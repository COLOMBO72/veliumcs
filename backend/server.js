require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');
const fs      = require('fs');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const STEAM_KEY  = process.env.STEAM_API_KEY;
const FACEIT_KEY = process.env.FACEIT_API_KEY;
const PORT       = process.env.PORT || 3001;

// ── Simple JSON-file DB for ratings ────────────────────────
const DB_PATH = path.join(__dirname, 'ratings.json');

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {}
  return { ratings: {}, votes: {}, views: {} };
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ── helpers ─────────────────────────────────────────────────
async function steamGet(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Steam API ${r.status}`);
  return r.json();
}

async function faceitGet(path) {
  const r = await fetch(`https://open.faceit.com/data/v4${path}`, {
    headers: { Authorization: `Bearer ${FACEIT_KEY}` },
  });
  if (!r.ok) throw new Error(`FACEIT ${r.status}: ${path}`);
  return r.json();
}

function getClientId(req) {
  // Combine IP + User-Agent for fingerprinting (no registration needed)
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || 'unknown';
  const ua = req.headers['user-agent'] || '';
  // Simple hash
  let hash = 0;
  for (const c of ip + '|' + ua) {
    hash = ((hash << 5) - hash) + c.charCodeAt(0);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

// ── resolve ──────────────────────────────────────────────────
app.get('/api/resolve', async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) return res.status(400).json({ error: 'input required' });

    const vanityMatch = input.match(/steamcommunity\.com\/id\/([^\/\?#]+)/);
    const id64Match   = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
    const rawId64     = /^\d{17}$/.test(input.trim());

    let steamid64;
    if (id64Match)    { steamid64 = id64Match[1]; }
    else if (rawId64) { steamid64 = input.trim(); }
    else {
      const vanity = vanityMatch ? vanityMatch[1] : input.trim();
      const data = await steamGet(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_KEY}&vanityurl=${encodeURIComponent(vanity)}`
      );
      if (data.response.success !== 1) return res.status(404).json({ error: 'Profile not found' });
      steamid64 = data.response.steamid;
    }

    res.json({ steamid64 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── full player data ─────────────────────────────────────────
app.get('/api/player/:steamid64', async (req, res) => {
  const { steamid64 } = req.params;
  if (!/^\d{17}$/.test(steamid64)) return res.status(400).json({ error: 'Invalid SteamID64' });

  try {
    const [summaryData, banData, statsData] = await Promise.allSettled([
      steamGet(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_KEY}&steamids=${steamid64}`),
      steamGet(`https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${STEAM_KEY}&steamids=${steamid64}`),
      steamGet(`https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?appid=730&key=${STEAM_KEY}&steamid=${steamid64}`),
    ]);

    const profile = summaryData.value?.response?.players?.[0] ?? null;
    if (!profile) return res.status(404).json({ error: 'Steam profile not found' });

    const bans  = banData.value?.players?.[0] ?? {};
    const stats = statsData.value?.playerstats?.stats ?? null;

    let faceitPlayer    = null;
    let faceitStats     = null;
    let faceitMatches   = null;
    let faceitRecent20  = null;
    let faceitMaps      = null;
    let faceitCsgoStats = null;

    try {
      faceitPlayer = await faceitGet(`/players?game=cs2&game_player_id=${steamid64}`);

      if (faceitPlayer?.player_id) {
        const pid = faceitPlayer.player_id;

        const [fStats, fHistory20, fCsgoStats] = await Promise.allSettled([
          faceitGet(`/players/${pid}/stats/cs2`),
          faceitGet(`/players/${pid}/history?game=cs2&limit=20`),
          faceitGet(`/players/${pid}/stats/csgo`),
        ]);

        const cs2StatsData = fStats.value ?? null;
        faceitStats = cs2StatsData;

        if (cs2StatsData?.segments) {
          faceitMaps = cs2StatsData.segments
            .filter(s => s.type === 'map' || (s.label && s.label.startsWith('de_')))
            .sort((a, b) => parseInt(b.stats?.Matches || '0') - parseInt(a.stats?.Matches || '0'))
            .slice(0, 3);
        }

        const historyItems = fHistory20.value?.items ?? null;

        if (historyItems?.length) {
          const matchStatsResults = await Promise.allSettled(
            historyItems.slice(0, 10).map(m =>
              faceitGet(`/matches/${m.match_id}/stats`).catch(() => null)
            )
          );

          const statsFor20 = [];
          const playerMatchStats = {};

          matchStatsResults.forEach((r, i) => {
            if (r.status !== 'fulfilled' || !r.value) return;
            const rounds = r.value?.rounds ?? [];
            if (!rounds.length) return;
            const matchId = historyItems[i].match_id;
            for (const team of (rounds[0].teams ?? [])) {
              const player = (team.players ?? []).find(p => p.player_id === pid);
              if (player) {
                statsFor20.push(player.player_stats);
                playerMatchStats[matchId] = player.player_stats;
              }
            }
          });

          const currentElo = faceitPlayer?.games?.cs2?.faceit_elo ?? 0;
          const level      = faceitPlayer?.games?.cs2?.skill_level ?? 5;

          faceitMatches = historyItems.slice(0, 10).map((m, i) => {
            let elo_diff = null;
            const rawEloNow  = m.elo != null ? parseInt(String(m.elo)) : null;
            const nextItem   = historyItems[i + 1];
            const rawEloPrev = nextItem?.elo != null ? parseInt(String(nextItem.elo)) : null;

            if (rawEloNow != null && !isNaN(rawEloNow) && rawEloPrev != null && !isNaN(rawEloPrev)) {
              elo_diff = rawEloNow - rawEloPrev;
            } else {
              const ps  = playerMatchStats[m.match_id];
              const won = ps
                ? ps['Result'] === '1'
                : (() => {
                    const inF1   = m.teams?.faction1?.players?.some(p => p.player_id === pid);
                    const myTeam = inF1 ? 'faction1' : 'faction2';
                    return m.results?.winner === myTeam;
                  })();
              const gain = level <= 2 ? 5 : level <= 4 ? 18 : level <= 6 ? 23 : level <= 8 ? 25 : 28;
              elo_diff = won ? gain : -gain;
            }

            return { ...m, elo_diff, map_pick: m.voting?.map?.pick?.[0] ?? '' };
          });

          if (historyItems.length > 10) {
            const extra = await Promise.allSettled(
              historyItems.slice(10).map(m =>
                faceitGet(`/matches/${m.match_id}/stats`).catch(() => null)
              )
            );
            extra.forEach(r => {
              if (r.status !== 'fulfilled' || !r.value) return;
              const rounds = r.value?.rounds ?? [];
              if (!rounds.length) return;
              for (const team of (rounds[0].teams ?? [])) {
                const player = (team.players ?? []).find(p => p.player_id === pid);
                if (player) statsFor20.push(player.player_stats);
              }
            });
          }

          faceitRecent20 = statsFor20.length > 0 ? statsFor20 : null;
        }

        faceitCsgoStats = fCsgoStats.value ?? null;
      }
    } catch (_) {}

    // Load ratings for this steamid
    const db = loadDB();
    if (!db.views) db.views = {};
    db.views[steamid64] = (db.views[steamid64] || 0) + 1;
    const viewCount = db.views[steamid64];

    // Load ratings for this steamid
    const ratings = db.ratings[steamid64] || { likes: {}, dislikes: {} };
    const clientId = getClientId(req);
    const myVote = db.votes[`${clientId}:${steamid64}`] || null;

    saveDB(db);

    res.json({
      profile, bans, cs2stats: stats,
      faceit: faceitPlayer, faceitStats, faceitMatches,
      faceitRecent20, faceitMaps, faceitCsgoStats,
      ratings: {
        likes:    ratings.likes,
        dislikes: ratings.dislikes,
        myVote,
      },
      viewCount,
    })
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Rating endpoints ─────────────────────────────────────────

// POST /api/rate/:steamid64  body: { type: 'like'|'dislike', reason: number }
app.post('/api/rate/:steamid64', (req, res) => {
  const { steamid64 } = req.params;
  const { type, reason } = req.body;

  if (!/^\d{17}$/.test(steamid64)) return res.status(400).json({ error: 'Invalid SteamID64' });
  if (!['like', 'dislike'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
  if (typeof reason !== 'number' || reason < 0 || reason > 3) return res.status(400).json({ error: 'Invalid reason' });

  const clientId = getClientId(req);
  const voteKey  = `${clientId}:${steamid64}`;

  const db = loadDB();
  if (!db.ratings[steamid64]) db.ratings[steamid64] = { likes: {}, dislikes: {} };
  if (!db.votes) db.votes = {};

  // Check if already voted
  const existing = db.votes[voteKey];
  if (existing) {
    // Remove old vote first
    const { type: oldType, reason: oldReason } = existing;
    const oldCount = db.ratings[steamid64][`${oldType}s`][String(oldReason)] || 0;
    db.ratings[steamid64][`${oldType}s`][String(oldReason)] = Math.max(0, oldCount - 1);
  }

  // Add new vote
  const bucket = `${type}s`; // 'likes' or 'dislikes'
  const key    = String(reason);
  db.ratings[steamid64][bucket][key] = (db.ratings[steamid64][bucket][key] || 0) + 1;
  db.votes[voteKey] = { type, reason };

  saveDB(db);
  res.json({ ok: true, ratings: db.ratings[steamid64], myVote: db.votes[voteKey] });
});

// DELETE /api/rate/:steamid64 — remove vote
app.delete('/api/rate/:steamid64', (req, res) => {
  const { steamid64 } = req.params;
  const clientId = getClientId(req);
  const voteKey  = `${clientId}:${steamid64}`;

  const db = loadDB();
  const existing = db.votes?.[voteKey];
  if (existing && db.ratings[steamid64]) {
    const { type, reason } = existing;
    const bucket = `${type}s`;
    const old = db.ratings[steamid64][bucket][String(reason)] || 0;
    db.ratings[steamid64][bucket][String(reason)] = Math.max(0, old - 1);
    delete db.votes[voteKey];
    saveDB(db);
  }
  res.json({ ok: true });
});

// ── health ───────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`VELIUMCS backend :${PORT}`));
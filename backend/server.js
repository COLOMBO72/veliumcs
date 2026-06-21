require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const http = require("http");

const app = express();
app.use(cors());
app.use(express.json());

const STEAM_KEY = process.env.STEAM_API_KEY;
const FACEIT_KEY = process.env.FACEIT_API_KEY;
const PORT = process.env.PORT || 3005;

// ── In-memory cache (5 min TTL) ─────────────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cacheGet(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return e.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, ts: Date.now() });
  if (cache.size > 500) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    cache.delete(oldest[0]);
  }
}

// ── JSON file DB ─────────────────────────────────────────────
const DB_PATH = path.join(__dirname, "ratings.json");

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH))
      return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
  } catch {}
  return { ratings: {}, votes: {}, views: {}, totalVisits: 0 };
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Subscribers from tgbot (shared file)
const SUBS_PATH = path.join(__dirname, "../tgbot/subscribers.json");

function loadSubs() {
  try {
    if (fs.existsSync(SUBS_PATH))
      return JSON.parse(fs.readFileSync(SUBS_PATH, "utf8"));
  } catch {}
  return {};
}

// ── Client fingerprint for rate limiting ─────────────────────
function getClientId(req) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  const ua = req.headers["user-agent"] || "";
  let hash = 0;
  for (const c of ip + "|" + ua) {
    hash = (hash << 5) - hash + c.charCodeAt(0);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

// ── API helpers ──────────────────────────────────────────────
async function steamGet(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Steam API ${r.status}`);
  return r.json();
}

async function faceitGet(p) {
  const r = await fetch(`https://open.faceit.com/data/v4${p}`, {
    headers: { Authorization: `Bearer ${FACEIT_KEY}` },
  });
  if (!r.ok) throw new Error(`FACEIT ${r.status}: ${p}`);
  return r.json();
}

// ── /api/resolve ─────────────────────────────────────────────
app.get("/api/resolve", async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) return res.status(400).json({ error: "input required" });

    const vanityMatch = input.match(/steamcommunity\.com\/id\/([^\/\?#]+)/);
    const id64Match = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
    const rawId64 = /^\d{17}$/.test(input.trim());

    let steamid64;
    if (id64Match) {
      steamid64 = id64Match[1];
    } else if (rawId64) {
      steamid64 = input.trim();
    } else {
      const vanity = vanityMatch ? vanityMatch[1] : input.trim();
      const data = await steamGet(
        `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${STEAM_KEY}&vanityurl=${encodeURIComponent(vanity)}`,
      );
      if (data.response.success !== 1)
        return res.status(404).json({ error: "Profile not found" });
      steamid64 = data.response.steamid;
    }

    res.json({ steamid64 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── /api/player/:steamid64 ───────────────────────────────────
app.get("/api/player/:steamid64", async (req, res) => {
  const { steamid64 } = req.params;
  if (!/^\d{17}$/.test(steamid64))
    return res.status(400).json({ error: "Invalid SteamID64" });

  try {
    // ── Views counter ──
    const db = loadDB();
    if (!db.views) db.views = {};
    db.views[steamid64] = (db.views[steamid64] || 0) + 1;
    db.totalVisits = (db.totalVisits || 0) + 1;
    const viewCount = db.views[steamid64];
    saveDB(db);

    // ── Ratings ──
    const ratings = db.ratings[steamid64] || { likes: {}, dislikes: {} };
    const clientId = getClientId(req);
    const myVote = db.votes?.[`${clientId}:${steamid64}`] || null;

    // ── TG linked ──
    const subs = loadSubs();
    const tgLinked =
      Object.values(subs).find((s) => s.steamid === steamid64) || null;

    // ── Check cache (skip heavy API calls) ──
    const cacheKey = `player:${steamid64}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return res.json({
        ...cached,
        viewCount,
        ratings: { likes: ratings.likes, dislikes: ratings.dislikes, myVote },
        tgLinked: tgLinked
          ? { username: tgLinked.tgUsername, linkedAt: tgLinked.linkedAt }
          : null,
      });
    }

    // ── Steam calls ──
    const [summaryData, banData, statsData, ownedData] =
      await Promise.allSettled([
        steamGet(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_KEY}&steamids=${steamid64}`,
        ),
        steamGet(
          `https://api.steampowered.com/ISteamUser/GetPlayerBans/v1/?key=${STEAM_KEY}&steamids=${steamid64}`,
        ),
        steamGet(
          `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?appid=730&key=${STEAM_KEY}&steamid=${steamid64}`,
        ),
        // GetOwnedGames даёт точное время запуска игры в минутах (как в Steam профиле)
        steamGet(
          `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${STEAM_KEY}&steamid=${steamid64}&appids_filter[0]=730&include_appinfo=false&include_played_free_games=true`,
        ),
      ]);

    const profile = summaryData.value?.response?.players?.[0] ?? null;
    if (!profile)
      return res.status(404).json({ error: "Steam profile not found" });

    const bans = banData.value?.players?.[0] ?? {};
    const stats = statsData.value?.playerstats?.stats ?? null;
    // playtime_forever в минутах → часы (это то что показывает Steam профиль)
    const cs2Game = ownedData.value?.response?.games?.find(
      (g) => g.appid === 730,
    );
    const cs2HoursReal = cs2Game
      ? Math.round(cs2Game.playtime_forever / 60)
      : null;
    if (stats) {
      console.log("=== STEAM CS2 STATS KEYS ===");
      console.log("Total keys:", stats.length);
      // Фильтруй интересные
      stats
        .filter(
          (s) =>
            s.name.includes("blind") ||
            s.name.includes("smoke") ||
            s.name.includes("wall") ||
            s.name.includes("noscope") ||
            s.name.includes("zoom") ||
            s.name.includes("knife") ||
            s.name.includes("damage") ||
            s.name.includes("rounds") ||
            s.name.includes("matches"),
        )
        .forEach((s) => console.log(s.name, "=", s.value));
      console.log("=== MAP KEYS ===");
      stats
        .filter((s) => s.name.includes("map"))
        .forEach((s) => console.log(s.name, "=", s.value));
    }
    // ── FACEIT calls ──
    let faceitPlayer = null;
    let faceitStats = null;
    let faceitMatches = null;
    let faceitRecent20 = null;
    let faceitMaps = null;
    let faceitCsgoStats = null;

    try {
      faceitPlayer = await faceitGet(
        `/players?game=cs2&game_player_id=${steamid64}`,
      );

      if (faceitPlayer?.player_id) {
        const pid = faceitPlayer.player_id;

        const [fStats, fHistory20, fCsgoStats] = await Promise.allSettled([
          faceitGet(`/players/${pid}/stats/cs2`),
          faceitGet(`/players/${pid}/history?game=cs2&limit=20`),
          faceitGet(`/players/${pid}/stats/csgo`),
        ]);

        faceitStats = fStats.value ?? null;
        if (faceitStats) {
          console.log("=== FACEIT LIFETIME ===", faceitStats.lifetime);
          console.log(
            "=== FACEIT SEGMENTS count ===",
            faceitStats.segments?.length,
          );
          if (faceitStats.segments?.[0]) {
            console.log(
              "=== FIRST SEGMENT SAMPLE ===",
              JSON.stringify(faceitStats.segments[0], null, 2),
            );
          }
        }
        // Map segments
        if (faceitStats?.segments) {
          faceitMaps = faceitStats.segments
            .filter(
              (s) => s.type === "map" || (s.label && s.label.startsWith("de_")),
            )
            .sort(
              (a, b) =>
                parseInt(b.stats?.Matches || "0") -
                parseInt(a.stats?.Matches || "0"),
            )
            .slice(0, 3);
        }

        const historyItems = fHistory20.value?.items ?? null;
        const level = faceitPlayer?.games?.cs2?.skill_level ?? 5;

        if (historyItems?.length) {
          // Fetch match stats for first 10
          const matchStatsResults = await Promise.allSettled(
            historyItems
              .slice(0, 10)
              .map((m) =>
                faceitGet(`/matches/${m.match_id}/stats`).catch(() => null),
              ),
          );

          const statsFor20 = [];
          const playerMatchStats = {};

          matchStatsResults.forEach((r, i) => {
            if (r.status !== "fulfilled" || !r.value) return;
            const rounds = r.value?.rounds ?? [];
            if (!rounds.length) return;
            const round = rounds[0];
            if (!round?.teams?.length) return;
            const matchId = historyItems[i]?.match_id;
            if (!matchId) return;
            for (const team of round.teams) {
              if (!team?.players?.length) continue;
              const player = team.players.find((p) => p.player_id === pid);
              if (player) {
                statsFor20.push(player.player_stats);
                playerMatchStats[matchId] = player.player_stats;
              }
            }
          });

          const avgEloChange =
            level <= 2
              ? 5
              : level <= 4
                ? 18
                : level <= 6
                  ? 23
                  : level <= 8
                    ? 25
                    : 28;

          faceitMatches = historyItems.slice(0, 20).map((m, i) => {
            let elo_diff = null;
            const rawNow = m.elo != null ? parseInt(String(m.elo)) : null;
            const rawPrev =
              historyItems[i + 1]?.elo != null
                ? parseInt(String(historyItems[i + 1].elo))
                : null;

            if (
              rawNow != null &&
              !isNaN(rawNow) &&
              rawPrev != null &&
              !isNaN(rawPrev)
            ) {
              elo_diff = rawNow - rawPrev;
            } else {
              const ps = playerMatchStats[m.match_id];
              const won = ps
                ? ps["Result"] === "1"
                : (() => {
                    const inF1 = m.teams?.faction1?.players?.some(
                      (p) => p.player_id === pid,
                    );
                    const myTeam = inF1 ? "faction1" : "faction2";
                    return m.results?.winner === myTeam;
                  })();
              elo_diff = won ? avgEloChange : -avgEloChange;
            }

            return { ...m, elo_diff, map_pick: m.voting?.map?.pick?.[0] ?? "" };
          });

          // Fetch remaining 10 for recent20
          if (historyItems.length > 10) {
            const extra = await Promise.allSettled(
              historyItems
                .slice(10)
                .map((m) =>
                  faceitGet(`/matches/${m.match_id}/stats`).catch(() => null),
                ),
            );
            extra.forEach((r) => {
              if (r.status !== "fulfilled" || !r.value) return;
              const rounds = r.value?.rounds ?? [];
              if (!rounds.length) return;
              const round = rounds[0];
              if (!round?.teams?.length) return;
              for (const team of round.teams) {
                if (!team?.players?.length) continue;
                const player = team.players.find((p) => p.player_id === pid);
                if (player) statsFor20.push(player.player_stats);
              }
            });
          }

          faceitRecent20 = statsFor20.length > 0 ? statsFor20 : null;
        }

        faceitCsgoStats = fCsgoStats.value ?? null;
      }
    } catch (_) {
      /* no faceit account */
    }

    // Cache the heavy data
    const payload = {
      profile,
      bans,
      cs2HoursReal,
      cs2stats: stats,
      faceit: faceitPlayer,
      faceitStats,
      faceitMatches,
      faceitRecent20,
      faceitMaps,
      faceitCsgoStats,
    };
    cacheSet(cacheKey, payload);

    res.json({
      ...payload,
      viewCount,
      ratings: { likes: ratings.likes, dislikes: ratings.dislikes, myVote },
      tgLinked: tgLinked
        ? { username: tgLinked.tgUsername, linkedAt: tgLinked.linkedAt }
        : null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── /api/rate/:steamid64  POST ───────────────────────────────
app.post("/api/rate/:steamid64", (req, res) => {
  const { steamid64 } = req.params;
  const { type, reason } = req.body;

  if (!/^\d{17}$/.test(steamid64))
    return res.status(400).json({ error: "Invalid SteamID64" });
  if (!type || !["like", "dislike"].includes(type))
    return res.status(400).json({ error: "Invalid type" });
  if (typeof reason !== "number" || reason < 0 || reason > 3)
    return res.status(400).json({ error: "Invalid reason" });

  const clientId = getClientId(req);
  const voteKey = `${clientId}:${steamid64}`;

  const db = loadDB();
  if (!db.ratings[steamid64])
    db.ratings[steamid64] = { likes: {}, dislikes: {} };
  if (!db.votes) db.votes = {};

  // Remove old vote if exists
  const existing = db.votes[voteKey];
  if (existing) {
    const oldBucket = `${existing.type}s`;
    const oldKey = String(existing.reason);
    db.ratings[steamid64][oldBucket][oldKey] = Math.max(
      0,
      (db.ratings[steamid64][oldBucket][oldKey] || 0) - 1,
    );
  }

  // Save new vote
  const bucket = `${type}s`;
  const key = String(reason);
  db.ratings[steamid64][bucket][key] =
    (db.ratings[steamid64][bucket][key] || 0) + 1;
  db.votes[voteKey] = { type, reason };
  saveDB(db);

  // Notify TG bot — fire and forget, ONE notification only
  const notifyUrl = process.env.BOT_NOTIFY_URL;
  if (notifyUrl) {
    fetch(notifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: process.env.NOTIFY_SECRET || "veliumcs_notify_secret",
        steamid: steamid64,
        type,
        reason,
      }),
    }).catch(() => {});
  }

  res.json({
    ok: true,
    ratings: db.ratings[steamid64],
    myVote: db.votes[voteKey],
  });
});

// ── /api/rate/:steamid64  DELETE ─────────────────────────────
app.delete("/api/rate/:steamid64", (req, res) => {
  const { steamid64 } = req.params;
  const clientId = getClientId(req);
  const voteKey = `${clientId}:${steamid64}`;

  const db = loadDB();
  const existing = db.votes?.[voteKey];
  if (existing && db.ratings[steamid64]) {
    const bucket = `${existing.type}s`;
    const key = String(existing.reason);
    db.ratings[steamid64][bucket][key] = Math.max(
      0,
      (db.ratings[steamid64][bucket][key] || 0) - 1,
    );
    delete db.votes[voteKey];
    saveDB(db);
  }
  res.json({ ok: true });
});

// ── Sitemap ──────────────────────────────────────────────────
app.get("/sitemap.xml", (req, res) => {
  const db = loadDB();
  const baseUrl = process.env.SITE_URL || "https://veliumcs.su";
  const ids = Object.keys(db.views || {});
  const urls = [
    `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${baseUrl}/compare</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    ...ids
      .slice(0, 5000)
      .map(
        (id) =>
          `<url><loc>${baseUrl}/player/${id}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
      ),
  ].join("\n");
  res.header("Content-Type", "application/xml");
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
  );
});

// ── robots.txt ───────────────────────────────────────────────
app.get("/robots.txt", (req, res) => {
  const baseUrl = process.env.SITE_URL || "https://veliumcs.su";
  res.header("Content-Type", "text/plain");
  res.send(`User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
});

// ── Health ───────────────────────────────────────────────────
app.get("/api/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`VELIUMCS backend :${PORT}`));

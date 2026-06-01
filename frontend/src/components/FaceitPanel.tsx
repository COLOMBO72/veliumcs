import { useEffect, useRef, useState  } from 'react';
import type {
  FaceitPlayer, FaceitStats, FaceitMatch,
  FaceitPlayerMatchStats, FaceitSegment,
} from '../types';
import { eloToProgress, eloNextThreshold } from '../utils';
import { useLang } from '../useLang';

// ── FACEIT level images (official CDN) ─────────────────────
const LEVEL_IMGS: Record<number, string> = {
  1:  'https://cdn-frontend.faceit-cdn.net/web/static/media/skill_level_1_svg.svg',
  2:  'https://cdn-frontend.faceit-cdn.net/web/static/media/skill_level_2_svg.svg',
  3:  'https://cdn-frontend.faceit-cdn.net/web/static/media/skill_level_3_svg.svg',
  4:  'https://cdn-frontend.faceit-cdn.net/web/static/media/skill_level_4_svg.svg',
  5:  'https://cdn-frontend.faceit-cdn.net/web/static/media/skill_level_5_svg.svg',
  6:  'https://cdn-frontend.faceit-cdn.net/web/static/media/skill_level_6_svg.svg',
  7:  'https://cdn-frontend.faceit-cdn.net/web/static/media/skill_level_7_svg.svg',
  8:  'https://cdn-frontend.faceit-cdn.net/web/static/media/skill_level_8_svg.svg',
  9:  'https://cdn-frontend.faceit-cdn.net/web/static/media/skill_level_9_svg.svg',
  10: 'https://cdn-frontend.faceit-cdn.net/web/static/media/skill_level_10_svg.svg',
};

// Map thumbnails — FACEIT stats CDN (confirmed working)
const MAP_IMGS: Record<string, string> = {
  de_dust2:    'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/extras/de_dust2.png',
  de_mirage:   'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/extras/de_mirage.png',
  de_inferno:  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/extras/de_inferno.png',
  de_nuke:     'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/extras/de_nuke.png',
  de_overpass: 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/extras/de_overpass.png',
  de_ancient:  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/extras/de_ancient.png',
  de_anubis:   'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/extras/de_anubis.png',
  de_vertigo:  'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/extras/de_vertigo.png',
  de_train:    'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/730/extras/de_train.png',
};

// Resolve map key from a raw string like "de_mirage" or "Mirage"
function resolveMapKey(raw: string): string {
  if (!raw) return '';
  const lower = raw.toLowerCase().trim();
  if (lower.startsWith('de_')) return lower;
  // Match by short name
  const nameMap: Record<string, string> = {
    'dust2': 'de_dust2', 'dust 2': 'de_dust2',
    'mirage': 'de_mirage',
    'inferno': 'de_inferno',
    'nuke': 'de_nuke',
    'overpass': 'de_overpass',
    'ancient': 'de_ancient',
    'anubis': 'de_anubis',
    'vertigo': 'de_vertigo',
    'train': 'de_train',
  };
  return nameMap[lower] || Object.keys(MAP_IMGS).find(k => lower.includes(k.replace('de_', ''))) || '';
}

// ── Fallback hex level icon ─────────────────────────────────
function LevelFallback({ level }: { level: number }) {
  const c = level<=2?'#8a8a8a':level<=4?'#1eff00':level<=6?'#00b4ff':level<=8?'#a855f7':'#ff5500';
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <polygon points="32,4 60,20 60,44 32,60 4,44 4,20" fill="none" stroke={c} strokeWidth="2"/>
      <text x="32" y="38" textAnchor="middle" fontFamily="Rajdhani,sans-serif"
        fontWeight="700" fontSize="22" fill={c}>{level}</text>
    </svg>
  );
}

// ── Level image with fallback ───────────────────────────────
function LevelImage({ level, size = 72 }: { level: number; size?: number }) {
  const fbRef = useRef<HTMLDivElement>(null);
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <img
        src={LEVEL_IMGS[level]}
        alt={`FACEIT Level ${level}`}
        width={size} height={size}
        onError={e => {
          e.currentTarget.style.display = 'none';
          if (fbRef.current) fbRef.current.style.display = 'flex';
        }}
        style={{ display: 'block' }}
      />
      <div ref={fbRef} style={{ display: 'none', alignItems: 'center', justifyContent: 'center' }}>
        <LevelFallback level={level} />
      </div>
    </div>
  );
}

// ── Stat row helper ─────────────────────────────────────────
function StatRow({ label, val, cls = '' }: { label: string; val: string; cls?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text3)' }}>
        {label}
      </span>
      <span className={cls} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 14, color: 'var(--text)' }}>
        {val}
      </span>
    </div>
  );
}

// ── Main props ──────────────────────────────────────────────
interface Props {
  faceit:         FaceitPlayer;
  faceitStats:    FaceitStats | null;
  faceitMatches:  FaceitMatch[] | null;
  faceitRecent20: FaceitPlayerMatchStats[] | null;
  faceitMaps:     FaceitSegment[] | null;
  faceitCsgoStats: FaceitStats | null;
}

export default function FaceitPanel({
  faceit, faceitStats, faceitMatches, faceitRecent20, faceitMaps, faceitCsgoStats,
}: Props) {
  const { t } = useLang();
  const locale = (t as any).locale || 'en-US';
  const eloBarRef = useRef<HTMLDivElement>(null);

  const game    = faceit.games?.cs2;
  const level   = game?.skill_level ?? 1;
  const elo     = game?.faceit_elo  ?? 0;
  const progress = eloToProgress(elo, level);
  const nextElo  = eloNextThreshold(level);

  const fl       = faceitStats?.lifetime ?? {};
  const fMatches = parseInt(fl['Matches'] || '0');
  const fWins    = parseInt(fl['Wins']    || '0');
  const fWR      = fMatches > 0 ? Math.round(fWins / fMatches * 100) : 0;
  const fKD      = parseFloat(fl['Average K/D Ratio']    || '0');
  const fHS      = parseFloat(fl['Average Headshots %']  || '0');
  const fLongest = parseInt(fl['Longest Win Streak']     || '0');
  const fCurrent = parseInt(fl['Current Win Streak']     || '0');

  useEffect(() => {
    const bar = eloBarRef.current;
    if (!bar) return;
    bar.style.width = '0%';
    const id = setTimeout(() => { bar.style.width = `${progress}%`; }, 200);
    return () => clearTimeout(id);
  }, [progress]);

  const eloStr = level < 10
    ? (t.eloNext as (e: number, n: number) => string)(nextElo, level + 1)
    : t.eloMax;

  return (
    <div>
      {/* ── Section header ── */}
      <div className="sec-divider">
        <div className="sec-divider-label">{t.secFaceit}</div>
        <div className="sec-divider-line"/>
      </div>

      {/* ── Main panel ── */}
      <div className="animate-fadeup" style={{
        background: 'var(--bg3)',
        border: '1px solid var(--border2)',
        borderLeft: '3px solid var(--faceit)',
        padding: '28px',
        marginBottom: 2,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 28,
        alignItems: 'center',
      }}>
        {/* Level image + ELO */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 90 }}>
          <LevelImage level={level} size={76} />
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 40, fontWeight: 700, lineHeight: 1, color: 'var(--faceit)' }}>
            {elo.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text3)' }}>
            ELO
          </div>
          {fl['Best ELO'] && (
            <div style={{ textAlign: 'center', marginTop: 2 }}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>
                {parseInt(fl['Best ELO']).toLocaleString()}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text3)' }}>
                MAX ELO
              </div>
            </div>
          )}
        </div>

        {/* Nickname + meta + ELO bar */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <a
              href={faceit.faceit_url?.replace('{lang}', 'en') ?? '#'}
              target="_blank" rel="noopener noreferrer"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 30, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text)', textDecoration: 'none' }}
            >
              {faceit.nickname}
            </a>
            <span className={`level-badge lvl-${level}`}>LVL {level}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {faceit.country     && <span className="meta-tag">{faceit.country.toUpperCase()}</span>}
            {faceit.membership_type && <span className="meta-tag" style={{ borderColor: 'var(--faceit)', color: 'var(--faceit)' }}>{faceit.membership_type.toUpperCase()}</span>}
            {faceit.activated_at && <span className="meta-tag">{t.since} {new Date(faceit.activated_at).getFullYear()}</span>}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text3)', letterSpacing: '0.04em' }}>
              <span>Level {level}</span>
              <span>{elo} / {eloStr}</span>
            </div>
            <div className="elo-track">
              <div ref={eloBarRef} className="elo-fill" style={{ width: '0%' }}/>
            </div>
          </div>
        </div>

        {/* CS2 lifetime stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 130 }}>
          <StatRow label={t.fkMatches} val={fMatches.toLocaleString()} />
          <StatRow label={t.fkWR}      val={`${fWR}%`}               cls={fWR>=55?'good':fWR<45?'danger':''} />
          <StatRow label={t.fkKD}      val={fKD.toFixed(2)}           cls={fKD>=1.5?'good':fKD<1?'danger':''} />
          <StatRow label={t.fkHS}      val={`${fHS.toFixed(0)}%`}     cls={fHS>=50?'good':''} />
          <StatRow label={t.fkStreak}  val={`${fCurrent} / ${fLongest}`} cls={fCurrent>=3?'good':''} />
        </div>
      </div>

      {/* ── Recent 20 games form ── */}
      {faceitRecent20 && faceitRecent20.length > 0 && (
        <RecentForm stats={faceitRecent20} t={t} />
      )}

      {/* ── FACEIT top 3 maps ── */}
      {faceitMaps && faceitMaps.length > 0 && (
        <FaceitMaps maps={faceitMaps} t={t} />
      )}

      {/* ── CS:GO stats ── */}
      {faceitCsgoStats?.lifetime && (
        <CsgoStats stats={faceitCsgoStats} faceit={faceit} t={t} />
      )}

      {/* ── Match history ── */}
      {faceitMatches && faceitMatches.length > 0 && (
        <MatchHistory matches={faceitMatches} playerId={faceit.player_id} locale={locale} t={t} />
      )}
    </div>
  );
}

// ── Recent 20 games block ───────────────────────────────────
function RecentForm({ stats, t }: { stats: FaceitPlayerMatchStats[]; t: any }) {
  if (!stats.length) return null;

  const count = stats.length;
  const wins  = stats.filter(s => s['Result'] === '1').length;
  const wr    = Math.round(wins / count * 100);

  const avg = (key: string) => {
    const vals = stats.map(s => parseFloat(s[key] || '0')).filter(v => !isNaN(v));
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const kd  = avg('K/D Ratio');
  const hs  = avg('Headshots %');
  const kills = avg('Kills');
  // Kills per round = kills / rounds — some APIs expose "Rounds", else estimate
  const kpr = avg('K/R Ratio') || (avg('Kills') / Math.max(avg('Rounds') || 22, 1));

  const cells = [
    { label: 'K/D',        val: kd.toFixed(2),    cls: kd>=1.5?'good':kd<1?'danger':'' },
    { label: 'HS %',       val: `${hs.toFixed(0)}%`, cls: hs>=50?'good':'' },
    { label: 'WIN RATE',   val: `${wr}%`,          cls: wr>=55?'good':wr<45?'danger':'' },
    { label: 'AVG KILLS',  val: kills.toFixed(1),  cls: kills>=20?'good':'' },
    { label: 'K/R',        val: kpr.toFixed(2),    cls: kpr>=0.7?'good':'' },
  ];

  return (
    <div style={{ marginBottom: 2 }}>
      <div className="sec-divider" style={{ marginTop: 20 }}>
        <div className="sec-divider-label">{t.secRecent20 || `FACEIT — LAST ${count} MATCHES`}</div>
        <div className="sec-divider-line"/>
      </div>
      <div style={{
        background: 'var(--bg3)', border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 2,
      }}>
        {cells.map(c => (
          <div key={c.label} style={{ textAlign: 'center', padding: '12px 8px' }}>
            <div className={`stat-value ${c.cls}`} style={{ fontSize: 26 }}>{c.val}</div>
            <div className="stat-label" style={{ marginBottom: 0, marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FACEIT top 3 maps block ─────────────────────────────────
function FaceitMaps({ maps, t }: { maps: FaceitSegment[]; t: any }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <div className="sec-divider" style={{ marginTop: 20 }}>
        <div className="sec-divider-label">{t.secTopMaps || 'TOP MAPS (FACEIT)'}</div>
        <div className="sec-divider-line"/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {maps.slice(0, 3).map((seg, i) => {
          // Use img_small from API first (returned by FACEIT segments), then fallback
          const mapKey  = resolveMapKey(seg.label || '');
          const imgUrl  = seg.img_small || seg.img_regular || (mapKey ? MAP_IMGS[mapKey] : null);
          const displayName = seg.label || mapKey.replace('de_', '') || '?';
          const matches = parseInt(seg.stats?.['Matches'] || '0');
          const wins    = parseInt(seg.stats?.['Wins']    || '0');
          const wr      = matches > 0 ? Math.round(wins / matches * 100) : 0;
          const kd      = parseFloat(seg.stats?.['Average K/D Ratio'] || seg.stats?.['K/D Ratio'] || '0');
          const hs      = parseFloat(seg.stats?.['Average Headshots %'] || seg.stats?.['Headshots %'] || '0');

          return (
            <div key={i} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              overflow: 'hidden', position: 'relative',
            }}>
              {/* Map image banner */}
              {imgUrl && (
                <div style={{ position: 'relative', height: 90, overflow: 'hidden' }}>
                  <img
                    src={imgUrl}
                    alt={seg.label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
                    onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 30%, var(--bg3) 100%)',
                  }}/>
                  <div style={{
                    position: 'absolute', bottom: 8, left: 12,
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: 18, fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--text)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    textTransform: 'uppercase',
                  }}>
                    {displayName}
                  </div>
                </div>
              )}

              {!imgUrl && (
                <div style={{
                  padding: '12px 14px 6px',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: 18, fontWeight: 700,
                  letterSpacing: '0.08em', color: 'var(--text)',
                  textTransform: 'uppercase',
                }}>
                  {displayName}
                </div>
              )}

              {/* Stats */}
              <div style={{ padding: '10px 14px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
                <MapStat label="Matches" val={matches.toLocaleString()} />
                <MapStat label="Win Rate" val={`${wr}%`} cls={wr>=55?'good':wr<45?'danger':''} />
                <MapStat label="K/D" val={kd.toFixed(2)} cls={kd>=1.5?'good':kd<1?'danger':''} />
                <MapStat label="HS %" val={`${hs.toFixed(0)}%`} cls={hs>=50?'good':''} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MapStat({ label, val, cls = '' }: { label: string; val: string; cls?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 2 }}>{label}</div>
      <div className={cls} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{val}</div>
    </div>
  );
}

// ── CS:GO stats block ───────────────────────────────────────
function CsgoStats({ stats, faceit, t }: { stats: FaceitStats; faceit: FaceitPlayer; t: any }) {
  const fl = stats.lifetime ?? {};
  const csgoLevel = faceit.games?.csgo?.skill_level;
  const csgoElo   = faceit.games?.csgo?.faceit_elo;

  const csgoMatches = parseInt(fl['Matches'] || '0');
  const csgoWins    = parseInt(fl['Wins']    || '0');
  const csgoWR      = csgoMatches > 0 ? Math.round(csgoWins / csgoMatches * 100) : 0;
  const csgoKD      = parseFloat(fl['Average K/D Ratio']   || '0');
  const csgoHS      = parseFloat(fl['Average Headshots %'] || '0');
  const csgoLongest = parseInt(fl['Longest Win Streak']    || '0');

  if (!csgoMatches && !csgoKD) return null;

  return (
    <div style={{ marginBottom: 2 }}>
      <div className="sec-divider" style={{ marginTop: 20 }}>
        <div className="sec-divider-label">{t.secCsgo || 'CS:GO — FACEIT HISTORY'}</div>
        <div className="sec-divider-line"/>
      </div>
      <div style={{
        background: 'var(--bg3)',
        border: '1px solid var(--border2)',
        borderLeft: '3px solid #f59e0b',
        padding: '20px 24px',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: 24,
        alignItems: 'center',
      }}>
        {/* CS:GO level image if available */}
        {csgoLevel && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <LevelImage level={csgoLevel} size={56} />
            {csgoElo && (
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>
                {csgoElo}
              </div>
            )}
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text3)' }}>
              CS:GO ELO
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px 20px' }}>
          {[
            { label: 'Matches',  val: csgoMatches.toLocaleString(), cls: '' },
            { label: 'Win Rate', val: `${csgoWR}%`,                  cls: csgoWR>=55?'good':csgoWR<45?'danger':'' },
            { label: 'K/D',      val: csgoKD.toFixed(2),             cls: csgoKD>=1.5?'good':csgoKD<1?'danger':'' },
            { label: 'HS %',     val: `${csgoHS.toFixed(0)}%`,       cls: csgoHS>=50?'good':'' },
            { label: 'Best Streak', val: String(csgoLongest),        cls: '' },
          ].map(c => (
            <div key={c.label}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>
                {c.label}
              </div>
              <div className={c.cls} style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>
                {c.val}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Match history ───────────────────────────────────────────
function MatchHistory({
  matches, playerId, locale, t,
}: {
  matches: FaceitMatch[];
  playerId: string;
  locale: string;
  t: any;
}) {
  const [tooltip, setTooltip] = useState<number | null>(null);

  return (
    <div>
      <div className="sec-divider" style={{ marginTop: 20 }}>
        <div className="sec-divider-label">{t.secMatches}</div>
        <div className="sec-divider-line"/>
      </div>

      <div style={{
        background: 'var(--bg3)',
        border: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
      }}>
        {matches.slice(0, 10).map((m, idx) => {
          const inF1   = m.teams?.faction1?.players?.some(p => p.player_id === playerId);
          const teamId = inF1 ? 'faction1' : 'faction2';
          const won    = m.results?.winner === teamId;

          const mapRaw  = (m as any).map_pick || m.voting?.map?.pick?.[0] || '';
          const mapKey  = resolveMapKey(mapRaw);
          const mapName = mapKey
            ? mapKey.replace('de_', '').replace(/^(.)/, (c: string) => c.toUpperCase())
            : (mapRaw ? mapRaw.replace('de_', '').replace(/^(.)/, (c: string) => c.toUpperCase()) : '?');

          const s1   = m.results?.score?.faction1 ?? '-';
          const s2   = m.results?.score?.faction2 ?? '-';
          const date = m.finished_at
            ? new Date(m.finished_at * 1000).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
            : '';

          const isHovered = tooltip === idx;

          return (
            <div
              key={m.match_id ?? idx}
              style={{ position: 'relative' }}
              onMouseEnter={() => setTooltip(idx)}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* W/L square */}
              <div style={{
                width: 40, height: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: won ? 'rgba(29,185,84,0.15)' : 'rgba(192,57,43,0.15)',
                border: `1px solid ${won ? 'rgba(29,185,84,0.5)' : 'rgba(192,57,43,0.5)'}`,
                cursor: 'default',
                transition: 'all 0.15s',
                ...(isHovered ? {
                  background: won ? 'rgba(29,185,84,0.28)' : 'rgba(192,57,43,0.28)',
                  borderColor: won ? 'var(--green)' : 'var(--red)',
                } : {}),
              }}>
                <span style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontSize: 15, fontWeight: 700,
                  color: won ? 'var(--green)' : 'var(--red)',
                }}>
                  {won ? 'W' : 'L'}
                </span>
              </div>

              {/* Tooltip */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--bg4)',
                  border: `1px solid ${won ? 'rgba(29,185,84,0.4)' : 'rgba(192,57,43,0.4)'}`,
                  padding: '10px 14px',
                  minWidth: 130,
                  zIndex: 100,
                  pointerEvents: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                }}>
                  {/* Map name */}
                  <div style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: 16, fontWeight: 700,
                    color: 'var(--text)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: 4,
                  }}>
                    {mapName}
                  </div>
                  {/* Score */}
                  <div style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    fontSize: 20, fontWeight: 700,
                    color: won ? 'var(--green)' : 'var(--red)',
                    marginBottom: 4,
                  }}>
                    {s1} : {s2}
                  </div>
                  {/* Result */}
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: won ? 'var(--green)' : 'var(--red)',
                    marginBottom: 4,
                  }}>
                    {won ? 'VICTORY' : 'DEFEAT'}
                  </div>
                  {/* Date */}
                  <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.04em' }}>
                    {date}
                  </div>
                  {/* Tooltip arrow */}
                  <div style={{
                    position: 'absolute',
                    top: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `6px solid ${won ? 'rgba(29,185,84,0.4)' : 'rgba(192,57,43,0.4)'}`,
                  }}/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

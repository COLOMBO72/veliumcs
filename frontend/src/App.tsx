import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LangProvider, useLang } from './useLang';
import type { PlayerData } from './types';
import { resolvePlayer, fetchPlayer } from './api';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ProfileHeader from './components/ProfileHeader';
import CS2Stats from './components/CS2Stats';
import FaceitPanel from './components/FaceitPanel';
import SeoSection from './components/SeoSection';
import SupportBanner from './components/SupportBanner';
import PlayerRating from './components/PlayerRating';

const queryClient = new QueryClient();

// ── Simple analytics tracker ────────────────────────────────
function track(event: string, data?: Record<string, string>) {
  try {
    const log = JSON.parse(localStorage.getItem('veliumcs_analytics') || '[]');
    log.push({ event, data, ts: Date.now(), path: location.pathname });
    localStorage.setItem('veliumcs_analytics', JSON.stringify(log.slice(-200)));
  } catch {}
}

// ── URL routing helpers ─────────────────────────────────────
function getPlayerFromUrl(): string | null {
  const match = location.pathname.match(/^\/player\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function setPlayerUrl(input: string) {
  const slug = encodeURIComponent(input.trim());
  history.pushState({}, '', `/player/${slug}`);
}

function clearPlayerUrl() {
  history.pushState({}, '', '/');
}

function Inner() {
  const { t } = useLang();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [data, setData]         = useState<PlayerData | null>(null);
  const [currentInput, setCurrentInput] = useState('');

  // On mount — check if URL has a player slug and auto-load
  useEffect(() => {
    const slug = getPlayerFromUrl();
    if (slug) {
      track('page_view', { type: 'player_url', slug });
      handleSearch(slug, false);
    } else {
      track('page_view', { type: 'home' });
    }

    // Handle browser back/forward
    const onPop = () => {
      const s = getPlayerFromUrl();
      if (s) handleSearch(s, false);
      else { setData(null); setError(''); }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Update page title & meta when data loads
  useEffect(() => {
    if (!data) {
      document.title = 'VELIUMCS — CS2 Player Stats & FACEIT ELO Tracker';
      return;
    }
    const nick = data.profile.personaname;
    const elo  = data.faceit?.games?.cs2?.faceit_elo;
    const lvl  = data.faceit?.games?.cs2?.skill_level;
    document.title = elo
      ? `${nick} — ELO ${elo} | VELIUMCS`
      : `${nick} CS2 Stats | VELIUMCS`;
    // Update og:description dynamically
    const desc = document.querySelector('meta[name="description"]');
    if (desc && elo) {
      desc.setAttribute('content',
        `${nick} FACEIT stats: ELO ${elo}, Level ${lvl}. View full CS2 match history and statistics on VELIUMCS.`
      );
    }
  }, [data]);

  const handleSearch = async (input: string, updateUrl = true) => {
    setError('');
    setData(null);
    setLoading(true);
    setCurrentInput(input);
    if (updateUrl) setPlayerUrl(input);
    track('search', { input: input.slice(0, 60) });

    try {
      let steamid64: string;
      try { steamid64 = await resolvePlayer(input); }
      catch (e: any) { throw new Error(e?.response?.data?.error || t.errNotFound); }

      let player: PlayerData;
      try { player = await fetchPlayer(steamid64); }
      catch (e: any) { throw new Error(e?.response?.data?.error || t.errGeneric); }

      setData(player);
      // Update URL to use steamid64 for canonical SEO URL
      if (updateUrl) setPlayerUrl(steamid64);
      track('profile_loaded', { steamid64, hasFacteit: String(!!player.faceit) });
    } catch (e: any) {
      setError(e.message || t.errGeneric);
      if (updateUrl) clearPlayerUrl();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <section style={{
        padding: data ? '32px 2rem 24px' : '80px 2rem 60px',
        textAlign: 'center', maxWidth: 900, margin: '0 auto',
        transition: 'padding 0.3s ease',
      }}>
        {!data && (
          <>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 24,
            }}>
              <span style={{ width: 32, height: 1, background: 'var(--accent)', opacity: 0.5, display: 'inline-block' }}/>
              Steam · FACEIT · CS2
              <span style={{ width: 32, height: 1, background: 'var(--accent)', opacity: 0.5, display: 'inline-block' }}/>
            </div>
            <h1 style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 'clamp(42px, 7vw, 72px)',
              fontWeight: 700, letterSpacing: '0.05em',
              lineHeight: 1, marginBottom: 16, color: 'var(--text)',
            }}>
              {t.heroH1} <span style={{ color: 'var(--accent)' }}>{t.heroH1Span}</span>
            </h1>
            <p style={{
              fontSize: 17, color: 'var(--text2)', letterSpacing: '0.03em',
              marginBottom: 48, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto',
            }}>
              {t.heroP}
            </p>
          </>
        )}
        <SearchBar onSearch={handleSearch} loading={loading} error={error} />
      </section>

      {/* Loading bar */}
      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 999, background: 'var(--bg3)' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent), var(--orange))',
            animation: 'loadBar 1.2s ease-in-out infinite',
          }}/>
          <style>{`@keyframes loadBar{0%{width:0%;margin-left:0}50%{width:70%;margin-left:15%}100%{width:0%;margin-left:100%}}`}</style>
        </div>
      )}

      {/* Results */}
      {!loading && data && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 80px' }}>
          <ProfileHeader
            profile={data.profile}
            bans={data.bans}
            faceit={data.faceit}
            viewCount={data.viewCount}
          />

          <SupportBanner />

          {data.ratings && (
            <PlayerRating steamid64={data.profile.steamid} initial={data.ratings} />
          )}

          {/* FACEIT first */}
          {data.faceit && data.faceit.games?.cs2 ? (
            <FaceitPanel
              faceit={data.faceit}
              faceitStats={data.faceitStats}
              faceitMatches={data.faceitMatches}
              faceitRecent20={data.faceitRecent20}
              faceitMaps={data.faceitMaps}
              faceitCsgoStats={data.faceitCsgoStats}
            />
          ) : (
            <div>
              <div className="sec-divider">
                <div className="sec-divider-label">{t.secFaceit}</div>
                <div className="sec-divider-line"/>
              </div>
              <div className="no-faceit">{t.noFaceit}</div>
            </div>
          )}

          {/* CS2 stats second */}
          {data.cs2stats && data.cs2stats.length > 0 ? (
            <CS2Stats stats={data.cs2stats} />
          ) : (
            <div>
              <div className="sec-divider">
                <div className="sec-divider-label">{t.secCs2}</div>
                <div className="sec-divider-line"/>
              </div>
              <div className="no-faceit">{t.cs2private}</div>
            </div>
          )}

          {/* Share link */}
          <ShareBlock steamid64={data.profile.steamid} nick={data.profile.personaname} />
        </div>
      )}

      {!loading && !data && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 80px' }}>
          <SeoSection />
        </div>
      )}
    </div>
  );
}

// ── Share block ──────────────────────────────────────────────
function ShareBlock({ steamid64, nick }: { steamid64: string; nick: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${location.origin}/player/${steamid64}`;

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track('share_copy', { steamid64 });
    });
  };

  return (
    <div style={{
      marginTop: 32,
      background: 'var(--bg3)', border: '1px solid var(--border)',
      padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{
        fontFamily: 'Rajdhani, sans-serif', fontSize: 12,
        fontWeight: 700, letterSpacing: '0.15em',
        textTransform: 'uppercase', color: 'var(--text3)',
        flexShrink: 0,
      }}>
        Поделиться
      </div>
      <div style={{
        flex: 1, fontFamily: 'Share Tech Mono, monospace',
        fontSize: 12, color: 'var(--text2)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        minWidth: 0,
      }}>
        {url}
      </div>
      <button
        onClick={copy}
        style={{
          background: copied ? 'rgba(29,185,84,0.15)' : 'var(--bg4)',
          border: `1px solid ${copied ? 'var(--green)' : 'var(--border2)'}`,
          color: copied ? 'var(--green)' : 'var(--text2)',
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
          padding: '6px 14px', cursor: 'pointer',
          transition: 'all 0.2s', flexShrink: 0,
        }}
      >
        {copied ? '✓ СКОПИРОВАНО' : 'КОПИРОВАТЬ'}
      </button>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <Header />
        <main><Inner /></main>
        <footer style={{
          position: 'relative', zIndex: 1,
          borderTop: '1px solid var(--border)',
          padding: '28px 2rem',
          background: 'var(--bg2)',
        }}>
          <div style={{
            maxWidth: 1100, margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 24,
          }}>
            <div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontSize: 15, fontWeight: 700,
                letterSpacing: '0.12em', color: 'var(--text)', marginBottom: 4,
              }}>
                VELIUM<span style={{ color: 'var(--accent)' }}>CS</span>
                <span style={{ marginLeft: 10, fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', color: 'var(--text3)', verticalAlign: 'middle' }}>
                  BY VELIUM SERVICE
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', letterSpacing: '0.04em', marginBottom: 8 }}>
                Data: <span style={{ color: 'var(--accent)' }}>Steam Web API</span> + <span style={{ color: 'var(--faceit)' }}>FACEIT Data API v4</span>
              </div>
              <a href="https://velium.ru" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
                letterSpacing: '0.06em', borderBottom: '1px solid rgba(232,160,32,0.3)', paddingBottom: 1,
              }}>
                Ознакомьтесь с нашими проектами →
              </a>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em' }}>
              © {new Date().getFullYear()} Velium Service
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 6 }}>
                Связаться с нами
              </div>
              <a href="mailto:estwoodbizn@gmail.com" style={{
                fontFamily: 'Share Tech Mono, monospace', fontSize: 13,
                color: 'var(--text2)', textDecoration: 'none', letterSpacing: '0.04em',
              }}>
                estwoodbizn@gmail.com
              </a>
            </div>
          </div>
        </footer>
      </LangProvider>
    </QueryClientProvider>
  );
}
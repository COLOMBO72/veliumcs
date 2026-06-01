import { useState } from 'react';
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

function Inner() {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<PlayerData | null>(null);

  const handleSearch = async (input: string) => {
    setError('');
    setData(null);
    setLoading(true);
    try {
      let steamid64: string;
      try {
        steamid64 = await resolvePlayer(input);
      } catch (e: any) {
        throw new Error(e?.response?.data?.error || t.errNotFound);
      }
      let player: PlayerData;
      try {
        player = await fetchPlayer(steamid64);
      } catch (e: any) {
        throw new Error(e?.response?.data?.error || t.errGeneric);
      }
      setData(player);
    } catch (e: any) {
      setError(e.message || t.errGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Hero / search */}
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

      {/* Simple loading indicator — just a thin bar, no full panel */}
      {loading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 999,
          background: 'var(--bg3)',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent), var(--orange))',
            animation: 'loadBar 1.2s ease-in-out infinite',
          }}/>
          <style>{`
            @keyframes loadBar {
              0%   { width: 0%; margin-left: 0; }
              50%  { width: 70%; margin-left: 15%; }
              100% { width: 0%; margin-left: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* Results — FACEIT first, then CS2 */}
      {!loading && data && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 80px' }}>
          <ProfileHeader profile={data.profile} bans={data.bans} faceit={data.faceit} viewCount={data.viewCount} />

          <SupportBanner />
{data.ratings && (
            <PlayerRating
              steamid64={data.profile.steamid}
              initial={data.ratings}
            />
          )}
          {/* FACEIT block — first */}
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

          {/* CS2 Steam stats — second */}
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
        </div>
      )}

      {/* SEO section on empty state */}
      {!loading && !data && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem 80px' }}>
          <SeoSection />
        </div>
      )}
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
          padding: '20px 2rem', textAlign: 'center',
          fontSize: 12, color: 'var(--text3)', letterSpacing: '0.06em',
        }}>
          VELIUMCS &nbsp;·&nbsp; Data:{' '}
          <span style={{ color: 'var(--accent)' }}>Steam Web API</span>
          {' + '}
          <span style={{ color: 'var(--faceit)' }}>FACEIT Data API v4</span>
          {' '}·{' '}CS2 Only
        </footer>
      </LangProvider>
    </QueryClientProvider>
  );
}
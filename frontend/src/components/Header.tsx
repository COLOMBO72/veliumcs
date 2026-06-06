import { useLang } from '../useLang';
import type { Lang } from '../types';

const LANGS: Lang[] = ['en', 'ru', 'es'];

export default function Header() {
  const { lang, setLang, t } = useLang();

  return (
    <header style={{
      position: 'relative', zIndex: 10,
      padding: '0 2rem', height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(7,9,14,0.96)',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        
        <a href="/" style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 22, fontWeight: 700,
          letterSpacing: '0.12em', color: 'var(--text)',
        }}>
          VELIUM<span style={{ color: 'var(--accent)' }}>CS</span>
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          display: 'flex', gap: 3,
          background: 'var(--bg3)',
          border: '1px solid var(--border2)',
          padding: 3,
        }}>
          {LANGS.map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '4px 9px', border: 'none',
                background: lang === l ? 'var(--accent)' : 'transparent',
                color: lang === l ? '#0a0800' : 'var(--text3)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="resp-hide" style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.15em',
          color: 'var(--text3)', textTransform: 'uppercase',
          border: '1px solid var(--border2)', padding: '4px 12px',
          background: 'var(--bg3)',
        }}>
          {t.hdrBadge}
        </div>
      </div>
    </header>
  );
}
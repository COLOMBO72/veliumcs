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
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="var(--accent)" strokeWidth="1.5">
          <polygon points="12,2 22,8 22,16 12,22 2,16 2,8"/>
          <circle cx="12" cy="12" r="3"/>
          <line x1="12" y1="5" x2="12" y2="9"/>
          <line x1="12" y1="15" x2="12" y2="19"/>
        </svg>
        <span style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 22, fontWeight: 700,
          letterSpacing: '0.12em', color: 'var(--text)',
        }}>
          VELIUM<span style={{ color: 'var(--accent)' }}>CS</span>
        </span>
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
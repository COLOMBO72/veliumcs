import { useState } from 'react';

// Измени ссылки на свои
const BOOSTY_URL  = 'https://boosty.to/cs2scope';
const DONATE_URL  = 'https://www.donationalerts.com/r/cs2scope';
const DISCORD_URL = 'https://discord.gg/cs2scope';

export default function SupportBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('cs2scope_support_dismissed') === '1'; } catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try { localStorage.setItem('cs2scope_support_dismissed', '1'); } catch {}
    setDismissed(true);
  };

  return (
    <div style={{
      position: 'relative',
      margin: '20px 0 4px',
      background: 'linear-gradient(135deg, rgba(232,160,32,0.07) 0%, rgba(212,82,26,0.07) 100%)',
      border: '1px solid rgba(232,160,32,0.25)',
      borderLeft: '3px solid var(--accent)',
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      flexWrap: 'wrap',
    }}>
      {/* Icon */}
      <div style={{ fontSize: 28, flexShrink: 0 }}>⬡</div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: 16, fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--accent)',
          marginBottom: 3,
        }}>
          ПОДДЕРЖИ РАЗРАБОТЧИКА
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', letterSpacing: '0.03em' }}>
          CS2SCOPE полностью бесплатен. Если сервис тебе помогает — поддержи проект,
          это помогает оплачивать сервера и развивать новые фичи.
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
        <SupportBtn href={BOOSTY_URL} color="#f97316" label="☕ Boosty" />
        <SupportBtn href={DONATE_URL} color="#e8a020" label="💛 Donate" />
        <SupportBtn href={DISCORD_URL} color="#5865f2" label="Discord" />
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        title="Скрыть"
        style={{
          position: 'absolute', top: 8, right: 10,
          background: 'none', border: 'none',
          color: 'var(--text3)', cursor: 'pointer',
          fontSize: 16, lineHeight: 1, padding: 4,
        }}
      >
        ✕
      </button>
    </div>
  );
}

function SupportBtn({ href, color, label }: { href: string; color: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center',
        gap: 6, padding: '7px 14px',
        background: `${color}18`,
        border: `1px solid ${color}55`,
        color: color,
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 13, fontWeight: 700,
        letterSpacing: '0.08em',
        textDecoration: 'none',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = `${color}30`;
        (e.currentTarget as HTMLElement).style.borderColor = color;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = `${color}18`;
        (e.currentTarget as HTMLElement).style.borderColor = `${color}55`;
      }}
    >
      {label}
    </a>
  );
}

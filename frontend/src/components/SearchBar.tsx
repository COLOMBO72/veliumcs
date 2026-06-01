import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useLang } from '../useLang';

interface Props {
  onSearch: (input: string) => void;
  loading: boolean;
  error?: string;
}

export default function SearchBar({ onSearch, loading, error }: Props) {
  const { t } = useLang();
  const [val, setVal] = useState('');

  const handle = () => {
    if (!val.trim()) return;
    onSearch(val.trim());
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handle();
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Input row */}
      <div style={{
        display: 'flex',
        border: `1px solid ${error ? 'rgba(192,57,43,0.5)' : 'var(--border2)'}`,
        background: 'var(--bg3)',
        transition: 'border-color 0.2s',
        clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
      }}>
        {/* Icon */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 18px', color: 'var(--text3)', flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>

        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={onKey}
          placeholder={t.inputPlaceholder}
          disabled={loading}
          style={{
            flex: 1,
            background: 'none', border: 'none', outline: 'none',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: 17, fontWeight: 400,
            letterSpacing: '0.03em',
            color: 'var(--text)',
            padding: '18px 0',
          }}
        />

        <button
          onClick={handle}
          disabled={loading}
          style={{
            background: loading ? 'var(--border2)' : 'var(--accent)',
            border: 'none',
            color: '#0a0800',
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: 15, fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '0 28px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            flexShrink: 0,
            minWidth: 110,
          }}
        >
          {loading ? '...' : t.searchBtn}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 10,
          padding: '10px 14px',
          background: 'rgba(192,57,43,0.1)',
          border: '1px solid rgba(192,57,43,0.3)',
          color: '#e74c3c',
          fontSize: 14,
          letterSpacing: '0.03em',
        }}>
          {error}
        </div>
      )}

      {/* Hint */}
      <div style={{
        marginTop: 12,
        fontSize: 13,
        color: 'var(--text3)',
        letterSpacing: '0.04em',
        textAlign: 'center',
      }}>
        {t.searchHint}
      </div>
    </div>
  );
}

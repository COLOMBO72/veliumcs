import { useState } from 'react';
import type { Ratings } from '../types';
import { ratePlayer, removeRating } from '../api';

const LIKE_REASONS  = [
  'Хороший командный игрок',
  'Хорошо играет',
  'Просто приятный чел',
  'Это мой друг',
];
const DISLIKE_REASONS = [
  'Читер',
  'Грифер',
  'Мне он просто не нравится',
  'Токсик',
];

interface Props {
  steamid64: string;
  initial:   Ratings;
}

export default function PlayerRating({ steamid64, initial }: Props) {
  const [ratings, setRatings] = useState<Ratings>(initial);
  const [pending, setPending] = useState<'like' | 'dislike' | null>(null);
  const [loading, setLoading] = useState(false);

  const totalLikes    = Object.values(ratings.likes).reduce((a, b) => a + b, 0);
  const totalDislikes = Object.values(ratings.dislikes).reduce((a, b) => a + b, 0);
  const myVote        = ratings.myVote;

  const handleVote = async (type: 'like' | 'dislike', reason: number) => {
    setLoading(true);
    try {
      const res = await ratePlayer(steamid64, type, reason);
      setRatings(r => ({
        likes:    type === 'like'    ? res.ratings : r.likes,
        dislikes: type === 'dislike' ? res.ratings : r.dislikes,
        myVote:   res.myVote,
      }));
      // Re-fetch full ratings properly
      const fullRes = await ratePlayer(steamid64, type, reason);
      setRatings({
        likes:    type === 'like'    ? fullRes.ratings : ratings.likes,
        dislikes: type === 'dislike' ? fullRes.ratings : ratings.dislikes,
        myVote:   fullRes.myVote,
      });
    } catch {}
    setLoading(false);
    setPending(null);
  };

  const handleRemove = async () => {
    setLoading(true);
    try { await removeRating(steamid64); } catch {}
    setRatings(r => ({ ...r, myVote: null }));
    setLoading(false);
  };

  const accentColor = (type: 'like' | 'dislike') =>
    type === 'like' ? 'var(--green)' : 'var(--red)';

  return (
    <div style={{
      background: 'var(--bg3)',
      border: '1px solid var(--border2)',
      borderLeft: '3px solid var(--accent)',
      padding: '20px 24px',
      marginBottom: 2,
    }}>
      {/* Header */}
      <div style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 13, fontWeight: 700,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: 'var(--accent)', marginBottom: 16,
      }}>
        ОЦЕНИТЬ ИГРОКА
      </div>

      {/* Existing rating stats */}
      {(totalLikes > 0 || totalDislikes > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* Likes breakdown */}
          <div style={{
            background: 'rgba(29,185,84,0.06)',
            border: '1px solid rgba(29,185,84,0.2)',
            padding: '12px 14px',
          }}>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 700,
              color: 'var(--green)', marginBottom: 8,
            }}>
              👍 {totalLikes}
            </div>
            {LIKE_REASONS.map((r, i) => {
              const count = ratings.likes[String(i)] || 0;
              if (!count) return null;
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 12, color: 'var(--text2)', marginBottom: 3,
                  letterSpacing: '0.02em',
                }}>
                  <span>{r}</span>
                  <span style={{ color: 'var(--green)', fontFamily: 'Share Tech Mono, monospace' }}>{count}</span>
                </div>
              );
            })}
          </div>
          {/* Dislikes breakdown */}
          <div style={{
            background: 'rgba(192,57,43,0.06)',
            border: '1px solid rgba(192,57,43,0.2)',
            padding: '12px 14px',
          }}>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: 20, fontWeight: 700,
              color: 'var(--red)', marginBottom: 8,
            }}>
              👎 {totalDislikes}
            </div>
            {DISLIKE_REASONS.map((r, i) => {
              const count = ratings.dislikes[String(i)] || 0;
              if (!count) return null;
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 12, color: 'var(--text2)', marginBottom: 3,
                  letterSpacing: '0.02em',
                }}>
                  <span>{r}</span>
                  <span style={{ color: 'var(--red)', fontFamily: 'Share Tech Mono, monospace' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vote UI */}
      {!myVote && !pending && (
        <div style={{ display: 'flex', gap: 10 }}>
          <VoteBtn
            icon="👍"
            label="Лайк"
            color="var(--green)"
            onClick={() => setPending('like')}
            disabled={loading}
          />
          <VoteBtn
            icon="👎"
            label="Дизлайк"
            color="var(--red)"
            onClick={() => setPending('dislike')}
            disabled={loading}
          />
        </div>
      )}

      {/* Reason picker */}
      {pending && !myVote && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, letterSpacing: '0.04em' }}>
            {pending === 'like' ? 'Почему тебе нравится этот игрок?' : 'Что не так с этим игроком?'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(pending === 'like' ? LIKE_REASONS : DISLIKE_REASONS).map((reason, i) => (
              <button
                key={i}
                disabled={loading}
                onClick={() => handleVote(pending, i)}
                style={{
                  background: 'var(--bg4)',
                  border: `1px solid ${pending === 'like' ? 'rgba(29,185,84,0.3)' : 'rgba(192,57,43,0.3)'}`,
                  color: 'var(--text)',
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 14, letterSpacing: '0.04em',
                  padding: '8px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = pending === 'like' ? 'var(--green)' : 'var(--red)';
                  (e.currentTarget as HTMLElement).style.color = pending === 'like' ? 'var(--green)' : 'var(--red)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = pending === 'like' ? 'rgba(29,185,84,0.3)' : 'rgba(192,57,43,0.3)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                }}
              >
                {i + 1}. {reason}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPending(null)}
            style={{
              marginTop: 8, background: 'none', border: 'none',
              color: 'var(--text3)', fontSize: 12, cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            ← Отмена
          </button>
        </div>
      )}

      {/* Already voted */}
      {myVote && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 13, color: 'var(--text2)', letterSpacing: '0.04em',
          }}>
            Ты оценил:{' '}
            <span style={{ color: accentColor(myVote.type), fontWeight: 700 }}>
              {myVote.type === 'like' ? '👍' : '👎'}{' '}
              {myVote.type === 'like'
                ? LIKE_REASONS[myVote.reason]
                : DISLIKE_REASONS[myVote.reason]}
            </span>
          </div>
          <button
            onClick={handleRemove}
            disabled={loading}
            style={{
              background: 'none',
              border: '1px solid var(--border2)',
              color: 'var(--text3)',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              padding: '4px 10px', cursor: 'pointer',
            }}
          >
            Убрать
          </button>
        </div>
      )}
    </div>
  );
}

function VoteBtn({
  icon, label, color, onClick, disabled,
}: {
  icon: string; label: string; color: string;
  onClick: () => void; disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: `${color}10`,
        border: `1px solid ${color}40`,
        color: color,
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 15, fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '10px 20px',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = `${color}22`;
        (e.currentTarget as HTMLElement).style.borderColor = color;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = `${color}10`;
        (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </button>
  );
}
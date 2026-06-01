import { useLang } from '../useLang';

type StepState = 'idle' | 'active' | 'done';
interface Props {
  steps: [StepState, StepState, StepState];
}

export default function LoadingPanel({ steps }: Props) {
  const { t } = useLang();
  const labels = [t.stepSteam, t.stepStats, t.stepFaceit];

  const dotColor = (s: StepState) =>
    s === 'done' ? 'var(--green)' : s === 'active' ? 'var(--accent)' : 'var(--text3)';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '60px 2rem',
    }}>
      {/* Spinner */}
      <div style={{
        width: 48, height: 48,
        border: '2px solid var(--border2)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        marginBottom: 24,
      }}/>

      <p style={{
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: 18, letterSpacing: '0.12em',
        color: 'var(--text2)',
        marginBottom: 16,
      }}>
        {t.loadingTitle}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13,
            color: dotColor(s),
            letterSpacing: '0.05em',
            transition: 'color 0.3s',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'currentColor',
              ...(s === 'active' ? { animation: 'spin 1s linear infinite' } : {}),
            }}/>
            {labels[i]}
            {s === 'done' && <span style={{ marginLeft: 4 }}>✓</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

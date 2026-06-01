import { useLang } from '../useLang';

export default function SeoSection() {
  const { t } = useLang();

  const features = [
    { h: t.feat1H, p: t.feat1P, icon: '⬡' },
    { h: t.feat2H, p: t.feat2P, icon: '⬡' },
    { h: t.feat3H, p: t.feat3P, icon: '⬡' },
    { h: t.feat4H, p: t.feat4P, icon: '⬡' },
  ];

  return (
    <section style={{ marginTop: 64 }}>
      {/* Features */}
      <div className="sec-divider">
        <div className="sec-divider-label" style={{ fontSize: 11 }}>
          {(t as any).seoFeat || 'FEATURES'}
        </div>
        <div className="sec-divider-line" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 2,
        marginBottom: 2,
      }}>
        {features.map((f, i) => (
          <div key={i} style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            padding: '22px 20px',
          }}>
            <div style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 15, fontWeight: 700,
              letterSpacing: '0.06em',
              color: 'var(--accent)',
              marginBottom: 8,
            }}>
              {f.icon} {f.h}
            </div>
            <p style={{
              fontSize: 14,
              color: 'var(--text2)',
              lineHeight: 1.6,
              letterSpacing: '0.02em',
            }}>
              {f.p}
            </p>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="sec-divider" style={{ marginTop: 32 }}>
        <div className="sec-divider-label" style={{ fontSize: 11 }}>
          {(t as any).faqTitle || 'FAQ'}
        </div>
        <div className="sec-divider-line" />
      </div>

      <div itemScope itemType="https://schema.org/FAQPage">
        {((t as any).faq as { q: string; a: string }[]).map((item, i) => (
          <div
            key={i}
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              padding: '16px 20px',
              marginBottom: 2,
            }}
          >
            <h3 itemProp="name" style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: 15, fontWeight: 600,
              letterSpacing: '0.04em',
              color: 'var(--text)',
              marginBottom: 6,
            }}>
              {item.q}
            </h3>
            <div
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
            >
              <p itemProp="text" style={{
                fontSize: 14,
                color: 'var(--text2)',
                lineHeight: 1.6,
              }}>
                {item.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

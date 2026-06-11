import { useState } from "react";
import { useLang } from "../useLang";

const BOT_URL = "https://t.me/veliumcs_bot";

export default function TgBanner({ steamid64 }: { steamid64: string }) {
  const { t } = useLang();
  const tc = t as any;

  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(`veliumcs_tg_dismissed_${steamid64}`) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(`veliumcs_tg_dismissed_${steamid64}`, "1");
    } catch {}
    setDismissed(true);
  };

  return (
    <div
      style={{
        position: "relative",
        margin: "12px 0",
        background:
          "linear-gradient(135deg, rgba(41,182,246,0.08) 0%, rgba(29,185,84,0.06) 100%)",
        border: "1px solid rgba(41,182,246,0.35)",
        borderLeft: "3px solid #29b6f6",
        padding: "18px 48px 18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      {/* Dismiss button */}
      <button
        onClick={dismiss}
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          background: "none",
          border: "none",
          color: "var(--text3)",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      {/* Telegram icon */}
      <div style={{ flexShrink: 0 }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="#29b6f6">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.03 5.36 13.1c-.658-.204-.67-.658.136-.974l10.91-4.207c.548-.194 1.026.132.856.97l-.7-.64z" />
        </svg>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 200 }}>
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "#29b6f6",
            marginBottom: 4,
          }}
        >
          {tc.tgBannerTitle || "TRACK YOUR REPUTATION"}
        </div>
        <div
          style={{
            fontSize: 14,
            color: "var(--text2)",
            lineHeight: 1.5,
            letterSpacing: "0.02em",
          }}
        >
          {tc.tgBannerText ||
            "Link your Steam to our Telegram bot and get notified when players rate you."}
        </div>
      </div>

      {/* CTA button */}
      <a
        href={`${BOT_URL}?start=${steamid64}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          background: "rgba(41,182,246,0.15)",
          border: "1px solid rgba(41,182,246,0.5)",
          color: "#29b6f6",
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textDecoration: "none",
          textTransform: "uppercase",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(41,182,246,0.28)";
          (e.currentTarget as HTMLElement).style.borderColor = "#29b6f6";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(41,182,246,0.15)";
          (e.currentTarget as HTMLElement).style.borderColor =
            "rgba(41,182,246,0.5)";
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 14.03 5.36 13.1c-.658-.204-.67-.658.136-.974l10.91-4.207c.548-.194 1.026.132.856.97l-.7-.64z" />
        </svg>
        {tc.tgBannerBtn || "Connect Telegram Bot"}
      </a>
    </div>
  );
}

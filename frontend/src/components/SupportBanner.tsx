import { useState } from "react";
import { useLang } from "../useLang";

const BOOSTY_URL = "https://boosty.to/velium";

export default function SupportBanner() {
  const { lang } = useLang();
  const [showQR, setShowQR] = useState(false);

  const isRu = lang === "ru";

  return (
    <div
      style={{
        position: "relative",
        margin: "12px 0",
        background:
          "linear-gradient(135deg, rgba(232,160,32,0.06) 0%, rgba(212,82,26,0.06) 100%)",
        border: "1px solid rgba(232,160,32,0.2)",
        borderLeft: "3px solid var(--accent)",
        padding: "18px 20px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "var(--accent)",
              marginBottom: 6,
            }}
          >
            {isRu ? "⬡ ПОДДЕРЖИ ПРОЕКТ" : "⬡ SUPPORT THE PROJECT"}
          </div>
          <div
            style={{
              fontSize: 14,
              color: "var(--text2)",
              lineHeight: 1.6,
              marginBottom: 12,
            }}
          >
            {isRu
              ? "Разработкой этого сервиса занимается один человек — скиньте по-братски на шаурму 200₽ 🌯"
              : "This service is built and maintained by one person. If it helped you — consider buying me a coffee ☕ ($1 goes a long way!)"}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SupportBtn label="☕ Boosty" color="#f97316" href={BOOSTY_URL} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportBtn({
  label,
  color,
  href,
  onClick,
}: {
  label: string;
  color: string;
  href?: string;
  onClick?: () => void;
}) {
  const style = {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    padding: "7px 14px",
    background: `${color}18`,
    border: `1px solid ${color}55`,
    color: color,
    fontFamily: "Rajdhani, sans-serif",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.15s",
  };
  if (href)
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
        {label}
      </a>
    );
  return (
    <button
      onClick={onClick}
      style={{ ...style, border: `1px solid ${color}55` }}
    >
      {label}
    </button>
  );
}

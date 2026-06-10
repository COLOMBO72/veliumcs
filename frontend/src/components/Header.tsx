import { useLang } from "../useLang";
import type { Lang } from "../types";
import { useState, useEffect } from "react";

const LANGS: Lang[] = ["en", "ru", "es"];

function navigate(path: string) {
  history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function Header() {
  const { lang, setLang, t } = useLang();
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    const onPop = () => setCurrentPath(location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const isCompare = currentPath.startsWith("/compare");

  return (
    <header
      style={{
        position: "relative",
        zIndex: 10,
        padding: "0 2rem",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "rgba(7,9,14,0.96)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Logo + nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
          >
            <polygon points="12,2 22,8 22,16 12,22 2,16 2,8" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="5" x2="12" y2="9" />
            <line x1="12" y1="15" x2="12" y2="19" />
          </svg>
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "var(--text)",
            }}
          >
            VELIUM<span style={{ color: "var(--accent)" }}>CS</span>
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: 4 }}>
          <NavBtn
            label="Поиск"
            active={!isCompare}
            onClick={() => navigate("/")}
          />
          <NavBtn
            label="⚔ Сравнение"
            active={isCompare}
            onClick={() => navigate("/compare")}
            accent
          />
        </nav>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            display: "flex",
            gap: 3,
            background: "var(--bg3)",
            border: "1px solid var(--border2)",
            padding: 3,
          }}
        >
          {LANGS.map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                fontFamily: "Barlow Condensed, sans-serif",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "4px 9px",
                border: "none",
                background: lang === l ? "var(--accent)" : "transparent",
                color: lang === l ? "#0a0800" : "var(--text3)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div
          className="resp-hide"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.15em",
            color: "var(--text3)",
            textTransform: "uppercase",
            border: "1px solid var(--border2)",
            padding: "4px 10px",
            background: "var(--bg3)",
          }}
        >
          {t.hdrBadge}
        </div>
      </div>
    </header>
  );
}

function NavBtn({
  label,
  active,
  onClick,
  accent,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "Barlow Condensed, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "6px 14px",
        border: "none",
        background: active
          ? accent
            ? "rgba(255,85,0,0.12)"
            : "rgba(232,160,32,0.1)"
          : "transparent",
        color: active
          ? accent
            ? "var(--faceit)"
            : "var(--accent)"
          : "var(--text3)",
        cursor: "pointer",
        transition: "all 0.15s",
        borderBottom: active
          ? `2px solid ${accent ? "var(--faceit)" : "var(--accent)"}`
          : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

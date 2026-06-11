import { useState, useEffect } from "react";
import type { PlayerData, CS2Stat } from "../types";
import { resolvePlayer, fetchPlayer } from "../api";
import { getStat } from "../utils";
import { useLang } from "../useLang";

export function getCompareFromUrl(): [string, string] | null {
  const m = location.pathname.match(/^\/compare\/(.+)-vs-(.+)$/);
  if (!m) return null;
  return [decodeURIComponent(m[1]), decodeURIComponent(m[2])];
}

export function setCompareUrl(a: string, b: string) {
  history.pushState(
    {},
    "",
    `/compare/${encodeURIComponent(a)}-vs-${encodeURIComponent(b)}`,
  );
}

interface Side {
  data: PlayerData;
  id64: string;
}

export default function ComparePage() {
  const { t } = useLang();
  const tc = t as any;

  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sideA, setSideA] = useState<Side | null>(null);
  const [sideB, setSideB] = useState<Side | null>(null);

  useEffect(() => {
    const pair = getCompareFromUrl();
    if (pair) {
      setInputA(pair[0]);
      setInputB(pair[1]);
      handleCompare(pair[0], pair[1]);
    }
  }, []);

  useEffect(() => {
    if (sideA && sideB) {
      document.title = `${sideA.data.profile.personaname} vs ${sideB.data.profile.personaname} | VELIUMCS`;
    } else {
      document.title = "Compare Players | VELIUMCS";
    }
  }, [sideA, sideB]);

  const handleCompare = async (a = inputA, b = inputB) => {
    if (!a.trim() || !b.trim()) {
      setError(tc.compareErrBoth || "Enter both players");
      return;
    }
    setError("");
    setLoading(true);
    setSideA(null);
    setSideB(null);
    try {
      const [id64A, id64B] = await Promise.all([
        resolvePlayer(a.trim()),
        resolvePlayer(b.trim()),
      ]);
      if (id64A === id64B) throw new Error(tc.compareErrSame || "Same player");
      const [dataA, dataB] = await Promise.all([
        fetchPlayer(id64A),
        fetchPlayer(id64B),
      ]);
      setSideA({ data: dataA, id64: id64A });
      setSideB({ data: dataB, id64: id64B });
      setCompareUrl(id64A, id64B);
    } catch (e: any) {
      setError(e.message || tc.compareErrLoad || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Loading bar */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            zIndex: 999,
            background: "var(--bg3)",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg,var(--accent),var(--orange))",
              animation: "loadBar 1.2s ease-in-out infinite",
            }}
          />
          <style>{`@keyframes loadBar{0%{width:0%;margin-left:0}50%{width:70%;margin-left:15%}100%{width:0%;margin-left:100%}}`}</style>
        </div>
      )}

      <section
        style={{
          padding: sideA ? "32px 2rem 24px" : "64px 2rem 48px",
          textAlign: "center",
          maxWidth: 900,
          margin: "0 auto",
          transition: "padding 0.3s",
        }}
      >
        {!sideA && (
          <>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 28,
                  height: 1,
                  background: "var(--accent)",
                  opacity: 0.5,
                  display: "inline-block",
                }}
              />
              {tc.secCompare || "PLAYER COMPARISON"}
              <span
                style={{
                  width: 28,
                  height: 1,
                  background: "var(--accent)",
                  opacity: 0.5,
                  display: "inline-block",
                }}
              />
            </div>
            <h1
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "clamp(40px, 6vw, 64px)",
                fontWeight: 700,
                letterSpacing: "0.05em",
                lineHeight: 1,
                marginBottom: 14,
                color: "var(--text)",
              }}
            >
              {tc.compareTitle || "PLAYER"}{" "}
              <span style={{ color: "var(--accent)" }}>VS</span>
            </h1>
            <p
              style={{
                fontSize: 17,
                color: "var(--text2)",
                marginBottom: 40,
                letterSpacing: "0.03em",
              }}
            >
              {tc.compareSubtitle ||
                "Compare CS2 & FACEIT stats of two players"}
            </p>
          </>
        )}

        {/* Inputs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 56px 1fr",
            gap: 10,
            alignItems: "center",
            maxWidth: 800,
            margin: "0 auto 16px",
          }}
        >
          <CInput
            value={inputA}
            onChange={setInputA}
            placeholder={tc.comparePlaceholder1 || "Player 1"}
            onEnter={() => handleCompare()}
            color="var(--blue)"
          />
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--accent)",
              textAlign: "center",
            }}
          >
            VS
          </div>
          <CInput
            value={inputB}
            onChange={setInputB}
            placeholder={tc.comparePlaceholder2 || "Player 2"}
            onEnter={() => handleCompare()}
            color="var(--faceit)"
          />
        </div>

        <button
          onClick={() => handleCompare()}
          disabled={loading}
          style={{
            background: loading ? "var(--border2)" : "var(--accent)",
            border: "none",
            color: "#0a0800",
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "13px 44px",
            cursor: loading ? "not-allowed" : "pointer",
            clipPath:
              "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)",
            transition: "background 0.2s",
          }}
        >
          {loading
            ? tc.compareLoading || "LOADING..."
            : tc.compareBtn || "COMPARE"}
        </button>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 16px",
              background: "rgba(192,57,43,0.1)",
              border: "1px solid rgba(192,57,43,0.3)",
              color: "#e74c3c",
              fontSize: 15,
            }}
          >
            {error}
          </div>
        )}
      </section>

      {sideA && sideB && <CompareResults a={sideA} b={sideB} t={tc} />}
    </div>
  );
}

function CInput({
  value,
  onChange,
  placeholder,
  onEnter,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onEnter: () => void;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg3)",
        border: `1px solid ${color}44`,
        clipPath:
          "polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))",
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter()}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: "none",
          border: "none",
          outline: "none",
          fontFamily: "Barlow Condensed, sans-serif",
          fontSize: 15,
          color: "var(--text)",
          padding: "14px 16px",
          letterSpacing: "0.03em",
        }}
      />
    </div>
  );
}

function CompareResults({ a, b, t }: { a: Side; b: Side; t: any }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem 80px" }}>
      {/* Player headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 56px 1fr",
          gap: 3,
          marginBottom: 3,
        }}
      >
        <PlayerCard data={a.data} color="var(--blue)" />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg3)",
            border: "1px solid var(--border)",
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--accent)",
          }}
        >
          VS
        </div>
        <PlayerCard data={b.data} color="var(--faceit)" align="right" />
      </div>

      {(a.data.faceit?.games?.cs2 || b.data.faceit?.games?.cs2) && (
        <FaceitCompare a={a.data} b={b.data} t={t} />
      )}
      {(a.data.cs2stats?.length || b.data.cs2stats?.length) && (
        <StatsCompare a={a.data} b={b.data} t={t} />
      )}
      <ShareCompare id64A={a.id64} id64B={b.id64} t={t} />
    </div>
  );
}

function PlayerCard({
  data,
  color,
  align = "left",
}: {
  data: PlayerData;
  color: string;
  align?: "left" | "right";
}) {
  const isR = align === "right";
  const game = data.faceit?.games?.cs2;
  return (
    <div
      style={{
        background: "var(--bg3)",
        border: "1px solid var(--border2)",
        borderLeft: isR ? "1px solid var(--border2)" : `3px solid ${color}`,
        borderRight: isR ? `3px solid ${color}` : "1px solid var(--border2)",
        padding: "22px 22px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexDirection: isR ? "row-reverse" : "row",
      }}
    >
      <img
        src={data.profile.avatarfull}
        alt="avatar"
        style={{
          width: 68,
          height: 68,
          flexShrink: 0,
          border: `2px solid ${color}55`,
        }}
      />
      <div style={{ textAlign: isR ? "right" : "left", flex: 1 }}>
        <a
          href={data.profile.profileurl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "var(--text)",
            textDecoration: "none",
            display: "block",
            marginBottom: 6,
          }}
        >
          {data.profile.personaname}
        </a>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: isR ? "flex-end" : "flex-start",
          }}
        >
          {game && (
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.08em",
                padding: "3px 10px",
                border: `1px solid ${color}55`,
                color,
                textTransform: "uppercase",
              }}
            >
              LVL {game.skill_level} · {game.faceit_elo.toLocaleString()} ELO
            </span>
          )}
          {data.bans.VACBanned && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.08em",
                padding: "3px 10px",
                border: "1px solid #e74c3c55",
                color: "#e74c3c",
              }}
            >
              VAC BAN
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FaceitCompare({ a, b }: { a: PlayerData; b: PlayerData; t: any }) {
  const ga = a.faceit?.games?.cs2;
  const gb = b.faceit?.games?.cs2;
  const fa = a.faceitStats?.lifetime ?? {};
  const fb = b.faceitStats?.lifetime ?? {};

  const rows = [
    { label: "ELO", va: ga?.faceit_elo ?? 0, vb: gb?.faceit_elo ?? 0 },
    { label: "Level", va: ga?.skill_level ?? 0, vb: gb?.skill_level ?? 0 },
    {
      label: "Matches",
      va: parseInt((fa as any)["Matches"] || "0"),
      vb: parseInt((fb as any)["Matches"] || "0"),
    },
    {
      label: "Win Rate %",
      va: parseFloat((fa as any)["Win Rate %"] || "0"),
      vb: parseFloat((fb as any)["Win Rate %"] || "0"),
    },
    {
      label: "K/D",
      va: parseFloat((fa as any)["Average K/D Ratio"] || "0"),
      vb: parseFloat((fb as any)["Average K/D Ratio"] || "0"),
    },
    {
      label: "Headshots %",
      va: parseFloat((fa as any)["Average Headshots %"] || "0"),
      vb: parseFloat((fb as any)["Average Headshots %"] || "0"),
    },
    {
      label: "Best Streak",
      va: parseInt((fa as any)["Longest Win Streak"] || "0"),
      vb: parseInt((fb as any)["Longest Win Streak"] || "0"),
    },
    {
      label: "Max ELO",
      va: parseInt((fa as any)["Best ELO"] || "0"),
      vb: parseInt((fb as any)["Best ELO"] || "0"),
    },
  ].filter((r) => r.va > 0 || r.vb > 0);

  return (
    <div>
      <div className="sec-divider">
        <div className="sec-divider-label">FACEIT</div>
        <div className="sec-divider-line" />
      </div>
      <CompareTable rows={rows} colorA="var(--blue)" colorB="var(--faceit)" />
    </div>
  );
}

function StatsCompare({ a, b }: { a: PlayerData; b: PlayerData; t: any }) {
  const sa = a.cs2stats || [];
  const sb = b.cs2stats || [];
  const g = (s: CS2Stat[], k: string) => getStat(s, k);

  const kdA =
    g(sa, "total_deaths") > 0
      ? g(sa, "total_kills") / g(sa, "total_deaths")
      : 0;
  const kdB =
    g(sb, "total_deaths") > 0
      ? g(sb, "total_kills") / g(sb, "total_deaths")
      : 0;
  const hsA =
    g(sa, "total_kills") > 0
      ? (g(sa, "total_kills_headshot") / g(sa, "total_kills")) * 100
      : 0;
  const hsB =
    g(sb, "total_kills") > 0
      ? (g(sb, "total_kills_headshot") / g(sb, "total_kills")) * 100
      : 0;
  const wrA =
    g(sa, "total_matches_played") > 0
      ? (g(sa, "total_matches_won") / g(sa, "total_matches_played")) * 100
      : 0;
  const wrB =
    g(sb, "total_matches_played") > 0
      ? (g(sb, "total_matches_won") / g(sb, "total_matches_played")) * 100
      : 0;
  const adrA =
    g(sa, "total_rounds_played") > 0
      ? g(sa, "total_damage_done") / g(sa, "total_rounds_played")
      : 0;
  const adrB =
    g(sb, "total_rounds_played") > 0
      ? g(sb, "total_damage_done") / g(sb, "total_rounds_played")
      : 0;
  const accA =
    g(sa, "total_shots_fired") > 0
      ? (g(sa, "total_shots_hit") / g(sa, "total_shots_fired")) * 100
      : 0;
  const accB =
    g(sb, "total_shots_fired") > 0
      ? (g(sb, "total_shots_hit") / g(sb, "total_shots_fired")) * 100
      : 0;
  const hrsA = Math.round(g(sa, "total_time_played") / 3600);
  const hrsB = Math.round(g(sb, "total_time_played") / 3600);

  const rows = [
    { label: "K/D Ratio", va: kdA, vb: kdB },
    { label: "Headshot %", va: hsA, vb: hsB },
    { label: "Win Rate %", va: wrA, vb: wrB },
    { label: "ADR", va: adrA, vb: adrB },
    { label: "Accuracy %", va: accA, vb: accB },
    {
      label: "Total Kills",
      va: g(sa, "total_kills"),
      vb: g(sb, "total_kills"),
    },
    {
      label: "Matches",
      va: g(sa, "total_matches_played"),
      vb: g(sb, "total_matches_played"),
    },
    { label: "Hours", va: hrsA, vb: hrsB },
    { label: "MVPs", va: g(sa, "total_mvps"), vb: g(sb, "total_mvps") },
  ].filter((r) => r.va > 0 || r.vb > 0);

  return (
    <div>
      <div className="sec-divider">
        <div className="sec-divider-label">CS2 STATISTICS</div>
        <div className="sec-divider-line" />
      </div>
      <CompareTable rows={rows} colorA="var(--blue)" colorB="var(--faceit)" />
    </div>
  );
}

function CompareTable({
  rows,
  colorA,
  colorB,
}: {
  rows: { label: string; va: number; vb: number }[];
  colorA: string;
  colorB: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {rows.map((row, i) => {
        const aWins = row.va !== row.vb && row.va > row.vb;
        const bWins = row.va !== row.vb && row.vb > row.va;
        const total = row.va + row.vb;
        const pctA = total > 0 ? Math.round((row.va / total) * 100) : 50;
        const pctB = 100 - pctA;

        // Format display value
        const fmt = (v: number, label: string) => {
          if (label.includes("%")) return `${v.toFixed(1)}%`;
          if (label === "K/D Ratio") return v.toFixed(2);
          if (label === "ADR") return v.toFixed(1);
          return v >= 1000
            ? v.toLocaleString()
            : v.toFixed(label.includes("K/D") || label.includes("ADR") ? 2 : 0);
        };

        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px 1fr",
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            {/* Value A */}
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: aWins ? `${colorA}14` : "transparent",
                borderRight: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: `${pctA}%`,
                  maxWidth: "60%",
                  height: 4,
                  background: aWins ? "var(--green)" : colorA,
                  opacity: aWins ? 0.9 : 0.4,
                  borderRadius: 2,
                  flexShrink: 0,
                  minWidth: 3,
                }}
              />
              <span
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: aWins ? "var(--green)" : "var(--text)",
                }}
              >
                {fmt(row.va, row.label)}
                {aWins && (
                  <span
                    style={{
                      fontSize: 13,
                      marginLeft: 5,
                      color: "var(--green)",
                    }}
                  >
                    ▲
                  </span>
                )}
              </span>
            </div>

            {/* Label */}
            <div
              style={{
                padding: "16px 8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRight: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text3)",
                  textAlign: "center",
                }}
              >
                {row.label}
              </span>
            </div>

            {/* Value B */}
            <div
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 10,
                background: bWins ? `${colorB}14` : "transparent",
              }}
            >
              <span
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: bWins ? "var(--green)" : "var(--text)",
                }}
              >
                {bWins && (
                  <span
                    style={{
                      fontSize: 13,
                      marginRight: 5,
                      color: "var(--green)",
                    }}
                  >
                    ▲
                  </span>
                )}
                {fmt(row.vb, row.label)}
              </span>
              <div
                style={{
                  width: `${pctB}%`,
                  maxWidth: "60%",
                  height: 4,
                  background: bWins ? "var(--green)" : colorB,
                  opacity: bWins ? 0.9 : 0.4,
                  borderRadius: 2,
                  flexShrink: 0,
                  minWidth: 3,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShareCompare({
  id64A,
  id64B,
  t,
}: {
  id64A: string;
  id64B: string;
  t: any;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${location.origin}/compare/${id64A}-vs-${id64B}`;
  return (
    <div
      style={{
        marginTop: 32,
        background: "var(--bg3)",
        border: "1px solid var(--border)",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--text3)",
          flexShrink: 0,
        }}
      >
        {t.compareShare || "Share"}
      </div>
      <div
        style={{
          flex: 1,
          fontFamily: "Share Tech Mono, monospace",
          fontSize: 12,
          color: "var(--text2)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {url}
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        style={{
          background: copied ? "rgba(29,185,84,0.15)" : "var(--bg4)",
          border: `1px solid ${copied ? "var(--green)" : "var(--border2)"}`,
          color: copied ? "var(--green)" : "var(--text2)",
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.1em",
          padding: "7px 16px",
          cursor: "pointer",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        {copied ? t.compareCopied || "✓ COPIED" : t.compareCopy || "COPY"}
      </button>
    </div>
  );
}

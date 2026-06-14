import { useEffect, useState } from "react";
import type { CS2Stat } from "../types";
import { getStat } from "../utils";

interface Props {
  stats: CS2Stat[];
}

interface Factor {
  label: string;
  value: number; // actual %
  normal: number; // normal baseline %
  max: number; // suspicious threshold %
  weight: number; // contribution to total score
  description: string;
}

function calcScore(factors: Factor[]): number {
  let totalWeight = 0;
  let weightedScore = 0;
  for (const f of factors) {
    if (f.value === 0) continue;
    // How far above normal (0 = normal, 1 = at max suspicious)
    const suspicion = Math.min(
      1,
      Math.max(0, (f.value - f.normal) / (f.max - f.normal)),
    );
    weightedScore += suspicion * f.weight;
    totalWeight += f.weight;
  }
  if (totalWeight === 0) return 0;
  return Math.round((weightedScore / totalWeight) * 100);
}

function scoreColor(score: number): string {
  if (score < 20) return "#1db954";
  if (score < 40) return "#86efac";
  if (score < 60) return "#f59e0b";
  if (score < 75) return "#f97316";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score < 15) return "CLEAN";
  if (score < 35) return "LEGIT";
  if (score < 55) return "SUSPICIOUS";
  if (score < 75) return "LIKELY CHEATER";
  return "CHEATER";
}

export default function CheatMeter({ stats }: Props) {
  // const barRef = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  const kills = getStat(stats, "total_kills");
  const hs = getStat(stats, "total_kills_headshot");
  const blinded = getStat(stats, "total_kills_enemy_blinded");
  const vsZoomed = getStat(stats, "total_kills_against_zoomed_sniper");
  // const enemyWep = getStat(stats, "total_kills_enemy_weapon");
  const shotsFired = getStat(stats, "total_shots_fired");
  const shotsHit = getStat(stats, "total_shots_hit");
  const matchesWon = getStat(stats, "total_matches_won");
  const matchesPlay = getStat(stats, "total_matches_played");

  if (kills < 500) return null; // недостаточно данных

  const hsPct = kills > 0 ? (hs / kills) * 100 : 0;
  const blindedPct = kills > 0 ? (blinded / kills) * 100 : 0;
  const zoomedPct = kills > 0 ? (vsZoomed / kills) * 100 : 0;
  const accPct = shotsFired > 0 ? (shotsHit / shotsFired) * 100 : 0;
  const wrPct = matchesPlay > 0 ? (matchesWon / matchesPlay) * 100 : 0;

  const factors: Factor[] = [
    {
      label: "Headshot %",
      value: hsPct,
      normal: 42, // avg legit player
      max: 75, // pro players rarely exceed this
      weight: 3,
      description: `${hsPct.toFixed(1)}% (norm ~42%)`,
    },
    {
      label: "Kills while blinded",
      value: blindedPct,
      normal: 3,
      max: 12,
      weight: 4, // strongest wallhack indicator
      description: `${blindedPct.toFixed(1)}% (norm ~3%)`,
    },
    {
      label: "Kills vs scoped AWP",
      value: zoomedPct,
      normal: 3,
      max: 10,
      weight: 3,
      description: `${zoomedPct.toFixed(1)}% (norm ~3%)`,
    },
    {
      label: "Shot accuracy",
      value: accPct,
      normal: 18,
      max: 36,
      weight: 2,
      description: `${accPct.toFixed(1)}% (norm ~18%)`,
    },
    {
      label: "Win rate",
      value: wrPct,
      normal: 50,
      max: 75,
      weight: 1,
      description: `${wrPct.toFixed(1)}% (norm ~50%)`,
    },
  ].filter((f) => f.value > 0);

  const score = calcScore(factors);
  const color = scoreColor(score);
  const label = scoreLabel(score);

  useEffect(() => {
    const id = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      style={{
        background: "var(--bg3)",
        border: `1px solid var(--border2)`,
        borderLeft: `3px solid ${color}`,
        padding: "20px 24px",
        marginBottom: 2,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "Rajdhani, sans-serif",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--text2)",
          }}
        >
          ⚠ CHEAT PROBABILITY
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color,
              padding: "3px 10px",
              border: `1px solid ${color}55`,
              background: `${color}12`,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color,
              lineHeight: 1,
            }}
          >
            {score}%
          </span>
        </div>
      </div>

      {/* Main bar */}
      <div
        style={{
          height: 10,
          background: "var(--bg5)",
          border: "1px solid var(--border)",
          position: "relative",
          overflow: "hidden",
          marginBottom: 16,
          borderRadius: 2,
        }}
      >
        {/* Gradient fill */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: animated ? `${score}%` : "0%",
            background: `linear-gradient(90deg, #1db954, #f59e0b ${score < 60 ? "80%" : "40%"}, ${color})`,
            transition: "width 1.4s cubic-bezier(0.16,1,0.3,1)",
            borderRadius: 2,
            boxShadow: `0 0 8px ${color}88`,
          }}
        />
        {/* Marker lines at 25, 50, 75 */}
        {[25, 50, 75].map((p) => (
          <div
            key={p}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${p}%`,
              width: 1,
              background: "var(--bg)",
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      {/* Scale labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          fontSize: 10,
          color: "var(--text3)",
          letterSpacing: "0.08em",
        }}
      >
        <span>0% CLEAN</span>
        <span>25%</span>
        <span>50% SUSPICIOUS</span>
        <span>75%</span>
        <span>100% CHEATER</span>
      </div>

      {/* Factor breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 8,
        }}
      >
        {factors.map((f) => {
          const fScore = Math.min(
            100,
            Math.max(
              0,
              Math.round(
                (Math.max(0, f.value - f.normal) / (f.max - f.normal)) * 100,
              ),
            ),
          );
          const fColor = scoreColor(fScore);
          return (
            <div
              key={f.label}
              style={{
                background: "var(--bg4)",
                border: "1px solid var(--border)",
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text3)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {f.label}
                </span>
                <span
                  style={{
                    fontFamily: "Share Tech Mono, monospace",
                    fontSize: 12,
                    color: fColor,
                  }}
                >
                  {fScore}%
                </span>
              </div>
              <div
                style={{
                  height: 3,
                  background: "var(--bg5)",
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: animated ? `${fScore}%` : "0%",
                    background: fColor,
                    transition: "width 1.4s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  marginTop: 4,
                  letterSpacing: "0.03em",
                }}
              >
                {f.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: "var(--text3)",
          letterSpacing: "0.04em",
          fontStyle: "italic",
        }}
      >
        * Based on Steam API lifetime stats. This is a statistical estimate, not
        definitive proof of cheating.
        {kills < 5000 && " Low sample size may affect accuracy."}
      </div>
    </div>
  );
}

import type {
  SteamProfile,
  SteamBans,
  FaceitPlayer,
  FaceitStats,
  CS2Stat,
} from "../types";
import { getStat } from "../utils";
import { useLang } from "../useLang";

const LEVEL_COLORS: Record<number, string> = {
  1: "#676767",
  2: "#676767",
  3: "#fae361",
  4: "#e9ce37",
  5: "#f6e33b",
  6: "#f6d43b",
  7: "#f7ab55",
  8: "#f7be55",
  9: "#ff5500",
  10: "#ff5500",
};

interface Props {
  profile: SteamProfile;
  bans: SteamBans;
  faceit: FaceitPlayer | null;
  faceitStats: FaceitStats | null;
  cs2stats: CS2Stat[] | null;
  cs2HoursReal: number | null;
}

export default function ProfileCards({
  profile,
  bans,
  faceit,
  faceitStats,
  cs2stats,
  cs2HoursReal,
}: Props) {
  const game = faceit?.games?.cs2;
  const fl = faceitStats?.lifetime ?? {};

  // ── Steam card data ──────────────────────────────────────
  const timePlayed = getStat(cs2stats || [], "total_time_played");
  // Приоритет: реальные часы из GetOwnedGames (как в Steam профиле), иначе из stats
  const hrs =
    cs2HoursReal ?? (timePlayed > 0 ? Math.round(timePlayed / 3600) : null);
  const matchesPlay = getStat(cs2stats || [], "total_matches_played");
  const created = profile.timecreated
    ? new Date(profile.timecreated * 1000)
    : null;
  const accountAge = created
    ? Math.floor((Date.now() - created.getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;
  const isPub = profile.communityvisibilitystate === 3;

  // ── Trust score ──────────────────────────────────────────
  // Рассчитываем Trust Score: 0-100, выше = надёжнее
  let trustScore = 50; // базовый
  const trustFactors: { label: string; impact: number; note: string }[] = [];

  // Возраст аккаунта (до +20)
  if (accountAge !== null) {
    const ageBonus = Math.min(20, accountAge * 3);
    trustScore += ageBonus;
    trustFactors.push({
      label: "Account age",
      impact: ageBonus,
      note: `${accountAge}y old`,
    });
  }

  // VAC / Game ban (-30 / -15)
  if (bans.VACBanned) {
    trustScore -= 30;
    trustFactors.push({
      label: "VAC Ban",
      impact: -30,
      note: `${bans.DaysSinceLastBan}d ago`,
    });
  }
  if (bans.NumberOfGameBans > 0) {
    const penalty = Math.min(20, bans.NumberOfGameBans * 10);
    trustScore -= penalty;
    trustFactors.push({
      label: "Game Ban",
      impact: -penalty,
      note: `×${bans.NumberOfGameBans}`,
    });
  }

  // Публичный профиль (+5)
  if (isPub) {
    trustScore += 5;
    trustFactors.push({ label: "Public profile", impact: 5, note: "visible" });
  } else {
    trustScore -= 5;
    trustFactors.push({ label: "Private profile", impact: -5, note: "hidden" });
  }

  // FACEIT данные
  if (game) {
    const level = game.skill_level;
    const bonus = Math.min(15, level * 1.5);
    trustScore += bonus;
    trustFactors.push({
      label: "FACEIT level",
      impact: bonus,
      note: `Level ${level}`,
    });

    const fMatches = parseInt((fl as any)["Matches"] || "0");
    if (fMatches > 500) {
      trustScore += 10;
      trustFactors.push({
        label: "FACEIT veteran",
        impact: 10,
        note: `${fMatches} matches`,
      });
    } else if (fMatches > 100) {
      trustScore += 5;
      trustFactors.push({
        label: "FACEIT active",
        impact: 5,
        note: `${fMatches} matches`,
      });
    }
  }

  // Много часов в CS2 (+5 если >500ч)
  if (hrs !== null && hrs > 500) {
    trustScore += 5;
    trustFactors.push({ label: "CS2 hours", impact: 5, note: `${hrs}h` });
  }

  // Clamp 0-100
  trustScore = Math.max(0, Math.min(100, Math.round(trustScore)));

  const trustColor =
    trustScore >= 70
      ? "#1db954"
      : trustScore >= 50
        ? "#f59e0b"
        : trustScore >= 30
          ? "#f97316"
          : "#ef4444";

  const trustLabel =
    trustScore >= 70
      ? "HIGH"
      : trustScore >= 50
        ? "MEDIUM"
        : trustScore >= 30
          ? "LOW"
          : "VERY LOW";

  return (
    <div
      className="profile-cards-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 3,
        margin: "12px 0",
      }}
    >
      {/* ── Card 1: FACEIT ── */}
      <Card
        accentColor={
          game ? LEVEL_COLORS[game.skill_level] || "#888" : "var(--border2)"
        }
        header="FACEIT CS2"
        headerIcon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.987 9.518c-.065-.31-.375-.518-.685-.518H13.13L16.04.616C16.169.242 15.89 0 15.56 0H8.233c-.266 0-.506.175-.581.44L4.006 12.044c-.1.33.146.65.484.65h7.077l-3.73 10.71c-.11.319.152.597.468.597.145 0 .29-.06.4-.175L23.78 10.218c.23-.23.27-.461.207-.7z" />
          </svg>
        }
      >
        {game ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
              }}
            >
              {/* Level circle */}
              <LevelCircleMini level={game.skill_level} />
              <div>
                <div
                  style={{
                    fontFamily: "Rajdhani, sans-serif",
                    fontSize: 32,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: LEVEL_COLORS[game.skill_level],
                  }}
                >
                  {game.faceit_elo.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text3)",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                  }}
                >
                  ELO
                </div>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px 12px",
              }}
            >
              <MiniStat label="Matches" val={(fl as any)["Matches"] || "—"} />
              <MiniStat
                label="Win Rate"
                val={
                  (fl as any)["Win Rate %"]
                    ? `${(fl as any)["Win Rate %"]}%`
                    : "—"
                }
              />
              <MiniStat
                label="K/D"
                val={(fl as any)["Average K/D Ratio"] || "—"}
              />
              <MiniStat
                label="HS %"
                val={
                  (fl as any)["Average Headshots %"]
                    ? `${(fl as any)["Average Headshots %"]}%`
                    : "—"
                }
              />
            </div>
            {(fl as any)["Best ELO"] &&
              parseInt((fl as any)["Best ELO"]) > game.faceit_elo && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "5px 10px",
                    background: "rgba(245,188,74,0.08)",
                    border: "1px solid rgba(245,188,74,0.2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text3)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    MAX ELO
                  </span>
                  <span
                    style={{
                      fontFamily: "Rajdhani, sans-serif",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#f5bc4a",
                    }}
                  >
                    {parseInt((fl as any)["Best ELO"]).toLocaleString()}
                  </span>
                </div>
              )}
          </>
        ) : (
          <div
            style={{ color: "var(--text3)", fontSize: 14, padding: "20px 0" }}
          >
            No FACEIT account linked
          </div>
        )}
      </Card>

      {/* ── Card 2: Steam ── */}
      <Card
        accentColor="#1a9fff"
        header="STEAM CS2"
        headerIcon={
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z" />
          </svg>
        }
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <img
            src={profile.avatarfull}
            alt=""
            style={{ width: 44, height: 44, border: "2px solid #1a9fff44" }}
          />
          <div>
            <div
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "0.04em",
              }}
            >
              {profile.personaname}
            </div>
            <div
              style={{
                fontFamily: "Share Tech Mono, monospace",
                fontSize: 10,
                color: "var(--text3)",
              }}
            >
              {profile.steamid}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px 12px",
          }}
        >
          {hrs !== null && (
            <MiniStat label="CS2 Hours" val={`${hrs.toLocaleString()}h`} />
          )}
          {matchesPlay > 0 && (
            <MiniStat label="Matches" val={matchesPlay.toLocaleString()} />
          )}
          {accountAge !== null && (
            <MiniStat label="Account age" val={`${accountAge}y`} />
          )}
          <MiniStat
            label="Profile"
            val={isPub ? "✓ Public" : "✗ Private"}
            color={isPub ? "var(--green)" : "var(--red)"}
          />
        </div>
        {(bans.VACBanned || bans.NumberOfGameBans > 0) && (
          <div
            style={{
              marginTop: 10,
              padding: "6px 10px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            {bans.VACBanned && (
              <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 700 }}>
                ⚠ VAC BAN · {bans.DaysSinceLastBan}d ago
              </div>
            )}
            {bans.NumberOfGameBans > 0 && (
              <div style={{ fontSize: 12, color: "#f97316", fontWeight: 700 }}>
                ⚠ Game Ban ×{bans.NumberOfGameBans}
              </div>
            )}
          </div>
        )}
        {!bans.VACBanned && !bans.NumberOfGameBans && (
          <div
            style={{
              marginTop: 10,
              padding: "6px 10px",
              background: "rgba(29,185,84,0.06)",
              border: "1px solid rgba(29,185,84,0.2)",
              fontSize: 12,
              color: "var(--green)",
              fontWeight: 700,
            }}
          >
            ✓ No bans on record
          </div>
        )}
      </Card>

      {/* ── Card 3: Trust Score ── */}
      <Card
        accentColor={trustColor}
        header="TRUST SCORE"
        headerIcon={
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        }
      >
        {/* Big score */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 14,
          }}
        >
          {/* Circular progress */}
          <TrustCircle score={trustScore} color={trustColor} />
          <div>
            <div
              style={{
                fontFamily: "Rajdhani, sans-serif",
                fontSize: 32,
                fontWeight: 700,
                color: trustColor,
                lineHeight: 1,
              }}
            >
              {trustScore}
              <span style={{ fontSize: 16 }}>%</span>
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: trustColor,
                marginTop: 2,
              }}
            >
              {trustLabel} TRUST
            </div>
          </div>
        </div>

        {/* Factor list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {trustFactors.slice(0, 5).map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text3)",
                  letterSpacing: "0.04em",
                  flex: 1,
                }}
              >
                {f.label}
              </span>
              <span
                style={{ fontSize: 11, color: "var(--text3)", marginRight: 8 }}
              >
                {f.note}
              </span>
              <span
                style={{
                  fontFamily: "Share Tech Mono, monospace",
                  fontSize: 12,
                  color: f.impact > 0 ? "var(--green)" : "var(--red)",
                  minWidth: 32,
                  textAlign: "right",
                }}
              >
                {f.impact > 0 ? "+" : ""}
                {f.impact}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function Card({
  accentColor,
  header,
  headerIcon,
  children,
}: {
  accentColor: string;
  header: string;
  headerIcon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg3)",
        border: "1px solid var(--border2)",
        borderTop: `3px solid ${accentColor}`,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 14,
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: accentColor,
        }}
      >
        <span style={{ color: accentColor }}>{headerIcon}</span>
        {header}
      </div>
      {children}
    </div>
  );
}

function MiniStat({
  label,
  val,
  color,
}: {
  label: string;
  val: string;
  color?: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--text3)",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 17,
          fontWeight: 700,
          color: color || "var(--text)",
          lineHeight: 1,
        }}
      >
        {val}
      </div>
    </div>
  );
}

function LevelCircleMini({ level }: { level: number }) {
  const c = LEVEL_COLORS[level] || "#888";
  const size = 44;
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const fill = level === 10 ? 1 : level % 2 === 0 ? 1 : 0.55;
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth={sw}
          strokeOpacity={0.2}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${circ * fill} ${circ}`}
          style={{ filter: `drop-shadow(0 0 ${size * 0.02}px)` }}
        />
      </svg>
      <span
        style={{
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 16,
          fontWeight: 700,
          color: c,
          position: "relative",
          zIndex: 1,
        }}
      >
        {level}
      </span>
    </div>
  );
}

function TrustCircle({ score, color }: { score: number; color: string }) {
  const size = 64;
  const sw = 6;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const fill = score / 100;
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ position: "absolute", transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeOpacity={0.15}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${circ * fill} ${circ}`}
          style={{
            filter: `drop-shadow(0 0 1px ${color})`,
            transition: "stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </svg>
      <svg
        width={size * 0.4}
        height={size * 0.4}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        style={{ position: "relative", zIndex: 1 }}
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </div>
  );
}

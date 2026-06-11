import type { SteamProfile, SteamBans, FaceitPlayer } from "../types";
import { useLang } from "../useLang";

interface Props {
  profile: SteamProfile;
  bans: SteamBans;
  faceit?: FaceitPlayer | null;
  viewCount?: number;
  tgLinked?: { username: string | null; linkedAt: string } | null;
}

export default function ProfileHeader({
  profile,
  bans,
  faceit,
  viewCount,
}: Props) {
  const { t } = useLang();
  const locale = (t as any).locale || "en-US";

  const stateLabels = t.states as string[];
  const stateLabel = stateLabels[profile.personastate] ?? stateLabels[0];
  const isOnline = profile.personastate === 1;
  const isPub = profile.communityvisibilitystate === 3;
  const created = profile.timecreated
    ? new Date(profile.timecreated * 1000).getFullYear()
    : "?";
  const lastOnline = profile.lastlogoff
    ? new Date(profile.lastlogoff * 1000).toLocaleDateString(locale)
    : "?";

  return (
    <div
      className="clip-tr2 animate-fadeup"
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 24,
        alignItems: "center",
        padding: "28px 32px",
        background: "var(--bg3)",
        border: "1px solid var(--border2)",
        marginBottom: 2,
      }}
    >
      {/* Avatar */}
      <div
        style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}
      >
        <img
          src={profile.avatarfull}
          alt="avatar"
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            border: "2px solid var(--border2)",
            display: "block",
          }}
        />
        {/* Online dot */}
        <div
          style={{
            position: "absolute",
            bottom: -4,
            right: -4,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: isOnline ? "var(--green)" : "var(--text3)",
            border: "2px solid var(--bg3)",
            boxShadow: isOnline ? "0 0 8px var(--green)" : "none",
            transition: "all 0.3s",
          }}
        />
      </div>

      {/* Info */}
      <div>
        <div style={{ marginBottom: 10 }}>
          <div
            style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: 36,
              fontWeight: 700,
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            {profile.personaname}
          </div>
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}
          >
            {viewCount != null && viewCount > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  background: "var(--bg4)",
                  border: "1px solid var(--border2)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text3)",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                ПРОСМОТРЕНО{" "}
                <span
                  style={{
                    color: "var(--accent)",
                    fontFamily: "Share Tech Mono, monospace",
                    fontSize: 12,
                  }}
                >
                  {viewCount.toLocaleString()}
                </span>{" "}
                РАЗ
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <span className="meta-tag steam">STEAM</span>
          <span className={`meta-tag ${isPub ? "public" : "private"}`}>
            {isPub ? t.tagPublic : t.tagPrivate}
          </span>
          {bans.VACBanned && <span className="meta-tag vac">{t.tagVac}</span>}
          {bans.NumberOfGameBans > 0 && (
            <span className="meta-tag gameban">
              {t.tagGameBan} ×{bans.NumberOfGameBans}
            </span>
          )}
          {!bans.VACBanned && !bans.NumberOfGameBans && (
            <span className="meta-tag public">{t.tagClean}</span>
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: isOnline ? "var(--green)" : "var(--text3)",
              padding: "3px 9px",
              border: `1px solid ${isOnline ? "var(--green)" : "var(--border2)"}`,
            }}
          >
            {stateLabel}
          </span>
        </div>

        <div
          style={{
            fontFamily: "Share Tech Mono, monospace",
            fontSize: 12,
            color: "var(--text3)",
            letterSpacing: "0.04em",
          }}
        >
          {profile.steamid}&nbsp;&nbsp;·&nbsp;&nbsp;
          {t.since} {created}&nbsp;&nbsp;·&nbsp;&nbsp;
          {t.lastOnline}: {lastOnline}
        </div>
      </div>

      {/* Links */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        <ExternalLink href={profile.profileurl} label="Steam" />
        {faceit?.faceit_url && (
          <ExternalLink
            href={faceit.faceit_url.replace("{lang}", "en")}
            label="FACEIT"
            accent="var(--faceit)"
          />
        )}
      </div>
    </div>
  );
}

function ExternalLink({
  href,
  label,
  accent,
}: {
  href: string;
  label: string;
  accent?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textDecoration: "none",
        padding: "8px 14px",
        border: `1px solid ${accent ? `${accent}55` : "var(--border2)"}`,
        color: accent || "var(--text2)",
        background: "var(--bg4)",
        transition: "all 0.15s",
      }}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      {label}
    </a>
  );
}

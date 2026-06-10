import type { CS2Stat } from "../types";
import { getStat } from "../utils";
import { useLang } from "../useLang";

interface Props {
  stats: CS2Stat[];
}

export default function CS2Stats({ stats }: Props) {
  const { t } = useLang();

  // ── Confirmed CS2/CSGO Steam API keys (verified from real API response) ──
  const kills = getStat(stats, "total_kills"); // total kills all-time
  const deaths = getStat(stats, "total_deaths"); // total deaths
  const matchesWon = getStat(stats, "total_matches_won"); // match wins (correct key!)
  const matchesPlay = getStat(stats, "total_matches_played"); // total matches played
  const roundsPlay = getStat(stats, "total_rounds_played"); // total rounds played
  const hsKills = getStat(stats, "total_kills_headshot"); // headshot kills
  const mvps = getStat(stats, "total_mvps"); // MVP stars
  const dmgDone = getStat(stats, "total_damage_done"); // total damage
  const shotsFired = getStat(stats, "total_shots_fired"); // shots fired
  const shotsHit = getStat(stats, "total_shots_hit"); // shots hit
  const timePlayed = getStat(stats, "total_time_played"); // seconds played
  const bombsPlant = getStat(stats, "total_planted_bombs"); // bombs planted
  const bombsDefu = getStat(stats, "total_defused_bombs"); // bombs defused

  // ── Calculations ──
  const kd = deaths > 0 ? kills / deaths : kills;
  const kdStr = kd.toFixed(2);
  const kdCls = kd >= 1.5 ? "good" : kd < 1 ? "danger" : "";

  const hsPct = kills > 0 ? Math.round((hsKills / kills) * 100) : 0;
  const hsCls = hsPct >= 50 ? "good" : hsPct >= 40 ? "warn" : "";

  // Win Rate — use total_matches_won / total_matches_played (both confirmed in API)
  const wr = matchesPlay > 0 ? Math.round((matchesWon / matchesPlay) * 100) : 0;
  const wrCls = wr >= 55 ? "good" : wr >= 50 ? "warn" : "";

  // ADR — damage / rounds (both confirmed in API)
  const adr = roundsPlay > 0 ? Math.round(dmgDone / roundsPlay) : 0;
  const adrCls = adr >= 90 ? "good" : adr >= 70 ? "warn" : "";

  // Accuracy — shots_hit / shots_fired
  const acc = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;

  // Hours
  const hrs = Math.round(timePlayed / 3600);

  // ── Weapons — top 8 by kills (all keys confirmed in API) ──
  const weapons = [
    { key: "total_kills_ak47", name: "AK-47" },
    { key: "total_kills_m4a1", name: "M4A1-S / M4A4" },
    { key: "total_kills_awp", name: "AWP" },
    { key: "total_kills_deagle", name: "Desert Eagle" },
    { key: "total_kills_glock", name: "Glock-18" },
    { key: "total_kills_hkp2000", name: "USP-S / P2000" },
    { key: "total_kills_famas", name: "FAMAS" },
    { key: "total_kills_aug", name: "AUG" },
    { key: "total_kills_sg556", name: "SG 553" },
    { key: "total_kills_ssg08", name: "SSG 08" },
    { key: "total_kills_p250", name: "P250" },
    { key: "total_kills_tec9", name: "Tec-9" },
    { key: "total_kills_fiveseven", name: "Five-SeveN" },
    { key: "total_kills_mac10", name: "MAC-10" },
    { key: "total_kills_mp9", name: "MP9" },
    { key: "total_kills_p90", name: "P90" },
    { key: "total_kills_mp7", name: "MP7" },
    { key: "total_kills_ump45", name: "UMP-45" },
    { key: "total_kills_nova", name: "Nova" },
    { key: "total_kills_xm1014", name: "XM1014" },
    { key: "total_kills_mag7", name: "MAG-7" },
    { key: "total_kills_negev", name: "Negev" },
    { key: "total_kills_m249", name: "M249" },
    { key: "total_kills_scar20", name: "SCAR-20" },
    { key: "total_kills_g3sg1", name: "G3SG1" },
    { key: "total_kills_knife", name: "Knife" },
    { key: "total_kills_hegrenade", name: "HE Grenade" },
    { key: "total_kills_molotov", name: "Molotov" },
    { key: "total_kills_taser", name: "Zeus" },
  ]
    .map((w) => ({ name: w.name, val: getStat(stats, w.key) }))
    .filter((w) => w.val > 0)
    .sort((a, b) => b.val - a.val)
    .slice(0, 8);

  // ── Maps — wins + rounds played (both confirmed in API) ──
  const mapList = [
    {
      wKey: "total_wins_map_de_dust2",
      rKey: "total_rounds_map_de_dust2",
      name: "Dust2",
    },
    {
      wKey: "total_wins_map_de_inferno",
      rKey: "total_rounds_map_de_inferno",
      name: "Inferno",
    },
    {
      wKey: "total_wins_map_de_nuke",
      rKey: "total_rounds_map_de_nuke",
      name: "Nuke",
    },
    {
      wKey: "total_wins_map_de_train",
      rKey: "total_rounds_map_de_train",
      name: "Train",
    },
    {
      wKey: "total_wins_map_de_vertigo",
      rKey: "total_rounds_map_de_vertigo",
      name: "Vertigo",
    },
    {
      wKey: "total_wins_map_de_cbble",
      rKey: "total_rounds_map_de_cbble",
      name: "Cobblestone",
    },
    { wKey: "total_wins_map_de_aztec", rKey: null, name: "Aztec" },
    // Note: mirage, overpass, ancient, anubis have no total_rounds_map_* confirmed
    // but total_wins_map_* exist for some — include with 0 rounds as fallback
  ]
    .map((m) => ({
      name: m.name,
      wins: getStat(stats, m.wKey),
      rounds: m.rKey ? getStat(stats, m.rKey) : 0,
    }))
    .filter((m) => m.wins > 0)
    .sort((a, b) => b.wins - a.wins);

  const mxW = weapons.length ? weapons[0].val : 1;
  const mxM = mapList.length ? mapList[0].wins : 1;

  const statCards = [
    {
      label: t.statKD,
      val: kdStr,
      sub: `${kills.toLocaleString()} ${t.kills} / ${deaths.toLocaleString()} ${t.deaths}`,
      cls: kdCls,
    },
    {
      label: t.statHS,
      val: `${hsPct}%`,
      sub: `${hsKills.toLocaleString()} / ${kills.toLocaleString()}`,
      cls: hsCls,
    },
    {
      label: t.statWR,
      val: matchesPlay > 0 ? `${wr}%` : "—",
      sub: `${matchesWon.toLocaleString()} / ${matchesPlay.toLocaleString()} матчей`,
      cls: wrCls,
    },
    {
      label: t.statADR,
      val: String(adr),
      sub: `${dmgDone.toLocaleString()} ${t.damageRound}`,
      cls: adrCls,
    },
    {
      label: t.statACC,
      val: `${acc}%`,
      sub: `${shotsHit.toLocaleString()} / ${shotsFired.toLocaleString()} ${t.hits}`,
      cls: "",
    },
    {
      label: t.statMVP,
      val: mvps.toLocaleString(),
      sub: t.stars,
      cls: "",
    },
    {
      label: t.statHours,
      val: hrs.toLocaleString(),
      sub: t.playtime,
      cls: "",
    },
    {
      label: t.statBombs,
      val: bombsPlant.toLocaleString(),
      sub: `${t.defused}: ${bombsDefu.toLocaleString()}`,
      cls: "",
    },
  ];

  return (
    <div>
      <div className="sec-divider">
        <div className="sec-divider-label">{t.secCs2}</div>
        <div className="sec-divider-line" />
      </div>

      {/* Stat cards */}
      <div
        className="stagger"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 2,
          marginBottom: 2,
        }}
      >
        {statCards.map((c, i) => (
          <div key={i} className="stat-card animate-fadeup">
            <div className="stat-label">{c.label}</div>
            <div className={`stat-value ${c.cls}`}>{c.val}</div>
            <div className="stat-sub">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Bar charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
          marginTop: 2,
        }}
      >
        {weapons.length > 0 && (
          <BarCard
            title={t.barWeapons}
            items={weapons.map((w) => ({ name: w.name, val: w.val }))}
            max={mxW}
          />
        )}
        {mapList.length > 0 && (
          <MapBarCard title={t.barMaps} maps={mapList} max={mxM} />
        )}
      </div>
    </div>
  );
}

function BarCard({
  title,
  items,
  max,
  colors,
}: {
  title: string;
  items: { name: string; val: number }[];
  max: number;
  colors?: string[];
}) {
  return (
    <div
      style={{
        background: "var(--bg3)",
        border: "1px solid var(--border)",
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--text2)",
          marginBottom: 18,
        }}
      >
        {title}
      </div>
      {items.map((item, i) => (
        <div
          key={item.name}
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 56px",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "var(--text2)",
              textAlign: "right",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.name}
          </div>
          <div className="bar-track">
            <div
              className={`bar-fill${colors?.[i] ? ` ${colors[i]}` : ""}`}
              style={{ width: `${Math.round((item.val / max) * 100)}%` }}
            />
          </div>
          <div
            style={{
              fontFamily: "Share Tech Mono, monospace",
              fontSize: 12,
              color: "var(--text)",
              textAlign: "right",
            }}
          >
            {item.val.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

// Map bar card — shows wins + rounds played per map
function MapBarCard({
  title,
  maps,
  max,
}: {
  title: string;
  maps: { name: string; wins: number; rounds: number }[];
  max: number;
}) {
  return (
    <div
      style={{
        background: "var(--bg3)",
        border: "1px solid var(--border)",
        padding: 24,
      }}
    >
      <div
        style={{
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--text2)",
          marginBottom: 18,
        }}
      >
        {title}
      </div>
      {maps.map((m, i) => {
        return (
          <div key={m.name} style={{ marginBottom: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 56px",
                alignItems: "center",
                gap: 12,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text2)",
                  textAlign: "right",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {m.name}
              </div>
              <div className="bar-track">
                <div
                  className={`bar-fill${["", "blue", "green", "teal", "purple", "blue", "green", "blue"][i] ? ` ${["", "blue", "green", "teal", "purple", "blue", "green", "blue"][i]}` : ""}`}
                  style={{ width: `${Math.round((m.wins / max) * 100)}%` }}
                />
              </div>
              <div
                style={{
                  fontFamily: "Share Tech Mono, monospace",
                  fontSize: 12,
                  color: "var(--text)",
                  textAlign: "right",
                }}
              >
                {m.wins.toLocaleString()}
              </div>
            </div>
            {m.rounds > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: 12,
                  paddingLeft: 0,
                }}
              >
                <div />
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text3)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {m.rounds.toLocaleString()} rounds
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

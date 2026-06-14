import { useEffect, useRef } from "react";
import type { CS2Stat } from "../types";
import { getStat } from "../utils";
import { useLang } from "../useLang";

interface Props {
  stats: CS2Stat[];
}

export default function CS2Stats({ stats }: Props) {
  const { t } = useLang();

  const kills = getStat(stats, "total_kills");
  const deaths = getStat(stats, "total_deaths");
  const matchesWon = getStat(stats, "total_matches_won");
  const matchesPlay = getStat(stats, "total_matches_played");
  const roundsPlay = getStat(stats, "total_rounds_played");
  const hsKills = getStat(stats, "total_kills_headshot");
  const mvps = getStat(stats, "total_mvps");
  const dmgDone = getStat(stats, "total_damage_done");
  const shotsFired = getStat(stats, "total_shots_fired");
  const shotsHit = getStat(stats, "total_shots_hit");
  const timePlayed = getStat(stats, "total_time_played");
  const bombsPlant = getStat(stats, "total_planted_bombs");
  const bombsDefu = getStat(stats, "total_defused_bombs");

  // Читерство-релевантные
  const killsBlinded = getStat(stats, "total_kills_enemy_blinded"); // убийства ослеплённых
  const killsZoomed = getStat(stats, "total_kills_against_zoomed_sniper"); // убийства vs AWP
  const killsEnemyWep = getStat(stats, "total_kills_enemy_weapon"); // чужим оружием
  const knifeFights = getStat(stats, "total_kills_knife_fight");

  const kd = deaths > 0 ? kills / deaths : 0;
  const kdCls = kd >= 1.5 ? "good" : kd < 1 ? "danger" : "";

  const hsPct = kills > 0 ? (hsKills / kills) * 100 : 0;
  const hsCls = hsPct >= 50 ? "good" : hsPct >= 40 ? "warn" : "";

  const wr =
    matchesPlay > 0 && matchesWon <= matchesPlay
      ? (matchesWon / matchesPlay) * 100
      : 0;

  const wrCls = wr >= 55 ? "good" : wr >= 50 ? "warn" : "";

  const adrRaw = roundsPlay > 0 && dmgDone > 0 ? dmgDone / roundsPlay : 0;

  const adr = adrRaw > 0 && adrRaw < 200 ? adrRaw : 0;

  const adrCls = adr >= 90 ? "good" : adr >= 70 ? "warn" : "";

  const acc =
    shotsFired > 0 && shotsHit <= shotsFired
      ? (shotsHit / shotsFired) * 100
      : 0;

  const hrs = timePlayed > 0 ? Math.round(timePlayed / 3600) : 0;
  // ── Weapons ──
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
    { key: "total_kills_ump45", name: "UMP-45" },
    { key: "total_kills_nova", name: "Nova" },
    { key: "total_kills_xm1014", name: "XM1014" },
    { key: "total_kills_negev", name: "Negev" },
    { key: "total_kills_knife", name: "Knife" },
    { key: "total_kills_hegrenade", name: "HE Grenade" },
    { key: "total_kills_molotov", name: "Molotov" },
    { key: "total_kills_taser", name: "Zeus" },
  ]
    .map((w) => ({ name: w.name, val: getStat(stats, w.key) }))
    .filter((w) => w.val > 0)
    .sort((a, b) => b.val - a.val)
    .slice(0, 8);

  // ── Maps — только ключи которые РЕАЛЬНО существуют в API ──
  // Подтверждено из реального API ответа (total_wins_map_* и total_rounds_map_*)
  const maps = [
    {
      wKey: "total_wins_map_de_dust2",
      rKey: "total_rounds_map_de_dust2",
      name: "Dust2",
    },
    {
      wKey: "total_wins_map_de_mirage",
      rKey: "total_rounds_map_de_mirage",
      name: "Mirage",
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
      wKey: "total_wins_map_de_overpass",
      rKey: "total_rounds_map_de_overpass",
      name: "Overpass",
    },
    {
      wKey: "total_wins_map_de_ancient",
      rKey: "total_rounds_map_de_ancient",
      name: "Ancient",
    },
    {
      wKey: "total_wins_map_de_anubis",
      rKey: "total_rounds_map_de_anubis",
      name: "Anubis",
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
  ]
    .map((m) => {
      const wonRounds = getStat(stats, m.wKey);
      const totalRounds = getStat(stats, m.rKey);

      return {
        name: m.name,
        wonRounds,
        totalRounds,
        winRate:
          totalRounds > 0 ? Math.round((wonRounds / totalRounds) * 100) : 0,
      };
    })
    .filter((m) => m.wonRounds > 0 || m.totalRounds > 0)
    .sort((a, b) => b.totalRounds - a.totalRounds);

  const mxW = weapons.length ? weapons[0].val : 1;
  const mxM = maps.length ? Math.max(...maps.map((m) => m.totalRounds)) : 1;
  // const maps = [
  //   {
  //     wKey: "total_wins_map_de_dust2",
  //     rKey: "total_rounds_map_de_dust2",
  //     name: "Dust2",
  //   },
  //   {
  //     wKey: "total_wins_map_de_inferno",
  //     rKey: "total_rounds_map_de_inferno",
  //     name: "Inferno",
  //   },
  //   {
  //     wKey: "total_wins_map_de_nuke",
  //     rKey: "total_rounds_map_de_nuke",
  //     name: "Nuke",
  //   },
  //   {
  //     wKey: "total_wins_map_de_train",
  //     rKey: "total_rounds_map_de_train",
  //     name: "Train",
  //   },
  //   {
  //     wKey: "total_wins_map_de_vertigo",
  //     rKey: "total_rounds_map_de_vertigo",
  //     name: "Vertigo",
  //   },
  //   {
  //     wKey: "total_wins_map_de_cbble",
  //     rKey: "total_rounds_map_de_cbble",
  //     name: "Cobblestone",
  //   },
  //   // Mirage, Overpass, Ancient, Anubis — нет ключей wins/rounds в Steam API
  //   // Есть только для старых карт из CS:GO эпохи
  // ]
  //   .map((m) => ({
  //     name: m.name,
  //     wins: getStat(stats, m.wKey),
  //     rounds: getStat(stats, m.rKey),
  //   }))
  //   .filter((m) => m.wins > 0 || m.rounds > 0)
  //   .sort((a, b) => b.wins + b.rounds - (a.wins + a.rounds));

  // const mxW = weapons.length ? weapons[0].val : 1;
  // const mxM = maps.length ? Math.max(...maps.map((m) => m.wins)) : 1;

  const statCards = [
    {
      label: t.statKD,
      val: kd.toFixed(2),
      sub: `${kills.toLocaleString()} ${t.kills} / ${deaths.toLocaleString()} ${t.deaths}`,
      cls: kdCls,
    },
    {
      label: t.statHS,
      val: `${Math.round(hsPct)}%`,
      sub: `${hsKills.toLocaleString()} / ${kills.toLocaleString()}`,
      cls: hsCls,
    },
    {
      label: t.statWR,
      val: matchesPlay > 0 ? `${Math.round(wr)}%` : "—",
      sub: `${matchesWon.toLocaleString()} / ${matchesPlay.toLocaleString()}`,
      cls: wrCls,
    },
    { label: t.statMVP, val: mvps.toLocaleString(), sub: t.stars, cls: "" },
    { label: t.statHours, val: hrs.toLocaleString(), sub: t.playtime, cls: "" },
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
        {maps.length > 0 && (
          <MapBarCard title={t.barMaps} maps={maps} max={mxM} />
        )}
      </div>
    </div>
  );
}

function BarCard({
  title,
  items,
  max,
}: {
  title: string;
  items: { name: string; val: number }[];
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
      {items.map((item, i) => (
        <div
          key={item.name}
          style={{
            display: "grid",
            gridTemplateColumns: "130px 1fr 56px",
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
              className="bar-fill"
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

function MapBarCard({
  title,
  maps,
  max,
}: {
  title: string;
  maps: {
    name: string;
    wonRounds: number;
    totalRounds: number;
    winRate: number;
  }[];
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
        const colors = ["", "blue", "green", "teal", "purple", "blue"];
        return (
          <div key={m.name} style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "130px 1fr 70px",
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
                }}
              >
                {m.name}
              </div>

              <div className="bar-track">
                <div
                  className={`bar-fill${colors[i] ? ` ${colors[i]}` : ""}`}
                  style={{
                    width: `${Math.round((m.totalRounds / max) * 100)}%`,
                  }}
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
                {m.wonRounds.toLocaleString()}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "130px 1fr",
                gap: 12,
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
                {m.totalRounds.toLocaleString()} rounds · {m.winRate}% round WR
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

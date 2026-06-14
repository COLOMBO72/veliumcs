import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LangProvider, useLang } from "./useLang";
import type { PlayerData } from "./types";
import { resolvePlayer, fetchPlayer } from "./api";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import ProfileHeader from "./components/ProfileHeader";
import CS2Stats from "./components/CS2Stats";
import FaceitPanel from "./components/FaceitPanel";
import TgBanner from "./components/TgBanner";
import SeoSection from "./components/SeoSection";
// import CheatMeter from "./components/CheatMeter";
import SupportBanner from "./components/SupportBanner";
import PlayerRating from "./components/PlayerRating";
import ComparePage from "./components/ComparePage";

const queryClient = new QueryClient();

// ── Analytics ────────────────────────────────────────────────
function track(event: string, data?: Record<string, string>) {
  try {
    const log = JSON.parse(localStorage.getItem("veliumcs_analytics") || "[]");
    log.push({ event, data, ts: Date.now(), path: location.pathname });
    localStorage.setItem("veliumcs_analytics", JSON.stringify(log.slice(-200)));
  } catch {}
}

// ── URL helpers ──────────────────────────────────────────────
function getPlayerFromUrl(): string | null {
  const m = location.pathname.match(/^\/player\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

function setPlayerUrl(id: string) {
  history.pushState({}, "", `/player/${encodeURIComponent(id)}`);
}

function clearPlayerUrl() {
  history.pushState({}, "", "/");
}

// ── Page type ────────────────────────────────────────────────
type Page = "home" | "compare";

function getPage(): Page {
  return location.pathname.startsWith("/compare") ? "compare" : "home";
}

// ── Router ───────────────────────────────────────────────────
function Router() {
  const [page, setPage] = useState<Page>(getPage);

  useEffect(() => {
    const onPop = () => setPage(getPage());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (page === "compare") return <ComparePage />;
  return <HomePage />;
}

// ── Home page ────────────────────────────────────────────────
function HomePage() {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<PlayerData | null>(null);

  // handleSearch wrapped in useCallback so useEffect can depend on it safely
  const handleSearch = useCallback(
    async (input: string, updateUrl = true) => {
      setError("");
      setData(null);
      setLoading(true);
      if (updateUrl) setPlayerUrl(input);
      track("search", { input: input.slice(0, 60) });

      try {
        let id64: string;
        try {
          id64 = await resolvePlayer(input);
        } catch (e: any) {
          throw new Error(e?.response?.data?.error || t.errNotFound);
        }

        let player: PlayerData;
        try {
          player = await fetchPlayer(id64);
        } catch (e: any) {
          throw new Error(e?.response?.data?.error || t.errGeneric);
        }

        setData(player);
        // Always update URL to canonical steamid64
        history.replaceState({}, "", `/player/${id64}`);
        // Save to sessionStorage for refresh persistence
        sessionStorage.setItem("veliumcs_last_id64", id64);
        track("profile_loaded", { steamid64: id64 });
      } catch (e: any) {
        setError(e.message || t.errGeneric);
        if (updateUrl) clearPlayerUrl();
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  // On mount: load from URL or sessionStorage
  useEffect(() => {
    const urlSlug = getPlayerFromUrl();
    if (urlSlug) {
      track("page_view", { type: "player_url" });
      handleSearch(urlSlug, false);
      return;
    }
    // Restore last viewed profile on refresh
    const saved = sessionStorage.getItem("veliumcs_last_id64");
    if (saved) {
      history.replaceState({}, "", `/player/${saved}`);
      handleSearch(saved, false);
      return;
    }
    track("page_view", { type: "home" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Browser back/forward
  useEffect(() => {
    const onPop = () => {
      const slug = getPlayerFromUrl();
      if (slug) {
        handleSearch(slug, false);
      } else {
        setData(null);
        setError("");
        sessionStorage.removeItem("veliumcs_last_id64");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [handleSearch]);

  // Page title
  useEffect(() => {
    if (!data) {
      document.title = "VELIUMCS — CS2 Player Stats & FACEIT ELO Tracker";
      return;
    }
    const nick = data.profile.personaname;
    const elo = data.faceit?.games?.cs2?.faceit_elo;
    const lvl = data.faceit?.games?.cs2?.skill_level;
    document.title = elo
      ? `${nick} — ELO ${elo} LVL ${lvl} | VELIUMCS`
      : `${nick} CS2 Stats | VELIUMCS`;
  }, [data]);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* Hero + search */}
      <section
        style={{
          padding: data ? "32px 2rem 24px" : "80px 2rem 60px",
          textAlign: "center",
          maxWidth: 900,
          margin: "0 auto",
          transition: "padding 0.3s ease",
        }}
      >
        {!data && !loading && (
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
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 1,
                  background: "var(--accent)",
                  opacity: 0.5,
                  display: "inline-block",
                }}
              />
              Steam · FACEIT · CS2
              <span
                style={{
                  width: 32,
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
                fontSize: "clamp(42px, 7vw, 72px)",
                fontWeight: 700,
                letterSpacing: "0.05em",
                lineHeight: 1,
                marginBottom: 16,
                color: "var(--text)",
              }}
            >
              {t.heroH1}{" "}
              <span style={{ color: "var(--accent)" }}>{t.heroH1Span}</span>
            </h1>
            <p
              style={{
                fontSize: 17,
                color: "var(--text2)",
                letterSpacing: "0.03em",
                marginBottom: 48,
                maxWidth: 520,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {t.heroP}
            </p>
          </>
        )}
        <SearchBar
          onSearch={(v) => handleSearch(v, true)}
          loading={loading}
          error={error}
        />
      </section>

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
              background:
                "linear-gradient(90deg, var(--accent), var(--orange))",
              animation: "loadBar 1.2s ease-in-out infinite",
            }}
          />
          <style>{`@keyframes loadBar{0%{width:0%;margin-left:0}50%{width:70%;margin-left:15%}100%{width:0%;margin-left:100%}}`}</style>
        </div>
      )}

      {/* Results */}
      {!loading && data && (
        <div
          style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem 80px" }}
        >
          <ProfileHeader
            profile={data.profile}
            bans={data.bans}
            faceit={data.faceit}
            viewCount={data.viewCount}
            tgLinked={data.tgLinked}
          />

          {/* Cheat meter — показывать только если есть CS2 stats */}
          {/* {data.cs2stats && data.cs2stats.length > 0 && (
            <CheatMeter stats={data.cs2stats} />
          )} */}

          <SupportBanner />
          <TgBanner steamid64={data.profile.steamid} />

          {data.ratings && (
            <PlayerRating
              steamid64={data.profile.steamid}
              initial={data.ratings}
            />
          )}

          {/* FACEIT first */}
          {data.faceit?.games?.cs2 ? (
            <FaceitPanel
              faceit={data.faceit}
              faceitStats={data.faceitStats}
              faceitMatches={data.faceitMatches}
              faceitRecent20={data.faceitRecent20}
              faceitMaps={data.faceitMaps}
              faceitCsgoStats={data.faceitCsgoStats}
            />
          ) : (
            <div>
              <div className="sec-divider">
                <div className="sec-divider-label">{t.secFaceit}</div>
                <div className="sec-divider-line" />
              </div>
              <div className="no-faceit">{t.noFaceit}</div>
            </div>
          )}

          {/* CS2 stats second */}
          {data.cs2stats && data.cs2stats.length > 0 ? (
            <CS2Stats stats={data.cs2stats} />
          ) : (
            <div>
              <div className="sec-divider">
                <div className="sec-divider-label">{t.secCs2}</div>
                <div className="sec-divider-line" />
              </div>
              <div className="no-faceit">{t.cs2private}</div>
            </div>
          )}

          <ShareBlock steamid64={data.profile.steamid} />
        </div>
      )}

      {/* SEO section on empty state */}
      {!loading && !data && (
        <div
          style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem 80px" }}
        >
          <SeoSection />
        </div>
      )}
    </div>
  );
}

// ── Share block ──────────────────────────────────────────────
function ShareBlock({ steamid64 }: { steamid64: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${location.origin}/player/${steamid64}`;
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
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--text3)",
          flexShrink: 0,
        }}
      >
        SHARE
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
          track("share_copy", { steamid64 });
        }}
        style={{
          background: copied ? "rgba(29,185,84,0.15)" : "var(--bg4)",
          border: `1px solid ${copied ? "var(--green)" : "var(--border2)"}`,
          color: copied ? "var(--green)" : "var(--text2)",
          fontFamily: "Rajdhani, sans-serif",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          padding: "6px 14px",
          cursor: "pointer",
          transition: "all 0.2s",
          flexShrink: 0,
        }}
      >
        {copied ? "✓ COPIED" : "COPY"}
      </button>
    </div>
  );
}

// ── App root ─────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <Header />
        <main>
          <Router />
        </main>
        <footer
          style={{
            position: "relative",
            zIndex: 1,
            borderTop: "1px solid var(--border)",
            padding: "28px 2rem",
            background: "var(--bg2)",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "Rajdhani, sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "var(--text)",
                  marginBottom: 4,
                }}
              >
                VELIUM<span style={{ color: "var(--accent)" }}>CS</span>
                <span
                  style={{
                    marginLeft: 10,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.15em",
                    color: "var(--text3)",
                    verticalAlign: "middle",
                  }}
                >
                  BY VELIUM SERVICE
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text3)",
                  letterSpacing: "0.04em",
                  marginBottom: 8,
                }}
              >
                Data:{" "}
                <span style={{ color: "var(--accent)" }}>Steam Web API</span> +{" "}
                <span style={{ color: "var(--faceit)" }}>
                  FACEIT Data API v4
                </span>
              </div>
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "var(--text3)",
                letterSpacing: "0.08em",
              }}
            >
              © {new Date().getFullYear()} Velium Service
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text3)",
                  marginBottom: 6,
                }}
              >
                CONTACT US
              </div>
              <a
                href="mailto:estwoodbizn@gmail.com"
                style={{
                  fontFamily: "Share Tech Mono, monospace",
                  fontSize: 13,
                  color: "var(--text2)",
                  textDecoration: "none",
                  letterSpacing: "0.04em",
                }}
              >
                estwoodbizn@gmail.com
              </a>
            </div>
          </div>
        </footer>
      </LangProvider>
    </QueryClientProvider>
  );
}

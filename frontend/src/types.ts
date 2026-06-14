export interface SteamProfile {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
  timecreated?: number;
  lastlogoff?: number;
  loccountrycode?: string;
}

export interface SteamBans {
  VACBanned: boolean;
  NumberOfVACBans: number;
  NumberOfGameBans: number;
  DaysSinceLastBan: number;
  EconomyBan: string;
}

export interface CS2Stat {
  name: string;
  value: number;
}

export interface FaceitGame {
  skill_level: number;
  faceit_elo: number;
  game_player_id: string;
  region: string;
}

export interface FaceitPlayer {
  player_id: string;
  nickname: string;
  avatar?: string;
  country?: string;
  faceit_url: string;
  membership_type?: string;
  activated_at?: string;
  games: {
    cs2?: FaceitGame;
    csgo?: FaceitGame;
  };
}

export interface FaceitSegment {
  mode: any;
  label: string;
  type?: string;
  img_small?: string;
  img_regular?: string;
  stats: Record<string, string>;
}

export interface FaceitStats {
  lifetime?: Record<string, string>;
  segments?: FaceitSegment[];
}

export interface FaceitMatch {
  match_id: string;
  game_mode?: string;
  competition_name?: string;
  results?: {
    winner: string;
    score: { faction1: number; faction2: number };
  };
  teams?: {
    faction1: { players: { player_id: string }[] };
    faction2: { players: { player_id: string }[] };
  };
  voting?: { map?: { pick?: string[] } };
  finished_at?: number;
  elo_diff?: number | null; // enriched by backend from match stats
}

export interface RatingCounts {
  [reason: string]: number;
}
export interface Ratings {
  likes: RatingCounts;
  dislikes: RatingCounts;
  myVote: { type: "like" | "dislike"; reason: number } | null;
}

// Per-player stats from /matches/{id}/stats
export type FaceitPlayerMatchStats = Record<string, string>;

export interface PlayerData {
  profile: SteamProfile;
  bans: SteamBans;
  cs2stats: CS2Stat[] | null;
  faceit: FaceitPlayer | null;
  faceitStats: FaceitStats | null;
  faceitMatches: FaceitMatch[] | null;
  faceitRecent20: FaceitPlayerMatchStats[] | null;
  faceitMaps: FaceitSegment[] | null;
  faceitCsgoStats: FaceitStats | null;
  ratings: Ratings | null;
  viewCount: number;
  tgLinked: { username: string | null; linkedAt: string } | null;
}

export type Lang = "en" | "ru" | "es";

import axios from "axios";
import type { PlayerData } from "./types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

const api = axios.create({ baseURL: BASE });

export async function resolvePlayer(input: string): Promise<string> {
  const { data } = await api.get<{ steamid64: string }>("/api/resolve", {
    params: { input },
  });
  return data.steamid64;
}

export async function fetchPlayer(steamid64: string): Promise<PlayerData> {
  const { data } = await api.get<PlayerData>(`/api/player/${steamid64}`);
  return data;
}

export async function ratePlayer(
  steamid64: string,
  type: "like" | "dislike",
  reason: number,
): Promise<{
  ratings: { likes: Record<string, number>; dislikes: Record<string, number> };
  myVote: { type: "like" | "dislike"; reason: number } | null;
}> {
  const { data } = await api.post(`/api/rate/${steamid64}`, { type, reason });
  return data;
}

export async function removeRating(steamid64: string): Promise<void> {
  await api.delete(`/api/rate/${steamid64}`);
}

import type { EliminationEvent, GameMode, GameRecord, PlayerStats } from "../types/game";

const RECORDS_KEY = "blindkarta_records_v2";
const STATS_KEY = "blindkarta_stats_v2";

export function loadRecords(): GameRecord[] {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]"); } catch { return []; }
}
export function loadStats(): Record<string, PlayerStats> {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || "{}"); } catch { return {}; }
}
export function updateStatsAfterGame(
  players: string[], winner: string, eliminationOrder: EliminationEvent[],
  totalCities: number, mode: GameMode, scores: number[], placedCounts: number[]
) {
  const stats = loadStats();
  const eliminated = new Set(eliminationOrder.map(e => e.playerName));
  players.forEach((name, i) => {
    const old = stats[name] || { name, totalGames: 0, wins: 0, citiesPlaced: 0, timesEliminated: 0, totalScore: 0, bestScore: 0 };
    stats[name] = {
      ...old, name, totalGames: old.totalGames + 1,
      wins: old.wins + (name === winner ? 1 : 0),
      citiesPlaced: old.citiesPlaced + placedCounts[i],
      timesEliminated: old.timesEliminated + (eliminated.has(name) ? 1 : 0),
      totalScore: old.totalScore + scores[i], bestScore: Math.max(old.bestScore, scores[i]),
    };
  });
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  const records = loadRecords();
  records.push({ id: crypto.randomUUID?.() || String(Date.now()), date: new Date().toISOString(), players, winner, totalCities, eliminationOrder, mode, scores });
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records.slice(-100)));
}

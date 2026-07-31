import { PLAYER_COLORS } from "./GameSetup";
import type { EliminationEvent } from "../types/game";

interface GameOverProps {
  winner: string | null;
  players: string[];
  eliminated: boolean[];
  eliminationOrder: EliminationEvent[];
  placedCounts: number[];
  totalCities: number;
  onNewGame: () => void;
  onShowStats: () => void;
}

export default function GameOver({
  winner,
  players,
  eliminated,
  eliminationOrder,
  placedCounts,
  totalCities,
  onNewGame,
  onShowStats,
}: GameOverProps) {
  // Build a ranking: winner first, then eliminated in reverse (last eliminated = 2nd place, etc.)
  const ranking = players
    .map((name, i) => ({
      name,
      index: i,
      eliminated: eliminated[i],
      placed: placedCounts[i] || 0,
      eliminatedBy: eliminationOrder.find((e) => e.playerName === name)?.cityName ?? null,
    }))
    .sort((a, b) => {
      if (a.name === winner) return -1;
      if (b.name === winner) return 1;
      // Later elimination = better placement
      const aIdx = eliminationOrder.findIndex((e) => e.playerName === a.name);
      const bIdx = eliminationOrder.findIndex((e) => e.playerName === b.name);
      if (aIdx === -1 && bIdx === -1) return 0;
      if (aIdx === -1) return -1;
      if (bIdx === -1) return 1;
      return bIdx - aIdx;
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
            <span className="text-2xl">🏆</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Game Over!</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {totalCities} orter placerades totalt
          </p>
        </div>

        {/* Winner spotlight */}
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/20 p-4 text-center border border-amber-200 dark:border-amber-700">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            🥇 Vinnare
          </p>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
            {winner}
          </p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
            Överlevde alla {players.length} rundor!
          </p>
        </div>

        {/* All players ranking */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">
            Resultat
          </p>
          {ranking.map((r) => {
            const color = PLAYER_COLORS[r.index % PLAYER_COLORS.length];
            const isWinner = r.name === winner;

            return (
              <div
                key={r.name}
                className={`flex items-center gap-3 rounded-xl p-2.5 transition-colors ${
                  isWinner
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : r.eliminated
                    ? "bg-slate-50 dark:bg-slate-700/30"
                    : "bg-slate-50 dark:bg-slate-700/30"
                }`}
              >
                {/* Rank badge */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: r.eliminated && !isWinner ? "#94a3b8" : color }}
                >
                  {isWinner ? "🥇" : r.eliminated ? "✕" : ranking.indexOf(r) + 1}
                </div>

                {/* Name + detail */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-semibold truncate ${
                        isWinner
                          ? "text-amber-700 dark:text-amber-300"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {r.name}
                    </p>
                    {isWinner && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 font-medium">
                        👑
                      </span>
                    )}
                    {r.eliminated && !isWinner && (
                      <span className="text-xs text-red-400 dark:text-red-500">Utslagen</span>
                    )}
                  </div>
                  {r.eliminatedBy && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      Föll på "<span className="text-red-400 dark:text-red-400">{r.eliminatedBy}</span>"
                    </p>
                  )}
                </div>

                {/* Cities placed */}
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                    {r.placed}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">orter</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onNewGame}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Ny omgång
          </button>
          <button
            onClick={onShowStats}
            className="rounded-xl bg-slate-100 dark:bg-slate-700 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
          >
            Statistik
          </button>
        </div>
      </div>
    </div>
  );
}

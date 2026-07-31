import { loadStats, loadRecords } from "../utils/storage";
import type { PlayerStats } from "../types/game";
import { useState, useMemo } from "react";

interface StatsPanelProps {
  onClose: () => void;
}

export default function StatsPanel({ onClose }: StatsPanelProps) {
  const [tab, setTab] = useState<"players" | "records">("players");

  const stats = useMemo(() => loadStats(), []);
  const records = useMemo(() => loadRecords(), []);

  const sortedStats: PlayerStats[] = useMemo(() => {
    return Object.values(stats).sort((a, b) => b.wins - a.wins || b.totalGames - a.totalGames);
  }, [stats]);

  const recentRecords = useMemo(() => {
    return [...records].reverse().slice(0, 20);
  }, [records]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[80vh] rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Statistik</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTab("players")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "players"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Spelare
          </button>
          <button
            onClick={() => setTab("records")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "records"
                ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            Senaste matcher
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {tab === "players" && (
            <>
              {sortedStats.length === 0 ? (
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
                  Ingen statistik än. Spela en omgång först!
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedStats.map((ps, i) => (
                    <div
                      key={ps.name}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-bold text-blue-600 dark:text-blue-400">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                          {ps.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {ps.totalGames} matcher • {ps.wins} vinster
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                          {ps.totalGames > 0
                            ? Math.round((ps.wins / ps.totalGames) * 100)
                            : 0}
                          %
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">vinst</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "records" && (
            <>
              {recentRecords.length === 0 ? (
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">
                  Inga matcher spelade än.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(rec.date).toLocaleDateString("sv-SE", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {rec.totalCities} orter
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                          🏆 {rec.winner}
                        </span>
                        <span className="text-xs text-slate-400">vann</span>
                      </div>
                      {rec.eliminationOrder && rec.eliminationOrder.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {rec.eliminationOrder.map((e, ei) => (
                            <span key={ei} className="text-xs bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                              {e.playerName} ✕
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

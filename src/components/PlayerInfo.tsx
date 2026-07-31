import { PLAYER_COLORS } from "./GameSetup";

interface PlayerInfoProps {
  players: string[];
  eliminated: boolean[];
  currentPlayerIndex: number;
  placedCounts: number[];
  phase: string;
}

export default function PlayerInfo({
  players,
  eliminated,
  currentPlayerIndex,
  placedCounts,
  phase,
}: PlayerInfoProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {players.map((name, i) => {
        const isEliminated = eliminated[i];
        const isCurrent = i === currentPlayerIndex && phase === "playing" && !isEliminated;
        const color = PLAYER_COLORS[i % PLAYER_COLORS.length];

        return (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-300 ${
              isEliminated
                ? "bg-slate-200/60 dark:bg-slate-700/40 opacity-50 line-through"
                : isCurrent
                ? "bg-white dark:bg-slate-700 shadow-lg ring-2 ring-offset-1 scale-105"
                : "bg-white/60 dark:bg-slate-800/60"
            }`}
            style={{
              borderLeft: isEliminated
                ? "4px solid #94a3b8"
                : `4px solid ${color}`,
            }}
          >
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                background: isEliminated ? "#94a3b8" : color,
              }}
            >
              {isEliminated ? "✕" : i + 1}
            </span>
            <span className="text-slate-700 dark:text-slate-200">
              {name}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">
              ({placedCounts[i] || 0})
            </span>
            {isCurrent && (
              <span className="ml-1 flex h-2 w-2">
                <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
            )}
            {isEliminated && (
              <span className="text-xs text-red-400 dark:text-red-500 ml-1">ute</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

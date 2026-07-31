import { useEffect, useState } from "react";
import { PLAYER_COLORS } from "./GameSetup";

interface EliminationToastProps {
  playerName: string;
  cityName: string;
  players: string[];
  onDone: () => void;
}

export default function EliminationToast({
  playerName,
  cityName,
  players,
  onDone,
}: EliminationToastProps) {
  const [visible, setVisible] = useState(false);

  const playerIndex = players.indexOf(playerName);
  const color = playerIndex >= 0 ? PLAYER_COLORS[playerIndex % PLAYER_COLORS.length] : "#ef4444";

  useEffect(() => {
    // Trigger entrance animation
    const t1 = setTimeout(() => setVisible(true), 50);
    // Auto-dismiss after 2.5s
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-5 py-3 shadow-2xl border border-red-200 dark:border-red-800">
        <div className="flex-shrink-0">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white text-lg"
            style={{ background: color }}
          >
            ✕
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">
            {playerName} är ute!
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            "<span className="font-semibold text-red-500 dark:text-red-400">{cityName}</span>" — linjen korsade!
          </p>
        </div>
      </div>
    </div>
  );
}

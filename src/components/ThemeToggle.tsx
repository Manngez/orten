interface ThemeToggleProps {
  dark: boolean;
  onToggle: () => void;
}

export default function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-3 right-3 z-50 rounded-full p-2.5 transition-all duration-300
        bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm
        shadow-lg hover:shadow-xl hover:scale-110
        border border-slate-200 dark:border-slate-700"
      aria-label={dark ? "Byt till ljust tema" : "Byt till mörkt tema"}
      title={dark ? "Byt till ljust tema" : "Byt till mörkt tema"}
    >
      {dark ? (
        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-foreground transition duration-300 hover:bg-[#6B4B36]/10 hover:text-[#4A3024] dark:hover:bg-white/10 dark:hover:text-[#F7EBDD] active:scale-95"
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] transition-transform duration-500 ease-out group-hover:rotate-[25deg] group-hover:scale-110" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px] transition-transform duration-500 ease-out group-hover:rotate-[25deg] group-hover:scale-110" aria-hidden="true" />
      )}
    </button>
  );
}

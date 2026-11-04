'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className="h-10 w-10 border border-border"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="group inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-surface text-foreground transition duration-300 hover:border-primary hover:text-primary active:scale-95"
    >
      {isDark ? (
        <Sun className="h-[18px] w-[18px] transition-transform duration-500 ease-out group-hover:rotate-[25deg] group-hover:scale-110" aria-hidden="true" />
      ) : (
        <Moon className="h-[18px] w-[18px] transition-transform duration-500 ease-out group-hover:rotate-[25deg] group-hover:scale-110" aria-hidden="true" />
      )}
    </button>
  );
}

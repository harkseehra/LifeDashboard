"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Sun, Moon, Monitor, Cloud } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getGreeting } from "@/lib/date-helpers";

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const now = new Date();
  const greeting = getGreeting();
  const dateStr = format(now, "EEEE, MMMM d");

  const cycleTheme = () => {
    const cycle = { light: "dark", dark: "system", system: "light" } as const;
    setTheme(cycle[theme]);
  };

  const ThemeIcon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const themeLabel = `Theme: ${theme}`;

  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="type-display">{greeting}, Harkirat</h1>
        <p className="type-small mt-1">{dateStr}</p>
      </div>

      <div className="flex items-center gap-2 mt-1 shrink-0">
        {/* Weather pill — stub until Phase 5 */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full type-small"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <Cloud size={13} style={{ color: "var(--text-tertiary)" }} />
          <span style={{ color: "var(--text-secondary)" }}>—°</span>
        </div>

        {mounted && (
          <button
            onClick={cycleTheme}
            title={themeLabel}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              boxShadow: "var(--shadow-card)",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-card-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-card)";
            }}
          >
            <ThemeIcon size={14} />
          </button>
        )}
      </div>
    </header>
  );
}

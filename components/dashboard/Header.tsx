"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Sun, Moon, Monitor, CloudSun } from "lucide-react";
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

  const ThemeIcon =
    theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="type-display">{greeting}, Harkirat</h1>
        <p className="type-small mt-1">{dateStr}</p>
      </div>

      <div className="flex items-center gap-2 mt-1 shrink-0">
        {/* Weather pill — hardcoded Mississauga until Phase 5 wires OpenWeatherMap */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-card)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <CloudSun size={14} style={{ color: "#FF9500" }} />
          <span className="type-small" style={{ color: "var(--text-primary)" }}>
            18°
          </span>
          <span style={{ color: "var(--border-card)" }}>·</span>
          <span className="type-small">Cloudy</span>
        </div>

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
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

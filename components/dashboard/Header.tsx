"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Sun,
  Moon,
  Monitor,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { getGreeting } from "@/lib/date-helpers";
import { fadeUp, spring } from "@/lib/animations";

// ── Weather helpers ──────────────────────────────────────────────────────────

type WeatherIcon =
  | "sun"
  | "cloud-sun"
  | "cloud"
  | "cloud-rain"
  | "cloud-drizzle"
  | "cloud-snow"
  | "cloud-lightning";

function wmoToWeather(code: number): { label: string; icon: WeatherIcon } {
  if (code === 0) return { label: "Clear", icon: "sun" };
  if (code <= 2) return { label: "Partly cloudy", icon: "cloud-sun" };
  if (code === 3) return { label: "Overcast", icon: "cloud" };
  if (code <= 48) return { label: "Foggy", icon: "cloud" };
  if (code <= 55) return { label: "Drizzle", icon: "cloud-drizzle" };
  if (code <= 65) return { label: "Rain", icon: "cloud-rain" };
  if (code <= 77) return { label: "Snow", icon: "cloud-snow" };
  if (code <= 82) return { label: "Showers", icon: "cloud-rain" };
  if (code <= 86) return { label: "Snow showers", icon: "cloud-snow" };
  return { label: "Stormy", icon: "cloud-lightning" };
}

const ICON_COMPONENTS = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-rain": CloudRain,
  "cloud-drizzle": CloudDrizzle,
  "cloud-snow": CloudSnow,
  "cloud-lightning": CloudLightning,
};

const ICON_COLORS: Record<WeatherIcon, string> = {
  sun: "#FF9500",
  "cloud-sun": "#FF9500",
  cloud: "var(--text-tertiary)",
  "cloud-rain": "#007AFF",
  "cloud-drizzle": "#007AFF",
  "cloud-snow": "#34C759",
  "cloud-lightning": "#FF3B30",
};

interface WeatherState {
  temp: number;
  label: string;
  icon: WeatherIcon;
}

function useWeather() {
  const [weather, setWeather] = useState<WeatherState | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto&forecast_days=1`
          );
          const data = await res.json();
          const { label, icon } = wmoToWeather(data.current.weather_code);
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            label,
            icon,
          });
        } catch {
          // silently fail — weather is non-critical
        }
      },
      () => {
        // geolocation denied — hide the widget silently
      },
      { timeout: 8000 }
    );
  }, []);

  return weather;
}

// ── Component ────────────────────────────────────────────────────────────────

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const weather = useWeather();

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

  const WeatherIconComponent = weather
    ? ICON_COMPONENTS[weather.icon]
    : CloudSun;
  const weatherColor = weather ? ICON_COLORS[weather.icon] : "#FF9500";

  return (
    <motion.header
      className="flex items-start justify-between gap-4"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ ...spring, delay: 0 }}
    >
      <div>
        <h1 className="type-display">{greeting}, Harkirat</h1>
        <p className="type-small mt-1">{dateStr}</p>
      </div>

      <div className="flex items-center gap-2 mt-1 shrink-0">
        {/* Weather pill */}
        {mounted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <WeatherIconComponent size={14} style={{ color: weatherColor }} />
            {weather ? (
              <>
                <span
                  className="type-small"
                  style={{ color: "var(--text-primary)" }}
                >
                  {weather.temp}°
                </span>
                <span style={{ color: "var(--border-card)" }}>·</span>
                <span className="type-small">{weather.label}</span>
              </>
            ) : (
              <span
                className="type-small"
                style={{ color: "var(--text-tertiary)" }}
              >
                ···
              </span>
            )}
          </motion.div>
        )}

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
    </motion.header>
  );
}

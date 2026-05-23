"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { fadeUp, staggerParent, spring } from "@/lib/animations";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <motion.div
        className="flex flex-col gap-8"
        style={{ padding: "var(--page-top) var(--page-gutter) 60px", maxWidth: 640, margin: "0 auto" }}
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} transition={spring} className="flex items-center gap-4">
          <Link href="/" className="type-small" style={{ color: "var(--accent)" }}>
            ← Dashboard
          </Link>
        </motion.div>

        <motion.h1 variants={fadeUp} transition={spring} className="type-display">
          Settings
        </motion.h1>

        {/* Theme */}
        <motion.section variants={fadeUp} transition={spring} className="flex flex-col gap-4">
          <h2 className="type-section">Appearance</h2>
          <div className="card px-6 py-5 flex items-center justify-between">
            <div>
              <p className="type-body">Theme</p>
              <p className="type-small">How the dashboard looks</p>
            </div>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="type-small px-3 py-1.5 rounded-[8px] capitalize transition-all duration-150"
                  style={{
                    background: theme === t ? "var(--accent)" : "var(--bg-card-hover)",
                    color: theme === t ? "#fff" : "var(--text-secondary)",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Placeholder sections */}
        <motion.section variants={fadeUp} transition={spring} className="flex flex-col gap-4">
          <h2 className="type-section" style={{ color: "var(--text-tertiary)" }}>
            More settings coming in Phase 5
          </h2>
          <div className="card px-6 py-5" style={{ opacity: 0.5 }}>
            <p className="type-body" style={{ color: "var(--text-secondary)" }}>
              Weather location, goal check-in time, data export, and sign out will live here.
            </p>
          </div>
        </motion.section>
      </motion.div>
    </main>
  );
}

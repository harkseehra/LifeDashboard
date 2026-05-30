"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/ui/BackButton";
import { LogOut, MapPin, Shield } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase";
import { fadeUp, staggerParent, spring } from "@/lib/animations";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <motion.div
        className="flex flex-col gap-8"
        style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} transition={spring}>
          <BackButton />
        </motion.div>

        <motion.h1 variants={fadeUp} transition={spring} className="type-display">
          Settings
        </motion.h1>

        {/* Appearance */}
        <motion.section variants={fadeUp} transition={spring} className="flex flex-col gap-3">
          <h2 className="type-section">Appearance</h2>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="flex items-center justify-between px-6 py-4 flex-wrap gap-3">
              <div>
                <p className="type-body" style={{ fontWeight: 500 }}>Theme</p>
                <p className="type-small">Light, dark, or follow your system</p>
              </div>
              <div className="flex gap-1.5">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className="type-small px-3 py-1.5 rounded-[8px] capitalize transition-all duration-150"
                    style={{
                      background:
                        theme === t ? "var(--accent)" : "var(--bg-card-hover)",
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
          </div>
        </motion.section>

        {/* Account */}
        <motion.section variants={fadeUp} transition={spring} className="flex flex-col gap-3">
          <h2 className="type-section">Account</h2>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <p className="type-body" style={{ fontWeight: 500 }}>
                Signed in as
              </p>
              <p className="type-small" style={{ color: "var(--text-secondary)" }}>
                {email ?? "—"}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center justify-between px-6 py-4"
              style={{
                background: "transparent",
                border: "none",
                cursor: signingOut ? "not-allowed" : "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "background 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-card-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                className="type-body"
                style={{ color: "var(--accent-overdue)", fontWeight: 500 }}
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </span>
              <LogOut size={14} style={{ color: "var(--accent-overdue)" }} />
            </button>
          </div>
        </motion.section>

        {/* Privacy */}
        <motion.section variants={fadeUp} transition={spring} className="flex flex-col gap-3">
          <h2 className="type-section">Privacy</h2>
          <div className="card px-6 py-5 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <MapPin
                size={14}
                style={{
                  color: "var(--text-tertiary)",
                  marginTop: 2,
                  flexShrink: 0,
                }}
              />
              <div className="flex flex-col gap-0.5">
                <p className="type-body" style={{ fontWeight: 500 }}>
                  Location
                </p>
                <p className="type-small">
                  Weather uses your device GPS. Coordinates go directly
                  to Open-Meteo and are never stored.
                </p>
              </div>
            </div>
            <div
              className="flex items-start gap-3"
              style={{
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: 16,
              }}
            >
              <Shield
                size={14}
                style={{
                  color: "var(--text-tertiary)",
                  marginTop: 2,
                  flexShrink: 0,
                }}
              />
              <div className="flex flex-col gap-0.5">
                <p className="type-body" style={{ fontWeight: 500 }}>
                  Data
                </p>
                <p className="type-small">
                  Tasks, goals, and appointments live in your private Supabase
                  project. Nothing is shared with third parties.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </motion.div>
    </main>
  );
}

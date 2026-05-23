"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Trash2, Plus, ChevronRight } from "lucide-react";
import { getGoals, addGoal, deleteGoal, calculateStreak, getCheckIns } from "@/lib/goals";
import { getTierForStreak } from "@/lib/tiers";
import { fadeUp, staggerParent, spring } from "@/lib/animations";
import type { Goal } from "@/lib/types";

const EMOJI_SUGGESTIONS = ["🌱", "💪", "📚", "🧘", "💧", "🏃", "✍️", "🎯", "🛌", "🍎"];

type GoalWithStreak = Goal & { streak: number };

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🌱");
  const [customEmoji, setCustomEmoji] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);

  const newEmoji = customEmoji || selectedEmoji;

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    const { data } = await getGoals();
    const withStreaks = await Promise.all(
      data.map(async (g) => {
        const { data: dates } = await getCheckIns(g.id);
        return { ...g, streak: calculateStreak(dates) };
      })
    );
    setGoals(withStreaks);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || adding) return;
    setAdding(true);
    const { data } = await addGoal({ title: newTitle.trim(), emoji: newEmoji });
    if (data) {
      setGoals((prev) => [...prev, { ...data, streak: 0 }]);
      setNewTitle("");
      setSelectedEmoji("🌱");
      setCustomEmoji("");
      setShowForm(false);
    }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await deleteGoal(id);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <motion.div
        style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}
        variants={staggerParent}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-8"
      >
        <motion.div variants={fadeUp} transition={spring}>
          <Link href="/" className="type-small" style={{ color: "var(--accent)" }}>
            ← Dashboard
          </Link>
        </motion.div>

        <motion.div
          variants={fadeUp}
          transition={spring}
          className="flex items-center justify-between"
        >
          <h1 className="type-display">Goals</h1>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full type-small spring-hover"
            style={{
              background: showForm ? "var(--accent)" : "var(--bg-card)",
              color: showForm ? "#fff" : "var(--text-secondary)",
              border: `1px solid ${showForm ? "var(--accent)" : "var(--border-card)"}`,
              boxShadow: "var(--shadow-card)",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 180ms ease",
            }}
          >
            <Plus size={13} />
            New goal
          </button>
        </motion.div>

        {/* Add goal form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              onSubmit={handleAdd}
              className="card px-5 py-5 flex flex-col gap-4"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={spring}
            >
              <p className="type-section">New Goal</p>

              {/* Emoji picker */}
              <div className="flex gap-2 flex-wrap">
                {EMOJI_SUGGESTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => {
                      setSelectedEmoji(e);
                      setCustomEmoji("");
                    }}
                    className="w-9 h-9 rounded-[8px] flex items-center justify-center transition-all duration-150"
                    style={{
                      background:
                        !customEmoji && selectedEmoji === e
                          ? "var(--accent)"
                          : "var(--bg-card-hover)",
                      border: "none",
                      fontSize: 18,
                      cursor: "pointer",
                    }}
                  >
                    {e}
                  </button>
                ))}
                <input
                  type="text"
                  value={customEmoji}
                  onChange={(e) => {
                    setCustomEmoji(e.target.value);
                    if (e.target.value) setSelectedEmoji("");
                  }}
                  maxLength={2}
                  className="w-9 h-9 rounded-[8px] text-center type-body"
                  style={{
                    background: customEmoji ? "var(--accent)" : "var(--bg-card-hover)",
                    border: customEmoji ? "none" : "1px solid var(--border-card)",
                    color: customEmoji ? "#fff" : "var(--text-primary)",
                    outline: "none",
                    fontFamily: "inherit",
                    fontSize: 18,
                    transition: "background 120ms, border 120ms",
                  }}
                  placeholder="✦"
                />
              </div>

              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Go to the gym daily"
                autoFocus
                className="w-full px-4 py-3 rounded-[10px] type-body"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border-card)",
                  color: "var(--text-primary)",
                  outline: "none",
                  fontFamily: "inherit",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid var(--accent)";
                  e.target.style.boxShadow = "0 0 0 3px rgba(0,122,255,0.12)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid var(--border-card)";
                  e.target.style.boxShadow = "none";
                }}
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="type-small px-4 py-2 rounded-[8px]"
                  style={{
                    background: "var(--bg-card-hover)",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !newTitle.trim()}
                  className="type-small px-4 py-2 rounded-[8px]"
                  style={{
                    background: "var(--accent)",
                    border: "none",
                    color: "#fff",
                    cursor: adding ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: adding || !newTitle.trim() ? 0.6 : 1,
                  }}
                >
                  {adding ? "Adding…" : "Add goal"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Goals list */}
        <motion.div variants={fadeUp} transition={spring}>
          {loading ? (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{
                    borderBottom: i < 3 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <div className="skeleton w-10 h-10 rounded-[10px]" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="skeleton h-4 rounded" style={{ width: "55%" }} />
                    <div className="skeleton h-3 rounded" style={{ width: "30%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="card px-6 py-10 text-center">
              <p className="type-body" style={{ color: "var(--text-secondary)" }}>
                No goals yet. Add your first one above.
              </p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {goals.map((goal, i) => {
                const tier = getTierForStreak(goal.streak);
                return (
                  <div
                    key={goal.id}
                    className="flex items-center gap-4 px-5 py-4"
                    style={{
                      borderBottom:
                        i < goals.length - 1
                          ? "1px solid var(--border-subtle)"
                          : "none",
                    }}
                  >
                    {/* Emoji */}
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "var(--bg-card-hover)",
                        fontSize: 22,
                      }}
                    >
                      {goal.emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="type-body" style={{ fontWeight: 500 }}>
                        {goal.title}
                      </p>
                      <p className="type-small" style={{ color: "var(--text-tertiary)" }}>
                        {goal.streak > 0
                          ? `${goal.streak} day streak · ${tier.emoji} ${tier.name}`
                          : "No streak yet — check in today"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/goals/${goal.id}`}
                        className="flex items-center justify-center w-8 h-8 rounded-[6px]"
                        style={{
                          color: "var(--text-tertiary)",
                          transition: "color 120ms",
                        }}
                      >
                        <ChevronRight size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-[6px]"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-tertiary)",
                          cursor: "pointer",
                          transition: "color 120ms",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--accent-overdue)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "var(--text-tertiary)";
                        }}
                        aria-label={`Delete ${goal.title}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </main>
  );
}

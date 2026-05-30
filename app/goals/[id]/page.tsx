"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/ui/BackButton";
import { use } from "react";
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns";
import { createClient } from "@/lib/supabase";
import { getCheckIns, calculateStreak } from "@/lib/goals";
import { getTierForStreak, getNextTier, TIERS } from "@/lib/tiers";
import { fadeUp, staggerParent, spring } from "@/lib/animations";
import { Emoji } from "@/components/ui/Emoji";
import type { Goal } from "@/lib/types";

export default function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [checkInDates, setCheckInDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("id", id)
        .single();
      setGoal(data as Goal);

      const { data: dates } = await getCheckIns(id);
      setCheckInDates(dates);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading || !goal) {
    return (
      <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
        <div
          style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}
          className="flex flex-col gap-8"
        >
          <div className="skeleton h-4 rounded" style={{ width: 120 }} />
          <div className="skeleton h-10 rounded" style={{ width: 220 }} />
          <div className="card skeleton" style={{ height: 160 }} />
        </div>
      </main>
    );
  }

  const streak = calculateStreak(checkInDates);
  const tier = getTierForStreak(streak);
  const nextTier = getNextTier(streak);
  const progress = nextTier
    ? Math.min(((streak - tier.threshold) / (nextTier.threshold - tier.threshold)) * 100, 100)
    : 100;

  // Last 91 days heatmap
  const today = new Date();
  const heatmapDays = eachDayOfInterval({
    start: subDays(today, 90),
    end: today,
  });
  const checkInSet = new Set(checkInDates);

  // Split into weeks (columns of 7)
  const weeks: Date[][] = [];
  for (let i = 0; i < heatmapDays.length; i += 7) {
    weeks.push(heatmapDays.slice(i, i + 7));
  }

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
          <BackButton href="/goals" label="Goals" />
        </motion.div>

        {/* Goal header */}
        <motion.div variants={fadeUp} transition={spring} className="flex items-center gap-4">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <Emoji size={28}>{goal.emoji}</Emoji>
          </div>
          <div>
            <h1 className="type-display" style={{ fontSize: "clamp(24px, 2.5vw, 36px)" }}>
              {goal.title}
            </h1>
            <p className="type-small" style={{ color: "var(--text-tertiary)", marginTop: 2 }}>
              Since {format(parseISO(goal.created_at), "MMMM d, yyyy")}
            </p>
          </div>
        </motion.div>

        {/* Streak + tier card */}
        <motion.div variants={fadeUp} transition={spring} className="card px-6 py-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="type-section mb-1">Current Streak</p>
              <p style={{ fontSize: 36, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", fontFamily: "inherit" }}>
                {streak}
                <span className="type-small ml-1" style={{ fontWeight: 400 }}>days</span>
              </p>
            </div>
            <div className="text-right">
              <p className="type-section mb-1">Tier</p>
              <p><Emoji size={28}>{tier.emoji}</Emoji></p>
              <p className="type-small" style={{ color: "var(--text-secondary)" }}>{tier.name}</p>
            </div>
          </div>

          {/* Tier progress bar */}
          {nextTier && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="type-caption">{tier.name}</span>
                <span className="type-caption flex items-center gap-1"><Emoji size={12}>{nextTier.emoji}</Emoji> {nextTier.name} at {nextTier.threshold} days</span>
              </div>
              <div
                className="rounded-full overflow-hidden"
                style={{ height: 5, background: "var(--bg-card-hover)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--accent)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ...spring, delay: 0.3 }}
                />
              </div>
              <p className="type-small" style={{ color: "var(--text-tertiary)" }}>
                {nextTier.threshold - streak} days to {nextTier.name}
              </p>
            </div>
          )}

          {!nextTier && (
            <p className="type-small flex items-center gap-1.5" style={{ color: "var(--accent-success)" }}>
              <Emoji size={14}>🏆</Emoji> Maximum tier reached. Legendary.
            </p>
          )}
        </motion.div>

        {/* Heatmap — last 91 days */}
        <motion.div variants={fadeUp} transition={spring} className="card px-6 py-5 flex flex-col gap-4">
          <p className="type-section">Last 91 Days</p>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const done = checkInSet.has(dateStr);
                  return (
                    <div
                      key={dateStr}
                      title={`${format(day, "MMM d")}${done ? " ✓" : ""}`}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        background: done ? "var(--accent)" : "var(--bg-card-hover)",
                        opacity: done ? 1 : 0.6,
                        transition: "background 120ms",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--bg-card-hover)", opacity: 0.6 }} />
            <span className="type-caption">Missed</span>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--accent)", marginLeft: 8 }} />
            <span className="type-caption">Checked in</span>
            <span className="type-caption ml-auto">{checkInDates.length} total</span>
          </div>
        </motion.div>

        {/* All tiers reference */}
        <motion.div variants={fadeUp} transition={spring} className="card px-6 py-5 flex flex-col gap-3">
          <p className="type-section">Tier Path</p>
          {TIERS.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-3"
              style={{ opacity: streak >= t.threshold ? 1 : 0.4 }}
            >
              <span style={{ width: 28 }}><Emoji size={20}>{t.emoji}</Emoji></span>
              <div className="flex-1">
                <span className="type-body" style={{ fontWeight: streak >= t.threshold ? 500 : 400 }}>
                  {t.name}
                </span>
              </div>
              <span className="type-small" style={{ color: "var(--text-tertiary)" }}>
                {t.threshold === 0 ? "Start" : `${t.threshold} days`}
              </span>
              {streak >= t.threshold && (
                <span style={{ color: "var(--accent-success)", fontSize: 12 }}>✓</span>
              )}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </main>
  );
}

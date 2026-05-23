"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays } from "date-fns";
import Link from "next/link";
import { GoalChip } from "./GoalChip";
import { CheckInPopover } from "@/components/modals/CheckInPopover";
import { fadeUp, spring } from "@/lib/animations";
import { createClient } from "@/lib/supabase";
import { checkInGoal, calculateStreak } from "@/lib/goals";
import { crossedTierThreshold } from "@/lib/tiers";
import type { Goal } from "@/lib/types";

type GoalWithStats = Goal & { streak: number; checkedInToday: boolean };

export function GoalsSection() {
  const [goals, setGoals] = useState<GoalWithStats[]>([]);
  const [activeGoal, setActiveGoal] = useState<GoalWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    const supabase = createClient();
    const today = format(new Date(), "yyyy-MM-dd");
    const cutoff = format(subDays(new Date(), 400), "yyyy-MM-dd");

    const [{ data: goalsData }, { data: checkInsData }] = await Promise.all([
      supabase.from("goals").select("*").order("sort_order"),
      supabase
        .from("goal_check_ins")
        .select("goal_id, checked_in_on")
        .gte("checked_in_on", cutoff)
        .order("checked_in_on", { ascending: false }),
    ]);

    const rawGoals = (goalsData ?? []) as Goal[];
    const rawCheckIns = (checkInsData ?? []) as {
      goal_id: string;
      checked_in_on: string;
    }[];

    setGoals(
      rawGoals.map((g) => {
        const dates = rawCheckIns
          .filter((ci) => ci.goal_id === g.id)
          .map((ci) => ci.checked_in_on);
        return {
          ...g,
          streak: calculateStreak(dates),
          checkedInToday: dates.includes(today),
        };
      })
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();

    const handler = (e: Event) => {
      const goal = (e as CustomEvent<Goal>).detail;
      setGoals((prev) => [
        ...prev,
        { ...goal, streak: 0, checkedInToday: false },
      ]);
    };
    window.addEventListener("goal-added", handler as EventListener);
    return () =>
      window.removeEventListener("goal-added", handler as EventListener);
  }, []);

  const handleSave = async (goalId: string, didIt: boolean, notes: string) => {
    if (didIt) {
      const today = format(new Date(), "yyyy-MM-dd");
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                checkedInToday: true,
                streak: g.checkedInToday ? g.streak : g.streak + 1,
              }
            : g
        )
      );
      await checkInGoal(goalId, today, notes);
    }
    setActiveGoal(null);
  };

  if (loading) {
    return (
      <div className="flex gap-3" style={{ paddingBottom: 2 }}>
        {[140, 160, 130].map((w, i) => (
          <div
            key={i}
            className="skeleton shrink-0 rounded-card"
            style={{ width: w, height: 56 }}
          />
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="flex items-center gap-3">
        <p className="type-small" style={{ color: "var(--text-tertiary)" }}>
          No goals yet.
        </p>
        <Link
          href="/goals"
          className="type-small"
          style={{ color: "var(--accent)" }}
        >
          Add your first goal →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex gap-3 overflow-x-auto"
        style={{ scrollbarWidth: "none", paddingBottom: 2 }}
      >
        {goals.map((goal, i) => (
          <motion.div
            key={goal.id}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ ...spring, delay: i * 0.06 }}
          >
            <GoalChip
              goal={goal}
              checkedIn={goal.checkedInToday}
              onClick={() => {
                if (!goal.checkedInToday) setActiveGoal(goal);
              }}
            />
          </motion.div>
        ))}

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ ...spring, delay: goals.length * 0.06 }}
          className="shrink-0 flex items-center"
        >
          <Link
            href="/goals"
            className="type-small px-3 py-1.5 rounded-full"
            style={{
              color: "var(--text-tertiary)",
              border: "1px dashed var(--border-card)",
              whiteSpace: "nowrap",
            }}
          >
            Manage →
          </Link>
        </motion.div>
      </div>

      <AnimatePresence>
        {activeGoal && (
          <CheckInPopover
            goal={activeGoal}
            onClose={() => setActiveGoal(null)}
            onSave={(didIt, reflection) =>
              handleSave(activeGoal.id, didIt, reflection)
            }
            celebrationTier={crossedTierThreshold(
              activeGoal.streak,
              activeGoal.streak + 1
            )}
          />
        )}
      </AnimatePresence>
    </>
  );
}

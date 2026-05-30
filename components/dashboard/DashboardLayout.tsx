"use client";

import { useState, useRef, useEffect } from "react";
import { motion, Reorder, useDragControls } from "framer-motion";
import Link from "next/link";
import { GripVertical } from "lucide-react";
import { QuickCapture } from "./QuickCapture";
import { TasksSection } from "./TasksSection";
import { AppointmentsSection } from "./AppointmentsSection";
import { PurchasesSection } from "./PurchasesSection";
import { DailyBrief } from "./DailyBrief";
import { BudgetWidget } from "./BudgetWidget";
import { addTask, completeTask } from "@/lib/tasks";
import { addAppointment } from "@/lib/appointments";
import { addGoal } from "@/lib/goals";
import { loadTaskEmojis, saveTaskEmoji } from "@/lib/task-emojis";
import { fadeUp, staggerParent, spring, springSnap } from "@/lib/animations";
import type { Task, Appointment } from "@/lib/types";

const WIDGET_ORDER_KEY = "ld_widget_order";
const DEFAULT_ORDER = ["goals", "tasks", "appointments", "purchases", "budget"];

interface DashboardLayoutProps {
  initialTasks: Task[];
  initialAppointments: Appointment[];
  goals: React.ReactNode;
}

// ── Draggable widget shell ─────────────────────────────────────────────────
// Each widget sits inside this shell. Drag is only triggered from the handle
// (dragListener={false}) so clicks/taps inside widgets work normally.

function WidgetShell({ id, children }: { id: string; children: React.ReactNode }) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      as="div"
      className="relative group"
      style={{ listStyle: "none" }}
    >
      {children}
      {/* Grip handle — appears on hover in the top-right of the widget */}
      <div
        className="absolute right-3 top-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity rounded-[6px] p-1"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-card)",
          boxShadow: "var(--shadow-card)",
          cursor: "grab",
          touchAction: "none",
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        title="Drag to reorder"
      >
        <GripVertical size={13} style={{ color: "var(--text-tertiary)" }} />
      </div>
    </Reorder.Item>
  );
}

// ── Main layout ────────────────────────────────────────────────────────────

export function DashboardLayout({ initialTasks, initialAppointments, goals }: DashboardLayoutProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [toast, setToast] = useState<string | null>(null);
  const [taskEmojis, setTaskEmojis] = useState<Record<string, string>>({});
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_ORDER);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTaskEmojis(loadTaskEmojis());
    // Restore saved widget order, ensuring all widgets are present
    try {
      const saved = JSON.parse(localStorage.getItem(WIDGET_ORDER_KEY) ?? "null") as string[] | null;
      if (Array.isArray(saved) && DEFAULT_ORDER.every((id) => saved.includes(id))) {
        setWidgetOrder(saved);
      }
    } catch { /* ignore */ }
  }, []);

  const handleReorder = (order: string[]) => {
    setWidgetOrder(order);
    try { localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(order)); } catch { /* ignore */ }
  };

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const handleAddTask = async (title: string, due_date: string | null) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Task = {
      id: tempId,
      user_id: "",
      title,
      due_date: due_date ?? null,
      notes: null,
      completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      priority: 0,
    };
    setTasks((prev) => [optimistic, ...prev]);

    const { data, error } = await addTask({ title, due_date });
    if (error || !data) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      showToast("Couldn't save the task — check your connection and try again.");
    } else {
      setTasks((prev) => prev.map((t) => (t.id === tempId ? data : t)));
      fetch("/api/ai/task-emoji", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
        .then((r) => r.json())
        .then(({ emoji }: { emoji: string | null }) => {
          if (emoji) {
            saveTaskEmoji(data.id, emoji);
            setTaskEmojis((prev) => ({ ...prev, [data.id]: emoji }));
          }
        })
        .catch(() => {});
    }
  };

  const handleCompleteTask = async (id: string) => {
    const removed = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));

    const { error } = await completeTask(id);
    if (error) {
      if (removed) setTasks((prev) => [removed, ...prev]);
      showToast("Couldn't complete the task — check your connection.");
    }
  };

  const handleAddGoal = async (title: string) => {
    const { data, error } = await addGoal({ title, emoji: "🌱" });
    if (error || !data) {
      showToast("Couldn't create the goal — try again.");
    } else {
      showToast("Goal created! 🌱");
      window.dispatchEvent(new CustomEvent("goal-added", { detail: data }));
    }
  };

  const handleAddAppointment = async (title: string, starts_at: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimistic: Appointment = {
      id: tempId,
      user_id: "",
      title,
      starts_at,
      ends_at: null,
      location: null,
      notes: null,
      created_at: new Date().toISOString(),
    };
    setAppointments((prev) =>
      [...prev, optimistic].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    );

    const { data, error } = await addAppointment({ title, starts_at });
    if (error || !data) {
      setAppointments((prev) => prev.filter((a) => a.id !== tempId));
      showToast("Couldn't save the appointment — check your connection.");
    } else {
      setAppointments((prev) => prev.map((a) => (a.id === tempId ? data : a)));
    }
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case "goals":        return <>{goals}</>;
      case "tasks":        return <TasksSection tasks={tasks} onCompleteTask={handleCompleteTask} taskEmojis={taskEmojis} />;
      case "appointments": return <AppointmentsSection appointments={appointments} />;
      case "purchases":    return <PurchasesSection />;
      case "budget":       return <BudgetWidget />;
      default:             return null;
    }
  };

  return (
    <>
      <motion.div
        className="flex flex-col gap-6"
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        {/* ── Nav pills (pinned) ─────────────────────────────────── */}
        <motion.div variants={fadeUp} transition={spring} className="flex items-center gap-1.5">
          {[
            { href: "/goals",     label: "Goals" },
            { href: "/purchases", label: "Purchases" },
            { href: "/wishlist",  label: "Wishlist" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} passHref legacyBehavior>
              <motion.a
                className="type-small"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 30,
                  padding: "0 12px",
                  borderRadius: 20,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  boxShadow: "var(--shadow-card)",
                  textDecoration: "none",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                variants={{
                  rest:  { scale: 1, y: 0, color: "var(--text-secondary)" },
                  hover: { scale: 1.03, y: -1.5, color: "var(--text-primary)" },
                  tap:   { scale: 0.95, y: 0,    color: "var(--text-secondary)" },
                }}
                transition={springSnap}
              >
                {label}
              </motion.a>
            </Link>
          ))}
        </motion.div>

        {/* ── Daily brief + quick capture (pinned) ──────────────── */}
        <motion.div variants={fadeUp} transition={spring}>
          <DailyBrief tasks={tasks} appointments={appointments} />
        </motion.div>

        <motion.div variants={fadeUp} transition={spring}>
          <QuickCapture
            onAddTask={handleAddTask}
            onAddAppointment={handleAddAppointment}
            onAddGoal={handleAddGoal}
          />
        </motion.div>
      </motion.div>

      {/* ── Reorderable widgets ────────────────────────────────── */}
      <Reorder.Group
        as="div"
        axis="y"
        values={widgetOrder}
        onReorder={handleReorder}
        className="flex flex-col gap-6 mt-6"
        style={{ outline: "none" }}
      >
        {widgetOrder.map((id) => (
          <WidgetShell key={id} id={id}>
            {renderWidget(id)}
          </WidgetShell>
        ))}
      </Reorder.Group>

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 glass rounded-[12px] px-4 py-3 type-small z-50 whitespace-nowrap"
          style={{
            border: "1px solid var(--border-card)",
            boxShadow: "var(--shadow-card)",
            color: "var(--text-primary)",
            animation: "fadeInUp 200ms ease-out",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

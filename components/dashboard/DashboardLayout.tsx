"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { QuickCapture } from "./QuickCapture";
import { TasksSection } from "./TasksSection";
import { AppointmentsSection } from "./AppointmentsSection";
import { PurchasesStub } from "./PurchasesStub";
import { addTask, completeTask } from "@/lib/tasks";
import { addAppointment } from "@/lib/appointments";
import { addGoal } from "@/lib/goals";
import { fadeUp, staggerParent, spring } from "@/lib/animations";
import type { Task, Appointment } from "@/lib/types";

interface DashboardLayoutProps {
  initialTasks: Task[];
  initialAppointments: Appointment[];
  goals: React.ReactNode;
}

export function DashboardLayout({ initialTasks, initialAppointments, goals }: DashboardLayoutProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <>
      <motion.div
        className="flex flex-col gap-6"
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} transition={spring}>
          <QuickCapture
            onAddTask={handleAddTask}
            onAddAppointment={handleAddAppointment}
            onAddGoal={handleAddGoal}
          />
        </motion.div>

        <motion.div variants={fadeUp} transition={spring}>
          {goals}
        </motion.div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start"
          variants={fadeUp}
          transition={spring}
        >
          <div className="lg:col-span-3">
            <TasksSection tasks={tasks} onCompleteTask={handleCompleteTask} />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-6">
            <AppointmentsSection appointments={appointments} />
            <PurchasesStub />
          </div>
        </motion.div>
      </motion.div>

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

"use client";

import { useState, useRef } from "react";
import { QuickCapture } from "./QuickCapture";
import { TasksSection } from "./TasksSection";
import { addTask, completeTask } from "@/lib/tasks";
import type { Task } from "@/lib/types";

interface DashboardTasksProps {
  initialTasks: Task[];
}

export function DashboardTasks({ initialTasks }: DashboardTasksProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const handleAddTask = async (title: string, due_date: string | null) => {
    // Optimistic insert
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
    // Task is removed from list after animation — capture it for rollback
    const removed = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));

    const { error } = await completeTask(id);
    if (error) {
      if (removed) setTasks((prev) => [removed, ...prev]);
      showToast("Couldn't complete the task — check your connection.");
    }
  };

  return (
    <>
      <QuickCapture onAddTask={handleAddTask} />
      <TasksSection tasks={tasks} onCompleteTask={handleCompleteTask} />

      {/* Toast */}
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

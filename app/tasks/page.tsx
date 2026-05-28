"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Reorder } from "framer-motion";
import Link from "next/link";
import { parseISO, isPast, isToday, format } from "date-fns";
import { createClient } from "@/lib/supabase";
import { completeTask, uncompleteTask, deleteTask, updateTask } from "@/lib/tasks";
import { loadTaskEmojis } from "@/lib/task-emojis";
import { TaskRow } from "@/components/dashboard/TaskRow";
import { fadeUp, staggerParent, spring } from "@/lib/animations";
import type { Task } from "@/lib/types";

type Filter = "todo" | "completed" | "overdue" | "all";
type SortKey = "due_date" | "priority" | "created_at";

function applyFilter(tasks: Task[], filter: Filter): Task[] {
  switch (filter) {
    case "todo":
      return tasks.filter((t) => !t.completed);
    case "completed":
      return tasks.filter((t) => t.completed);
    case "overdue":
      return tasks.filter(
        (t) =>
          !t.completed &&
          t.due_date &&
          isPast(parseISO(t.due_date)) &&
          !isToday(parseISO(t.due_date))
      );
    default:
      return tasks;
  }
}

function applySort(tasks: Task[], sort: SortKey): Task[] {
  return [...tasks].sort((a, b) => {
    if (sort === "due_date") {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.localeCompare(b.due_date);
    }
    if (sort === "priority") return b.priority - a.priority;
    return b.created_at.localeCompare(a.created_at);
  });
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
  { key: "all", label: "All" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "due_date", label: "Due date" },
  { key: "priority", label: "Priority" },
  { key: "created_at", label: "Created" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("todo");
  const [sort, setSort] = useState<SortKey>("due_date");
  const [taskEmojis, setTaskEmojis] = useState<Record<string, string>>({});

  useEffect(() => {
    setTaskEmojis(loadTaskEmojis());
    const supabase = createClient();
    supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTasks((data as Task[]) ?? []);
        setLoading(false);
      });
  }, []);

  const handleComplete = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: true, completed_at: new Date().toISOString() }
          : t
      )
    );
    await completeTask(id);
  };

  const handleUncomplete = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: false, completed_at: null } : t
      )
    );
    await uncompleteTask(id);
  };

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTask(id);
  };

  const handleEdit = async (id: string, title: string, due_date: string | null) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title, due_date } : t))
    );
    await updateTask(id, { title, due_date });
  };

  const visible = applySort(applyFilter(tasks, filter), sort);

  return (
    <main className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <motion.div
        className="flex flex-col gap-8"
        style={{ padding: "var(--page-top) var(--page-gutter) 60px" }}
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeUp} transition={spring} className="flex items-center gap-4">
          <Link href="/" className="type-small" style={{ color: "var(--accent)" }}>
            ← Dashboard
          </Link>
        </motion.div>

        <motion.div variants={fadeUp} transition={spring} className="flex items-center justify-between">
          <h1 className="type-display">Tasks</h1>
          <span className="type-small">{tasks.filter((t) => !t.completed).length} remaining</span>
        </motion.div>

        {/* Filter pills */}
        <motion.div variants={fadeUp} transition={{ ...spring }} className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="type-small px-3 py-1.5 rounded-full transition-all duration-150"
              style={{
                background: filter === f.key ? "var(--accent)" : "var(--bg-card)",
                color: filter === f.key ? "#fff" : "var(--text-secondary)",
                border: `1px solid ${filter === f.key ? "var(--accent)" : "var(--border-card)"}`,
                boxShadow: "var(--shadow-card)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {f.label}
            </button>
          ))}

          <div className="flex-1" />

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="type-small px-3 py-1.5 rounded-full"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-card)",
              boxShadow: "var(--shadow-card)",
              cursor: "pointer",
              fontFamily: "inherit",
              outline: "none",
            }}
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Task list */}
        <motion.div variants={fadeUp} transition={spring}>
          {loading ? (
            <div className="card px-6 py-8">
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-5 rounded" style={{ width: `${60 + i * 10}%` }} />
                ))}
              </div>
            </div>
          ) : visible.length === 0 ? (
            <div className="card px-6 py-8">
              <p className="type-body text-center" style={{ color: "var(--text-secondary)" }}>
                {filter === "todo" ? "All clear." :
                 filter === "overdue" ? "Nothing overdue." :
                 filter === "completed" ? "Nothing completed yet." : "No tasks yet."}
              </p>
            </div>
          ) : filter === "todo" ? (
            <Reorder.Group
              axis="y"
              values={visible}
              onReorder={(newOrder) => {
                setTasks((prev) => {
                  const visibleIds = new Set(visible.map((t) => t.id));
                  const nonVisible = prev.filter((t) => !visibleIds.has(t.id));
                  return [...newOrder, ...nonVisible];
                });
              }}
              as="div"
              className="card"
              style={{ padding: 0, overflow: "hidden", listStyle: "none", margin: 0 }}
            >
              {visible.map((task, i) => (
                <Reorder.Item key={task.id} value={task} as="div" style={{ listStyle: "none" }}>
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showDivider={i < visible.length - 1}
                    emoji={taskEmojis[task.id]}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {visible.map((task, i) =>
                task.completed ? (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-6"
                    style={{
                      paddingTop: 13,
                      paddingBottom: 13,
                      borderBottom: i < visible.length - 1 ? "1px solid var(--border-subtle)" : "none",
                      opacity: 0.55,
                    }}
                  >
                    <button
                      onClick={() => handleUncomplete(task.id)}
                      className="shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center"
                      style={{
                        background: "var(--accent)",
                        border: "2px solid var(--accent)",
                      }}
                      aria-label={`Undo: ${task.title}`}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span
                      className="flex-1 type-body"
                      style={{
                        textDecoration: "line-through",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {task.title}
                    </span>
                    {task.completed_at && (
                      <span className="type-caption shrink-0" style={{ color: "var(--text-tertiary)" }}>
                        {format(new Date(task.completed_at), "MMM d")}
                      </span>
                    )}
                  </div>
                ) : (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    showDivider={i < visible.length - 1}
                    emoji={taskEmojis[task.id]}
                  />
                )
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </main>
  );
}

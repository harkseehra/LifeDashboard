"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  parseISO,
  isToday,
  isTomorrow,
  isPast,
  addDays,
  startOfDay,
  format,
} from "date-fns";
import type { Task } from "@/lib/types";
import { TaskRow } from "./TaskRow";

interface TasksSectionProps {
  tasks: Task[];
  onCompleteTask: (id: string) => void;
  taskEmojis?: Record<string, string>;
}

function groupTasks(tasks: Task[]) {
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);

  const todayGroup: Task[] = [];
  const tomorrowGroup: Task[] = [];
  const weekGroup: Task[] = [];
  const laterGroup: Task[] = [];

  for (const t of tasks) {
    if (!t.due_date) {
      laterGroup.push(t);
      continue;
    }
    const d = parseISO(t.due_date);
    if (isToday(d) || (isPast(d) && !isToday(d))) {
      todayGroup.push(t);
    } else if (isTomorrow(d)) {
      tomorrowGroup.push(t);
    } else if (d <= weekEnd) {
      weekGroup.push(t);
    } else {
      laterGroup.push(t);
    }
  }

  return { todayGroup, tomorrowGroup, weekGroup, laterGroup };
}

interface GroupProps {
  label: string;
  tasks: Task[];
  onComplete: (id: string) => void;
  isFirst: boolean;
  collapsible?: boolean;
  subgroupByDate?: boolean;
  taskEmojis?: Record<string, string>;
}

function TaskGroup({ label, tasks, onComplete, isFirst, collapsible = false, subgroupByDate = false, taskEmojis = {} }: GroupProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (tasks.length === 0) return null;

  // Build date sub-groups when multiple distinct dates exist
  const dateGroups: { key: string; label: string; tasks: Task[] }[] = (() => {
    if (!subgroupByDate) return [];
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      const key = t.due_date ?? "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    if (map.size <= 1) return []; // single date — no need to sub-group
    return Array.from(map.entries()).map(([key, ts]) => ({
      key,
      label: key === "__none__" ? "No date" : format(parseISO(key), "EEE, MMM d"),
      tasks: ts,
    }));
  })();

  const useSubgroups = dateGroups.length > 0;

  return (
    <div style={{ borderTop: isFirst ? "none" : "1px solid var(--border-subtle)" }}>
      {/* Group header */}
      <div
        className="flex items-center gap-1.5 px-6 pt-4 pb-2"
        onClick={collapsible ? () => setCollapsed((c) => !c) : undefined}
        style={{ cursor: collapsible ? "pointer" : "default" }}
      >
        <span className="type-caption">{label}</span>
        {collapsible && (
          collapsed
            ? <ChevronRight size={11} style={{ color: "var(--text-tertiary)" }} />
            : <ChevronDown size={11} style={{ color: "var(--text-tertiary)" }} />
        )}
        {collapsible && collapsed && (
          <span className="type-caption" style={{ color: "var(--text-tertiary)" }}>
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        )}
      </div>

      {/* Task rows — flat or date-sub-grouped */}
      {!collapsed && (
        useSubgroups ? (
          dateGroups.map((dg) => (
            <div key={dg.key}>
              <div
                className="flex items-center px-6 pb-1.5"
                style={{ paddingTop: 6, borderTop: "1px solid var(--border-subtle)" }}
              >
                <span className="type-caption" style={{ color: "var(--text-tertiary)", letterSpacing: "0.04em" }}>
                  {dg.label}
                </span>
              </div>
              {dg.tasks.map((task, i) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  showDivider={i < dg.tasks.length - 1}
                  emoji={taskEmojis[task.id]}
                />
              ))}
            </div>
          ))
        ) : (
          tasks.map((task, i) => (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={onComplete}
              showDivider={i < tasks.length - 1}
              emoji={taskEmojis[task.id]}
            />
          ))
        )
      )}

      {/* Bottom padding when expanded */}
      {!collapsed && <div style={{ height: 4 }} />}
    </div>
  );
}

export function TasksSection({ tasks, onCompleteTask, taskEmojis = {} }: TasksSectionProps) {
  const { todayGroup, tomorrowGroup, weekGroup, laterGroup } = groupTasks(tasks);
  const total = tasks.length;

  if (total === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="type-section">To Do</h2>
          <Link href="/tasks" className="type-small transition-colors duration-150" style={{ color: "var(--accent)" }}>
            View all →
          </Link>
        </div>
        <div className="card px-6 py-10 flex flex-col items-center gap-2 text-center">
          <span style={{ fontSize: 22, opacity: 0.35 }}>✓</span>
          <p className="type-body" style={{ color: "var(--text-secondary)" }}>
            All clear.
          </p>
          <p className="type-small" style={{ color: "var(--text-tertiary)" }}>
            Use the capture bar above to add a task.
          </p>
        </div>
      </section>
    );
  }

  const groups = [
    { label: "Today", tasks: todayGroup },
    { label: "Tomorrow", tasks: tomorrowGroup },
    { label: "This Week", tasks: weekGroup, subgroupByDate: true },
    { label: "Later", tasks: laterGroup, collapsible: true, subgroupByDate: true },
  ].filter((g) => g.tasks.length > 0);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="type-section">To Do</h2>
          <span
            className="type-caption px-2 py-0.5 rounded-full"
            style={{ background: "var(--bg-card-hover)", color: "var(--text-tertiary)" }}
          >
            {total}
          </span>
        </div>
        <Link href="/tasks" className="type-small transition-colors duration-150" style={{ color: "var(--accent)" }}>
          View all →
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {groups.map((g, i) => (
          <TaskGroup
            key={g.label}
            label={g.label}
            tasks={g.tasks}
            onComplete={onCompleteTask}
            isFirst={i === 0}
            collapsible={g.collapsible}
            subgroupByDate={g.subgroupByDate}
            taskEmojis={taskEmojis}
          />
        ))}
      </div>
    </section>
  );
}

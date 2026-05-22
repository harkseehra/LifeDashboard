import * as chrono from "chrono-node";
import { format } from "date-fns";

export type ParsedCapture =
  | { type: "task"; title: string; due_date: string | null }
  | { type: "appointment"; title: string; starts_at: Date | null; raw: string }
  | { type: "goal"; title: string };

export function parseQuickCapture(input: string): ParsedCapture {
  const trimmed = input.trim();

  if (trimmed.startsWith("/appt ") || trimmed.startsWith("/appointment ")) {
    const raw = trimmed.replace(/^\/appt(ointment)?\s+/, "");
    const results = chrono.parse(raw, new Date(), { forwardDate: true });
    const starts_at = results[0]?.date() ?? null;
    // Strip the parsed date text from the title
    const title = results[0]
      ? raw.slice(0, results[0].index).trim() ||
        raw.slice(results[0].index + results[0].text.length).trim() ||
        raw
      : raw;
    return { type: "appointment", title, starts_at, raw };
  }

  if (trimmed.startsWith("/goal ")) {
    return { type: "goal", title: trimmed.slice(6).trim() };
  }

  // Default: task — strip /task prefix if present
  const raw = trimmed.startsWith("/task ") ? trimmed.slice(6).trim() : trimmed;

  // Try to find a date expression in the task text
  const results = chrono.parse(raw, new Date(), { forwardDate: true });
  if (results[0]) {
    const dateStr = format(results[0].date(), "yyyy-MM-dd");
    const title =
      (raw.slice(0, results[0].index).trim() +
        " " +
        raw.slice(results[0].index + results[0].text.length).trim()).trim() ||
      raw;
    return { type: "task", title, due_date: dateStr };
  }

  return { type: "task", title: raw, due_date: null };
}

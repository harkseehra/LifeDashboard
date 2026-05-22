import { format, isToday, isTomorrow, startOfDay } from "date-fns";

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "MMM d");
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "h:mm a");
}

export function isLateNight(date = new Date()): boolean {
  return date.getHours() >= 22;
}

export function getDayOfWeek(date = new Date()): number {
  return date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
}

export function todayAsDate(): Date {
  return startOfDay(new Date());
}

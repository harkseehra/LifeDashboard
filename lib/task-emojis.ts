const KEY = "ld_task_emojis";

export function loadTaskEmojis(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

export function saveTaskEmoji(id: string, emoji: string): void {
  try {
    const map = loadTaskEmojis();
    map[id] = emoji;
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {}
}

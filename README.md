# CLAUDE.md — Life Dashboard

A personal Apple-style desktop dashboard for tasks, goals, appointments, and (later) purchases. Single-user. Built for Harkirat. ADHD-friendly: calm, focused, never overwhelming.

---

## Philosophy

- **Apple desktop aesthetic.** macOS Sonoma / Stage Manager / Reminders / Calendar app. Frosted glass, subtle depth, generous padding, restrained color.
- **Calm over loud.** No badges screaming red unless something is actually overdue. Empty states feel peaceful, not punitive.
- **Typography is the design.** SF Pro family. Weight does the work. Color is accent only.
- **One screen, light scroll.** Dashboard is the home. Everything reachable in one or two clicks.
- **Single user, single device today, multi-device tomorrow.** Supabase handles sync from day one so future-you isn't stuck.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router) + React + TypeScript
- **Styling:** Tailwind CSS + custom design tokens (CSS variables for the Apple system palette)
- **Database:** Supabase (Postgres + Row Level Security)
- **Auth:** Supabase Auth, single user, magic link login (no passwords to remember)
- **Hosting:** Vercel, connected to GitHub repo
- **State:** React Server Components where possible, `useState`/`useReducer` for local UI state, Supabase realtime for live updates across tabs
- **Fonts:** SF Pro Display / Text via system stack, fallback to Inter
- **Icons:** Lucide React (clean, Apple-adjacent line icons)
- **Date handling:** `date-fns` (lightweight, tree-shakeable)

No CSS frameworks beyond Tailwind. No component libraries. Build the look from scratch — that's the point.

---

## Design Tokens

### Colors (Apple system palette)

```css
:root {
  /* Primary accent — Apple system blue */
  --accent: #007AFF;          /* Apple system blue (iOS/macOS default) */
  --accent-deep: #0051D5;     /* Hover, pressed state */
  --accent-dark: #0A84FF;     /* Apple system blue, dark mode variant */

  /* Surfaces (light mode) */
  --bg-base: #FAFAF7;         /* Notion-warm off-white */
  --bg-card: #FFFFFF;
  --bg-card-hover: #F5F5F2;
  --border-subtle: rgba(0, 0, 0, 0.06);
  --border-card: rgba(0, 0, 0, 0.08);

  /* Surfaces (dark mode) */
  --bg-base-dark: #1C1C1E;    /* Grok dark */
  --bg-card-dark: #2C2C2E;
  --bg-card-hover-dark: #3A3A3C;
  --border-subtle-dark: rgba(255, 255, 255, 0.08);

  /* Text */
  --text-primary: #1C1C1E;
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;
  --text-primary-dark: #F2F2F7;
  --text-secondary-dark: #98989D;

  /* Semantic accents (sparingly) — Apple system colors */
  --accent-overdue: #FF3B30;     /* Apple system red */
  --accent-success: #34C759;     /* Apple system green */
  --accent-warning: #FF9500;     /* Apple system orange */
}
```

### Typography

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", system-ui, sans-serif;
```

- **Display (H1):** 32px / 700 weight / -0.02em tracking
- **Title (H2):** 22px / 600 / -0.01em
- **Section (H3):** 17px / 600 / 0em
- **Body:** 15px / 400 / 0em / 1.5 line-height
- **Small / meta:** 13px / 500 / 0.01em / `--text-secondary`
- **Caption:** 11px / 500 / 0.02em / uppercase / `--text-tertiary`

### Spacing & Layout

- Base unit: 4px. All spacing is a multiple: 4, 8, 12, 16, 20, 24, 32, 48, 64.
- Card padding: 24px desktop, 20px tablet, 16px mobile.
- Card radius: **14px** (Apple uses 12–16, this lands in the sweet spot).
- Border: 1px solid `--border-card`. No heavy shadows.
- Subtle elevation: `box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04);`
- Frosted glass (modals, popovers): `backdrop-filter: blur(20px) saturate(180%); background: rgba(255,255,255,0.72);`

### Buttons

- **Primary:** Filled `--accent` (Apple blue), white text, 14px radius, 12px vertical / 20px horizontal padding, 500 weight.
- **Secondary:** Transparent, border `--border-card`, text `--text-primary`.
- **Ghost:** No border, text `--accent`, hover bg `rgba(0,122,255,0.08)`.
- All buttons: 150ms ease-out transition on background, transform `scale(0.98)` on active.

### Animations

- Page transitions: 200ms `cubic-bezier(0.4, 0, 0.2, 1)` (Apple's standard).
- Popover/modal entrance: 220ms with slight `scale(0.96 → 1)` and opacity.
- Hover states: 150ms.
- Goal trophy unlock: spring physics (`framer-motion`), small celebration, no confetti spam.

---

## Data Model (Supabase Postgres)

### `tasks`
| Column        | Type        | Notes                                  |
|---------------|-------------|----------------------------------------|
| `id`          | uuid        | PK                                     |
| `user_id`     | uuid        | FK → auth.users                        |
| `title`       | text        | Required                               |
| `notes`       | text        | Optional, no limit                     |
| `due_date`    | date        | Nullable                               |
| `completed`   | boolean     | Default false                          |
| `completed_at`| timestamptz | Set when completed flips to true       |
| `created_at`  | timestamptz | Default now()                          |
| `priority`    | smallint    | 0=none, 1=low, 2=med, 3=high           |

### `appointments`
| Column      | Type        | Notes                                |
|-------------|-------------|--------------------------------------|
| `id`        | uuid        | PK                                   |
| `user_id`   | uuid        | FK                                   |
| `title`     | text        | Required                             |
| `location`  | text        | Optional                             |
| `starts_at` | timestamptz | Required                             |
| `ends_at`   | timestamptz | Optional                             |
| `notes`     | text        | Optional                             |
| `created_at`| timestamptz | Default now()                        |

### `goals`
| Column           | Type        | Notes                                                       |
|------------------|-------------|-------------------------------------------------------------|
| `id`             | uuid        | PK                                                          |
| `user_id`        | uuid        | FK                                                          |
| `title`          | text        | "Go to gym", "Save $5 to savings"                          |
| `description`    | text        | Optional context                                            |
| `schedule_days`  | smallint[]  | Array of weekday integers, 0=Sun..6=Sat. Empty = daily.    |
| `show_on_dashboard` | boolean  | If false, goal exists but is hidden from main view          |
| `target_streak`  | integer     | Optional final goal (e.g. 100 days)                         |
| `created_at`     | timestamptz | Default now()                                               |
| `active`         | boolean     | Default true; archived goals stay for history               |

### `goal_check_ins`
| Column        | Type        | Notes                                          |
|---------------|-------------|------------------------------------------------|
| `id`          | uuid        | PK                                             |
| `goal_id`     | uuid        | FK → goals                                     |
| `check_in_date`| date       | The day this check-in is FOR (not when logged)|
| `did_it`      | boolean     | Yes / No                                       |
| `reflection`  | text        | One or two lines, no character limit           |
| `logged_at`   | timestamptz | When the user actually clicked through         |

Unique constraint on `(goal_id, check_in_date)` — one check-in per goal per day.

### `quick_capture_log` (optional, useful for debugging the parser)
| Column      | Type        | Notes                          |
|-------------|-------------|--------------------------------|
| `id`        | uuid        | PK                             |
| `raw_input` | text        | What the user typed            |
| `parsed_as` | text        | 'task' / 'appointment' / 'goal'|
| `created_at`| timestamptz | Default now()                  |

### Row Level Security

Every table has RLS enabled. Policy: `user_id = auth.uid()`. Even though it's single-user today, this is non-negotiable from day one.

---

## The Dashboard (Home Screen)

Single page, light vertical scroll. Top to bottom:

### 1. Header strip
- Left: Greeting + date. `"Good evening, Harkirat"` + `"Friday, May 22"` in body text below.
- Right: Weather widget (Apple-style pill — icon + temp + condition). Uses OpenWeatherMap free API. City: Mississauga (hardcoded v1).
- Quick capture bar pinned right under the header. Full width, single text input, ghost styling, placeholder rotates: `"Add a task… try /goal or /appt"`.

### 2. Today's Goals (only if any goals are scheduled for today)
- Horizontal row of goal "chips" — each is a card-pill showing emoji tier + goal title + streak count.
- Tap a chip → check-in popover (see Goal Check-In flow below).
- If a scheduled goal hasn't been checked in by 10pm, the chip border turns soft red (`--accent-overdue`).
- If no goals today, this section doesn't render. Don't show "no goals today" — silence is fine.

### 3. To Do (incomplete tasks)
- Section header: `"To Do"` + count badge (`3`).
- Sub-grouping inside the card:
  - **Today** (due today or overdue)
  - **Tomorrow**
  - **This Week**
  - **Later** (collapsed by default)
- Each row: checkbox (left) + title + optional due date pill (right).
- Completing a task: checkbox fills with `--accent` blue, title strikes through with 200ms ease, row fades and removes after 600ms.
- Empty state: `"All clear."` in body text, centered, gentle.

### 4. Appointments
- Section header: `"Appointments"` + small `"View calendar →"` link to `/calendar`.
- Shows next 3 upcoming appointments (today + future).
- Each row: time (left, fixed width), title, location (secondary text).
- Today's appointments grouped under a `"Today"` mini-header.
- Empty state: `"Nothing on the books."`

### 5. Recent Purchases — **v2, stub for now**
- Render the section card with placeholder: `"Purchases sync coming in v2."` Greyed out, no interaction.
- Build the UI shell so v2 is a data swap, not a redesign.

---

## Other Screens

### `/calendar` — full calendar view
- Month grid, Apple Calendar style.
- Click a day → drawer slides in from right with that day's appointments.
- `+` button top-right opens new appointment modal.

### `/goals` — all goals manager
- List of all goals (active + archived).
- Each goal shows: title, schedule days, current streak, current tier emoji, all-time check-ins.
- Tap a goal → detail view with streak calendar (heatmap, GitHub-style but warmer colors), check-in history with reflections, edit button, archive button.
- `+` button → new goal modal.

### `/tasks` — full task list
- All tasks including completed.
- Filter pills: All / To Do / Completed / Overdue.
- Sort: by due date / by priority / by created.

### `/settings`
- Theme: light / dark / system.
- Weather location.
- Goal check-in time threshold (default 10pm, slider 8pm–midnight).
- Export all data (JSON download).
- Sign out.

---

## Quick Capture

A single input field. User types, hits Enter. The app routes based on prefix:

- `/task buy milk` or just `buy milk` (default) → new task
- `/appt dentist friday 3pm` → new appointment, parses date
- `/goal read 20 pages daily` → new goal (opens a config modal to set schedule days)

Date parsing: use `chrono-node` library — handles "friday 3pm", "tomorrow", "next monday at 2", "may 30", etc. Lightweight, no AI call needed.

If parsing fails: show inline feedback `"Couldn't parse the date — try 'dentist friday 3pm'"` in `--accent-warning` for 3 seconds, don't lose what they typed.

**No AI parsing in v1.** Keep it fast and free. Add Claude API parsing in v2 if the prefix system feels clunky.

---

## Goal Check-In Flow

The signature feature. Get this right.

**Trigger:** User clicks a goal chip on the dashboard.

**Popover (frosted glass, centered, 380px wide):**

```
┌─────────────────────────────────┐
│  🌱  Go to gym                   │
│  Day 7 of your streak            │
│                                  │
│  Did you do it today?            │
│                                  │
│  [   Yes   ]    [   No   ]       │
└─────────────────────────────────┘
```

**On Yes:**
- Buttons morph into a text area: `"What felt good about it?"`
- User types one or two lines. No character limit, but the area is sized for ~2 lines naturally.
- `[Save]` button at bottom right, Apple-blue filled.
- On save: record check-in with `did_it = true`. If this crosses a tier threshold, the popover transforms into a celebration screen (see Tiers below).

**On No:**
- Text area appears: `"What got in the way?"`
- Same flow. Record `did_it = false`.
- No streak penalty in v1 — just honest tracking. Missed days break the streak naturally because the next check-in starts day 1 again, UNLESS the goal isn't scheduled for that day (gym goal on a non-gym day doesn't break).

**Closing without answering:** Popover closes, no record saved, chip stays clickable. User can come back to it.

**After 10pm with no check-in:** Chip border turns soft red. Tapping still opens the same popover. Nothing punitive — just a visual nudge.

---

## Tiers — Sprout → Sapling → Tree → Ancient

Streak-based progression per goal. Emoji-forward, calm, growth-themed.

| Tier         | Emoji | Streak threshold | Celebration message                       |
|--------------|-------|------------------|-------------------------------------------|
| Seedling     | 🌰    | 0 days           | (default, no celebration)                 |
| Sprout       | 🌱    | 3 days           | "Three days in. You started something."   |
| Sapling      | 🌿    | 10 days          | "Ten days. This is becoming a thing."     |
| Young Tree   | 🌳    | 30 days          | "A month. You're rooted now."             |
| Tall Tree    | 🌲    | 100 days         | "100 days. Look at you."                  |
| Ancient      | 🪵    | 365 days         | "A year. You're the kind of person who does this now." |

Note: "streak" = consecutive **scheduled days** completed. A gym-Fri-Sat-Sun goal builds streak only on those days; weekdays in between don't break it.

**Celebration screen:** popover stays open, content swaps to:
- Large emoji (96px), centered
- Tier name in display weight
- Message line
- `[Continue]` button

Spring animation on the emoji entrance (`scale: 0 → 1.1 → 1`, 600ms total). No confetti. Apple does celebration through restraint.

---

## Empty States — write these like Apple writes them

Short, warm, slightly clever, never apologetic. Examples:

- No tasks: `"All clear."`
- No appointments: `"Nothing on the books."`
- No goals: `"Set a goal to start tracking."` + `[New goal]` button
- No goals today (but goals exist): render nothing
- First-time dashboard (no data at all): a single card centered — `"Welcome. Start by adding a task above."` Quick capture bar is highlighted with a soft glow for 2 seconds on first load.

---

## Dark Mode

System-detected by default, toggle in settings. Switching is instant, no flash.
- Background: `--bg-base-dark`
- Cards: `--bg-card-dark`
- Text inverts to `--text-primary-dark`
- Accent stays Apple blue but swaps to `--accent-dark` (#0A84FF) which is brighter for dark surfaces — Apple does this
- Frosted glass: `background: rgba(28,28,30,0.72); backdrop-filter: blur(20px) saturate(180%);`

---

## Build Order

### Phase 1 — Foundation (day 1–2)
1. Next.js + Tailwind + TypeScript setup. Push to GitHub. Connect to Vercel — verify deploy works.
2. Supabase project setup. Magic link auth. Single user (your email allowlisted).
3. Design token CSS variables. Base layout shell. Dark mode toggle.
4. Build the empty dashboard shell — header, sections, empty states. No data yet.

### Phase 2 — Tasks (day 3–4)
1. Supabase `tasks` table + RLS.
2. To Do section on dashboard with sub-groupings.
3. Add task via quick capture (no prefix needed, default to task).
4. Complete/uncomplete interaction with animation.
5. `/tasks` full view with filters.

### Phase 3 — Appointments + Calendar (day 5–6)
1. `appointments` table + RLS.
2. Appointments section on dashboard.
3. `/appt` prefix in quick capture with `chrono-node` parsing.
4. `/calendar` month view + day drawer.

### Phase 4 — Goals (day 7–9)
1. `goals` + `goal_check_ins` tables + RLS.
2. `/goals` manager screen.
3. Goal chips on dashboard.
4. Check-in popover with Yes/No + reflection.
5. Tier calculation + celebration screen.
6. Streak heatmap on goal detail.

### Phase 5 — Polish (day 10)
1. Weather widget (OpenWeatherMap API, key in env vars).
2. Empty states pass — every screen reviewed.
3. Animation timing audit — everything between 150–250ms unless intentional.
4. Mobile responsive pass (single column, larger tap targets).
5. Settings screen.

### v2 (later)
- Purchases via Plaid or SimpleFIN.
- Google Calendar two-way sync.
- Time-aware dashboard (morning vs evening emphasis).
- Keyboard shortcuts (`⌘K`, `T`, `A`, `G`).
- AI-powered quick capture via Claude API.
- Subscriptions sub-view.

### v3 (later still)
- Notifications / reminders (browser push API).
- Widgets / embeddable views.

---

## Things to Get Right

- **Padding generosity.** When in doubt, more padding. Apple apps breathe.
- **No double borders.** If a card has a border, items inside use dividers, not borders.
- **Hover states matter.** Every clickable thing changes state subtly on hover. 150ms.
- **Focus rings.** Use a soft Apple-blue ring (`box-shadow: 0 0 0 3px rgba(0,122,255,0.25)`) not browser default.
- **Loading states.** Skeletons, not spinners. Same shape as the final content.
- **Optimistic updates.** Checking off a task is instant. Sync to Supabase happens in the background. If it fails, undo with a toast.

---

## File Structure

```
/dashboard
  /app
    layout.tsx              # Root layout, font loading, theme provider
    page.tsx                # Dashboard home
    /tasks/page.tsx
    /goals/page.tsx
    /goals/[id]/page.tsx    # Goal detail with heatmap
    /calendar/page.tsx
    /settings/page.tsx
    /api/                   # Server actions, mostly Supabase passthrough
  /components
    /ui                     # Button, Card, Popover, Input — primitives
    /dashboard              # GoalChip, TaskRow, AppointmentRow, etc.
    /modals                 # NewGoalModal, CheckInPopover, etc.
  /lib
    supabase.ts             # Client + server-side clients
    parse-quick-capture.ts  # Prefix routing + chrono-node
    tiers.ts                # Streak → tier mapping
    date-helpers.ts
  /styles
    globals.css             # Tokens, base styles
  /public
    /icons
```

---

## North Star

When you sit down with coffee in the morning and open this dashboard, it should feel like opening a well-made notebook. Calm. Yours. Not asking anything of you it doesn't need to ask. The blue accent should feel like a friend's handwriting, not a notification.

If a feature would make a designer at Apple wince, cut it.

---

## How This Spec Came Together — Conversation History

For the AI builder: this section captures the back-and-forth that shaped every decision below. When something seems specific or opinionated, the reasoning lives here. Read this before making interpretive choices.

### Round 1 — Initial pitch

**User opened with:** A life dashboard, Apple-desktop aesthetic, web app. Design is core philosophy — typography, weight, padding, buttons, blur, roundness all need to feel Apple. Sections wanted: tasks at a glance, appointments at a glance (calendar full view under appointments, not on main), recent purchases (Plaid + bank, possibly v2), goals. Purchases should show transactions over a threshold ($10–$20 default, with a user-configurable slider from $5 to $100). Asked for additional ideas before writing the plan.

**AI suggested adding:**
1. Quick capture / `⌘K` command bar — the single feature that determines if dashboards get used
2. Today vs. Inbox split for tasks (Things 3 model)
3. Goals → tasks linkage (next-action surfacing)
4. Rolling weekly purchase total + subscriptions sub-view
5. Reality check on Plaid: not free for production, ~$0.30–$0.60/item/month, free dev tier covers personal use, all major Canadian banks supported. Alternative: SimpleFIN at $1.50/month flat, or manual CSV import for v1
6. Time-aware dashboard (morning vs. evening emphasis)
7. First-class empty states (Apple obsesses over these)
8. Weather + greeting line
9. Keyboard-first navigation
10. Pushed back on Plaid in v1, calendar full view on dashboard, and notifications

### Round 2 — User's refinements

**User accepted:**
- Quick capture (yes, good feature)
- Subscriptions tracking (worth watching in one place)
- Empty states Apple-style
- Weather widget (will need API)
- Keyboard-first → **v2**
- Notifications/reminders → **v3**
- Calendar full view stays off main dashboard, lives under appointments

**User rejected / modified:**
- **"Inbox" naming** — user said: *"I am actually tired of inbox views — what task is not done should be named — tasks incomplete or tasks not done — inbox is a bad word."* AI later proposed "To Do" instead, user accepted.
- **Time-aware dashboard** → v2. Reasoning: *"it's a personal dashboard for ADHD — we don't want to overwhelm user."* This is a load-bearing constraint. Calm > clever throughout.

**User's specific goals design (this is the heart of the app):**
> "Goals I want is own accountability so user clicks on goals as it surfaces like user selects show me this goal in dashboard like daily like save $5 and put in savings — then user clicks on goals and add update like added $5 today, so for example go to gym on fridays, saturdays and sundays so goal shows on these days as user selects weekdays to show it and then user clicks on goal these days and add update and the pop ups — apple style like did you do it? yes or no — user says yes and explains in one or two line (no character limit), same with user saying no — then explains what would be reason — update"

Key extractions:
- Goals have **user-selected schedule days** (gym = Fri/Sat/Sun only)
- Goals only **appear on dashboard on scheduled days**
- Tap a goal → **Apple-style popover** with Yes/No
- After Yes/No → **reflection text area**, one or two lines, **no character limit**
- Same flow regardless of Yes or No — honest tracking, not punishment

**User's tier system (the gamification):**
> "we can progress in goals to be fun gen z appreciation like upon 10 days here is a bronze trophy (or something fun gen z like you suggest) and tiers level up as goals we accomplish"

User later picked: **Sprout → Sapling → Tree → Ancient** from the nature/growth option, said *"using apple style emojis."* AI added Seedling (day 0) and Ancient (365 days) to round out the progression.

### Round 3 — Stack & infrastructure

**SimpleFIN vs Plaid:** User asked which is better. AI explained: Plaid has better UX (slick OAuth, all Canadian banks), free dev tier fine for personal use, but production requires company application + per-item fees. SimpleFIN is $1.50/month flat, no production gate, slightly thinner Canadian bank coverage. For single-user personal dashboard: Plaid free dev tier wins. Either way, **purchases stay v2.**

**User's data path question:** User asked *"wouldn't github pages work?"* and said they're not technical.

**AI explained:** GitHub Pages serves static files only — no data storage. Three paths offered:
- A) IndexedDB browser storage (free, single-device, no backup)
- B) Supabase (free, multi-device, 15-min setup)
- C) Flat JSON files (laptop-only)

**User picked Supabase**, but then asked why Vercel over GitHub Pages since they're used to the GitHub workflow (Claude Code on any computer → push → done).

**AI clarified:** Vercel uses the same GitHub connect-and-push workflow. Same free URL. Difference is Vercel can run modern app frameworks (Next.js, server-side stuff) where GitHub Pages can't. Since the app uses Supabase auth and dynamic data, Vercel is the right host. Nothing about user's workflow changes.

**Final infrastructure choices locked:**
- Storage: **Supabase** (multi-device, real database, RLS from day one)
- Hosting: **Vercel** (free, GitHub-connected, supports Next.js)
- Auth: **Magic link** (no passwords — AI's call, user didn't push back)
- Framework: **Next.js + TypeScript + Tailwind**

### Round 4 — Other user decisions

- **Purchases:** entirely v2, including section UI shown as greyed placeholder so layout doesn't shift later
- **Calendar API:** no Google Calendar sync in v1, will try Google API in v2
- **Tasks section name:** "To Do" (AI suggested, user accepted as Apple-native)
- **Check-in deadline:** user said *"any day after 11pm is great or 10pm — no snooze till tomorrow (just start showing in red accent colour)"*. AI flagged this might feel ADHD-unfriendly and offered alternatives — **awaiting user confirmation**, currently spec'd at 10pm red border.
- **Tier emojis:** Apple-style emojis, Sprout/Sapling/Tree/Ancient line

### Round 5 — Final surgical edits

- **Color palette swap:** User clarified that the Kon-peki / Iroshizuku River Blue was *"of old project"*. Standard Apple system blue (#007AFF light / #0A84FF dark) is the accent. All semantic colors also swapped to Apple system equivalents (red #FF3B30, green #34C759, orange #FF9500).
- **This conversation history section:** Added so AI builder has full context, not just the spec output.

---

## Standing Constraints (do not violate)

These came up multiple times in conversation and shape interpretive decisions:

1. **ADHD-calm over feature-rich.** When in doubt, fewer things, more space, gentler colors.
2. **Apple-native, not Apple-inspired.** Match real Apple semantics — system blue, system red, SF Pro, 14px radius, 150–250ms transitions.
3. **No `.docx` or generated files unless explicitly asked.** Default to inline / web output.
4. **Manual entry in v1, integrations in v2+.** Don't build Plaid, don't build Google Calendar sync, don't build push notifications until v1 ships and feels right.
5. **Honesty over gamification.** Streaks track reality, including misses. The reflection text saves on both Yes and No. No shame mechanics.
6. **Single user today, multi-user tomorrow.** Use Supabase RLS from day one even though only Harkirat will log in.
7. **The dashboard is the product.** Everything else (`/tasks`, `/goals`, `/calendar`, `/settings`) is a supporting room. The home screen earns most of the design attention.

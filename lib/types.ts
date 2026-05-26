export type Priority = 0 | 1 | 2 | 3;

export type Task = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  due_date: string | null; // YYYY-MM-DD
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  priority: Priority;
};

export type NewTask = {
  title: string;
  due_date?: string | null;
  priority?: Priority;
  notes?: string | null;
};

export type Appointment = {
  id: string;
  user_id: string;
  title: string;
  starts_at: string; // ISO timestamptz
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
};

export type NewAppointment = {
  title: string;
  starts_at: string;
  ends_at?: string | null;
  location?: string | null;
  notes?: string | null;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  sort_order: number;
  created_at: string;
};

export type NewGoal = {
  title: string;
  emoji?: string;
};

export type GoalCheckIn = {
  id: string;
  goal_id: string;
  user_id: string;
  checked_in_on: string; // YYYY-MM-DD
  notes: string | null;
  created_at: string;
};

export type WishlistItem = {
  id: string;
  user_id: string;
  title: string;
  estimated_cost: number;
  priority: number;
  notes: string | null;
  emoji: string;
  created_at: string;
};

export type SavingsAdvice = {
  monthly_income: number;
  monthly_expenses: number;
  monthly_savings: number;
  top_categories: { category: string; monthly_avg: number }[];
  recurring_bills: { name: string; monthly_amount: number; cancellable: boolean }[];
  wishlist_advice: {
    id: string;
    title: string;
    cost: number;
    months_current: number;
    months_optimized: number;
    message: string;
  }[];
  quick_wins: string[];
  summary: string;
};

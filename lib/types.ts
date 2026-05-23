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

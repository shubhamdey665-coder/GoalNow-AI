export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type GoalRow = {
  id: string;
  user_id: string;

  name: string;
  category: string;
  tracker_type: "normal" | "complex";

  duration: string;
  priority: string | null;

  target_date: string | null;
  daily_time: string | null;
  current_level: string | null;
  target_result: string | null;

  normal_target: string | null;
  normal_frequency: "daily" | "weekly" | null;

  normal_check_ins: Json;
  complex_plan_days: Json;
  mentor_messages: Json;

  active_day_number: number | null;

  latest_test_result: string | null;
  latest_test_date: string | null;

  status: "active" | "completed" | "paused";

  created_at: string;
  updated_at: string;
};

export type GoalInsert = Omit<
  GoalRow,
  "id" | "created_at" | "updated_at"
>;

export type GoalUpdate = Partial<
  Omit<GoalRow, "id" | "user_id" | "created_at">
>;
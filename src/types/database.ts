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
  tracker_type: string;

  duration: string | null;
  priority: string | null;

  target_date: string | null;
  daily_time: string | null;
  current_level: string | null;
  target_result: string | null;

  normal_target: string | null;
  normal_frequency: string | null;

  normal_check_ins: Json;
  complex_plan_days: Json;
  mentor_messages: Json;

  active_day_number: number | null;

  latest_test_result: Json | null;
  latest_test_date: string | null;

  status: string;

  created_at: string;
  updated_at: string;
};

export type GoalInsert = {
  id?: string;
  user_id: string;

  name: string;
  category: string;
  tracker_type: string;

  duration?: string | null;
  priority?: string | null;

  target_date?: string | null;
  daily_time?: string | null;
  current_level?: string | null;
  target_result?: string | null;

  normal_target?: string | null;
  normal_frequency?: string | null;

  normal_check_ins?: Json;
  complex_plan_days?: Json;
  mentor_messages?: Json;

  active_day_number?: number | null;

  latest_test_result?: Json | null;
  latest_test_date?: string | null;

  status?: string;

  created_at?: string;
  updated_at?: string;
};

export type GoalUpdate = {
  name?: string;
  category?: string;
  tracker_type?: string;

  duration?: string | null;
  priority?: string | null;

  target_date?: string | null;
  daily_time?: string | null;
  current_level?: string | null;
  target_result?: string | null;

  normal_target?: string | null;
  normal_frequency?: string | null;

  normal_check_ins?: Json;
  complex_plan_days?: Json;
  mentor_messages?: Json;

  active_day_number?: number | null;

  latest_test_result?: Json | null;
  latest_test_date?: string | null;

  status?: string;
  updated_at?: string;
};
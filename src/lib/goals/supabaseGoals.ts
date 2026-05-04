import { createClient } from "@/lib/supabase/client";
import {
  goalRowToGoal,
  goalToGoalInsert,
  goalToGoalUpdate,
} from "@/lib/goals/converters";
import type { Goal } from "@/types/goal";
import type { GoalRow } from "@/types/database";

async function getSupabaseWithUser() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error("You must be logged in to use goals.");
  }

  return {
    supabase,
    userId: user.id,
  };
}

export async function getGoalsFromSupabase(): Promise<Goal[]> {
  const { supabase, userId } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as GoalRow[]).map(goalRowToGoal);
}

export async function getGoalByIdFromSupabase(goalId: string): Promise<Goal | null> {
  const { supabase, userId } = await getSupabaseWithUser();

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return goalRowToGoal(data as GoalRow);
}

export async function createGoalInSupabase(goal: Goal): Promise<Goal> {
  const { supabase, userId } = await getSupabaseWithUser();

  const goalInsert = goalToGoalInsert(goal, userId);

  const { data, error } = await supabase
    .from("goals")
    .insert(goalInsert)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return goalRowToGoal(data as GoalRow);
}

export async function updateGoalInSupabase(goal: Goal): Promise<Goal> {
  const { supabase, userId } = await getSupabaseWithUser();

  const goalUpdate = goalToGoalUpdate(goal);

  const { data, error } = await supabase
    .from("goals")
    .update(goalUpdate)
    .eq("id", goal.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return goalRowToGoal(data as GoalRow);
}

export async function deleteGoalFromSupabase(goalId: string): Promise<void> {
  const { supabase, userId } = await getSupabaseWithUser();

  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
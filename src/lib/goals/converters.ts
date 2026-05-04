import type { Goal } from "@/types/goal";
import type { GoalInsert, GoalRow, GoalUpdate } from "@/types/database";

export function goalRowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    trackerType: row.tracker_type,
    duration: row.duration,
    priority: row.priority ?? undefined,

    targetDate: row.target_date ?? undefined,
    dailyTime: row.daily_time ?? undefined,
    currentLevel: row.current_level ?? undefined,
    targetResult: row.target_result ?? undefined,

    normalTarget: row.normal_target ?? undefined,
    normalFrequency: row.normal_frequency ?? undefined,

    normalCheckIns: Array.isArray(row.normal_check_ins)
      ? row.normal_check_ins
      : [],
    complexPlanDays: Array.isArray(row.complex_plan_days)
      ? row.complex_plan_days
      : [],
    mentorMessages: Array.isArray(row.mentor_messages)
      ? row.mentor_messages
      : [],

    activeDayNumber: row.active_day_number ?? undefined,

    latestTestResult: row.latest_test_result ?? undefined,
    latestTestDate: row.latest_test_date ?? undefined,

    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as Goal;
}

export function goalToGoalInsert(goal: Goal, userId: string): GoalInsert {
  return {
    user_id: userId,

    name: goal.name,
    category: goal.category,
    tracker_type: goal.trackerType,

    duration: goal.duration,
    priority: goal.priority ?? null,

    target_date: goal.targetDate ?? null,
    daily_time: goal.dailyTime ?? null,
    current_level: goal.currentLevel ?? null,
    target_result: goal.targetResult ?? null,

    normal_target: goal.normalTarget ?? null,
    normal_frequency: goal.normalFrequency ?? null,

    normal_check_ins: goal.normalCheckIns ?? [],
    complex_plan_days: goal.complexPlanDays ?? [],
    mentor_messages: goal.mentorMessages ?? [],

    active_day_number: goal.activeDayNumber ?? null,

    latest_test_result: goal.latestTestResult ?? null,
    latest_test_date: goal.latestTestDate ?? null,

    status: goal.status,
  };
}

export function goalToGoalUpdate(goal: Goal): GoalUpdate {
  return {
    name: goal.name,
    category: goal.category,
    tracker_type: goal.trackerType,

    duration: goal.duration,
    priority: goal.priority ?? null,

    target_date: goal.targetDate ?? null,
    daily_time: goal.dailyTime ?? null,
    current_level: goal.currentLevel ?? null,
    target_result: goal.targetResult ?? null,

    normal_target: goal.normalTarget ?? null,
    normal_frequency: goal.normalFrequency ?? null,

    normal_check_ins: goal.normalCheckIns ?? [],
    complex_plan_days: goal.complexPlanDays ?? [],
    mentor_messages: goal.mentorMessages ?? [],

    active_day_number: goal.activeDayNumber ?? null,

    latest_test_result: goal.latestTestResult ?? null,
    latest_test_date: goal.latestTestDate ?? null,

    status: goal.status,
    updated_at: new Date().toISOString(),
  };
}

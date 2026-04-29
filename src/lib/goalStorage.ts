import { Goal } from "@/types/goal";

const STORAGE_KEY = "goalnow-goals-v2";

export function getGoals(): Goal[] {
  if (typeof window === "undefined") return [];

  const savedGoals = localStorage.getItem(STORAGE_KEY);
  return savedGoals ? JSON.parse(savedGoals) : [];
}

export function saveGoals(goals: Goal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

export function getGoalById(goalId: string): Goal | undefined {
  return getGoals().find((goal) => goal.id === goalId);
}

export function addGoal(goal: Goal) {
  const goals = getGoals();
  goals.push(goal);
  saveGoals(goals);
}

export function updateGoal(updatedGoal: Goal) {
  const goals = getGoals();
  const updatedGoals = goals.map((goal) =>
    goal.id === updatedGoal.id ? updatedGoal : goal
  );

  saveGoals(updatedGoals);
}

export function deleteGoalById(goalId: string) {
  const goals = getGoals();
  const updatedGoals = goals.filter((goal) => goal.id !== goalId);
  saveGoals(updatedGoals);
}
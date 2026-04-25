"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Goal = {
  id: string;
  name: string;
  category: string;
  duration: string;
  dailyTime: string;
  currentLevel: string;
  targetResult: string;
  plan: string[];
  completedTasks: number[];
  createdAt: string;
};

export default function ReportPage() {
  const params = useParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const savedGoals = localStorage.getItem("goalnow-goals");
    const goals: Goal[] = savedGoals ? JSON.parse(savedGoals) : [];

    const foundGoal = goals.find((item) => item.id === goalId);

    if (foundGoal) {
      setGoal(foundGoal);
    }
  }, [goalId]);

  if (!goal) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
            ← Back to Dashboard
          </Link>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8">
            <h1 className="text-3xl font-bold">Goal not found</h1>
            <p className="mt-3 text-zinc-400">
              This report page needs a saved goal first.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const totalTasks = goal.plan.length;
  const completedTasks = goal.completedTasks.length;
  const pendingTasks = totalTasks - completedTasks;

  const progressPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  let feedback = "";
  let recommendation = "";

  if (progressPercentage >= 80) {
    feedback = "Excellent progress. You are consistent and ready for a harder plan.";
    recommendation = "Increase difficulty slightly and add more practice/revision tasks.";
  } else if (progressPercentage >= 40) {
    feedback = "Good start. You are moving, but consistency needs improvement.";
    recommendation = "Focus on completing pending tasks before adding new harder tasks.";
  } else {
    feedback = "Progress is low. The plan may be too heavy or your routine is not stable yet.";
    recommendation = "Reduce daily load, complete small tasks, and rebuild consistency.";
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href={`/goals/${goal.id}`} className="text-sm text-zinc-400 hover:text-white">
          ← Back to Goal
        </Link>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-blue-400">Progress Report</p>
          <h1 className="mt-2 text-4xl font-bold">{goal.name}</h1>
          <p className="mt-3 text-zinc-400">
            This report analyzes your current progress and gives your next best action.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Total Tasks</p>
            <p className="mt-2 text-3xl font-bold">{totalTasks}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Completed</p>
            <p className="mt-2 text-3xl font-bold">{completedTasks}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Pending</p>
            <p className="mt-2 text-3xl font-bold">{pendingTasks}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Progress</p>
            <p className="mt-2 text-3xl font-bold">{progressPercentage}%</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Progress Bar</h2>

          <div className="mt-5 h-4 rounded-full bg-zinc-800">
            <div
              className="h-4 rounded-full bg-blue-400 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </section>

        <section className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <h2 className="text-2xl font-bold">AI-style Feedback</h2>
            <p className="mt-3 rounded-xl bg-zinc-900 p-4 text-zinc-300">
              {feedback}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Next Recommendation</h2>
            <p className="mt-3 rounded-xl bg-zinc-900 p-4 text-zinc-300">
              {recommendation}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
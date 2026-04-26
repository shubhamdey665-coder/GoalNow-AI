"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
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

  function toggleTask(index: number) {
    if (!goal) return;

    let updatedCompletedTasks: number[];

    if (goal.completedTasks.includes(index)) {
      updatedCompletedTasks = goal.completedTasks.filter(
        (taskIndex) => taskIndex !== index
      );
    } else {
      updatedCompletedTasks = [...goal.completedTasks, index];
    }

    const updatedGoal = {
      ...goal,
      completedTasks: updatedCompletedTasks,
    };

    const savedGoals = localStorage.getItem("goalnow-goals");
    const goals: Goal[] = savedGoals ? JSON.parse(savedGoals) : [];

    const updatedGoals = goals.map((item) =>
      item.id === goal.id ? updatedGoal : item
    );

    localStorage.setItem("goalnow-goals", JSON.stringify(updatedGoals));
    setGoal(updatedGoal);
  }
  function resetProgress() {
    if (!goal) return;

    const confirmReset = window.confirm(
      `Are you sure you want to reset progress for "${goal.name}"?`
    );

    if (!confirmReset) return;

    const updatedGoal = {
      ...goal,
      completedTasks: [],
    };

    const savedGoals = localStorage.getItem("goalnow-goals");
    const goals: Goal[] = savedGoals ? JSON.parse(savedGoals) : [];

    const updatedGoals = goals.map((item) =>
      item.id === goal.id ? updatedGoal : item
    );

    localStorage.setItem("goalnow-goals", JSON.stringify(updatedGoals));
    setGoal(updatedGoal);
  }
        function deleteGoal() {
            if (!goal) return;

            const confirmDelete = window.confirm(
                `Are you sure you want to delete "${goal.name}"?`
            );

            if (!confirmDelete) return;

            const savedGoals = localStorage.getItem("goalnow-goals");
            const goals: Goal[] = savedGoals ? JSON.parse(savedGoals) : [];

            const updatedGoals = goals.filter((item) => item.id !== goal.id);

            localStorage.setItem("goalnow-goals", JSON.stringify(updatedGoals));

            router.push("/dashboard");
            }

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
              This goal may have been deleted or not saved properly.
            </p>
          </div>
        </div>
      </main>
    );
  }
  const totalTasks = goal.plan.length;
  const completedTaskCount = goal.completedTasks.length;
  const pendingTaskCount = totalTasks - completedTaskCount;
  const progressPercentage =
    goal.plan.length === 0
      ? 0
      : Math.round((goal.completedTasks.length / goal.plan.length) * 100);
      const firstIncompleteTask = goal.plan.find(
        (_item, index) => !goal.completedTasks.includes(index)
      );

      const todaysFocus = firstIncompleteTask || "All tasks completed. Great work!";

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
          ← Back to Dashboard
        </Link>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-blue-400">{goal.category}</p>
                    <h1 className="mt-2 text-4xl font-bold">{goal.name}</h1>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/goals/${goal.id}/mentor`}
                    className="rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-400/20"
                  >
                    AI Mentor
                  </Link>
                  <Link
                    href={`/goals/${goal.id}/report`}
                    className="rounded-xl border border-purple-400/30 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-400/20"
                  >
                    Report
                  </Link>
                  <Link
                    href={`/goals/${goal.id}/test`}
                    className="rounded-xl border border-green-400/30 bg-green-400/10 px-4 py-2 text-sm font-semibold text-green-300 transition hover:bg-green-400/20"
                  >
                    Weekly Test
                  </Link>
                  <Link
                      href={`/goals/${goal.id}/edit`}
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      Edit Goal
                  </Link>
                  <button
                    type="button"
                    onClick={resetProgress}
                    className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-400/20"
                  >
                    Reset Progress
                  </button>
                  <button
                      type="button"
                      onClick={deleteGoal}
                      className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
                  >
                      Delete Goal
                  </button>
                </div>
             </div>
          

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-zinc-900 p-4">
              <p className="text-sm text-zinc-400">Duration</p>
              <p className="mt-1 font-semibold">{goal.duration}</p>
            </div>

            <div className="rounded-xl bg-zinc-900 p-4">
              <p className="text-sm text-zinc-400">Daily Time</p>
              <p className="mt-1 font-semibold">{goal.dailyTime}</p>
            </div>
            <div className="rounded-xl bg-zinc-900 p-4">
              <p className="text-sm text-zinc-400">Created Date</p>
              <p className="mt-1 font-semibold">
                {new Date(goal.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <h2 className="font-bold">Current Level</h2>
              <p className="mt-2 rounded-xl bg-zinc-900 p-4 text-sm text-zinc-300">
                {goal.currentLevel}
              </p>
            </div>

            <div>
              <h2 className="font-bold">Target Result</h2>
              <p className="mt-2 rounded-xl bg-zinc-900 p-4 text-sm text-zinc-300">
                {goal.targetResult}
              </p>
            </div>
          </div>
        </section>
        <section className="mt-8 rounded-2xl border border-blue-400/30 bg-blue-400/10 p-6">
          <p className="text-sm font-medium text-blue-300">Today&apos;s Focus</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{todaysFocus}</h2>
          <p className="mt-3 text-sm text-blue-100/80">
            Complete this task first. After ticking it, your next incomplete task will become the new focus.
          </p>
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Total Tasks</p>
            <p className="mt-2 text-3xl font-bold">{totalTasks}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Completed</p>
            <p className="mt-2 text-3xl font-bold">{completedTaskCount}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Pending</p>
            <p className="mt-2 text-3xl font-bold">{pendingTaskCount}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-zinc-400">Progress</p>
            <p className="mt-2 text-3xl font-bold">{progressPercentage}%</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">7-Day Tracker</h2>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>
                Completed: {goal.completedTasks.length} / {goal.plan.length}
              </span>
              <span>{progressPercentage}% complete</span>
            </div>

            <div className="h-3 rounded-full bg-zinc-800">
              <div
                className="h-3 rounded-full bg-blue-400 transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {goal.plan.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-900 p-4 text-sm"
              >
                <input
                  type="checkbox"
                  checked={goal.completedTasks.includes(index)}
                  onChange={() => toggleTask(index)}
                  className="mt-1 h-4 w-4"
                />

                <p
                  className={
                    goal.completedTasks.includes(index)
                      ? "text-zinc-500 line-through"
                      : "text-zinc-200"
                  }
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
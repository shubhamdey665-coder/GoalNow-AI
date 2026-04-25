"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

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

export default function DashboardPage() {
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const savedGoals = localStorage.getItem("goalnow-goals");
    const parsedGoals = savedGoals ? JSON.parse(savedGoals) : [];
    setGoals(parsedGoals);
  }, []);

  return (
    <>
     <Navbar />
     <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">GoalNow AI</p>
            <h1 className="mt-2 text-4xl font-bold">Your Dashboard</h1>
            <p className="mt-3 max-w-2xl text-zinc-400">
              Track every goal with AI-made plans, daily tasks, weekly tests,
              progress reports and a personal mentor.
            </p>
          </div>

          <Link
            href="/goals/new"
            className="rounded-xl bg-white px-5 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
          >
            Create New Goal
          </Link>
        </div>

        {goals.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="text-2xl font-bold">No goals created yet</h2>
            <p className="mt-3 text-zinc-400">
              Create your first goal and your AI starter plan will appear here.
            </p>

            <Link
              href="/goals/new"
              className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
            >
              Create First Goal
            </Link>
          </div>
        ) : (
          <section className="mt-10 grid gap-6 md:grid-cols-3">
            {goals.map((goal) => {
              const progress =
                goal.plan.length === 0
                  ? 0
                  : Math.round((goal.completedTasks.length / goal.plan.length) * 100);

              return (
                <Link
                  key={goal.id}
                  href={`/goals/${goal.id}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl text-black">
                    ✦
                  </div>

                  <p className="text-sm text-blue-400">{goal.category}</p>
                  <h2 className="mt-2 text-xl font-bold">{goal.name}</h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    Duration: {goal.duration}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    Daily time: {goal.dailyTime}
                  </p>

                  <div className="mt-6">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-zinc-400">Progress</span>
                      <span>{progress}%</span>
                    </div>

                    <div className="h-2 rounded-full bg-zinc-800">
                      <div
                        className="h-2 rounded-full bg-blue-400"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </div>
      </main>
    </>
  );
}
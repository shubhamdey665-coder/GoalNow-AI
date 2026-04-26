"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";

type Goal = {
  id: string;
  name: string;
  category: string;
  duration: string;
  priority?: string;
  dailyTime: string;
  currentLevel: string;
  targetResult: string;
  plan: string[];
  completedTasks: number[];
  createdAt: string;
};

export default function DashboardPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [sortBy, setSortBy] = useState("Newest First");

  useEffect(() => {
    const savedGoals = localStorage.getItem("goalnow-goals");
    const parsedGoals = savedGoals ? JSON.parse(savedGoals) : [];
    setGoals(parsedGoals);
  }, []);
 const filteredGoals = goals.filter((goal) => {
  const searchText = searchTerm.toLowerCase();

  const matchesSearch =
    goal.name.toLowerCase().includes(searchText) ||
    goal.category.toLowerCase().includes(searchText) ||
    goal.duration.toLowerCase().includes(searchText);

    const matchesCategory =
      selectedCategory === "All Categories" || goal.category === selectedCategory;

    const goalPriority = goal.priority || "Medium";

    const matchesPriority =
      selectedPriority === "All Priorities" || goalPriority === selectedPriority;

    return matchesSearch && matchesCategory && matchesPriority;
});
const sortedGoals = [...filteredGoals].sort((a, b) => {
    const getPriorityScore = (priority?: string) => {
    if (priority === "High") return 3;
    if (priority === "Medium") return 2;
    if (priority === "Low") return 1;
    return 2;
  };
  const progressA =
    a.plan.length === 0 ? 0 : Math.round((a.completedTasks.length / a.plan.length) * 100);

  const progressB =
    b.plan.length === 0 ? 0 : Math.round((b.completedTasks.length / b.plan.length) * 100);

  if (sortBy === "Newest First") {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }

  if (sortBy === "Oldest First") {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }

  if (sortBy === "Highest Progress") {
    return progressB - progressA;
  }

  if (sortBy === "Lowest Progress") {
    return progressA - progressB;
  }

  if (sortBy === "A to Z") {
    return a.name.localeCompare(b.name);
  }

  if (sortBy === "Z to A") {
    return b.name.localeCompare(a.name);
  }
  if (sortBy === "Highest Priority") {
    return getPriorityScore(b.priority) - getPriorityScore(a.priority);
  }

  if (sortBy === "Lowest Priority") {
    return getPriorityScore(a.priority) - getPriorityScore(b.priority);
  }

  return 0;
});
const completedGoals = goals.filter((goal) => {
  if (goal.plan.length === 0) return false;

  return goal.completedTasks.length === goal.plan.length;
});

const inProgressGoals = goals.filter((goal) => {
  if (goal.plan.length === 0) return false;

  return goal.completedTasks.length < goal.plan.length;
});
function clearAllGoals() {
  const confirmClear = window.confirm(
    "Are you sure you want to delete all goals? This cannot be undone."
  );

  if (!confirmClear) return;

  localStorage.removeItem("goalnow-goals");
  setGoals([]);
  setSearchTerm("");
  setSelectedCategory("All Categories");
  setSortBy("Newest First");
}
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

          <div className="flex flex-wrap gap-3">
            <Link
              href="/goals/new"
              className="rounded-xl bg-white px-5 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
            >
              Create New Goal
            </Link>

            {goals.length > 0 && (
              <button
                type="button"
                onClick={clearAllGoals}
                className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-400/20"
              >
                Clear All Goals
              </button>
            )}
          </div>
        </div>
          <div className="mt-8 grid gap-4 md:grid-cols-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search goals by name, category, or duration..."
            className="md:col-span-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
          />

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
          >
            <option>All Categories</option>
            <option>Career / Job</option>
            <option>Fitness / Fat Burning</option>
            <option>Education / Exam</option>
            <option>English / Communication</option>
            <option>Business / Money</option>
            <option>Custom Goal</option>
          </select>
          <select
            value={selectedPriority}
            onChange={(event) => setSelectedPriority(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
          >
            <option>All Priorities</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
            >
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>Highest Progress</option>
              <option>Lowest Progress</option>
              <option>Highest Priority</option>
              <option>Lowest Priority</option>
              <option>A to Z</option>
              <option>Z to A</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All Categories");
                setSelectedPriority("All Priorities");
                setSortBy("Newest First");
              }}
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
            >
              Clear
            </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-400">Total Goals</p>
              <p className="mt-2 text-3xl font-bold">{goals.length}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-400">Visible Goals</p>
              <p className="mt-2 text-3xl font-bold">{filteredGoals.length}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-400">Completed</p>
              <p className="mt-2 text-3xl font-bold">{completedGoals.length}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-400">In Progress</p>
              <p className="mt-2 text-3xl font-bold">{inProgressGoals.length}</p>
            </div>
        </div>
        {goals.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl text-black">
              ✦
            </div>

            <h2 className="mt-6 text-3xl font-bold">No goals created yet</h2>

            <p className="mx-auto mt-3 max-w-xl text-zinc-400">
              Create your first AI-powered goal tracker. You can build plans for Google
              job preparation, fat burning, English mastery, exam preparation, business
              growth, or any custom goal.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-zinc-300">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Google SWE Prep
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Fat Burning
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                English Mastery
              </span>
            </div>

            <Link
              href="/goals/new"
              className="mt-8 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
            >
              Create First Goal
            </Link>
          </div>
        
        ) : filteredGoals.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <h2 className="text-2xl font-bold">No matching goals found</h2>
            <p className="mt-3 text-zinc-400">
              Try searching with another goal name, category, or duration.
            </p>
          </div>
        ) : (
        <section className="mt-10 grid gap-6 md:grid-cols-3">
            {sortedGoals.map((goal) => {
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
                    Priority: {goal.priority || "Medium"}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-zinc-400">
                    Daily time: {goal.dailyTime}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Created: {new Date(goal.createdAt).toLocaleDateString()}
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
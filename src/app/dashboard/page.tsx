"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getGoals, saveGoals } from "@/lib/goalStorage";
import type { Goal } from "@/types/goal";

export default function DashboardPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedTrackerType, setSelectedTrackerType] = useState("All Trackers");
  const [sortBy, setSortBy] = useState("Newest First");

  useEffect(() => {
    const savedGoals = getGoals();
    setGoals(savedGoals);
  }, []);

  function getGoalProgress(goal: Goal) {
    if (goal.trackerType === "normal") {
      const checkIns = goal.normalCheckIns || [];
      if (checkIns.length === 0) return 0;

      const completed = checkIns.filter((item) => item.completed).length;
      return Math.round((completed / checkIns.length) * 100);
    }

    const planDays = goal.complexPlanDays || [];
    if (planDays.length === 0) return 0;

    const completedDays = planDays.filter((day) => day.completed).length;
    return Math.round((completedDays / planDays.length) * 100);
  }

  function getCompletedCount(goal: Goal) {
    if (goal.trackerType === "normal") {
      return goal.normalCheckIns?.filter((item) => item.completed).length || 0;
    }

    return goal.complexPlanDays?.filter((day) => day.completed).length || 0;
  }

  function getTotalCount(goal: Goal) {
    if (goal.trackerType === "normal") {
      return goal.normalCheckIns?.length || 0;
    }

    return goal.complexPlanDays?.length || 0;
  }

  const filteredGoals = goals.filter((goal) => {
    const searchText = searchTerm.toLowerCase();

    const matchesSearch =
      goal.name.toLowerCase().includes(searchText) ||
      goal.category.toLowerCase().includes(searchText) ||
      goal.duration.toLowerCase().includes(searchText);

    const matchesCategory =
      selectedCategory === "All Categories" ||
      goal.category === selectedCategory;

    const matchesTrackerType =
      selectedTrackerType === "All Trackers" ||
      goal.trackerType === selectedTrackerType;

    return matchesSearch && matchesCategory && matchesTrackerType;
  });

  const sortedGoals = [...filteredGoals].sort((a, b) => {
    const progressA = getGoalProgress(a);
    const progressB = getGoalProgress(b);

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

    return 0;
  });

  const completedGoals = goals.filter((goal) => getGoalProgress(goal) === 100);
  const inProgressGoals = goals.filter((goal) => getGoalProgress(goal) < 100);

  function getDaysRemainingText(targetDate?: string) {
    if (!targetDate) {
      return "No target date";
    }

    const today = new Date();
    const target = new Date(targetDate);

    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const differenceInTime = target.getTime() - today.getTime();
    const differenceInDays = Math.ceil(
      differenceInTime / (1000 * 60 * 60 * 24)
    );

    if (differenceInDays > 0) {
      return `${differenceInDays} day${differenceInDays === 1 ? "" : "s"} left`;
    }

    if (differenceInDays === 0) {
      return "Due today";
    }

    return `Overdue by ${Math.abs(differenceInDays)} day${
      Math.abs(differenceInDays) === 1 ? "" : "s"
    }`;
  }

  function clearAllGoals() {
    const confirmClear = window.confirm(
      "Are you sure you want to delete all goals? This cannot be undone."
    );

    if (!confirmClear) return;

    saveGoals([]);
    setGoals([]);
    setSearchTerm("");
    setSelectedCategory("All Categories");
    setSelectedTrackerType("All Trackers");
    setSortBy("Newest First");
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <section className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-300">GoalNow AI</p>
              <h1 className="mt-2 text-4xl font-black">Your Dashboard</h1>
              <p className="mt-3 max-w-2xl text-zinc-400">
                Manage normal habit trackers and complex AI-based goal trackers
                from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/goals/new"
                className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                Create New Goal
              </Link>

              {goals.length > 0 && (
                <button
                  onClick={clearAllGoals}
                  className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-400/20"
                >
                  Clear All Goals
                </button>
              )}
            </div>
          </div>

          <div className="mb-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 md:grid-cols-2 lg:grid-cols-4">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search goals..."
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400 md:col-span-2"
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
              value={selectedTrackerType}
              onChange={(event) => setSelectedTrackerType(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
            >
              <option>All Trackers</option>
              <option value="normal">Normal Tracker</option>
              <option value="complex">Complex AI Tracker</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400 md:col-span-2"
            >
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>Highest Progress</option>
              <option>Lowest Progress</option>
              <option>A to Z</option>
              <option>Z to A</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All Categories");
                setSelectedTrackerType("All Trackers");
                setSortBy("Newest First");
              }}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20 md:col-span-2"
            >
              Clear Filters
            </button>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-400">Total Goals</p>
              <h2 className="mt-2 text-3xl font-black">{goals.length}</h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-400">Visible Goals</p>
              <h2 className="mt-2 text-3xl font-black">{filteredGoals.length}</h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-400">Completed</p>
              <h2 className="mt-2 text-3xl font-black">
                {completedGoals.length}
              </h2>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-zinc-400">In Progress</p>
              <h2 className="mt-2 text-3xl font-black">
                {inProgressGoals.length}
              </h2>
            </div>
          </div>

          {goals.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-400/10 text-2xl">
                ✦
              </div>

              <h2 className="text-2xl font-bold">No goals created yet</h2>

              <p className="mx-auto mt-3 max-w-xl text-zinc-400">
                Create your first normal tracker or complex AI tracker.
              </p>

              <Link
                href="/goals/new"
                className="mt-6 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
              >
                Create First Goal
              </Link>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <h2 className="text-2xl font-bold">No matching goals found</h2>
              <p className="mt-3 text-zinc-400">
                Try another search or filter.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {sortedGoals.map((goal) => {
                const progress = getGoalProgress(goal);
                const completed = getCompletedCount(goal);
                const total = getTotalCount(goal);

                return (
                  <Link
                    key={goal.id}
                    href={`/goals/${goal.id}`}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-blue-400/40 hover:bg-white/10"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-zinc-400">{goal.category}</p>
                        <h2 className="mt-1 text-2xl font-bold">{goal.name}</h2>
                      </div>

                      <span
                        className={
                          goal.trackerType === "normal"
                            ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300"
                            : "rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-300"
                        }
                      >
                        {goal.trackerType === "normal"
                          ? "Normal"
                          : "Complex AI"}
                      </span>
                    </div>

                    <div className="grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
                      <p>
                        <span className="text-zinc-500">Duration:</span>{" "}
                        {goal.duration}
                      </p>

                      <p>
                        <span className="text-zinc-500">Priority:</span>{" "}
                        {goal.priority || "Medium"}
                      </p>

                      <p>
                        <span className="text-zinc-500">Target:</span>{" "}
                        {goal.targetDate
                          ? new Date(goal.targetDate).toLocaleDateString()
                          : "Not set"}
                      </p>

                      <p>
                        <span className="text-zinc-500">Deadline:</span>{" "}
                        {getDaysRemainingText(goal.targetDate)}
                      </p>

                      {goal.trackerType === "complex" && (
                        <p>
                          <span className="text-zinc-500">Active Day:</span>{" "}
                          Day {goal.activeDayNumber || 1}
                        </p>
                      )}

                      {goal.trackerType === "normal" && (
                        <p>
                          <span className="text-zinc-500">Frequency:</span>{" "}
                          {goal.normalFrequency || "daily"}
                        </p>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-zinc-400">
                          Progress {completed}/{total}
                        </span>
                        <span className="font-semibold text-white">
                          {progress}%
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
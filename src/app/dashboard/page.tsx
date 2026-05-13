"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConfirmModal from "@/components/ConfirmModal";
import {
  deleteGoalFromSupabase,
  getGoalsFromSupabase,
} from "@/lib/goals/supabaseGoals";
import type { Goal } from "@/types/goal";
import DashboardWelcome from "@/components/DashboardWelcome";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalError, setGoalError] = useState("");
  const [userName, setUserName] = useState("");
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
const [isClearingAllGoals, setIsClearingAllGoals] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedTrackerType, setSelectedTrackerType] = useState("All Trackers");
  const [sortBy, setSortBy] = useState("Newest First");

 useEffect(() => {
  let isMounted = true;

  async function loadDashboard() {
    setIsLoadingGoals(true);
    setGoalError("");
    setIsLoggedOut(false);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (!user) {
        setIsLoggedOut(true);
        setUserName("");
        setGoals([]);
        return;
      }

      const displayName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";

      setUserName(displayName);

      const supabaseGoals = await getGoalsFromSupabase();

      if (!isMounted) return;

      setGoals(supabaseGoals);
    } catch (error) {
      if (!isMounted) return;

      const message =
        error instanceof Error ? error.message : "Could not load your goals.";

      setGoalError(message);
    } finally {
      if (!isMounted) return;
      setIsLoadingGoals(false);
    }
  }

  loadDashboard();

  return () => {
    isMounted = false;
  };
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

  const priorityScore: Record<string, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const sortedGoals = [...filteredGoals].sort((a, b) => {
  if (sortBy === "Newest First") {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }

  if (sortBy === "Oldest First") {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }

  if (sortBy === "Highest Progress") {
    return getGoalProgress(b) - getGoalProgress(a);
  }

  if (sortBy === "Lowest Progress") {
    return getGoalProgress(a) - getGoalProgress(b);
  }

  if (sortBy === "Highest Priority") {
    return (
      (priorityScore[b.priority || "Medium"] || 2) -
      (priorityScore[a.priority || "Medium"] || 2)
    );
  }

  if (sortBy === "Lowest Priority") {
    return (
      (priorityScore[a.priority || "Medium"] || 2) -
      (priorityScore[b.priority || "Medium"] || 2)
    );
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
  const normalGoals = goals.filter((goal) => goal.trackerType === "normal");

const complexGoals = goals.filter((goal) => goal.trackerType === "complex");

const overdueGoals = goals.filter((goal) => {
  if (!goal.targetDate) return false;

  const today = new Date();
  const target = new Date(goal.targetDate);

  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  return target < today && getGoalProgress(goal) < 100;
});

const averageProgress =
  goals.length === 0
    ? 0
    : Math.round(
        goals.reduce((total, goal) => total + getGoalProgress(goal), 0) /
          goals.length
      );

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
  setShowClearAllConfirm(true);
}

async function confirmClearAllGoals() {
  const previousGoals = goals;

  setIsClearingAllGoals(true);
  setGoals([]);
  setSearchTerm("");
  setSelectedCategory("All Categories");
  setSelectedTrackerType("All Trackers");
  setSortBy("Newest First");
  setGoalError("");

  try {
    await Promise.all(
      previousGoals.map((goal) => deleteGoalFromSupabase(goal.id))
    );

    setShowClearAllConfirm(false);
  } catch (error) {
    setGoals(previousGoals);
    setGoalError(
      error instanceof Error ? error.message : "Could not delete all goals."
    );
  } finally {
    setIsClearingAllGoals(false);
  }
}

return (
  <>
    <Navbar />

    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-10">
      <section className="mx-auto max-w-7xl">
        {!isLoggedOut && (
        <>
          <DashboardWelcome userName={userName || "User"} />

    
        {/* Header */}
        <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl md:p-8">
          <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                GoalNow-AI Dashboard
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Your Goal Command Center
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                Manage normal habit trackers and complex AI-based goal trackers
                from one clean, professional workspace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/goals/new"
                className="rounded-2xl bg-cyan-400 px-6 py-4 text-center text-sm font-black text-slate-950 transition hover:bg-cyan-300"
              >
                + Create New Goal
              </Link>

              {goals.length > 0 && (
                <button
  type="button"
  onClick={clearAllGoals}
  disabled={isClearingAllGoals}
  className="rounded-2xl border border-red-400/30 bg-red-400/10 px-6 py-4 text-sm font-bold text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
>
  {isClearingAllGoals ? "Clearing..." : "Clear All"}
</button>
              )}
            </div>
          </div>
        </div>


        {goalError && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {goalError}
          </div>
        )}

        {/* Main Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-400">
                Total Goals
              </p>
              <span className="rounded-2xl bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
                All
              </span>
            </div>

            <h2 className="mt-4 text-4xl font-black">{goals.length}</h2>

            <p className="mt-2 text-xs text-slate-500">
              Total goals created in your account
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-400">
                Average Progress
              </p>
              <span className="rounded-2xl bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                Avg
              </span>
            </div>

            <h2 className="mt-4 text-4xl font-black">{averageProgress}%</h2>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${averageProgress}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-400">
                In Progress
              </p>
              <span className="rounded-2xl bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-300">
                Active
              </span>
            </div>

            <h2 className="mt-4 text-4xl font-black">
              {inProgressGoals.length}
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Goals still being worked on
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-400">
                Completed
              </p>
              <span className="rounded-2xl bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-300">
                Done
              </span>
            </div>

            <h2 className="mt-4 text-4xl font-black">
              {completedGoals.length}
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              Goals completed fully
            </p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">Normal Trackers</p>
            <h3 className="mt-2 text-3xl font-black text-emerald-300">
              {normalGoals.length}
            </h3>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">Complex AI Trackers</p>
            <h3 className="mt-2 text-3xl font-black text-cyan-300">
              {complexGoals.length}
            </h3>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">Overdue Goals</p>
            <h3 className="mt-2 text-3xl font-black text-red-300">
              {overdueGoals.length}
            </h3>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-black">Goal Library</h2>
              <p className="mt-1 text-sm text-slate-400">
                Search, filter, and open your trackers quickly.
              </p>
            </div>

            <p className="text-sm text-slate-500">
              Showing {sortedGoals.length} of {goals.length}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search goals..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400 xl:col-span-2"
            />

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
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
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
            >
              <option>All Trackers</option>
              <option value="normal">Normal Tracker</option>
              <option value="complex">Complex AI Tracker</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
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
          </div>

          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("All Categories");
              setSelectedTrackerType("All Trackers");
              setSortBy("Newest First");
            }}
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20 md:w-fit"
          >
            Clear Filters
          </button>
        </div>

        {/* Content */}
        <div className="mt-8">
          {isLoadingGoals ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <h2 className="text-2xl font-black">Loading your goals...</h2>
              <p className="mt-3 text-slate-400">
                Fetching your account-based goals from Supabase.
              </p>
            </div>
          ) : goals.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center md:p-12">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 text-3xl">
                ✦
              </div>

              <h2 className="text-3xl font-black">No goals created yet</h2>

              <p className="mx-auto mt-3 max-w-xl text-slate-400">
                Create your first normal tracker or complex AI tracker and start
                building your goal system.
              </p>

              <Link
                href="/goals/new"
                className="mt-7 inline-flex rounded-2xl bg-cyan-400 px-6 py-4 font-black text-slate-950 transition hover:bg-cyan-300"
              >
                Create First Goal
              </Link>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center md:p-12">
              <h2 className="text-3xl font-black">No matching goals found</h2>
              <p className="mt-3 text-slate-400">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All Categories");
                  setSelectedTrackerType("All Trackers");
                  setSortBy("Newest First");
                }}
                className="mt-6 rounded-2xl bg-white px-6 py-3 font-black text-slate-950 transition hover:bg-slate-200"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {sortedGoals.map((goal) => {
                const progress = getGoalProgress(goal);
                const completed = getCompletedCount(goal);
                const total = getTotalCount(goal);
                const isCompleted = progress === 100;
                const isOverdue = overdueGoals.some(
                  (item) => item.id === goal.id
                );

                return (
                  <Link
                    key={goal.id}
                    href={`/goals/${goal.id}`}
                    className="group rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl transition hover:-translate-y-1 hover:border-cyan-400/40 hover:bg-white/[0.08] md:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span
                            className={
                              goal.trackerType === "normal"
                                ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"
                                : "rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300"
                            }
                          >
                            {goal.trackerType === "normal"
                              ? "Normal Tracker"
                              : "Complex AI"}
                          </span>

                          {isCompleted && (
                            <span className="rounded-full border border-purple-400/30 bg-purple-400/10 px-3 py-1 text-xs font-bold text-purple-300">
                              Completed
                            </span>
                          )}

                          {isOverdue && (
                            <span className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
                              Overdue
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-semibold text-slate-400">
                          {goal.category}
                        </p>

                        <h2 className="mt-1 truncate text-2xl font-black text-white group-hover:text-cyan-200">
                          {goal.name}
                        </h2>
                      </div>

                      <div className="shrink-0 rounded-3xl border border-white/10 bg-black/30 px-4 py-3 text-center">
                        <p className="text-2xl font-black">{progress}%</p>
                        <p className="text-xs text-slate-500">Progress</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                      <p className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <span className="block text-xs text-slate-500">
                          Duration
                        </span>
                        <span className="font-semibold">{goal.duration}</span>
                      </p>

                      <p className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <span className="block text-xs text-slate-500">
                          Priority
                        </span>
                        <span className="font-semibold">
                          {goal.priority || "Medium"}
                        </span>
                      </p>

                      <p className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <span className="block text-xs text-slate-500">
                          Target
                        </span>
                        <span className="font-semibold">
                          {goal.targetDate
                            ? new Date(goal.targetDate).toLocaleDateString()
                            : "Not set"}
                        </span>
                      </p>

                      <p className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <span className="block text-xs text-slate-500">
                          Deadline
                        </span>
                        <span className="font-semibold">
                          {getDaysRemainingText(goal.targetDate)}
                        </span>
                      </p>

                      {goal.trackerType === "complex" && (
                        <p className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <span className="block text-xs text-slate-500">
                            Active Day
                          </span>
                          <span className="font-semibold">
                            Day {goal.activeDayNumber || 1}
                          </span>
                        </p>
                      )}

                      {goal.trackerType === "normal" && (
                        <p className="rounded-2xl border border-white/10 bg-black/20 p-3">
                          <span className="block text-xs text-slate-500">
                            Frequency
                          </span>
                          <span className="font-semibold capitalize">
                            {goal.normalFrequency || "daily"}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                          Completed {completed}/{total}
                        </span>
                        <span className="font-bold text-white">
                          {progress}%
                        </span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={
                            isCompleted
                              ? "h-full rounded-full bg-purple-400"
                              : goal.trackerType === "normal"
                              ? "h-full rounded-full bg-emerald-400"
                              : "h-full rounded-full bg-cyan-400"
                          }
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
          </>
)}
{isLoggedOut && !isLoadingGoals && (
  <section className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-black/30">
    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-cyan-400/10 text-3xl">
      🔐
    </div>

    <p className="mb-3 text-xs font-black uppercase tracking-[0.35em] text-cyan-300">
      Account Required
    </p>

    <h2 className="text-3xl font-black text-white md:text-4xl">
      Login to open your dashboard
    </h2>

    <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-400">
      Your GoalNow-AI goals are now saved with your Supabase account.
      Please login to view your personal trackers, progress, weekly tests,
      and AI mentor history.
    </p>

    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
      <button
        type="button"
        onClick={() => router.push("/login?redirect=/dashboard")}
        className="rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
      >
        Login Now
      </button>

      <button
        type="button"
        onClick={() => router.push("/signup?redirect=/dashboard")}
        className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/20"
      >
        Create Account
      </button>

      <button
        type="button"
        onClick={() => router.push("/")}
        className="rounded-2xl border border-white/10 px-6 py-3 text-sm font-black text-slate-300 transition hover:bg-white/10"
      >
        Back to Home
      </button>
    </div>
  </section>
)}
      </section>
    </main>

    <Footer />

    <ConfirmModal
      isOpen={showClearAllConfirm}
      title="Delete all goals?"
      message="This will permanently remove every goal from your dashboard. Your normal trackers, complex AI trackers, progress, tests, reports, and mentor history for these goals will be deleted."
      confirmText="Yes, Delete All"
      cancelText="Cancel"
      icon="!"
      tone="danger"
      isLoading={isClearingAllGoals}
      onCancel={() => setShowClearAllConfirm(false)}
      onConfirm={confirmClearAllGoals}
    />
  </>
); 
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getGoalByIdFromSupabase } from "@/lib/goals/supabaseGoals";
import type { Goal } from "@/types/goal";
import {
  addDays,
  calculateSmartWeekProgress,
  canGoToPreviousWeek,
  getWeekStartMonday,
} from "@/lib/smartProgress";

function getDateOnly(dateString: string) {
  return new Date(dateString).toISOString().split("T")[0];
}



function getDayLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

function getShortDateLabel(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function getWeekRangeText(startDate: Date, endDate: Date) {
  const start = startDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const end = endDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return `${start} - ${end}`;
}

export default function WeeklyDashboardPage() {
  const params = useParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [weeklyError, setWeeklyError] = useState("");
  const [weekStartDate, setWeekStartDate] = useState<Date>(
    getWeekStartMonday(new Date())
  );

  useEffect(() => {
    let isMounted = true;

    async function loadGoal() {
      setIsLoadingGoal(true);
      setWeeklyError("");

      try {
        const foundGoal = await getGoalByIdFromSupabase(goalId);

        if (!isMounted) return;

        if (!foundGoal) {
          setGoal(null);
          setWeeklyError("Goal not found.");
          return;
        }

        setGoal(foundGoal);
      } catch (error) {
        if (!isMounted) return;

        setGoal(null);
        setWeeklyError(
          error instanceof Error
            ? error.message
            : "Could not load weekly dashboard."
        );
      } finally {
        if (!isMounted) return;

        setIsLoadingGoal(false);
      }
    }

    if (goalId) {
      loadGoal();
    }

    return () => {
      isMounted = false;
    };
  }, [goalId]);

  if (isLoadingGoal) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black px-6 py-10 text-white">
          <section className="mx-auto max-w-4xl">
            <Link href="/dashboard" className="text-sm text-blue-300">
              ← Back to Dashboard
            </Link>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <h1 className="text-3xl font-black">
                Loading weekly dashboard...
              </h1>
              <p className="mt-3 text-zinc-400">
                Fetching weekly progress from your Supabase account.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  if (!goal) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black px-6 py-10 text-white">
          <section className="mx-auto max-w-4xl">
            <Link href="/dashboard" className="text-sm text-blue-300">
              ← Back to Dashboard
            </Link>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <h1 className="text-3xl font-black">Goal not found</h1>
              <p className="mt-3 text-zinc-400">
                {weeklyError || "This weekly dashboard needs a saved goal first."}
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  if (goal.trackerType !== "complex") {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black px-6 py-10 text-white">
          <section className="mx-auto max-w-4xl">
            <Link href={`/goals/${goal.id}`} className="text-sm text-blue-300">
              ← Back to Goal
            </Link>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <h1 className="text-3xl font-black">
                Weekly Dashboard is for Complex Trackers
              </h1>
              <p className="mt-3 text-zinc-400">
                Normal trackers use simple calendar ticking. Weekly dashboard is
                mainly for complex AI trackers like Google preparation, exams,
                English learning, or fitness goals.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  const planDays = goal.complexPlanDays || [];
  const allTasks = planDays.flatMap((day) => day.tasks);

  const completedDays = planDays.filter((day) => day.completed);
  const completedTasks = allTasks.filter((task) => task.completed);

  const totalDays = planDays.length;
  const totalTasks = allTasks.length;

  const progressPercentage =
    totalDays === 0 ? 0 : Math.round((completedDays.length / totalDays) * 100);

  const taskProgressPercentage =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks.length / totalTasks) * 100);


  const smartWeekProgress = calculateSmartWeekProgress(goal, weekStartDate);
  const weekEndDate = addDays(weekStartDate, 6);

  const weeklyTotalPercentage = smartWeekProgress.reduce(
    (total, day) => total + day.percentage,
    0
  );

  const weeklyAveragePercentage = Math.round(
    weeklyTotalPercentage / smartWeekProgress.length
  );

  const skippedDaysThisWeek = smartWeekProgress.filter(
    (day) => day.isSkipped
  ).length;

  const catchUpTasksThisWeek = smartWeekProgress.reduce(
    (total, day) => total + day.catchUpTaskCount,
    0
  );

  const futureTasksThisWeek = smartWeekProgress.reduce(
    (total, day) => total + day.futureTaskCount,
    0
  );

  const ownTasksThisWeek = smartWeekProgress.reduce(
    (total, day) => total + day.ownTaskCount,
    0
  );

  const totalTasksDoneThisWeek = smartWeekProgress.reduce(
    (total, day) => total + day.completedTaskUnits,
    0
  );

  const bestDay = [...smartWeekProgress].sort(
    (a, b) => b.percentage - a.percentage
  )[0];

  const maxGraphPercentage = Math.max(
    100,
    ...smartWeekProgress.map((day) => day.percentage)
  );

  const graphTopPercentage = Math.ceil(maxGraphPercentage / 100) * 100;

  const selectedWeekDateKeys = smartWeekProgress.map((day) => day.date);

const completedThisWeek = completedDays.filter((day) => {
  if (!day.completedAt) return false;

  const completedDate = getDateOnly(day.completedAt);
  return selectedWeekDateKeys.includes(completedDate);
});

  const activeDay = planDays.find(
    (day) => day.dayNumber === goal.activeDayNumber
  );

  const pendingTasksInActiveDay =
    activeDay?.tasks.filter((task) => !task.completed) || [];

  let consistencyStatus = "Needs Focus";
  let recommendation =
    "Complete the current active day first. If you missed a day, recover slowly instead of rushing everything.";

  if (weeklyAveragePercentage >= 120) {
    consistencyStatus = "Over Achiever";
    recommendation =
      "You are doing more than the weekly base plan. Keep this speed, but avoid burnout. Review once before moving too far ahead.";
  } else if (weeklyAveragePercentage >= 85) {
    consistencyStatus = "Excellent";
    recommendation =
      "You are consistent this week. Continue the same rhythm and take one realistic weekly test.";
  } else if (weeklyAveragePercentage >= 50) {
    consistencyStatus = "Good Start";
    recommendation =
      "You are moving, but consistency can improve. Try to complete the scheduled day before doing future work.";
  }

  const todayKey = new Date().toISOString().split("T")[0];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_35%,#000000_100%)] px-4 py-8 text-white md:px-6 md:py-10">
        <section className="mx-auto max-w-7xl">
          <Link href={`/goals/${goal.id}`} className="text-sm text-blue-300">
            ← Back to Goal
          </Link>

          {weeklyError && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {weeklyError}
            </div>
          )}

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-blue-950/30 backdrop-blur">
            <div className="border-b border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
                    GoalNow AI Weekly Dashboard
                  </p>

                  <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                    {goal.name}
                  </h1>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
                    Professional weekly analysis with day-vs-percentage graph,
                    skipped-day detection, catch-up tracking, future-work
                    tracking, and next best action.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Viewing Week
                  </p>
                  <h2 className="mt-2 text-lg font-black text-white">
                    {getWeekRangeText(weekStartDate, weekEndDate)}
                  </h2>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      disabled={!canGoToPreviousWeek(goal, weekStartDate)}
                      onClick={() =>
                        setWeekStartDate((current) => addDays(current, -7))
                      }
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    <button
                      onClick={() =>
                        setWeekStartDate(getWeekStartMonday(new Date()))
                      }
                      className="rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-xs font-bold text-blue-100 transition hover:bg-blue-400/20"
                    >
                      Current
                    </button>

                    <button
                      onClick={() =>
                        setWeekStartDate((current) => addDays(current, 7))
                      }
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                    Weekly Average
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-emerald-200">
                    {weeklyAveragePercentage}%
                  </h2>
                  <p className="mt-2 text-xs text-emerald-100/70">
                    Average completion per scheduled day
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Total Done
                  </p>
                  <h2 className="mt-3 text-4xl font-black">
                    {totalTasksDoneThisWeek}
                  </h2>
                  <p className="mt-2 text-xs text-zinc-500">
                    Tasks completed in this selected week
                  </p>
                </div>

                <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-red-200/70">
                    Skipped
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-red-200">
                    {skippedDaysThisWeek}
                  </h2>
                  <p className="mt-2 text-xs text-red-100/70">
                    Scheduled days missed
                  </p>
                </div>

                <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-yellow-200/70">
                    Catch-up
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-yellow-200">
                    {catchUpTasksThisWeek}
                  </h2>
                  <p className="mt-2 text-xs text-yellow-100/70">
                    Previous tasks done this week
                  </p>
                </div>

                <div className="rounded-3xl border border-blue-400/20 bg-blue-400/10 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-blue-200/70">
                    Future
                  </p>
                  <h2 className="mt-3 text-4xl font-black text-blue-200">
                    {futureTasksThisWeek}
                  </h2>
                  <p className="mt-2 text-xs text-blue-100/70">
                    Future tasks completed early
                  </p>
                </div>
              </div>
            </div>

<div className="space-y-6 p-6 md:p-8">
<div className="rounded-[2rem] border border-white/10 bg-black/35 p-5 shadow-xl md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                      Day vs Completion Percentage
                    </p>
                    <h2 className="mt-2 text-3xl font-black">
                      Smart Weekly Graph
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                      Each bar shows how much work was completed on that exact
                      date. 
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-right">
                    <p className="text-xs text-zinc-500">Best Day</p>
                    <h3 className="mt-1 text-xl font-black text-white">
                      {getDayLabel(bestDay.date)} · {bestDay.percentage}%
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">
                      Day {bestDay.scheduledDayNumber}
                    </p>
                  </div>
                </div>

                <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-6">
                  <div className="mb-4 flex items-center justify-between text-xs text-zinc-500">
                    <span>{graphTopPercentage}%</span>
                    <span>Completion Percentage</span>
                  </div>

                  <div className="relative h-80 overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-4">
                    <div className="pointer-events-none absolute inset-4 flex flex-col justify-between">
                      {[100, 75, 50, 25, 0].map((line) => (
                        <div key={line} className="flex items-center gap-3">
                          <span className="w-10 text-right text-[10px] text-zinc-600">
                            {Math.round((graphTopPercentage * line) / 100)}%
                          </span>
                          <div className="h-px flex-1 bg-white/10" />
                        </div>
                      ))}
                    </div>

                    <div className="relative z-10 ml-12 flex h-full items-end justify-between gap-2 pt-8">
                      {smartWeekProgress.map((day) => {
                        const barHeight = Math.max(
                          4,
                          Math.min(
                            100,
                            (day.percentage / graphTopPercentage) * 100
                          )
                        );

                        const isToday = day.date === todayKey;

                        let barClass =
                          "from-zinc-300 to-white shadow-white/10";

                        if (day.isSkipped) {
                          barClass = "from-red-500 to-red-300 shadow-red-500/20";
                        } else if (day.percentage > 100) {
                          barClass =
                            "from-blue-500 via-purple-400 to-emerald-300 shadow-blue-500/30";
                        } else if (day.percentage > 0) {
                          barClass =
                            "from-emerald-500 to-emerald-300 shadow-emerald-500/20";
                        } else {
                          barClass = "from-zinc-700 to-zinc-600 shadow-black/10";
                        }

                        return (
                          <div
                            key={day.date}
                            className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                          >
                            <div className="mb-3 opacity-0 transition group-hover:opacity-100">
                              <div className="whitespace-nowrap rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-center text-xs shadow-xl">
                                <p className="font-bold text-white">
                                  {day.percentage}%
                                </p>
                                <p className="mt-1 text-zinc-400">
                                  Done: {day.completedTaskUnits} / Scheduled:{" "}
                                  {day.scheduledTaskCount}
                                </p>
                              </div>
                            </div>

                            <div className="flex h-[220px] w-full items-end justify-center">
                              <div
                                className={`w-full max-w-12 rounded-t-2xl bg-gradient-to-t shadow-lg transition-all duration-500 group-hover:scale-105 ${barClass}`}
                                style={{ height: `${barHeight}%` }}
                              />
                            </div>

                            <div
                              className={
                                isToday
                                  ? "mt-3 rounded-xl border border-blue-400/30 bg-blue-400/10 px-2 py-1 text-center"
                                  : "mt-3 px-2 py-1 text-center"
                              }
                            >
                              <p className="text-xs font-black text-white">
                                {getDayLabel(day.date)}
                              </p>
                              <p className="mt-1 text-[10px] text-zinc-500">
                                {getShortDateLabel(day.date)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" />
                      Normal completion
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-blue-200">
                      <span className="h-2 w-2 rounded-full bg-blue-300" />
                      More than 100%
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-2 text-red-200">
                      <span className="h-2 w-2 rounded-full bg-red-300" />
                      Skipped day
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-zinc-300">
                      <span className="h-2 w-2 rounded-full bg-blue-300" />
                      Today highlighted
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-zinc-500">Own scheduled tasks</p>
                    <h3 className="mt-2 text-2xl font-black text-emerald-300">
                      {ownTasksThisWeek}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-zinc-500">Weekly score</p>
                    <h3 className="mt-2 text-2xl font-black">
                      {weeklyTotalPercentage}%
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs text-zinc-500">Consistency</p>
                    <h3 className="mt-2 text-2xl font-black">
                      {consistencyStatus}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                    Active Day
                  </p>

                  {activeDay ? (
                    <>
                      <h2 className="mt-3 text-3xl font-black">
                        Day {activeDay.dayNumber}
                      </h2>

                      <h3 className="mt-3 text-xl font-bold text-blue-200">
                        {activeDay.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {activeDay.focus}
                      </p>

                      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs text-zinc-500">
                          Pending Tasks Today
                        </p>
                        <h4 className="mt-2 text-3xl font-black">
                          {pendingTasksInActiveDay.length}
                        </h4>
                      </div>

                      <div className="mt-5 space-y-3">
                        {pendingTasksInActiveDay.length > 0 ? (
                          pendingTasksInActiveDay.slice(0, 5).map((task) => (
                            <div
                              key={task.id}
                              className="rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-zinc-300"
                            >
                              {task.title}
                            </div>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                            All tasks in the active day are completed.
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="mt-4 text-zinc-400">
                      No active day found. Your plan may be completed.
                    </p>
                  )}
                </div>

                <div className="rounded-[2rem] border border-blue-400/20 bg-blue-400/10 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200/70">
                    Next Best Action
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-blue-100">
                    AI-style weekly advice
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-blue-50/80">
                    {recommendation}
                  </p>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                    Overall Plan
                  </p>

                  <div className="mt-5 space-y-5">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Day Progress</span>
                        <span className="font-bold">{progressPercentage}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-white"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Task Progress</span>
                        <span className="font-bold">
                          {taskProgressPercentage}%
                        </span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-blue-300"
                          style={{ width: `${taskProgressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

<div className="grid gap-6 border-t border-white/10 p-6 md:p-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
  <div className="flex items-center justify-between gap-4">
    <div>
      <h2 className="text-2xl font-black">Daily Breakdown</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Short summary of the selected week.
      </p>
    </div>

    <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
      {getWeekRangeText(weekStartDate, weekEndDate)}
    </p>
  </div>

  <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
    {smartWeekProgress.map((day) => (
      <div
        key={day.date}
        className="grid gap-3 border-b border-white/10 bg-white/[0.03] p-4 last:border-b-0 md:grid-cols-[1fr_90px_1.4fr]"
      >
        <div>
          <p className="text-sm font-black text-white">
            {getDayLabel(day.date)}, {getShortDateLabel(day.date)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Day {day.scheduledDayNumber}
          </p>
        </div>

        <div>
          <p
            className={
              day.isSkipped
                ? "text-lg font-black text-red-300"
                : day.percentage > 100
                ? "text-lg font-black text-blue-300"
                : day.percentage > 0
                ? "text-lg font-black text-emerald-300"
                : "text-lg font-black text-zinc-500"
            }
          >
            {day.isSkipped ? "0%" : `${day.percentage}%`}
          </p>
          <p className="text-xs text-zinc-500">
            {day.completedTaskUnits}/{day.scheduledTaskCount}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {day.isSkipped && (
            <span className="rounded-full bg-red-400/10 px-3 py-1 text-red-200">
              Skipped
            </span>
          )}

          {day.ownTaskCount > 0 && (
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-emerald-200">
              Own {day.ownTaskCount}
            </span>
          )}

          {day.catchUpTaskCount > 0 && (
            <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-yellow-200">
              Catch-up {day.catchUpTaskCount}
            </span>
          )}

          {day.futureTaskCount > 0 && (
            <span className="rounded-full bg-blue-400/10 px-3 py-1 text-blue-200">
              Future {day.futureTaskCount}
            </span>
          )}

          {!day.isSkipped &&
            day.ownTaskCount === 0 &&
            day.catchUpTaskCount === 0 &&
            day.futureTaskCount === 0 && (
              <span className="rounded-full bg-white/5 px-3 py-1 text-zinc-500">
                No work
              </span>
            )}
        </div>
      </div>
    ))}
  </div>
</div>
              <div className="space-y-6">
                

                <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
                  <h2 className="text-2xl font-black">Weekly Feedback</h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    You completed {completedThisWeek.length} full plan day
                    {completedThisWeek.length === 1 ? "" : "s"} in the last 7
                    days. Your selected-week average is{" "}
                    <span className="font-bold text-white">
                      {weeklyAveragePercentage}%
                    </span>
                    , and your current consistency status is{" "}
                    <span className="font-bold text-white">
                      {consistencyStatus}
                    </span>
                    .
                  </p>
                </div>

                {goal.latestTestResult && (
                  <div className="rounded-[2rem] border border-purple-400/30 bg-purple-400/10 p-6">
                    <h2 className="text-2xl font-black text-purple-200">
                      Latest Weekly Test Result
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-zinc-200">
                      {goal.latestTestResult}
                    </p>

                    {goal.latestTestDate && (
                      <p className="mt-2 text-sm text-zinc-400">
                        Saved on{" "}
                        {new Date(goal.latestTestDate).toLocaleDateString(
                          "en-IN"
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import {
  deleteGoalFromSupabase,
  getGoalByIdFromSupabase,
  updateGoalInSupabase,
} from "@/lib/goals/supabaseGoals";
import { downloadComplexPlanPdf } from "@/lib/exportPlanPdf";
import type { Goal } from "@/types/goal";

function formatDateToYMD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayString() {
  return formatDateToYMD(new Date());
}
function getYesterdayString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateToYMD(yesterday);
}

function getDateRange(startDate: string, endDate: string) {
  const dates: string[] = [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (start <= end) {
    dates.push(formatDateToYMD(start));
    start.setDate(start.getDate() + 1);
  }

  return dates;
}

function getReadableDate(dateString: string) {
  return new Date(dateString).toLocaleDateString();
}

function getRecentDates(totalDays: number) {
  const dates: string[] = [];

  for (let index = totalDays - 1; index >= 0; index--) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}
function getMonthCalendarDays(calendarDate: Date) {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const leadingBlankDays = firstDayOfMonth.getDay();
  const totalDaysInMonth = lastDayOfMonth.getDate();

  const calendarDays: (string | null)[] = [];

  for (let index = 0; index < leadingBlankDays; index++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= totalDaysInMonth; day++) {
    calendarDays.push(formatDateToYMD(new Date(year, month, day)));
  }

  return calendarDays;
}

function getMonthTitle(calendarDate: Date) {
  return calendarDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}
function normalizeComplexGoalDates(goal: Goal) {
  if (goal.trackerType !== "complex" || !goal.complexPlanDays) {
    return goal;
  }

  const today = getTodayString();
  const yesterday = getYesterdayString();

  let changed = false;

  const updatedPlanDays = goal.complexPlanDays.map((day) => {
    if (day.dayNumber !== goal.activeDayNumber || day.completed) {
      return day;
    }

    let assignedDate = day.assignedDate;

    if (!assignedDate) {
      assignedDate = today;
      changed = true;
    }

    let missedDates = day.missedDates || [];

    if (assignedDate < today) {
      const datesToMarkMissed = getDateRange(assignedDate, yesterday);

      const uniqueMissedDates = Array.from(
        new Set([...missedDates, ...datesToMarkMissed])
      );

      if (uniqueMissedDates.length !== missedDates.length) {
        missedDates = uniqueMissedDates;
        changed = true;
      }
    }

    return {
      ...day,
      assignedDate,
      missedDates,
    };
  });

  if (!changed) {
    return goal;
  }

  return {
    ...goal,
    complexPlanDays: updatedPlanDays,
    updatedAt: new Date().toISOString(),
  };
}

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [goalError, setGoalError] = useState("");
  const [normalCalendarDate, setNormalCalendarDate] = useState(new Date());
  useEffect(() => {
  let isMounted = true;

  async function loadGoal() {
    setIsLoadingGoal(true);
    setGoalError("");

    try {
      const foundGoal = await getGoalByIdFromSupabase(goalId);

      if (!isMounted) return;

      if (!foundGoal) {
        setGoal(null);
        return;
      }

      const normalizedGoal = normalizeComplexGoalDates(foundGoal);

      if (JSON.stringify(normalizedGoal) !== JSON.stringify(foundGoal)) {
        const savedGoal = await updateGoalInSupabase(normalizedGoal);

        if (!isMounted) return;

        setGoal(savedGoal);
      } else {
        setGoal(normalizedGoal);
      }
    } catch (error) {
      if (!isMounted) return;

      setGoal(null);
      setGoalError(
        error instanceof Error ? error.message : "Could not load this goal."
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

 async function saveUpdatedGoal(updatedGoal: Goal) {
  const previousGoal = goal;

  setGoal(updatedGoal);
  setGoalError("");

  try {
    const savedGoal = await updateGoalInSupabase(updatedGoal);
    setGoal(savedGoal);
  } catch (error) {
    if (previousGoal) {
      setGoal(previousGoal);
    }

    setGoalError(
      error instanceof Error ? error.message : "Could not update this goal."
    );
  }
}

  function toggleNormalDate(date: string) {
    if (!goal) return;

    const checkIns = goal.normalCheckIns || [];
    const existingCheckIn = checkIns.find((item) => item.date === date);

    let updatedCheckIns;

    if (existingCheckIn) {
      updatedCheckIns = checkIns.map((item) =>
        item.date === date
          ? {
              ...item,
              completed: !item.completed,
              editedAt: new Date().toISOString(),
            }
          : item
      );
    } else {
      updatedCheckIns = [
        ...checkIns,
        {
          date,
          completed: true,
          editedAt: new Date().toISOString(),
        },
      ];
    }

    const updatedGoal: Goal = {
      ...goal,
      normalCheckIns: updatedCheckIns,
      updatedAt: new Date().toISOString(),
    };

    saveUpdatedGoal(updatedGoal);
  }
  function goToPreviousMonth() {
  setNormalCalendarDate((currentDate) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    return newDate;
  });
}

function goToNextMonth() {
  setNormalCalendarDate((currentDate) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    return newDate;
  });
}

function goToCurrentMonth() {
  setNormalCalendarDate(new Date());
}

  function toggleComplexTask(dayNumber: number, taskId: string) {
  if (!goal || !goal.complexPlanDays) return;

  const today = getTodayString();

  const updatedPlanDays = goal.complexPlanDays.map((day) => {
    if (day.dayNumber !== dayNumber) {
      return day;
    }

    const updatedTasks = day.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    const isDayComplete = updatedTasks.every((task) => task.completed);

    return {
      ...day,
      assignedDate: day.assignedDate || today,
      tasks: updatedTasks,
      completed: isDayComplete,
      completedAt: isDayComplete ? new Date().toISOString() : undefined,
    };
  });

  let nextActiveDayNumber = goal.activeDayNumber || 1;

  if (dayNumber === nextActiveDayNumber) {
    const currentDay = updatedPlanDays.find(
      (day) => day.dayNumber === dayNumber
    );

    if (currentDay?.completed) {
      const nextIncompleteDay = updatedPlanDays.find(
        (day) => !day.completed && day.dayNumber > dayNumber
      );

      nextActiveDayNumber = nextIncompleteDay
        ? nextIncompleteDay.dayNumber
        : dayNumber;
    }
  }

  const finalPlanDays = updatedPlanDays.map((day) => {
    if (
      day.dayNumber === nextActiveDayNumber &&
      !day.completed &&
      !day.assignedDate
    ) {
      return {
        ...day,
        assignedDate: today,
      };
    }

    return day;
  });

  const allDaysCompleted = finalPlanDays.every((day) => day.completed);

  const updatedGoal: Goal = {
    ...goal,
    complexPlanDays: finalPlanDays,
    activeDayNumber: nextActiveDayNumber,
    status: allDaysCompleted ? "completed" : "active",
    updatedAt: new Date().toISOString(),
  };

  saveUpdatedGoal(updatedGoal);
}
function recoverMissedDate(dayNumber: number, missedDate: string) {
  if (!goal || !goal.complexPlanDays) return;

  const confirmRecover = window.confirm(
    `Mark ${new Date(missedDate).toLocaleDateString()} as recovered? Use this only if you actually completed the study later.`
  );

  if (!confirmRecover) return;

  const updatedPlanDays = goal.complexPlanDays.map((day) => {
    if (day.dayNumber !== dayNumber) {
      return day;
    }

    return {
      ...day,
      missedDates: (day.missedDates || []).filter(
        (date) => date !== missedDate
      ),
    };
  });

  const updatedGoal: Goal = {
    ...goal,
    complexPlanDays: updatedPlanDays,
    updatedAt: new Date().toISOString(),
  };

  saveUpdatedGoal(updatedGoal);
}
        

  async function deleteGoal() {
  if (!goal) return;

  const confirmDelete = window.confirm(
    `Are you sure you want to delete "${goal.name}"?`
  );

  if (!confirmDelete) return;

  try {
    await deleteGoalFromSupabase(goal.id);
    router.push("/dashboard");
    router.refresh();
  } catch (error) {
    setGoalError(
      error instanceof Error ? error.message : "Could not delete this goal."
    );
  }
}

  function exportGoalSummary() {
    if (!goal) return;

    const summary = `
GoalNow AI Summary

Goal: ${goal.name}
Tracker Type: ${goal.trackerType === "normal" ? "Normal Tracker" : "Complex AI Tracker"}
Category: ${goal.category}
Duration: ${goal.duration}
Priority: ${goal.priority || "Medium"}
Target Date: ${
      goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : "Not set"
    }

Progress: ${getProgressPercentage()}%

Created: ${new Date(goal.createdAt).toLocaleDateString()}
Last Updated: ${
      goal.updatedAt ? new Date(goal.updatedAt).toLocaleDateString() : "Not updated yet"
    }
`;

    navigator.clipboard.writeText(summary.trim());
    alert("Goal summary copied to clipboard.");
  }
  function downloadPlanPdf() {
    if (!goal) return;

    if (goal.trackerType !== "complex") {
      alert("PDF plan download is only available for complex AI trackers.");
      return;
    }

    downloadComplexPlanPdf(goal);
  }

  function getProgressPercentage() {
    if (!goal) return 0;

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

  function getNormalStreak() {
    if (!goal || goal.trackerType !== "normal") return 0;

    const checkIns = goal.normalCheckIns || [];
    let streak = 0;

    for (let index = 0; index < 365; index++) {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const dateString = date.toISOString().split("T")[0];

      const checkIn = checkIns.find(
        (item) => item.date === dateString && item.completed
      );

      if (checkIn) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
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
            <h1 className="text-3xl font-black">Loading goal...</h1>
            <p className="mt-3 text-zinc-400">
              Fetching your account-based goal from Supabase.
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
                This goal may have been deleted or not saved properly.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  const progressPercentage = getProgressPercentage();
  const normalMonthDays = getMonthCalendarDays(normalCalendarDate);

const normalMonthPrefix = `${normalCalendarDate.getFullYear()}-${String(
  normalCalendarDate.getMonth() + 1
).padStart(2, "0")}`;

const normalMonthCheckIns =
  goal.normalCheckIns?.filter((item) => item.date.startsWith(normalMonthPrefix)) ||
  [];

const normalMonthCompletedCount = normalMonthCheckIns.filter(
  (item) => item.completed
).length;

const normalMonthTotalDays = normalMonthDays.filter(Boolean).length;

const normalMonthProgress =
  normalMonthTotalDays === 0
    ? 0
    : Math.round((normalMonthCompletedCount / normalMonthTotalDays) * 100);
  

  const activeDay = goal.complexPlanDays?.find(
    (day) => day.dayNumber === goal.activeDayNumber
  );
  const activeDayMissedDates = activeDay?.missedDates || [];
const hasStreakBreak =
  goal.trackerType === "complex" && activeDayMissedDates.length > 0;

  const completedComplexDays =
    goal.complexPlanDays?.filter((day) => day.completed).length || 0;

  const totalComplexDays = goal.complexPlanDays?.length || 0;

  const normalCompletedCount =
    goal.normalCheckIns?.filter((item) => item.completed).length || 0;

  const normalTotalCount = goal.normalCheckIns?.length || 0;

  const todayString = getTodayString();

  const activeDayNotCompleted =
    goal.trackerType === "complex" && activeDay && !activeDay.completed;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <section className="mx-auto max-w-6xl">
          <Link href="/dashboard" className="text-sm text-blue-300">
            ← Back to Dashboard
          </Link>
          {goalError && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {goalError}
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-zinc-400">{goal.category}</p>

                <h1 className="mt-2 text-4xl font-black">{goal.name}</h1>

                <div className="mt-4 flex flex-wrap gap-3">
                  <span
                    className={
                      goal.trackerType === "normal"
                        ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300"
                        : "rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm font-semibold text-blue-300"
                    }
                  >
                    {goal.trackerType === "normal"
                      ? "Normal Tracker"
                      : "Complex AI Tracker"}
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-zinc-300">
                    {progressPercentage}% Complete
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-zinc-300">
                    {goal.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {goal.trackerType === "complex" && (
                  <>
                    <Link
                      href={`/goals/${goal.id}/mentor`}
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                    >
                      AI Mentor
                    </Link>

                    <Link
                      href={`/goals/${goal.id}/test`}
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                    >
                      Weekly Test
                    </Link>
                    <Link
                      href={`/goals/${goal.id}/weekly-dashboard`}
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                    >
                      Weekly Dashboard
                    </Link>

                    <Link
                      href={`/goals/${goal.id}/report`}
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                    >
                      Report
                    </Link>
                    <button
                      onClick={downloadPlanPdf}
                      className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                    >
                      Download Plan PDF
                    </button>
                  </>
                )}

                <Link
                  href={`/goals/${goal.id}/edit`}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                >
                  Edit Goal
                </Link>

                <button
                  onClick={exportGoalSummary}
                  className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20"
                >
                  Export Summary
                </button>

                <button
                  onClick={deleteGoal}
                  className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 font-semibold text-red-300 transition hover:bg-red-400/20"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">Progress</span>
                <span className="font-semibold">{progressPercentage}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Duration</p>
                <h2 className="mt-2 text-xl font-bold">{goal.duration}</h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Priority</p>
                <h2 className="mt-2 text-xl font-bold">
                  {goal.priority || "Medium"}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Target Date</p>
                <h2 className="mt-2 text-xl font-bold">
                  {goal.targetDate
                    ? new Date(goal.targetDate).toLocaleDateString()
                    : "Not set"}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Created</p>
                <h2 className="mt-2 text-xl font-bold">
                  {new Date(goal.createdAt).toLocaleDateString()}
                </h2>
              </div>
            </div>
          </div>

          {goal.trackerType === "normal" && (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-3xl font-black">Normal Calendar Tracker</h2>
                  <p className="mt-2 text-zinc-400">
                    Tick dates for simple goals like saving money, drinking water,
                    walking, reading, or daily habits.
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4">
                  <p className="text-sm text-emerald-300">Current Streak</p>
                  <h3 className="mt-1 text-3xl font-black">
                    {getNormalStreak()} days
                  </h3>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-sm text-zinc-400">Target</p>
                  <h3 className="mt-2 text-xl font-bold">
                    {goal.normalTarget || goal.name}
                  </h3>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-sm text-zinc-400">Frequency</p>
                  <h3 className="mt-2 text-xl font-bold">
                    {goal.normalFrequency || "daily"}
                  </h3>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-sm text-zinc-400">Completed</p>
                  <h3 className="mt-2 text-xl font-bold">
                    {normalCompletedCount} / {normalTotalCount}
                  </h3>
                </div>
              </div>

              <div className="mt-8">
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
      <h3 className="text-2xl font-black">Monthly Calendar</h3>
      <p className="mt-1 text-sm text-zinc-400">
        Click any date to tick or untick your normal tracker.
      </p>
    </div>

    <div className="flex flex-wrap gap-3">
      <button
        onClick={goToPreviousMonth}
        className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        Previous
      </button>

      <button
        onClick={goToCurrentMonth}
        className="rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-400/20"
      >
        Today
      </button>

      <button
        onClick={goToNextMonth}
        className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        Next
      </button>
    </div>
  </div>

  <div className="mt-5 grid gap-4 md:grid-cols-3">
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <p className="text-sm text-zinc-400">Month</p>
      <h3 className="mt-2 text-xl font-bold">
        {getMonthTitle(normalCalendarDate)}
      </h3>
    </div>

    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <p className="text-sm text-zinc-400">Completed This Month</p>
      <h3 className="mt-2 text-xl font-bold">
        {normalMonthCompletedCount}/{normalMonthTotalDays}
      </h3>
    </div>

    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
      <p className="text-sm text-zinc-400">Monthly Progress</p>
      <h3 className="mt-2 text-xl font-bold">{normalMonthProgress}%</h3>
    </div>
  </div>

  <div className="mt-6 grid grid-cols-7 gap-2 text-center text-sm font-semibold text-zinc-400">
    <div>Sun</div>
    <div>Mon</div>
    <div>Tue</div>
    <div>Wed</div>
    <div>Thu</div>
    <div>Fri</div>
    <div>Sat</div>
  </div>

  <div className="mt-3 grid grid-cols-7 gap-2">
    {normalMonthDays.map((date, index) => {
      if (!date) {
        return (
          <div
            key={`blank-${index}`}
            className="min-h-24 rounded-2xl border border-transparent"
          />
        );
      }

      const checkIn = goal.normalCheckIns?.find(
        (item) => item.date === date
      );

      const isCompleted = checkIn?.completed || false;
      const isToday = date === todayString;

      return (
        <button
          key={date}
          onClick={() => toggleNormalDate(date)}
          className={
            isCompleted
              ? "min-h-24 rounded-2xl border border-emerald-400/40 bg-emerald-400/20 p-3 text-left"
              : isToday
              ? "min-h-24 rounded-2xl border border-blue-400/40 bg-blue-400/10 p-3 text-left"
              : "min-h-24 rounded-2xl border border-white/10 bg-black/40 p-3 text-left hover:bg-white/10"
          }
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white">
              {new Date(date).getDate()}
            </p>

            {isToday && (
              <span className="rounded-full bg-blue-400/20 px-2 py-0.5 text-[10px] font-semibold text-blue-200">
                Today
              </span>
            )}
          </div>

          <h4
            className={
              isCompleted
                ? "mt-3 text-sm font-bold text-emerald-200"
                : "mt-3 text-sm font-bold text-zinc-400"
            }
          >
            {isCompleted ? "✓ Done" : "Not Done"}
          </h4>

          {checkIn?.editedAt && (
            <p className="mt-2 text-[10px] text-zinc-500">
              Edited {new Date(checkIn.editedAt).toLocaleDateString()}
            </p>
          )}
        </button>
      );
    })}
  </div>
</div>
            </div>
          )}

          {goal.trackerType === "complex" && (
            <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
                <h2 className="text-3xl font-black">Complex AI Day Tracker</h2>

                <p className="mt-2 text-zinc-400">
                  Your learning day only moves forward when the current day is
                  completed. If you miss today, tomorrow will still show the same
                  active day.
                </p>

                {activeDayNotCompleted && (
                  <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-200">
                    Current Day {goal.activeDayNumber} is not completed yet. If
                    you do not complete it today, the next calendar day will still
                    continue from Day {goal.activeDayNumber}.
                  </div>
                )}
                {hasStreakBreak && activeDay && (
                  <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-5">
                    <h3 className="text-xl font-black text-red-200">
                      Streak Break Detected
                    </h3>

                    <p className="mt-2 text-red-100">
                      You missed Day {activeDay.dayNumber} on{" "}
                      {activeDayMissedDates.length} date
                      {activeDayMissedDates.length === 1 ? "" : "s"}. Your learning day will
                      not move forward until this active day is completed.
                    </p>

                    <div className="mt-4 space-y-3">
                      {activeDayMissedDates.map((missedDate) => (
                        <div
                          key={missedDate}
                          className="flex flex-col gap-3 rounded-xl border border-red-400/20 bg-black/30 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-white">
                              Missed: {new Date(missedDate).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-zinc-400">
                              You can recover this only if you honestly completed that day later.
                            </p>
                          </div>

                          <button
                            onClick={() => recoverMissedDate(activeDay.dayNumber, missedDate)}
                            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                          >
                            Mark Recovered
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeDay && (
                  <div className="mt-6 rounded-3xl border border-blue-400/30 bg-blue-400/10 p-6">
                    <p className="text-sm font-semibold text-blue-300">
                      Active Day {activeDay.dayNumber}
                    </p>

                    <h3 className="mt-2 text-2xl font-black">
                      {activeDay.title}
                    </h3>

                    <p className="mt-2 text-zinc-300">{activeDay.focus}</p>

                    <div className="mt-5 space-y-3">
                      {activeDay.tasks.map((task) => (
                        <label
                          key={task.id}
                          className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 hover:bg-black/60"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() =>
                              toggleComplexTask(activeDay.dayNumber, task.id)
                            }
                            className="mt-1 h-5 w-5"
                          />

                          <span
                            className={
                              task.completed
                                ? "text-zinc-500 line-through"
                                : "text-white"
                            }
                          >
                            {task.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <h3 className="text-xl font-bold">Full Plan Days</h3>

                  <div className="mt-4 space-y-4">
                    {goal.complexPlanDays?.map((day) => (
                      <div
                        key={day.dayNumber}
                        className={
                          day.dayNumber === goal.activeDayNumber
                            ? "rounded-2xl border border-blue-400/40 bg-blue-400/10 p-5"
                            : day.completed
                            ? "rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5"
                            : "rounded-2xl border border-white/10 bg-black/40 p-5"
                        }
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm text-zinc-400">
                              Day {day.dayNumber}
                            </p>

                            <h4 className="mt-1 text-xl font-bold">
                              {day.title}
                            </h4>

                            <p className="mt-2 text-zinc-400">{day.focus}</p>
                          </div>

                          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm">
                            {day.completed
                              ? "Completed"
                              : day.dayNumber === goal.activeDayNumber
                              ? "Active"
                              : "Locked / Upcoming"}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2">
                          {day.tasks.map((task) => (
                            <label
                              key={task.id}
                              className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
                            >
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() =>
                                  toggleComplexTask(day.dayNumber, task.id)
                                }
                                className="mt-1 h-4 w-4"
                              />

                              <span
                                className={
                                  task.completed
                                    ? "text-zinc-500 line-through"
                                    : "text-zinc-200"
                                }
                              >
                                {task.title}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-2xl font-black">Study Dashboard</h3>

                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-sm text-zinc-400">Active Learning Day</p>
                      <h4 className="mt-1 text-2xl font-bold">
                        Day {goal.activeDayNumber || 1}
                      </h4>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-sm text-zinc-400">Completed Days</p>
                      <h4 className="mt-1 text-2xl font-bold">
                        {completedComplexDays} / {totalComplexDays}
                      </h4>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-sm text-zinc-400">Missed Dates</p>
                      <h4 className="mt-1 text-2xl font-bold">
                        {activeDayMissedDates.length}
                      </h4>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="text-sm text-zinc-400">Daily Time</p>
                      <h4 className="mt-1 text-2xl font-bold">
                        {goal.dailyTime || "Not set"}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-2xl font-black">Current Level</h3>
                  <p className="mt-3 text-zinc-400">
                    {goal.currentLevel || "Not added"}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-2xl font-black">Target Result</h3>
                  <p className="mt-3 text-zinc-400">
                    {goal.targetResult || "Not added"}
                  </p>
                </div>

                {goal.latestTestResult && (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <h3 className="text-2xl font-black">Latest Weekly Test</h3>
                    <p className="mt-3 text-zinc-300">
                      {goal.latestTestResult}
                    </p>

                    {goal.latestTestDate && (
                      <p className="mt-2 text-sm text-zinc-500">
                        Saved on{" "}
                        {new Date(goal.latestTestDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
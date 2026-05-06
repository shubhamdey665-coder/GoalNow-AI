"use client";

import Link from "next/link";
import { useEffect,useRef, useState } from "react";
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
function addDaysToYMD(dateString: string, amount: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return formatDateToYMD(date);
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

function GoalPageFooter() {
  return (
    <footer className="border-t border-white/10 bg-black px-6 py-5 text-center text-xs text-zinc-500">
      © 2026 Powered by <span className="font-semibold text-zinc-300">GoalNow-AI</span>
    </footer>
  );
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
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement | null>(null);
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
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      actionMenuRef.current &&
      !actionMenuRef.current.contains(event.target as Node)
    ) {
      setIsActionMenuOpen(false);
    }
  }

  function handleEscapeKey(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setIsActionMenuOpen(false);
    }
  }

  if (isActionMenuOpen) {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
    document.removeEventListener("keydown", handleEscapeKey);
  };
}, [isActionMenuOpen]);

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

    if (date > getTodayString()) {
      setGoalError("Future dates cannot be marked. You can only mark today or past dates.");
      return;
    }

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

<main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-10">
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
<main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-10">
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

const todayString = getTodayString();
const yesterdayString = getYesterdayString();

const normalMonthDays = getMonthCalendarDays(normalCalendarDate);

const normalMonthPrefix = `${normalCalendarDate.getFullYear()}-${String(
  normalCalendarDate.getMonth() + 1
).padStart(2, "0")}`;

const normalMonthCheckIns =
  goal.normalCheckIns?.filter((item) =>
    item.date.startsWith(normalMonthPrefix)
  ) || [];

const normalMonthCompletedCount = normalMonthCheckIns.filter(
  (item) => item.completed
).length;

const normalMonthTrackableDays = normalMonthDays.filter(
  (date): date is string => typeof date === "string" && date <= todayString
);

const normalMonthTotalDays = normalMonthTrackableDays.length;

const normalMonthProgress =
  normalMonthTotalDays === 0
    ? 0
    : Math.round((normalMonthCompletedCount / normalMonthTotalDays) * 100);

const normalCompletedCount =
  goal.normalCheckIns?.filter((item) => item.completed).length || 0;

const normalCompletedDates =
  goal.normalCheckIns
    ?.filter((item) => item.completed)
    .map((item) => item.date)
    .sort() || [];

const lastNormalCompletedDate =
  normalCompletedDates.length > 0
    ? normalCompletedDates[normalCompletedDates.length - 1]
    : "";

const missedNormalDates =
  lastNormalCompletedDate && lastNormalCompletedDate < yesterdayString
    ? getDateRange(addDaysToYMD(lastNormalCompletedDate, 1), yesterdayString)
    : [];

const normalHasStreakBreak =
  goal.trackerType === "normal" &&
  missedNormalDates.length > 0 &&
  lastNormalCompletedDate !== todayString;

const complexPlanDays = goal.complexPlanDays || [];

const activeDay =
  goal.trackerType === "complex"
    ? complexPlanDays.find(
        (day) => day.dayNumber === (goal.activeDayNumber || 1)
      )
    : undefined;

const activeDayMissedDates = activeDay?.missedDates || [];

const hasStreakBreak =
  goal.trackerType === "complex" && activeDayMissedDates.length > 0;

const activeDayNotCompleted =
  goal.trackerType === "complex" && Boolean(activeDay && !activeDay.completed);

const totalComplexDays = complexPlanDays.length;

const completedComplexDays = complexPlanDays.filter(
  (day) => day.completed
).length;
const targetDateText = goal.targetDate
  ? new Date(goal.targetDate).toLocaleDateString()
  : "Not set";

const createdDateText = new Date(goal.createdAt).toLocaleDateString();

const updatedDateText = goal.updatedAt
  ? new Date(goal.updatedAt).toLocaleDateString()
  : "Not updated";

const trackerName =
  goal.trackerType === "normal" ? "Normal Tracker" : "Complex AI Tracker";

const trackerShortName =
  goal.trackerType === "normal" ? "Habit System" : "AI Roadmap";

const remainingComplexDays = Math.max(
  totalComplexDays - completedComplexDays,
  0
);

const priorityStyle =
  goal.priority === "High"
    ? "border-red-400/30 bg-red-400/10 text-red-200"
    : goal.priority === "Low"
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
    : "border-yellow-400/30 bg-yellow-400/10 text-yellow-200";

 
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-10">
        <section className="mx-auto max-w-6xl">
          <Link href="/dashboard" className="text-sm text-blue-300">
            ← Back to Dashboard
          </Link>
          {goalError && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {goalError}
            </div>
          )}

<div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40">
  {/* Hero Top */}
  <div className="relative p-6 md:p-8">
    <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
    <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={
              goal.trackerType === "normal"
                ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-300"
                : "rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-300"
            }
          >
            {trackerName}
          </span>

          <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${priorityStyle}`}>
            {goal.priority || "Medium"} Priority
          </span>

          <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-zinc-300">
            {goal.status || "active"}
          </span>
        </div>

        <p className="mt-5 text-sm font-bold text-cyan-300">
          {goal.category}
        </p>

        <h1 className="mt-2 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
          {goal.name}
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
          {goal.trackerType === "normal"
            ? "Track this goal with a simple calendar system, streak monitoring, future-day lock, and honest daily progress."
            : "Follow your active AI roadmap day, complete today’s tasks, recover missed dates, and use mentor, tests, and reports to improve."}
        </p>
      </div>

      {/* Action Menu */}
<div ref={actionMenuRef} className="relative flex shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={() => setIsActionMenuOpen((current) => !current)}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-lg shadow-black/20 transition hover:bg-white/20"
          aria-label="Open goal actions"
        >
          <span>Actions</span>
          <span className="text-lg leading-none">⋮</span>
        </button>

        {isActionMenuOpen && (
          <div className="absolute right-0 top-14 z-20 w-72 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-2 shadow-2xl shadow-black/60">
            <div className="border-b border-white/10 px-3 py-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                Goal Actions
              </p>
            </div>

            {goal.trackerType === "complex" && (
              <>
                <Link
                  href={`/goals/${goal.id}/mentor`}
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
                >
                  🤖 Ask AI Mentor
                </Link>

                <Link
                  href={`/goals/${goal.id}/test`}
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
                >
                  📝 Weekly Test
                </Link>

                <Link
                  href={`/goals/${goal.id}/weekly-dashboard`}
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
                >
                  📅 Weekly Dashboard
                </Link>

                <Link
                  href={`/goals/${goal.id}/report`}
                  className="block rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
                >
                  📊 Progress Report
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsActionMenuOpen(false);
                    downloadPlanPdf();
                  }}
                  className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
                >
                  ⬇️ Download Plan PDF
                </button>
              </>
            )}

            <Link
              href={`/goals/${goal.id}/edit`}
              className="block rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
            >
              ✏️ Edit Goal
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsActionMenuOpen(false);
                exportGoalSummary();
              }}
              className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-zinc-100 transition hover:bg-white/10"
            >
              📋 Export Summary
            </button>

            <div className="mt-2 border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsActionMenuOpen(false);
                  deleteGoal();
                }}
                className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-300 transition hover:bg-red-400/10"
              >
                🗑️ Delete Goal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Progress */}
    <div className="relative mt-8">
      <div className="mb-3 flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold text-zinc-400">Overall Progress</span>
        <span className="font-black text-white">{progressPercentage}%</span>
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-white/10">
        <div
          className={
            goal.trackerType === "normal"
              ? "h-full rounded-full bg-emerald-400 transition-all"
              : "h-full rounded-full bg-cyan-400 transition-all"
          }
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  </div>

  {/* Stats Grid */}
  <div className="grid border-t border-white/10 bg-black/20 sm:grid-cols-2 lg:grid-cols-4">
    <div className="border-white/10 p-5 sm:border-r">
      <p className="text-sm text-zinc-500">Tracker Type</p>
      <h2 className="mt-2 text-xl font-black text-white">{trackerShortName}</h2>
    </div>

    <div className="border-white/10 p-5 lg:border-r">
      <p className="text-sm text-zinc-500">Duration</p>
      <h2 className="mt-2 text-xl font-black text-white">{goal.duration}</h2>
    </div>

    <div className="border-white/10 p-5 sm:border-r lg:border-r">
      <p className="text-sm text-zinc-500">Target Date</p>
      <h2 className="mt-2 text-xl font-black text-white">{targetDateText}</h2>
    </div>

    <div className="p-5">
      <p className="text-sm text-zinc-500">Last Updated</p>
      <h2 className="mt-2 text-xl font-black text-white">{updatedDateText}</h2>
    </div>
  </div>

  {/* Tracker Specific Quick Stats */}
  <div className="grid gap-4 border-t border-white/10 p-5 md:grid-cols-3">
    {goal.trackerType === "normal" ? (
      <>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Current Streak</p>
          <h3 className="mt-2 text-2xl font-black text-emerald-300">
            {getNormalStreak()} days
          </h3>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Completed Days</p>
          <h3 className="mt-2 text-2xl font-black text-white">
            {normalCompletedCount}
          </h3>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">This Month</p>
          <h3 className="mt-2 text-2xl font-black text-cyan-300">
            {normalMonthProgress}%
          </h3>
        </div>
      </>
    ) : (
      <>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Active Day</p>
          <h3 className="mt-2 text-2xl font-black text-cyan-300">
            Day {goal.activeDayNumber || 1}
          </h3>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Completed Days</p>
          <h3 className="mt-2 text-2xl font-black text-white">
            {completedComplexDays}/{totalComplexDays}
          </h3>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-zinc-400">Remaining Days</p>
          <h3 className="mt-2 text-2xl font-black text-blue-300">
            {remainingComplexDays}
          </h3>
        </div>
      </>
    )}
  </div>

  <div className="border-t border-white/10 px-5 py-4 text-xs text-zinc-500">
    Created on {createdDateText}
  </div>
</div>

          {goal.trackerType === "normal" && (
  <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl md:p-8">
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-sm font-bold text-cyan-300">Normal Habit Tracker</p>

        <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
          Calendar Progress
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
          Mark your daily habit only for today or past dates. Future dates are
          locked so your progress stays honest.
        </p>
      </div>

      <div
        className={
          normalHasStreakBreak
            ? "rounded-3xl border border-red-400/30 bg-red-400/10 px-5 py-4"
            : "rounded-3xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4"
        }
      >
        <p
          className={
            normalHasStreakBreak
              ? "text-sm font-semibold text-red-200"
              : "text-sm font-semibold text-emerald-300"
          }
        >
          Current Streak
        </p>

        <h3 className="mt-1 text-3xl font-black text-white">
          {getNormalStreak()} days
        </h3>

        <p className="mt-1 text-xs text-zinc-400">
          {normalHasStreakBreak ? "Streak needs recovery" : "Keep going"}
        </p>
      </div>
    </div>

    {normalHasStreakBreak && (
      <div className="mt-6 rounded-3xl border border-red-400/30 bg-red-400/10 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-xl font-black text-red-200">
              Streak Break Detected
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-100">
              Your last completed date was{" "}
              <span className="font-bold">
                {new Date(lastNormalCompletedDate).toLocaleDateString()}
              </span>
              . You missed {missedNormalDates.length} day
              {missedNormalDates.length === 1 ? "" : "s"} after that.
            </p>
          </div>

          <button
            type="button"
            onClick={goToCurrentMonth}
            className="w-fit rounded-2xl border border-red-300/30 bg-red-300/10 px-4 py-3 text-sm font-bold text-red-100 transition hover:bg-red-300/20"
          >
            Go to Today
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {missedNormalDates.slice(0, 10).map((missedDate) => (
            <span
              key={missedDate}
              className="rounded-full border border-red-300/20 bg-black/30 px-3 py-1 text-xs font-semibold text-red-100"
            >
              {new Date(missedDate).toLocaleDateString()}
            </span>
          ))}

          {missedNormalDates.length > 10 && (
            <span className="rounded-full border border-red-300/20 bg-black/30 px-3 py-1 text-xs font-semibold text-red-100">
              +{missedNormalDates.length - 10} more
            </span>
          )}
        </div>
      </div>
    )}

    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
        <p className="text-sm text-zinc-400">Target</p>
        <h3 className="mt-2 line-clamp-2 text-lg font-black text-white">
          {goal.normalTarget || goal.name}
        </h3>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
        <p className="text-sm text-zinc-400">Frequency</p>
        <h3 className="mt-2 text-lg font-black capitalize text-white">
          {goal.normalFrequency || "daily"}
        </h3>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
        <p className="text-sm text-zinc-400">Completed</p>
        <h3 className="mt-2 text-lg font-black text-white">
          {normalCompletedCount} days
        </h3>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
        <p className="text-sm text-zinc-400">This Month</p>
        <h3 className="mt-2 text-lg font-black text-white">
          {normalMonthProgress}%
        </h3>
      </div>
    </div>

    <div className="mt-8 rounded-[2rem] border border-white/10 bg-slate-950/60 p-3 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-black text-white md:text-2xl">
            {getMonthTitle(normalCalendarDate)}
          </h3>

          <p className="mt-1 text-xs text-zinc-500 md:text-sm">
            Tap a day to mark it. Future days are locked.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 md:px-4 md:py-3 md:text-sm"
          >
            Previous
          </button>

          <button
            type="button"
            onClick={goToCurrentMonth}
            className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20 md:px-4 md:py-3 md:text-sm"
          >
            Today
          </button>

          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 md:px-4 md:py-3 md:text-sm"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-3 md:p-4">
          <p className="text-[11px] text-zinc-500 md:text-sm">Done</p>
          <h4 className="mt-1 text-lg font-black text-emerald-300 md:text-2xl">
            {normalMonthCompletedCount}
          </h4>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-3 md:p-4">
          <p className="text-[11px] text-zinc-500 md:text-sm">Trackable</p>
          <h4 className="mt-1 text-lg font-black text-white md:text-2xl">
            {normalMonthTotalDays}
          </h4>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-3 md:p-4">
          <p className="text-[11px] text-zinc-500 md:text-sm">Progress</p>
          <h4 className="mt-1 text-lg font-black text-cyan-300 md:text-2xl">
            {normalMonthProgress}%
          </h4>
        </div>
      </div>

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all"
          style={{ width: `${normalMonthProgress}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-zinc-500 sm:gap-2 sm:text-xs">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
        {normalMonthDays.map((date, index) => {
          if (!date) {
            return (
              <div
                key={`blank-${index}`}
                className="min-h-14 rounded-xl border border-transparent sm:min-h-24"
              />
            );
          }

          const checkIn = goal.normalCheckIns?.find(
            (item) => item.date === date
          );

          const isCompleted = checkIn?.completed || false;
          const isToday = date === todayString;
          const isFutureDate = date > todayString;
          const isMissedDate = missedNormalDates.includes(date);

          return (
            <button
              key={date}
              type="button"
              disabled={isFutureDate}
              onClick={() => toggleNormalDate(date)}
              title={
                isFutureDate
                  ? "Future date is locked"
                  : isCompleted
                  ? "Marked completed"
                  : isMissedDate
                  ? "Missed day"
                  : "Tap to mark completed"
              }
              className={
                isFutureDate
                  ? "min-h-14 cursor-not-allowed rounded-xl border border-white/5 bg-white/[0.03] p-1.5 text-left opacity-45 sm:min-h-24 sm:rounded-2xl sm:p-3"
                  : isCompleted
                  ? "min-h-14 rounded-xl border border-emerald-400/40 bg-emerald-400/20 p-1.5 text-left shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-400/25 sm:min-h-24 sm:rounded-2xl sm:p-3"
                  : isMissedDate
                  ? "min-h-14 rounded-xl border border-red-400/40 bg-red-400/10 p-1.5 text-left transition hover:bg-red-400/15 sm:min-h-24 sm:rounded-2xl sm:p-3"
                  : isToday
                  ? "min-h-14 rounded-xl border border-cyan-400/50 bg-cyan-400/10 p-1.5 text-left ring-1 ring-cyan-400/20 transition hover:bg-cyan-400/15 sm:min-h-24 sm:rounded-2xl sm:p-3"
                  : "min-h-14 rounded-xl border border-white/10 bg-black/30 p-1.5 text-left transition hover:bg-white/10 sm:min-h-24 sm:rounded-2xl sm:p-3"
              }
            >
              <div className="flex items-start justify-between gap-1">
                <p
                  className={
                    isFutureDate
                      ? "text-xs font-black text-zinc-600 sm:text-sm"
                      : "text-xs font-black text-white sm:text-sm"
                  }
                >
                  {new Date(date).getDate()}
                </p>

                {isToday && (
                  <span className="hidden rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200 sm:inline">
                    Today
                  </span>
                )}
              </div>

              <div className="mt-2 sm:mt-4">
                {isCompleted ? (
                  <p className="text-[10px] font-black text-emerald-200 sm:text-sm">
                    ✓ Done
                  </p>
                ) : isFutureDate ? (
                  <p className="text-[10px] font-bold text-zinc-600 sm:text-sm">
                    Locked
                  </p>
                ) : isMissedDate ? (
                  <p className="text-[10px] font-black text-red-200 sm:text-sm">
                    Missed
                  </p>
                ) : isToday ? (
                  <p className="text-[10px] font-black text-cyan-200 sm:text-sm">
                    Today
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-zinc-500 sm:text-sm">
                    Empty
                  </p>
                )}
              </div>

              {checkIn?.editedAt && (
                <p className="mt-1 hidden text-[10px] text-zinc-500 sm:block">
                  Edited {new Date(checkIn.editedAt).toLocaleDateString()}
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          Done
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          <span className="h-3 w-3 rounded-full bg-cyan-400" />
          Today
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          Streak missed
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
          <span className="h-3 w-3 rounded-full bg-zinc-600" />
          Future locked
        </div>
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

                <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Full Plan</h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        Hidden by default to keep this goal page clean. Open it only when you need to review all days.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowFullPlan((current) => !current)}
                      className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
                    >
                      {showFullPlan ? "Hide Full Plan" : "View Full Plan"}
                    </button>
                  </div>

                  {!showFullPlan && (
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-zinc-400">Completed</p>
                        <h4 className="mt-1 text-2xl font-black">
                          {completedComplexDays}/{totalComplexDays}
                        </h4>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-zinc-400">Active</p>
                        <h4 className="mt-1 text-2xl font-black">
                          Day {goal.activeDayNumber || 1}
                        </h4>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-zinc-400">Remaining</p>
                        <h4 className="mt-1 text-2xl font-black">
                          {Math.max(totalComplexDays - completedComplexDays, 0)} days
                        </h4>
                      </div>
                    </div>
                  )}

                  {showFullPlan && (
                    <div className="mt-5 max-h-[520px] space-y-3 overflow-y-auto pr-2">
                      {goal.complexPlanDays?.map((day) => {
                        const completedTasks = day.tasks.filter((task) => task.completed).length;
                        const totalTasks = day.tasks.length;

                        return (
                          <details
                            key={day.dayNumber}
                            open={day.dayNumber === goal.activeDayNumber}
                            className={
                              day.dayNumber === goal.activeDayNumber
                                ? "rounded-2xl border border-blue-400/40 bg-blue-400/10 p-4"
                                : day.completed
                                ? "rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4"
                                : "rounded-2xl border border-white/10 bg-black/40 p-4"
                            }
                          >
                            <summary className="cursor-pointer list-none">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-sm text-zinc-400">Day {day.dayNumber}</p>
                                  <h4 className="mt-1 font-bold text-white">{day.title}</h4>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-zinc-300">
                                    {completedTasks}/{totalTasks} tasks
                                  </span>
                                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-zinc-300">
                                    {day.completed
                                      ? "Completed"
                                      : day.dayNumber === goal.activeDayNumber
                                      ? "Active"
                                      : "Upcoming"}
                                  </span>
                                </div>
                              </div>
                            </summary>

                            <p className="mt-3 text-sm text-zinc-400">{day.focus}</p>

                            <div className="mt-4 space-y-2">
                              {day.tasks.map((task) => (
                                <label
                                  key={task.id}
                                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/30 p-3"
                                >
                                  <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => toggleComplexTask(day.dayNumber, task.id)}
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
                          </details>
                        );
                      })}
                    </div>
                  )}
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
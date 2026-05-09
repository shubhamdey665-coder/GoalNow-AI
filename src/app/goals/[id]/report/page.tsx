"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getGoalByIdFromSupabase } from "@/lib/goals/supabaseGoals";
import { downloadReportPdf } from "@/lib/exportReportPdf";
import type { Goal } from "@/types/goal";

type ReportData = {
  total: number;
  completed: number;
  pending: number;
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
};

type AiReport = {
  summary: string;
  progressFeedback: string;
  weakAreas: string[];
  nextActions: string[];
  weeklyRecommendation: string;
};

type RealDateProgressPoint = {
  date: string;
  percentage: number;
  completedDayUnits: number;
  completedTaskCount: number;
  ownDayNumbers: number[];
  isToday: boolean;
  isPast: boolean;
};

type TargetPrediction = {
  targetDate: string;
  remainingDays: number;
  remainingPlanDays: number;
  requiredDaysPerDay: number;
  currentSpeed: number;
  isOnTrack: boolean;
  message: string;
  suggestion: string;
};

function getFallbackAiReport(goal: Goal, reportData: ReportData): AiReport {
  if (goal.trackerType === "normal") {
    if (reportData.progressPercentage >= 80) {
      return {
        summary:
          "Your normal tracker consistency is strong. You are following the habit well.",
        progressFeedback:
          "Keep the same habit difficulty for now. After one more strong week, you can increase the target slowly.",
        weakAreas: [
          "Maintain consistency",
          "Avoid over-increasing the target",
          "Keep honest ticking",
        ],
        nextActions: [
          "Tick today's habit",
          "Review last 7 days",
          "Increase target only after stable consistency",
        ],
        weeklyRecommendation:
          "Keep this tracker simple and focus on daily completion.",
      };
    }

    return {
      summary:
        "Your normal tracker progress is still building. Start with small, easy wins.",
      progressFeedback:
        "Do not make the habit too hard. A small completed habit is better than a big skipped habit.",
      weakAreas: ["Daily consistency", "Habit simplicity", "Regular tracking"],
      nextActions: [
        "Tick today's habit",
        "Make the target easier if needed",
        "Check progress again after 7 days",
      ],
      weeklyRecommendation:
        "Use a very small target this week and build momentum.",
    };
  }

  if (reportData.progressPercentage >= 80) {
    return {
      summary:
        "Your complex goal progress is strong. You are ready for slightly harder tasks.",
      progressFeedback:
        "You are completing plan days well. Keep revision and tests active so that progress becomes real skill.",
      weakAreas: [
        "Need regular revision",
        "Need harder weekly test",
        "Need project-based practice",
      ],
      nextActions: [
        "Complete the current active day",
        "Take or review the weekly test",
        "Add one harder practice task next week",
      ],
      weeklyRecommendation:
        "Increase difficulty slightly and include revision plus a realistic weekly test.",
    };
  }

  if (reportData.progressPercentage >= 40) {
    return {
      summary:
        "You have started well, but consistency and completion need improvement.",
      progressFeedback:
        "Do not rush to future days. Complete the current active day properly and revise weak areas.",
      weakAreas: [
        "Incomplete active days",
        "Irregular revision",
        "Need more focused practice",
      ],
      nextActions: [
        "Finish pending tasks in the active day",
        "Revise one weak topic",
        "Take a short self-check test",
      ],
      weeklyRecommendation:
        "Keep the next week realistic. Complete fewer tasks but finish them properly.",
    };
  }

  return {
    summary:
      "Progress is low or not started yet. The plan may be too heavy right now.",
    progressFeedback:
      "Start with one small action today. The learning day should not move forward until the active day is completed.",
    weakAreas: ["Starting consistency", "Task completion", "Routine stability"],
    nextActions: [
      "Complete one pending task today",
      "Reduce daily load if needed",
      "Continue from the current active day",
    ],
    weeklyRecommendation:
      "Make this week lighter and focus only on rebuilding consistency.",
  };
}

function getProgressStatus(progressPercentage: number) {
  if (progressPercentage >= 85) {
    return {
      label: "Excellent",
      color: "text-emerald-200",
      border: "border-emerald-400/25",
      bg: "bg-emerald-400/10",
      message: "You are performing strongly. Keep the rhythm stable.",
    };
  }

  if (progressPercentage >= 60) {
    return {
      label: "Good",
      color: "text-blue-200",
      border: "border-blue-400/25",
      bg: "bg-blue-400/10",
      message: "You are moving well. Improve consistency and revision.",
    };
  }

  if (progressPercentage >= 35) {
    return {
      label: "Needs Focus",
      color: "text-yellow-200",
      border: "border-yellow-400/25",
      bg: "bg-yellow-400/10",
      message: "Progress has started, but the plan needs more discipline.",
    };
  }

  return {
    label: "At Risk",
    color: "text-red-200",
    border: "border-red-400/25",
    bg: "bg-red-400/10",
    message: "Start with smaller actions and rebuild consistency first.",
  };
}

function getDateLabel(dateString?: string) {
  if (!dateString) return "Not available";

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDateKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDaysToDate(dateInput: Date, amount: number) {
  const date = new Date(dateInput);
  date.setDate(date.getDate() + amount);
  return date;
}

function getStartOfDay(dateInput: string | Date) {
  const date = new Date(dateInput);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getDaysBetween(startDate: Date, endDate: Date) {
  const start = getStartOfDay(startDate);
  const end = getStartOfDay(endDate);

  return Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function getMonthStart(dateInput: Date) {
  const date = new Date(dateInput);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getMonthEnd(dateInput: Date) {
  const date = new Date(dateInput);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getMonthLabel(dateInput: Date) {
  return dateInput.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function getShortDateForGraph(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function getFullDateForGraph(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function getGraphTicks(topPercentage: number) {
  const safeTop = Math.max(100, topPercentage);
  const ticks: number[] = [];

  for (let value = safeTop; value >= 0; value -= 100) {
    ticks.push(value);
  }

  if (!ticks.includes(0)) {
    ticks.push(0);
  }

  return ticks;
}
function getCompletedDayLabel(dayNumbers: number[]) {
  if (dayNumbers.length === 0) return "";

  if (dayNumbers.length === 1) {
    return `Day ${dayNumbers[0]}`;
  }

  if (dayNumbers.length <= 3) {
    return `Day ${dayNumbers.join(", ")}`;
  }

  return `Day ${dayNumbers[0]}-${dayNumbers[dayNumbers.length - 1]}`;
}

function getGoalTargetDate(goal: Goal) {
  const goalWithPossibleTargetDate = goal as Goal & {
    targetDate?: string;
    deadline?: string;
  };

  if (goalWithPossibleTargetDate.targetDate) {
    return getStartOfDay(goalWithPossibleTargetDate.targetDate);
  }

  if (goalWithPossibleTargetDate.deadline) {
    return getStartOfDay(goalWithPossibleTargetDate.deadline);
  }

  const createdAt = getStartOfDay(goal.createdAt);

  if (goal.trackerType === "complex") {
    const totalPlanDays = goal.complexPlanDays?.length || 1;
    return addDaysToDate(createdAt, totalPlanDays - 1);
  }

  const totalNormalDays = goal.normalCheckIns?.length || 1;
  return addDaysToDate(createdAt, totalNormalDays - 1);
}

function getRealDateProgressPoints(goal: Goal): RealDateProgressPoint[] {
  const createdAt = getStartOfDay(goal.createdAt);
  const today = getStartOfDay(new Date());
  const targetDate = getGoalTargetDate(goal);

  let lastDate = targetDate > today ? targetDate : today;

  if (goal.trackerType === "complex") {
    for (const planDay of goal.complexPlanDays || []) {
      for (const task of planDay.tasks) {
        if (!task.completedAt) continue;

        const completedDate = getStartOfDay(task.completedAt);

        if (completedDate > lastDate) {
          lastDate = completedDate;
        }
      }
    }
  }

  if (goal.trackerType === "normal") {
    for (const checkIn of goal.normalCheckIns || []) {
      const checkInWithDates = checkIn as typeof checkIn & {
        completedAt?: string;
        date?: string;
      };

      const dateValue = checkInWithDates.completedAt || checkInWithDates.date;

      if (!dateValue) continue;

      const completedDate = getStartOfDay(dateValue);

      if (completedDate > lastDate) {
        lastDate = completedDate;
      }
    }
  }

  const totalDates = getDaysBetween(createdAt, lastDate) + 1;

  const points: RealDateProgressPoint[] = Array.from(
    { length: totalDates },
    (_, index) => {
      const date = addDaysToDate(createdAt, index);
      const dateKey = getDateKeyFromDate(date);

      return {
        date: dateKey,
        percentage: 0,
        completedDayUnits: 0,
        completedTaskCount: 0,
        ownDayNumbers: [],
        isToday: dateKey === getDateKeyFromDate(today),
        isPast: date < today,
      };
    }
  );

  const pointMap = new Map(points.map((point) => [point.date, point]));

  if (goal.trackerType === "complex") {
    for (const planDay of goal.complexPlanDays || []) {
      const totalTasksInDay = planDay.tasks.length || 1;

      for (const task of planDay.tasks) {
        if (!task.completedAt) continue;

        const completedDateKey = getDateKeyFromDate(new Date(task.completedAt));
        const point = pointMap.get(completedDateKey);

        if (!point) continue;

        const taskDayUnit = 100 / totalTasksInDay;

        point.percentage += taskDayUnit;
        point.completedDayUnits += taskDayUnit / 100;
        point.completedTaskCount += 1;

        if (!point.ownDayNumbers.includes(planDay.dayNumber)) {
          point.ownDayNumbers.push(planDay.dayNumber);
        }
      }
    }
  }

  if (goal.trackerType === "normal") {
    for (const checkIn of goal.normalCheckIns || []) {
      if (!checkIn.completed) continue;

      const checkInWithDates = checkIn as typeof checkIn & {
        completedAt?: string;
        date?: string;
      };

      const dateValue = checkInWithDates.completedAt || checkInWithDates.date;

      if (!dateValue) continue;

      const completedDateKey = getDateKeyFromDate(new Date(dateValue));
      const point = pointMap.get(completedDateKey);

      if (!point) continue;

      point.percentage += 100;
      point.completedDayUnits += 1;
      point.completedTaskCount += 1;
    }
  }

  return points.map((point) => ({
    ...point,
    percentage: Math.round(point.percentage),
    completedDayUnits: Number(point.completedDayUnits.toFixed(2)),
    ownDayNumbers: point.ownDayNumbers.sort((a, b) => a - b),
  }));
}

function getVisibleDateProgressPoints(
  allPoints: RealDateProgressPoint[],
  mode: "month" | "full",
  selectedMonth: Date
) {
  if (mode === "full") {
    return allPoints;
  }

  const monthStart = getMonthStart(selectedMonth);
  const monthEnd = getMonthEnd(selectedMonth);

  return allPoints.filter((point) => {
    const date = getStartOfDay(point.date);
    return date >= monthStart && date <= monthEnd;
  });
}

function getTargetPrediction(
  goal: Goal,
  progressPoints: RealDateProgressPoint[]
): TargetPrediction {
  const today = getStartOfDay(new Date());
  const targetDate = getGoalTargetDate(goal);

  const completedDayUnits = progressPoints.reduce(
    (total, point) => total + point.completedDayUnits,
    0
  );

  const totalPlanDays =
    goal.trackerType === "complex"
      ? goal.complexPlanDays?.length || 0
      : goal.normalCheckIns?.length || 0;

  const remainingPlanDays = Math.max(
    0,
    Math.ceil(totalPlanDays - completedDayUnits)
  );

  const remainingDays = Math.max(0, getDaysBetween(today, targetDate) + 1);

  const requiredDaysPerDay =
    remainingDays === 0
      ? remainingPlanDays
      : Number((remainingPlanDays / remainingDays).toFixed(2));

  const createdAt = getStartOfDay(goal.createdAt);
  const daysSinceCreation = Math.max(1, getDaysBetween(createdAt, today) + 1);

  const currentSpeed = Number(
    (completedDayUnits / daysSinceCreation).toFixed(2)
  );

  const isOnTrack =
    remainingPlanDays === 0 ||
    (remainingDays > 0 && currentSpeed >= requiredDaysPerDay);

  let message = "You are on track to complete the plan on time.";
  let suggestion =
    "Keep your current pace and continue completing the active day properly.";

  if (remainingPlanDays === 0) {
    message = "You have completed the planned workload.";
    suggestion = "Use the remaining time for revision, tests, and improvement.";
  } else if (remainingDays <= 0) {
    message = "The target date has arrived or passed.";
    suggestion =
      "Extend the target date or increase daily completion carefully with a smaller recovery plan.";
  } else if (!isOnTrack) {
    message =
      "At your current speed, you may not complete the plan by target date.";
    suggestion = `You need around ${requiredDaysPerDay} plan day(s) per day. Your current average speed is ${currentSpeed} plan day(s) per day, so complete today's active day first, then add catch-up work slowly.`;
  }

  return {
    targetDate: getDateKeyFromDate(targetDate),
    remainingDays,
    remainingPlanDays,
    requiredDaysPerDay,
    currentSpeed,
    isOnTrack,
    message,
    suggestion,
  };
}

export default function ReportPage() {
  const params = useParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [reportError, setReportError] = useState("");
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportSource, setReportSource] = useState<"gemini" | "fallback">(
    "fallback"
  );
  const [durationGraphMode, setDurationGraphMode] = useState<"month" | "full">(
    "month"
  );
  const [selectedGraphMonth, setSelectedGraphMonth] = useState<Date>(
    new Date()
  );

  useEffect(() => {
    let isMounted = true;

    async function loadGoal() {
      setIsLoadingGoal(true);
      setReportError("");

      try {
        const foundGoal = await getGoalByIdFromSupabase(goalId);

        if (!isMounted) return;

        if (!foundGoal) {
          setGoal(null);
          setReportError("Goal not found.");
          return;
        }

        setGoal(foundGoal);
        setSelectedGraphMonth(new Date(foundGoal.createdAt));

        const localReportData = getReportDataFromGoal(foundGoal);
        setAiReport(getFallbackAiReport(foundGoal, localReportData));
      } catch (error) {
        if (!isMounted) return;

        setGoal(null);
        setReportError(
          error instanceof Error ? error.message : "Could not load report."
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

  function getReportDataFromGoal(currentGoal: Goal): ReportData {
    if (currentGoal.trackerType === "normal") {
      const checkIns = currentGoal.normalCheckIns || [];
      const completed = checkIns.filter((item) => item.completed).length;
      const total = checkIns.length;
      const pending = total - completed;
      const progressPercentage =
        total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        total,
        completed,
        pending,
        progressPercentage,
        totalTasks: total,
        completedTasks: completed,
      };
    }

    const planDays = currentGoal.complexPlanDays || [];
    const completedDays = planDays.filter((day) => day.completed).length;
    const totalDays = planDays.length;
    const pendingDays = totalDays - completedDays;

    const allTasks = planDays.flatMap((day) => day.tasks);
    const completedTasks = allTasks.filter((task) => task.completed).length;

    const progressPercentage =
      totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100);

    return {
      total: totalDays,
      completed: completedDays,
      pending: pendingDays,
      progressPercentage,
      totalTasks: allTasks.length,
      completedTasks,
    };
  }

  async function generateGeminiReport(currentGoal: Goal) {
    setIsGeneratingReport(true);
    setReportSource("fallback");

    const reportData = getReportDataFromGoal(currentGoal);

    const activeDay = currentGoal.complexPlanDays?.find(
      (day) => day.dayNumber === currentGoal.activeDayNumber
    );

    const activeDayText = activeDay
      ? `Day ${activeDay.dayNumber}: ${activeDay.title} - ${activeDay.focus}`
      : "Not available";

    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalName: currentGoal.name,
          category: currentGoal.category,
          trackerType: currentGoal.trackerType,
          duration: currentGoal.duration,
          dailyTime: currentGoal.dailyTime,
          currentLevel: currentGoal.currentLevel,
          targetResult: currentGoal.targetResult,
          progressPercentage: reportData.progressPercentage,
          completed: reportData.completed,
          total: reportData.total,
          activeDayText,
          latestTestResult: currentGoal.latestTestResult,
        }),
      });

      const data = await response.json();

      if (response.ok && data.report) {
        setAiReport(data.report);
        setReportSource("gemini");
      } else {
        console.warn("Gemini report failed, using fallback report:", data.error);
      }
    } catch (error) {
      console.warn("Gemini report failed, using fallback report:", error);
    }

    setIsGeneratingReport(false);
  }

  if (isLoadingGoal) {
    return (
      <>
        <Navbar />

        <main className="goalnow-page min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_35%,#000000_100%)] py-5 text-white md:py-10">
          <section className="goalnow-container">
            <Link href="/dashboard" className="text-sm text-blue-300">
              ← Back to Dashboard
            </Link>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-blue-950/30 backdrop-blur md:mt-8 md:rounded-[2rem] md:p-10">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <h1 className="text-2xl font-black md:text-3xl">
                Loading report...
              </h1>
              <p className="mt-3 text-zinc-400">
                Fetching progress report from your Supabase account.
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

        <main className="goalnow-page min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_35%,#000000_100%)] py-5 text-white md:py-10">
          <section className="goalnow-container">
            <Link href="/dashboard" className="text-sm text-blue-300">
              ← Back to Dashboard
            </Link>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-blue-950/30 backdrop-blur md:mt-8 md:rounded-[2rem] md:p-10">
              <h1 className="text-2xl font-black md:text-3xl">
                Goal not found
              </h1>
              <p className="mt-3 text-zinc-400">
                {reportError || "This report page needs a saved goal first."}
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  const reportData = getReportDataFromGoal(goal);
  const status = getProgressStatus(reportData.progressPercentage);

  const activeDay = goal.complexPlanDays?.find(
    (day) => day.dayNumber === goal.activeDayNumber
  );

  const taskPercentage =
    reportData.totalTasks === 0
      ? 0
      : Math.round((reportData.completedTasks / reportData.totalTasks) * 100);

  const pendingTasks =
    goal.trackerType === "complex"
      ? activeDay?.tasks.filter((task) => !task.completed) || []
      : [];

  const realDateProgressPoints = getRealDateProgressPoints(goal);

  const visibleDateProgressPoints = getVisibleDateProgressPoints(
    realDateProgressPoints,
    durationGraphMode,
    selectedGraphMonth
  );

  const targetPrediction = getTargetPrediction(goal, realDateProgressPoints);

  const visibleTotalPercentage = visibleDateProgressPoints.reduce(
    (total, point) => total + point.percentage,
    0
  );

  const visibleAveragePercentage =
    visibleDateProgressPoints.length === 0
      ? 0
      : Math.round(visibleTotalPercentage / visibleDateProgressPoints.length);

  const visibleBestDay = [...visibleDateProgressPoints].sort(
    (a, b) => b.percentage - a.percentage
  )[0];

  const visibleSkippedDays = visibleDateProgressPoints.filter(
    (point) => point.isPast && point.percentage === 0
  ).length;

  const visibleCatchUpDays = visibleDateProgressPoints.filter(
    (point) => point.percentage > 100
  ).length;

  const visibleMaxPercentage = Math.max(
    100,
    ...visibleDateProgressPoints.map((point) => point.percentage)
  );

  const visibleGraphTopPercentage =
    Math.ceil(visibleMaxPercentage / 100) * 100;
  const graphTicks = getGraphTicks(visibleGraphTopPercentage);

  const monthGraphWidth = Math.max(
  360,
  visibleDateProgressPoints.length * 58
);

const fullDurationGraphWidth = Math.max(
  900,
  visibleDateProgressPoints.length * 28
);

const graphWidth =
  durationGraphMode === "month" ? monthGraphWidth : fullDurationGraphWidth;

  return (
    <>
      <Navbar />

      <main className="goalnow-page min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_35%,#000000_100%)] py-5 text-white md:py-10">
        <section className="goalnow-container">
          <Link href={`/goals/${goal.id}`} className="text-sm text-blue-300">
            ← Back to Goal
          </Link>

          {reportError && (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {reportError}
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-blue-950/30 backdrop-blur md:mt-8 md:rounded-[2rem]">
            <div className="border-b border-white/10 bg-white/[0.03] p-4 md:p-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300 md:tracking-[0.3em]">
                    GoalNow AI Progress Report
                  </p>

                  <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                    {goal.name}
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400 md:mt-4 md:text-base md:leading-7">
                    A professional report for your progress, completion quality,
                    weak areas, active plan status, and next best action.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span
                      className={
                        goal.trackerType === "normal"
                          ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"
                          : "rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-300"
                      }
                    >
                      {goal.trackerType === "normal"
                        ? "Normal Tracker"
                        : "Complex AI Tracker"}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${status.border} ${status.bg} ${status.color}`}
                    >
                      Status: {status.label}
                    </span>

                    <span
                      className={
                        reportSource === "gemini"
                          ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"
                          : "rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300"
                      }
                    >
                      {reportSource === "gemini"
                        ? "Gemini Report"
                        : "Smart Fallback Report"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/30 p-4 sm:flex-row xl:flex-col">
                  <button
                    type="button"
                    onClick={() => void generateGeminiReport(goal)}
                    disabled={isGeneratingReport}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingReport
                      ? "Generating..."
                      : "Generate AI Report"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      downloadReportPdf(
                        goal,
                        reportData,
                        aiReport,
                        reportSource
                      )
                    }
                    className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="border-b border-white/10 p-3 md:p-8">
              <div className="rounded-3xl border border-white/10 bg-black/35 p-4 md:rounded-[2rem] md:p-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                      Total Duration Progress
                    </p>

                    <h2 className="mt-3 text-2xl font-black md:text-3xl">
                      Date vs Completion Percentage
                    </h2>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
                      This graph starts from your goal creation date, but
                      progress is counted only on the exact date when you
                      completed tasks. If you complete Day 2 and Day 3 together
                      on one date, that date shows 200%.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                    <button
                      type="button"
                      onClick={() => setDurationGraphMode("month")}
                      className={
                        durationGraphMode === "month"
                          ? "rounded-xl bg-white px-4 py-2 text-xs font-black text-black"
                          : "rounded-xl px-4 py-2 text-xs font-black text-zinc-300 hover:bg-white/10"
                      }
                    >
                      Month View
                    </button>

                    <button
                      type="button"
                      onClick={() => setDurationGraphMode("full")}
                      className={
                        durationGraphMode === "full"
                          ? "rounded-xl bg-white px-4 py-2 text-xs font-black text-black"
                          : "rounded-xl px-4 py-2 text-xs font-black text-zinc-300 hover:bg-white/10"
                      }
                    >
                      Full Duration
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <p className="text-xs text-emerald-100/70">Average</p>
                    <h3 className="mt-1 text-2xl font-black text-emerald-200">
                      {visibleAveragePercentage}%
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4">
                    <p className="text-xs text-blue-100/70">Best Date</p>
                    <h3 className="mt-1 text-2xl font-black text-blue-200">
                      {visibleBestDay ? `${visibleBestDay.percentage}%` : "0%"}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                    <p className="text-xs text-red-100/70">No-work Days</p>
                    <h3 className="mt-1 text-2xl font-black text-red-200">
                      {visibleSkippedDays}
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-purple-400/20 bg-purple-400/10 p-4">
                    <p className="text-xs text-purple-100/70">
                      Over 100% Days
                    </p>
                    <h3 className="mt-1 text-2xl font-black text-purple-200">
                      {visibleCatchUpDays}
                    </h3>
                  </div>

                  <div
                    className={
                      targetPrediction.isOnTrack
                        ? "rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4"
                        : "rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4"
                    }
                  >
                    <p
                      className={
                        targetPrediction.isOnTrack
                          ? "text-xs text-emerald-100/70"
                          : "text-xs text-yellow-100/70"
                      }
                    >
                      Target Status
                    </p>
                    <h3
                      className={
                        targetPrediction.isOnTrack
                          ? "mt-1 text-2xl font-black text-emerald-200"
                          : "mt-1 text-2xl font-black text-yellow-200"
                      }
                    >
                      {targetPrediction.isOnTrack ? "On Track" : "Risk"}
                    </h3>
                  </div>
                </div>

                {durationGraphMode === "month" && (
  <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-3 md:p-4">
    <p className="text-center text-lg font-black text-white">
      {getMonthLabel(selectedGraphMonth)}
    </p>

    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <button
        type="button"
        onClick={() =>
          setSelectedGraphMonth((current) => {
            const date = new Date(current);
            date.setMonth(date.getMonth() - 1);
            return date;
          })
        }
        className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
      >
        Previous Month
      </button>

      <button
        type="button"
        onClick={() => setSelectedGraphMonth(new Date())}
        className="rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-bold text-blue-100 hover:bg-blue-400/20"
      >
        Return to Current Month
      </button>

      <button
        type="button"
        onClick={() =>
          setSelectedGraphMonth((current) => {
            const date = new Date(current);
            date.setMonth(date.getMonth() + 1);
            return date;
          })
        }
        className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
      >
        Next Month
      </button>
    </div>
  </div>
)}

                <div className="mt-5 rounded-3xl border border-white/10 bg-black/40 p-3 md:mt-7 md:p-6">
                  <div className="mb-4 flex flex-col gap-2 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      Showing:{" "}
                      {durationGraphMode === "month"
                        ? getMonthLabel(selectedGraphMonth)
                        : "Full duration"}
                    </span>
                    <span>Top scale: {visibleGraphTopPercentage}%</span>
                  </div>

                  {visibleDateProgressPoints.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
                      <h3 className="text-xl font-black">
                        No data for this month
                      </h3>
                      <p className="mt-2 text-sm text-zinc-400">
                        Choose another month or switch to full duration view.
                      </p>
                    </div>
                  ) : (
                  <div className="overflow-x-auto">
  <div
    className="relative"
    style={{
      width: `${graphWidth}px`,
      minWidth: durationGraphMode === "month" ? "360px" : "900px",
    }}
  >
    <div className="relative h-[420px] md:h-[470px]">
      {/* Y-axis grid */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-[280px] md:h-[340px]">
        {graphTicks.map((tick) => {
          const topPosition =
            visibleGraphTopPercentage === 0
              ? 100
              : 100 - (tick / visibleGraphTopPercentage) * 100;

          return (
            <div
              key={tick}
              className="absolute flex w-full items-center gap-3"
              style={{ top: `${topPosition}%` }}
            >
              <span className="w-10 text-right text-[10px] text-zinc-600 md:w-12">
                {tick}%
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>
          );
        })}
      </div>

      {/* Bars */}
      <div className="absolute left-10 right-0 top-0 flex h-[280px] items-end gap-2 md:left-16 md:h-[340px] md:gap-3">
        {visibleDateProgressPoints.map((point) => {
          const exactBarHeight =
            visibleGraphTopPercentage === 0
              ? 0
              : (point.percentage / visibleGraphTopPercentage) * 100;

          const barHeight = Math.max(
            point.percentage > 0 ? 4 : 0,
            Math.min(100, exactBarHeight)
          );

          let barClass = "from-zinc-700 to-zinc-600";

          if (point.isPast && point.percentage === 0) {
            barClass = "from-red-500 to-red-300";
          } else if (point.percentage > 100) {
            barClass = "from-blue-500 via-purple-400 to-emerald-300";
          } else if (point.percentage > 0) {
            barClass = "from-emerald-500 to-emerald-300";
          }

          return (
            <div
              key={point.date}
              className={
                durationGraphMode === "full"
                  ? "group relative flex h-full w-5 shrink-0 items-end justify-center"
                  : "group relative flex h-full w-12 shrink-0 items-end justify-center"
              }
            >
              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 hidden -translate-x-1/2 opacity-0 transition group-hover:opacity-100 md:block">
                <div className="whitespace-nowrap rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-center text-xs shadow-xl">
                  <p className="font-bold text-white">
                    {getFullDateForGraph(point.date)}
                  </p>

                  <p className="mt-1 text-zinc-300">
                    {point.percentage}%
                  </p>

                  <p className="mt-1 text-zinc-500">
                    Done units: {point.completedDayUnits}
                  </p>

                  {point.ownDayNumbers.length > 0 && (
  <p className="mt-1 text-zinc-500">
    Completed plan days: Day {point.ownDayNumbers.join(", Day ")}
  </p>
)}
                </div>
              </div>

              <div
                className={`rounded-t-xl bg-gradient-to-t shadow-lg transition duration-300 group-hover:scale-110 ${
                  durationGraphMode === "full" ? "w-4" : "w-7"
                } ${barClass}`}
                style={{ height: `${barHeight}%` }}
                title={`${getFullDateForGraph(point.date)} • ${point.percentage}%`}
              />
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      {/* X-axis labels + completed plan days */}
<div className="absolute left-10 right-0 top-[292px] flex gap-2 md:left-16 md:top-[352px] md:gap-3">
  {visibleDateProgressPoints.map((point) => {
    const completedDayLabel = getCompletedDayLabel(point.ownDayNumbers);

    return (
      <div
        key={point.date}
        className={
          durationGraphMode === "full"
            ? "w-5 shrink-0 text-center"
            : "w-12 shrink-0 text-center"
        }
      >
        <div
          className={
            point.isToday
              ? "rounded-lg border border-blue-400/30 bg-blue-400/10 px-1 py-1"
              : "px-1 py-1"
          }
        >
          <p className="text-[9px] font-bold text-white">
            {getShortDateForGraph(point.date)}
          </p>

          {completedDayLabel && (
            <p
              className={
                point.percentage > 100
                  ? "mt-1 rounded-md bg-blue-400/10 px-1 py-0.5 text-[8px] font-bold text-blue-200"
                  : "mt-1 rounded-md bg-emerald-400/10 px-1 py-0.5 text-[8px] font-bold text-emerald-200"
              }
              title={`Completed: Day ${point.ownDayNumbers.join(", Day ")}`}
            >
              {durationGraphMode === "full"
                ? `${point.ownDayNumbers.length}D`
                : completedDayLabel}
            </p>
          )}
        </div>
      </div>
    );
  })}
</div>
    </div>
  </div>
</div>  
                  )}

                  <div className="mt-4 grid grid-cols-1 gap-2 text-xs sm:flex sm:flex-wrap sm:gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-200">
                      <span className="h-2.5 w-2.5 rounded bg-emerald-400" />
                      1% to 100%
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-2 text-blue-200">
                      <span className="h-2.5 w-2.5 rounded bg-blue-400" />
                      More than 100%
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-2 text-red-200">
                      <span className="h-2.5 w-2.5 rounded bg-red-400" />
                      No-work day
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-zinc-300">
                      <span className="h-2.5 w-2.5 rounded bg-zinc-700" />
                      Future / no work
                    </div>
                  </div>
                </div>

                <div
                  className={
                    targetPrediction.isOnTrack
                      ? "mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 md:mt-7 md:p-5"
                      : "mt-5 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-4 md:mt-7 md:p-5"
                  }
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p
                        className={
                          targetPrediction.isOnTrack
                            ? "text-xs font-bold uppercase tracking-[0.25em] text-emerald-200/70"
                            : "text-xs font-bold uppercase tracking-[0.25em] text-yellow-200/70"
                        }
                      >
                        Target Date Prediction
                      </p>

                      <h3
                        className={
                          targetPrediction.isOnTrack
                            ? "mt-3 text-xl font-black text-emerald-100 md:text-2xl"
                            : "mt-3 text-xl font-black text-yellow-100 md:text-2xl"
                        }
                      >
                        {targetPrediction.message}
                      </h3>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-200">
                        {targetPrediction.suggestion}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[640px] lg:grid-cols-5">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs text-zinc-400">Target Date</p>
                        <h4 className="mt-2 text-lg font-black">
                          {getShortDateForGraph(targetPrediction.targetDate)}
                        </h4>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs text-zinc-400">Days Left</p>
                        <h4 className="mt-2 text-lg font-black">
                          {targetPrediction.remainingDays}
                        </h4>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs text-zinc-400">
                          Plan Days Left
                        </p>
                        <h4 className="mt-2 text-lg font-black">
                          {targetPrediction.remainingPlanDays}
                        </h4>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs text-zinc-400">Need / Day</p>
                        <h4 className="mt-2 text-lg font-black">
                          {targetPrediction.requiredDaysPerDay}
                        </h4>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs text-zinc-400">Current Speed</p>
                        <h4 className="mt-2 text-lg font-black">
                          {targetPrediction.currentSpeed}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-3 md:p-8 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-3xl border border-white/10 bg-black/35 p-4 md:rounded-[2rem] md:p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                      Overall Completion
                    </p>

                    <h2 className="mt-3 text-5xl font-black tracking-tight text-white md:text-6xl">
                      {reportData.progressPercentage}%
                    </h2>

                    <p className={`mt-3 text-sm font-semibold ${status.color}`}>
                      {status.message}
                    </p>
                  </div>

                  <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] md:h-44 md:w-44">
                    <div
                      className="absolute inset-3 rounded-full"
                      style={{
                        background: `conic-gradient(rgb(52 211 153) ${
                          reportData.progressPercentage * 3.6
                        }deg, rgb(39 39 42) 0deg)`,
                      }}
                    />
                    <div className="relative flex h-28 w-28 flex-col items-center justify-center rounded-full bg-zinc-950 text-center shadow-2xl md:h-32 md:w-32">
                      <span className="text-3xl font-black">
                        {reportData.progressPercentage}%
                      </span>
                      <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        Score
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {goal.trackerType === "normal"
                        ? "Total Ticks"
                        : "Total Days"}
                    </p>
                    <h3 className="mt-3 text-3xl font-black">
                      {reportData.total}
                    </h3>
                  </div>

                  <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                      Completed
                    </p>
                    <h3 className="mt-3 text-3xl font-black text-emerald-200">
                      {reportData.completed}
                    </h3>
                  </div>

                  <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-red-200/70">
                      Pending
                    </p>
                    <h3 className="mt-3 text-3xl font-black text-red-200">
                      {reportData.pending}
                    </h3>
                  </div>

                  <div className="rounded-3xl border border-blue-400/20 bg-blue-400/10 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-200/70">
                      Tasks
                    </p>
                    <h3 className="mt-3 text-3xl font-black text-blue-200">
                      {reportData.completedTasks}/{reportData.totalTasks}
                    </h3>
                  </div>
                </div>

                <div className="mt-8 space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Day completion</span>
                      <span className="font-bold">
                        {reportData.progressPercentage}%
                      </span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-300"
                        style={{
                          width: `${Math.min(
                            reportData.progressPercentage,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Task completion</span>
                      <span className="font-bold">{taskPercentage}%</span>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-blue-300"
                        style={{ width: `${Math.min(taskPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5 md:space-y-6">
                {goal.trackerType === "complex" && (
                  <div className="rounded-3xl border border-white/10 bg-black/35 p-4 md:rounded-[2rem] md:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                      Current Active Plan
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

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-xs text-zinc-500">Daily Time</p>
                            <h4 className="mt-2 text-xl font-black">
                              {goal.dailyTime || "Not set"}
                            </h4>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-xs text-zinc-500">
                              Pending Tasks
                            </p>
                            <h4 className="mt-2 text-xl font-black">
                              {pendingTasks.length}
                            </h4>
                          </div>
                        </div>

                        {pendingTasks.length > 0 && (
                          <div className="mt-5 space-y-2">
                            {pendingTasks.slice(0, 4).map((task) => (
                              <div
                                key={task.id}
                                className="rounded-2xl border border-white/10 bg-black/40 p-3 text-sm text-zinc-300"
                              >
                                {task.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-zinc-400">
                        No active day found. Your plan may be completed.
                      </p>
                    )}
                  </div>
                )}

                {goal.trackerType === "normal" && (
                  <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 md:rounded-[2rem] md:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-200/70">
                      Normal Tracker Summary
                    </p>

                    <h2 className="mt-3 text-3xl font-black text-emerald-100">
                      {goal.normalTarget || goal.name}
                    </h2>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs text-emerald-100/70">Frequency</p>
                        <h4 className="mt-2 text-xl font-black">
                          {goal.normalFrequency || "daily"}
                        </h4>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                        <p className="text-xs text-emerald-100/70">
                          Completed
                        </p>
                        <h4 className="mt-2 text-xl font-black">
                          {reportData.completed}/{reportData.total}
                        </h4>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-3xl border border-white/10 bg-black/35 p-4 md:rounded-[2rem] md:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                    Goal Details
                  </p>

                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-zinc-500">Category</span>
                      <span className="font-semibold text-white">
                        {goal.category || "Not set"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-zinc-500">Duration</span>
                      <span className="font-semibold text-white">
                        {goal.duration || "Not set"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-zinc-500">Current Level</span>
                      <span className="font-semibold text-white">
                        {goal.currentLevel || "Not set"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4 border-b border-white/10 pb-3">
                      <span className="text-zinc-500">Target Result</span>
                      <span className="font-semibold text-white">
                        {goal.targetResult || "Not set"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-zinc-500">Created</span>
                      <span className="font-semibold text-white">
                        {getDateLabel(goal.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {aiReport && (
              <div className="border-t border-white/10 p-3 md:p-8">
                <div className="grid gap-5 xl:grid-cols-[1fr_1fr] xl:gap-6">
                  <div className="rounded-3xl border border-white/10 bg-black/35 p-4 md:rounded-[2rem] md:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                      AI Summary
                    </p>
                    <h2 className="mt-3 text-2xl font-black md:text-3xl">
                      Report Analysis
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-zinc-300">
                      {aiReport.summary}
                    </p>

                    <div className="mt-6 rounded-3xl border border-blue-400/20 bg-blue-400/10 p-4 md:p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200/70">
                        Progress Feedback
                      </p>
                      <p className="mt-3 text-sm leading-7 text-blue-50/80">
                        {aiReport.progressFeedback}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-blue-400/20 bg-blue-400/10 p-4 md:rounded-[2rem] md:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200/70">
                      Weekly Recommendation
                    </p>
                    <h2 className="mt-3 text-2xl font-black text-blue-100 md:text-3xl">
                      Next Best Direction
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-blue-50/80">
                      {aiReport.weeklyRecommendation}
                    </p>

                    {isGeneratingReport && (
                      <p className="mt-4 rounded-2xl border border-blue-300/20 bg-blue-300/10 p-3 text-sm text-blue-100">
                        AI report is generating. Current fallback report is
                        still visible.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:gap-6">
                  <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-4 md:rounded-[2rem] md:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-red-200/70">
                      Weak Areas
                    </p>

                    <div className="mt-5 space-y-3">
                      {aiReport.weakAreas.map((area, index) => (
                        <div
                          key={area}
                          className="flex gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-200"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-400/20 text-xs font-black text-red-200">
                            {index + 1}
                          </span>
                          <span>{area}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 md:rounded-[2rem] md:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-200/70">
                      Next Actions
                    </p>

                    <div className="mt-5 space-y-3">
                      {aiReport.nextActions.map((action, index) => (
                        <div
                          key={action}
                          className="flex gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-200"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-black text-emerald-200">
                            {index + 1}
                          </span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {goal.latestTestResult && (
              <div className="border-t border-white/10 p-3 md:p-8">
                <div className="rounded-3xl border border-purple-400/30 bg-purple-400/10 p-4 md:rounded-[2rem] md:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-200/70">
                    Latest Weekly Test
                  </p>

                  <h2 className="mt-3 text-2xl font-black text-purple-100 md:text-3xl">
                    Test Result
                  </h2>

                  <p className="mt-4 text-sm leading-7 text-zinc-200">
                    {goal.latestTestResult}
                  </p>

                  {goal.latestTestDate && (
                    <p className="mt-3 text-sm text-purple-100/70">
                      Saved on {getDateLabel(goal.latestTestDate)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
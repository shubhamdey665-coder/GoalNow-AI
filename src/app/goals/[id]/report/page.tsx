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

        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_35%,#000000_100%)] px-4 py-8 text-white md:px-6 md:py-10">
          <section className="mx-auto max-w-4xl">
            <Link href="/dashboard" className="text-sm text-blue-300">
              ← Back to Dashboard
            </Link>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center shadow-2xl shadow-blue-950/30 backdrop-blur">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <h1 className="text-3xl font-black">Loading report...</h1>
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

        <main className="min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_35%,#000000_100%)] px-4 py-8 text-white md:px-6 md:py-10">
          <section className="mx-auto max-w-4xl">
            <Link href="/dashboard" className="text-sm text-blue-300">
              ← Back to Dashboard
            </Link>

            <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center shadow-2xl shadow-blue-950/30 backdrop-blur">
              <h1 className="text-3xl font-black">Goal not found</h1>
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

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_35%,#000000_100%)] px-4 py-8 text-white md:px-6 md:py-10">
        <section className="mx-auto max-w-7xl">
          <Link href={`/goals/${goal.id}`} className="text-sm text-blue-300">
            ← Back to Goal
          </Link>

          {reportError && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {reportError}
            </div>
          )}

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-blue-950/30 backdrop-blur">
            <div className="border-b border-white/10 bg-white/[0.03] p-6 md:p-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
                    GoalNow AI Progress Report
                  </p>

                  <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                    {goal.name}
                  </h1>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
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
                    {isGeneratingReport ? "Generating..." : "Generate AI Report"}
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

            <div className="grid gap-6 p-6 md:p-8 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                      Overall Completion
                    </p>

                    <h2 className="mt-3 text-6xl font-black tracking-tight text-white">
                      {reportData.progressPercentage}%
                    </h2>

                    <p className={`mt-3 text-sm font-semibold ${status.color}`}>
                      {status.message}
                    </p>
                  </div>

                  <div className="relative mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                    <div
                      className="absolute inset-3 rounded-full"
                      style={{
                        background: `conic-gradient(rgb(52 211 153) ${
                          reportData.progressPercentage * 3.6
                        }deg, rgb(39 39 42) 0deg)`,
                      }}
                    />
                    <div className="relative flex h-32 w-32 flex-col items-center justify-center rounded-full bg-zinc-950 text-center shadow-2xl">
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
                      {goal.trackerType === "normal" ? "Total Ticks" : "Total Days"}
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
                          width: `${Math.min(reportData.progressPercentage, 100)}%`,
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

              <div className="space-y-6">
                {goal.trackerType === "complex" && (
                  <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
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
                  <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6">
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

                <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
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
              <div className="border-t border-white/10 p-6 md:p-8">
                <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
                  <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                      AI Summary
                    </p>
                    <h2 className="mt-3 text-3xl font-black">
                      Report Analysis
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-zinc-300">
                      {aiReport.summary}
                    </p>

                    <div className="mt-6 rounded-3xl border border-blue-400/20 bg-blue-400/10 p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200/70">
                        Progress Feedback
                      </p>
                      <p className="mt-3 text-sm leading-7 text-blue-50/80">
                        {aiReport.progressFeedback}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-blue-400/20 bg-blue-400/10 p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200/70">
                      Weekly Recommendation
                    </p>
                    <h2 className="mt-3 text-3xl font-black text-blue-100">
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

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-6">
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

                  <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6">
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
              <div className="border-t border-white/10 p-6 md:p-8">
                <div className="rounded-[2rem] border border-purple-400/30 bg-purple-400/10 p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-200/70">
                    Latest Weekly Test
                  </p>

                  <h2 className="mt-3 text-3xl font-black text-purple-100">
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
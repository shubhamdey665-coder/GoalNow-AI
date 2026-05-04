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
      weakAreas: [
        "Daily consistency",
        "Habit simplicity",
        "Regular tracking",
      ],
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
    weakAreas: [
      "Starting consistency",
      "Task completion",
      "Routine stability",
    ],
    nextActions: [
      "Complete one pending task today",
      "Reduce daily load if needed",
      "Continue from the current active day",
    ],
    weeklyRecommendation:
      "Make this week lighter and focus only on rebuilding consistency.",
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

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <section className="mx-auto max-w-4xl">
          <Link href="/dashboard" className="text-sm text-blue-300">
            ← Back to Dashboard
          </Link>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
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

        <main className="min-h-screen bg-black px-6 py-10 text-white">
          <section className="mx-auto max-w-4xl">
            <Link href="/dashboard" className="text-sm text-blue-300">
              ← Back to Dashboard
            </Link>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
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

  const activeDay = goal.complexPlanDays?.find(
    (day) => day.dayNumber === goal.activeDayNumber
  );

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <section className="mx-auto max-w-5xl">
          <Link href={`/goals/${goal.id}`} className="text-sm text-blue-300">
            ← Back to Goal
          </Link>
          {reportError && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {reportError}
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-300">
                  GoalNow AI Progress Report
                </p>

                <h1 className="mt-2 text-4xl font-black">{goal.name}</h1>

                <p className="mt-3 text-zinc-400">
                  This report analyzes your progress, weak areas, and next best
                  action.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void generateGeminiReport(goal)}
                  disabled={isGeneratingReport}
                  className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingReport ? "Generating..." : "Generate Gemini Report"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadReportPdf(goal, reportData, aiReport, reportSource)
                  }
                  className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
                >
                  Download Report PDF
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
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

              <span
                className={
                  reportSource === "gemini"
                    ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300"
                    : "rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-sm font-semibold text-yellow-300"
                }
              >
                {reportSource === "gemini"
                  ? "Gemini-generated report"
                  : "Fallback report"}
              </span>

              {isGeneratingReport && (
                <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm font-semibold text-blue-300">
                  Report is generating...
                </span>
              )}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">
                  {goal.trackerType === "normal" ? "Total Ticks" : "Total Days"}
                </p>
                <h2 className="mt-2 text-3xl font-black">{reportData.total}</h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Completed</p>
                <h2 className="mt-2 text-3xl font-black">
                  {reportData.completed}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Pending</p>
                <h2 className="mt-2 text-3xl font-black">
                  {reportData.pending}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Progress</p>
                <h2 className="mt-2 text-3xl font-black">
                  {reportData.progressPercentage}%
                </h2>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">Progress Bar</span>
                <span className="font-semibold">
                  {reportData.progressPercentage}%
                </span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${reportData.progressPercentage}%` }}
                />
              </div>
            </div>

            {goal.trackerType === "complex" && (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-sm text-zinc-400">Active Day</p>
                  <h2 className="mt-2 text-2xl font-black">
                    Day {goal.activeDayNumber || 1}
                  </h2>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-sm text-zinc-400">Completed Tasks</p>
                  <h2 className="mt-2 text-2xl font-black">
                    {reportData.completedTasks}/{reportData.totalTasks}
                  </h2>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-sm text-zinc-400">Daily Time</p>
                  <h2 className="mt-2 text-2xl font-black">
                    {goal.dailyTime || "Not set"}
                  </h2>
                </div>
              </div>
            )}

            {goal.trackerType === "normal" && (
              <div className="mt-8 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                <h2 className="text-2xl font-black text-emerald-200">
                  Normal Tracker Summary
                </h2>

                <p className="mt-3 text-zinc-300">
                  Target: {goal.normalTarget || goal.name}
                </p>

                <p className="mt-2 text-zinc-300">
                  Frequency: {goal.normalFrequency || "daily"}
                </p>
              </div>
            )}

            {goal.trackerType === "complex" && activeDay && (
              <div className="mt-8 rounded-2xl border border-blue-400/30 bg-blue-400/10 p-5">
                <h2 className="text-2xl font-black text-blue-200">
                  Current Active Plan
                </h2>

                <p className="mt-3 text-zinc-300">
                  Day {activeDay.dayNumber}: {activeDay.title}
                </p>

                <p className="mt-2 text-zinc-400">{activeDay.focus}</p>
              </div>
            )}

            {aiReport && (
              <>
                <div className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-6">
                  <h2 className="text-2xl font-black">AI Report Summary</h2>
                  <p className="mt-3 text-zinc-300">{aiReport.summary}</p>
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-black/40 p-6">
                  <h2 className="text-2xl font-black">Progress Feedback</h2>
                  <p className="mt-3 text-zinc-300">
                    {aiReport.progressFeedback}
                  </p>
                </div>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6">
                    <h2 className="text-2xl font-black text-red-200">
                      Weak Areas
                    </h2>

                    <div className="mt-4 space-y-3">
                      {aiReport.weakAreas.map((area) => (
                        <div
                          key={area}
                          className="rounded-xl border border-white/10 bg-black/30 p-3 text-zinc-200"
                        >
                          {area}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6">
                    <h2 className="text-2xl font-black text-emerald-200">
                      Next Actions
                    </h2>

                    <div className="mt-4 space-y-3">
                      {aiReport.nextActions.map((action) => (
                        <div
                          key={action}
                          className="rounded-xl border border-white/10 bg-black/30 p-3 text-zinc-200"
                        >
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-blue-400/30 bg-blue-400/10 p-6">
                  <h2 className="text-2xl font-black text-blue-200">
                    Weekly Recommendation
                  </h2>

                  <p className="mt-3 text-zinc-200">
                    {aiReport.weeklyRecommendation}
                  </p>
                </div>
              </>
            )}

            {goal.latestTestResult && (
              <div className="mt-8 rounded-2xl border border-purple-400/30 bg-purple-400/10 p-5">
                <h2 className="text-2xl font-black text-purple-200">
                  Latest Weekly Test Result
                </h2>

                <p className="mt-3 text-zinc-300">{goal.latestTestResult}</p>

                {goal.latestTestDate && (
                  <p className="mt-2 text-sm text-zinc-400">
                    Saved on{" "}
                    {new Date(goal.latestTestDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
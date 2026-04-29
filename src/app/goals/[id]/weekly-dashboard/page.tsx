"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getGoalById } from "@/lib/goalStorage";
import type { Goal } from "@/types/goal";

function getDateOnly(dateString: string) {
  return new Date(dateString).toISOString().split("T")[0];
}

function getLast7Dates() {
  const dates: string[] = [];

  for (let index = 6; index >= 0; index--) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

export default function WeeklyDashboardPage() {
  const params = useParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const foundGoal = getGoalById(goalId);

    if (foundGoal) {
      setGoal(foundGoal);
    }
  }, [goalId]);

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
                This weekly dashboard needs a saved goal first.
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

  const last7Dates = getLast7Dates();

  const completedThisWeek = completedDays.filter((day) => {
    if (!day.completedAt) return false;

    const completedDate = getDateOnly(day.completedAt);
    return last7Dates.includes(completedDate);
  });

  const activeDay = planDays.find(
    (day) => day.dayNumber === goal.activeDayNumber
  );

  const pendingTasksInActiveDay =
    activeDay?.tasks.filter((task) => !task.completed) || [];

  let consistencyStatus = "Needs Focus";
  let recommendation =
    "Keep the plan lighter. Complete the current active day before trying harder tasks.";

  if (completedThisWeek.length >= 5) {
    consistencyStatus = "Excellent";
    recommendation =
      "You are consistent this week. Next week can include slightly harder tasks and one realistic test.";
  } else if (completedThisWeek.length >= 3) {
    consistencyStatus = "Good Start";
    recommendation =
      "You are moving, but consistency can improve. Keep daily tasks small and finish the active day first.";
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <section className="mx-auto max-w-6xl">
          <Link href={`/goals/${goal.id}`} className="text-sm text-blue-300">
            ← Back to Goal
          </Link>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <p className="text-sm font-semibold text-blue-300">
              GoalNow AI Weekly Dashboard
            </p>

            <h1 className="mt-2 text-4xl font-black">{goal.name}</h1>

            <p className="mt-3 max-w-3xl text-zinc-400">
              This dashboard shows your weekly consistency, active learning day,
              task completion, and next best action.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">This Week Completed</p>
                <h2 className="mt-2 text-3xl font-black">
                  {completedThisWeek.length}/7
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Overall Progress</p>
                <h2 className="mt-2 text-3xl font-black">
                  {progressPercentage}%
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Task Progress</p>
                <h2 className="mt-2 text-3xl font-black">
                  {taskProgressPercentage}%
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Consistency</p>
                <h2 className="mt-2 text-3xl font-black">
                  {consistencyStatus}
                </h2>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">Overall Plan Progress</span>
                <span className="font-semibold">{progressPercentage}%</span>
              </div>

              <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                <h2 className="text-2xl font-black">Last 7 Days</h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {last7Dates.map((date) => {
                    const completedOnThisDate = completedDays.find((day) => {
                      if (!day.completedAt) return false;
                      return getDateOnly(day.completedAt) === date;
                    });

                    return (
                      <div
                        key={date}
                        className={
                          completedOnThisDate
                            ? "rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4"
                            : "rounded-2xl border border-white/10 bg-white/5 p-4"
                        }
                      >
                        <p className="text-sm text-zinc-400">
                          {new Date(date).toLocaleDateString()}
                        </p>

                        <h3 className="mt-2 text-lg font-bold">
                          {completedOnThisDate
                            ? `Day ${completedOnThisDate.dayNumber} Done`
                            : "No Plan Day Completed"}
                        </h3>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                <h2 className="text-2xl font-black">Current Active Day</h2>

                {activeDay ? (
                  <>
                    <p className="mt-4 text-sm font-semibold text-blue-300">
                      Day {activeDay.dayNumber}
                    </p>

                    <h3 className="mt-2 text-2xl font-black">
                      {activeDay.title}
                    </h3>

                    <p className="mt-2 text-zinc-400">{activeDay.focus}</p>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-zinc-400">
                        Pending Tasks in Active Day
                      </p>

                      <h4 className="mt-2 text-2xl font-bold">
                        {pendingTasksInActiveDay.length}
                      </h4>
                    </div>

                    <div className="mt-5 space-y-3">
                      {pendingTasksInActiveDay.length > 0 ? (
                        pendingTasksInActiveDay.map((task) => (
                          <div
                            key={task.id}
                            className="rounded-xl border border-white/10 bg-black/40 p-3 text-zinc-300"
                          >
                            {task.title}
                          </div>
                        ))
                      ) : (
                        <p className="text-zinc-400">
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
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                <h2 className="text-2xl font-black">Weekly Feedback</h2>

                <p className="mt-3 text-zinc-300">
                  You completed {completedThisWeek.length} plan day
                  {completedThisWeek.length === 1 ? "" : "s"} in the last 7
                  days. Your current consistency status is{" "}
                  <span className="font-semibold text-white">
                    {consistencyStatus}
                  </span>
                  .
                </p>
              </div>

              <div className="rounded-3xl border border-blue-400/30 bg-blue-400/10 p-6">
                <h2 className="text-2xl font-black text-blue-200">
                  Next Best Action
                </h2>

                <p className="mt-3 text-zinc-200">{recommendation}</p>
              </div>
            </div>

            {goal.latestTestResult && (
              <div className="mt-8 rounded-3xl border border-purple-400/30 bg-purple-400/10 p-6">
                <h2 className="text-2xl font-black text-purple-200">
                  Latest Weekly Test Result
                </h2>

                <p className="mt-3 text-zinc-200">{goal.latestTestResult}</p>

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
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getGoalByIdFromSupabase,
  getGoalsFromSupabase,
  updateGoalInSupabase,
} from "@/lib/goals/supabaseGoals";
import type { Goal } from "@/types/goal";

type FieldShellProps = {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
};

function FieldShell({ label, helper, error, children }: FieldShellProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-bold text-zinc-100">{label}</label>
      </div>

      {children}

      {error ? (
        <p className="mt-2 text-sm font-semibold text-red-300">{error}</p>
      ) : helper ? (
        <p className="mt-2 text-xs leading-5 text-zinc-500">{helper}</p>
      ) : null}
    </div>
  );
}

function getInputClass(error?: string, accent: "blue" | "emerald" = "blue") {
  const focusColor =
    accent === "emerald" ? "focus:border-emerald-400" : "focus:border-blue-400";

  return error
    ? "mt-0 w-full rounded-2xl border border-red-400 bg-zinc-950/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-400"
    : `mt-0 w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 ${focusColor}`;
}

export default function EditGoalPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Career / Job");
  const [duration, setDuration] = useState("7 Days");
  const [priority, setPriority] = useState("Medium");
  const [targetDate, setTargetDate] = useState("");

  const [dailyTime, setDailyTime] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [targetResult, setTargetResult] = useState("");

  const [normalTarget, setNormalTarget] = useState("");
  const [normalFrequency, setNormalFrequency] = useState<"daily" | "weekly">(
    "daily"
  );

  const [message, setMessage] = useState("");
  const [hasTriedToSave, setHasTriedToSave] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadGoal() {
      setIsLoadingGoal(true);
      setMessage("");

      try {
        const foundGoal = await getGoalByIdFromSupabase(goalId);

        if (!isMounted) return;

        if (!foundGoal) {
          setGoal(null);
          setMessage("Goal not found.");
          return;
        }

        setGoal(foundGoal);

        setName(foundGoal.name);
        setCategory(foundGoal.category);
        setDuration(foundGoal.duration);
        setPriority(foundGoal.priority || "Medium");
        setTargetDate(foundGoal.targetDate || "");

        setDailyTime(foundGoal.dailyTime || "");
        setCurrentLevel(foundGoal.currentLevel || "");
        setTargetResult(foundGoal.targetResult || "");

        setNormalTarget(foundGoal.normalTarget || foundGoal.name);
        setNormalFrequency(foundGoal.normalFrequency || "daily");
      } catch (error) {
        if (!isMounted) return;

        setGoal(null);
        setMessage(
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

  function isTargetDateInvalid() {
    if (!targetDate) return false;

    const today = new Date();
    const selectedDate = new Date(targetDate);

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate <= today;
  }

  async function saveChanges() {
    setHasTriedToSave(true);
    if (!goal) return;

    if (!name.trim()) {
      setMessage("Please enter a goal name.");
      return;
    }

    if (name.trim().length < 3) {
      setMessage("Goal name must be at least 3 characters.");
      return;
    }

    if (isTargetDateInvalid()) {
      setMessage(
        "Target date must be a future date. Today or past date is not allowed."
      );
      return;
    }

    if (goal.trackerType === "normal") {
      if (!normalTarget.trim()) {
        setMessage("Please enter your simple tracker target.");
        return;
      }
    }

    if (goal.trackerType === "complex") {
      if (!dailyTime.trim() || !currentLevel.trim() || !targetResult.trim()) {
        setMessage("Please fill daily time, current level, and target result.");
        return;
      }
    }

    let goals: Goal[] = [];

    try {
      goals = await getGoalsFromSupabase();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not check your existing goals."
      );
      return;
    }

    const duplicateGoal = goals.find(
      (item) =>
        item.id !== goal.id &&
        item.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (duplicateGoal) {
      setMessage("Another goal with this name already exists.");
      return;
    }

    const updatedGoal: Goal = {
      ...goal,

      name: name.trim(),
      category,
      duration,
      priority,
      targetDate,

      dailyTime: goal.trackerType === "complex" ? dailyTime : goal.dailyTime,
      currentLevel:
        goal.trackerType === "complex" ? currentLevel : goal.currentLevel,
      targetResult:
        goal.trackerType === "complex" ? targetResult : goal.targetResult,

      normalTarget:
        goal.trackerType === "normal" ? normalTarget : goal.normalTarget,
      normalFrequency:
        goal.trackerType === "normal" ? normalFrequency : goal.normalFrequency,

      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    setMessage("");

    try {
      const savedGoal = await updateGoalInSupabase(updatedGoal);
      router.push(`/goals/${savedGoal.id}`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not save your changes."
      );
    } finally {
      setIsSaving(false);
    }
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
                Loading edit page...
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
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

        <main className="goalnow-page min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_35%,#000000_100%)] py-5 text-white md:py-10">
          <section className="goalnow-container">
            <Link href="/dashboard" className="text-sm text-blue-300">
              ← Back to Dashboard
            </Link>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-blue-950/30 backdrop-blur md:mt-8 md:rounded-[2rem] md:p-10">
              <h1 className="text-2xl font-black md:text-3xl">
                Goal not found
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {message ||
                  "This goal may have been deleted or not saved properly."}
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  const goalNameError =
    name.trim().length > 0 && name.trim().length < 3
      ? "Goal name must be at least 3 characters."
      : hasTriedToSave && !name.trim()
      ? "Please enter a goal name."
      : "";

  const targetDateError = isTargetDateInvalid()
    ? "Target date must be a future date. Today or past date is not allowed."
    : "";

  const normalTargetError =
    goal.trackerType === "normal" && hasTriedToSave && !normalTarget.trim()
      ? "Please enter your simple tracker target."
      : "";

  const dailyTimeError =
    goal.trackerType === "complex" && hasTriedToSave && !dailyTime.trim()
      ? "Please enter your daily available time."
      : "";

  const currentLevelError =
    goal.trackerType === "complex" && hasTriedToSave && !currentLevel.trim()
      ? "Please enter your current level."
      : "";

  const targetResultError =
    goal.trackerType === "complex" && hasTriedToSave && !targetResult.trim()
      ? "Please enter your target result."
      : "";

  const hasValidationError =
    Boolean(goalNameError) ||
    Boolean(targetDateError) ||
    Boolean(normalTargetError) ||
    Boolean(dailyTimeError) ||
    Boolean(currentLevelError) ||
    Boolean(targetResultError);

  const completedDays =
    goal.trackerType === "complex"
      ? goal.complexPlanDays?.filter((day) => day.completed).length || 0
      : goal.normalCheckIns?.filter((checkIn) => checkIn.completed).length || 0;

  const totalDays =
    goal.trackerType === "complex"
      ? goal.complexPlanDays?.length || 0
      : goal.normalCheckIns?.length || 0;

  const allComplexTasks = goal.complexPlanDays?.flatMap((day) => day.tasks) || [];
  const completedComplexTasks = allComplexTasks.filter(
    (task) => task.completed
  ).length;

  const progressPercentage =
    totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100);

  const trackerBadge =
    goal.trackerType === "normal" ? "Normal Tracker" : "Complex AI Tracker";

  const trackerDescription =
    goal.trackerType === "normal"
      ? "This goal uses simple daily or weekly check-ins."
      : "This goal uses an AI-generated plan with tasks, tests, reports, and mentor guidance.";

  const activeDay = goal.complexPlanDays?.find(
    (day) => day.dayNumber === goal.activeDayNumber
  );

  return (
    <>
      <Navbar />

      <main className="goalnow-page min-h-screen bg-[radial-gradient(circle_at_top,#172554_0%,#020617_35%,#000000_100%)] py-5 text-white md:py-10">
        <section className="goalnow-container">
          <Link href={`/goals/${goal.id}`} className="text-sm text-blue-300">
            ← Back to Goal
          </Link>

          <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-blue-950/30 backdrop-blur md:mt-8 md:rounded-[2rem]">
            <div className="border-b border-white/10 bg-white/[0.03] p-4 md:p-8">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300 md:tracking-[0.3em]">
                    GoalNow AI Goal Editor
                  </p>

                  <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                    Update your goal
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400 md:mt-4 md:text-base md:leading-7">
                    Edit important goal details without damaging your saved
                    progress. Tracker type is locked after creation for data
                    safety.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span
                      className={
                        goal.trackerType === "normal"
                          ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"
                          : "rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-300"
                      }
                    >
                      {trackerBadge}
                    </span>

                    <span
                      className={
                        priority === "High"
                          ? "rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300"
                          : priority === "Medium"
                          ? "rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-300"
                          : "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"
                      }
                    >
                      Priority: {priority}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-zinc-300">
                      Progress: {progressPercentage}%
                    </span>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Editing
                  </p>
                  <h2 className="mt-2 max-w-sm truncate text-xl font-black">
                    {goal.name}
                  </h2>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Last updated:{" "}
                    {goal.updatedAt
                      ? new Date(goal.updatedAt).toLocaleDateString("en-IN")
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-3 md:p-8 xl:grid-cols-[0.8fr_1.2fr]">
              <aside className="space-y-5">
                <div className="rounded-3xl border border-white/10 bg-black/35 p-4 md:rounded-[2rem] md:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                    Tracker Snapshot
                  </p>

                  <h2 className="mt-3 text-2xl font-black">{trackerBadge}</h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {trackerDescription}
                  </p>

                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-zinc-400">Progress</span>
                        <span className="font-bold">{progressPercentage}%</span>
                      </div>

                      <div className="h-3 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-300"
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs text-zinc-500">Completed</p>
                        <h3 className="mt-2 text-2xl font-black">
                          {completedDays}
                        </h3>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs text-zinc-500">Total</p>
                        <h3 className="mt-2 text-2xl font-black">{totalDays}</h3>
                      </div>
                    </div>

                    {goal.trackerType === "complex" && (
                      <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4">
                        <p className="text-xs text-blue-100/70">Task Progress</p>
                        <h3 className="mt-2 text-2xl font-black text-blue-100">
                          {completedComplexTasks}/{allComplexTasks.length}
                        </h3>

                        {activeDay && (
                          <p className="mt-2 text-xs leading-5 text-blue-50/70">
                            Active Day: Day {activeDay.dayNumber} —{" "}
                            {activeDay.title}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-4 md:rounded-[2rem] md:p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-200/70">
                    Safe Editing Notice
                  </p>

                  <h2 className="mt-3 text-xl font-black text-yellow-100">
                    Tracker type is locked
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-yellow-50/80">
                    You can edit goal details, timing, priority, and target
                    information. The tracker type cannot be changed because it
                    protects your saved progress and completed task history.
                  </p>
                </div>

                {message && (
                  <div className="rounded-3xl border border-red-400/30 bg-red-400/10 p-4 text-sm leading-6 text-red-200">
                    {message}
                  </div>
                )}
              </aside>

              <section className="rounded-3xl border border-white/10 bg-black/35 p-4 md:rounded-[2rem] md:p-6">
                <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                      Editable Details
                    </p>

                    <h2 className="mt-2 text-2xl font-black md:text-3xl">
                      Goal settings
                    </h2>
                  </div>

                  {hasValidationError && (
                    <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">
                      Please fix highlighted fields.
                    </div>
                  )}
                </div>

                <form className="mt-6 space-y-6">
                  <FieldShell label="Goal Name" error={goalNameError}>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Example: Google SWE preparation"
                      className={getInputClass(goalNameError)}
                    />
                  </FieldShell>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FieldShell label="Goal Category">
                      <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        className={getInputClass()}
                      >
                        <option>Career / Job</option>
                        <option>Fitness / Fat Burning</option>
                        <option>Education / Exam</option>
                        <option>English / Communication</option>
                        <option>Business / Money</option>
                        <option>Custom Goal</option>
                      </select>
                    </FieldShell>

                    <FieldShell
                      label="Duration"
                      helper="Changing duration does not regenerate the current saved plan."
                    >
                      <select
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                        className={getInputClass()}
                      >
                        <option>7 Days</option>
                        <option>30 Days</option>
                        <option>3 Months</option>
                        <option>6 Months</option>
                        <option>1 Year</option>
                        <option>4 Years</option>
                      </select>
                    </FieldShell>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <FieldShell label="Priority Level">
                      <select
                        value={priority}
                        onChange={(event) => setPriority(event.target.value)}
                        className={getInputClass()}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </FieldShell>

                    <FieldShell
                      label="Target Date"
                      helper="Target date must be a future date."
                      error={targetDateError}
                    >
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(event) => setTargetDate(event.target.value)}
                        className={getInputClass(targetDateError)}
                      />
                    </FieldShell>
                  </div>

                  {goal.trackerType === "normal" && (
                    <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-4 md:p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-200/70">
                        Normal Tracker Settings
                      </p>

                      <div className="mt-5 grid gap-5 md:grid-cols-2">
                        <FieldShell
                          label="Simple Target"
                          error={normalTargetError}
                        >
                          <input
                            value={normalTarget}
                            onChange={(event) =>
                              setNormalTarget(event.target.value)
                            }
                            placeholder="Example: Save ₹100 this week"
                            className={getInputClass(
                              normalTargetError,
                              "emerald"
                            )}
                          />
                        </FieldShell>

                        <FieldShell label="Frequency">
                          <select
                            value={normalFrequency}
                            onChange={(event) =>
                              setNormalFrequency(
                                event.target.value as "daily" | "weekly"
                              )
                            }
                            className={getInputClass(undefined, "emerald")}
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                          </select>
                        </FieldShell>
                      </div>
                    </div>
                  )}

                  {goal.trackerType === "complex" && (
                    <div className="rounded-3xl border border-blue-400/20 bg-blue-400/5 p-4 md:p-5">
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200/70">
                        Complex AI Tracker Settings
                      </p>

                      <div className="mt-5 space-y-5">
                        <FieldShell
                          label="Daily Available Time"
                          error={dailyTimeError}
                        >
                          <input
                            value={dailyTime}
                            onChange={(event) =>
                              setDailyTime(event.target.value)
                            }
                            placeholder="Example: 4 hours daily"
                            className={getInputClass(dailyTimeError)}
                          />
                        </FieldShell>

                        <FieldShell
                          label="Current Level"
                          error={currentLevelError}
                          helper="Write your real current condition so the mentor/report can stay practical."
                        >
                          <textarea
                            value={currentLevel}
                            onChange={(event) =>
                              setCurrentLevel(event.target.value)
                            }
                            placeholder="Example: I know HTML, CSS, basic JS, but I am weak in DSA."
                            className={`${getInputClass(
                              currentLevelError
                            )} min-h-32 resize-y`}
                          />
                        </FieldShell>

                        <FieldShell
                          label="Target Result"
                          error={targetResultError}
                          helper="Write the outcome you want to reach by the target date."
                        >
                          <textarea
                            value={targetResult}
                            onChange={(event) =>
                              setTargetResult(event.target.value)
                            }
                            placeholder="Example: I want to become Google SWE ready."
                            className={`${getInputClass(
                              targetResultError
                            )} min-h-32 resize-y`}
                          />
                        </FieldShell>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                      href={`/goals/${goal.id}`}
                      className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      Cancel
                    </Link>

                    <button
                      type="button"
                      onClick={saveChanges}
                      disabled={isSaving}
                      className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? "Saving changes..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
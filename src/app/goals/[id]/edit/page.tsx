"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getGoalByIdFromSupabase,
  getGoalsFromSupabase,
  updateGoalInSupabase,
} from "@/lib/goals/supabaseGoals";
import type { Goal } from "@/types/goal";

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
      setMessage("Target date must be a future date. Today or past date is not allowed.");
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

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <section className="mx-auto max-w-4xl">
          <Link href="/dashboard" className="text-sm text-blue-300">
            ← Back to Dashboard
          </Link>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <h1 className="text-3xl font-black">Loading edit page...</h1>
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

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <section className="mx-auto max-w-4xl">
          <Link href={`/goals/${goal.id}`} className="text-sm text-blue-300">
            ← Back to Goal
          </Link>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <p className="text-sm font-semibold text-blue-300">
              Edit GoalNow Tracker
            </p>

            <h1 className="mt-2 text-4xl font-black">Update your goal</h1>

            <p className="mt-3 text-zinc-400">
              Change your goal details. Tracker type is locked after creation to
              protect your saved progress.
            </p>

            <div className="mt-5 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-200">
              {goal.trackerType === "normal"
                ? "Normal Tracker"
                : "Complex AI Tracker"}
            </div>

            <form className="mt-8 space-y-5">
              <div>
                <label className="text-sm font-medium">Goal Name</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={
                    goalNameError
                      ? "mt-2 w-full rounded-xl border border-red-400 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-red-400"
                      : "mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
                  }
                />

                {goalNameError && (
                  <p className="mt-2 text-sm font-medium text-red-300">
                    {goalNameError}
                  </p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Goal Category</label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
                  >
                    <option>Career / Job</option>
                    <option>Fitness / Fat Burning</option>
                    <option>Education / Exam</option>
                    <option>English / Communication</option>
                    <option>Business / Money</option>
                    <option>Custom Goal</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Duration</label>
                  <select
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
                  >
                    <option>7 Days</option>
                    <option>30 Days</option>
                    <option>3 Months</option>
                    <option>6 Months</option>
                    <option>1 Year</option>
                    <option>4 Years</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                    className={
                      targetDateError
                        ? "mt-2 w-full rounded-xl border border-red-400 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-red-400"
                        : "mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
                    }
                  />

                  {targetDateError ? (
                    <p className="mt-2 text-sm font-medium text-red-300">
                      {targetDateError}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">
                      Target date must be a future date.
                    </p>
                  )}
                </div>
              </div>

              {goal.trackerType === "normal" && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Simple Target</label>
                   <input
                    value={normalTarget}
                    onChange={(event) => setNormalTarget(event.target.value)}
                    placeholder="Example: Save ₹100 this week"
                    className={
                      normalTargetError
                        ? "mt-2 w-full rounded-xl border border-red-400 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-red-400"
                        : "mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-emerald-400"
                    }
                  />

                  {normalTargetError && (
                    <p className="mt-2 text-sm font-medium text-red-300">
                      {normalTargetError}
                    </p>
                  )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Frequency</label>
                    <select
                      value={normalFrequency}
                      onChange={(event) =>
                        setNormalFrequency(
                          event.target.value as "daily" | "weekly"
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              )}

              {goal.trackerType === "complex" && (
                <>
                  <div>
                    <label className="text-sm font-medium">
                      Daily Available Time
                    </label>
                    <input
                      value={dailyTime}
                      onChange={(event) => setDailyTime(event.target.value)}
                      placeholder="Example: 4 hours daily"
                      className={
                        dailyTimeError
                          ? "mt-2 w-full rounded-xl border border-red-400 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-red-400"
                          : "mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
                      }
                    />

                    {dailyTimeError && (
                      <p className="mt-2 text-sm font-medium text-red-300">
                        {dailyTimeError}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Current Level</label>
                   <textarea
                    value={currentLevel}
                    onChange={(event) => setCurrentLevel(event.target.value)}
                    placeholder="Example: I know HTML, CSS, basic JS, but I am weak in DSA."
                    className={
                      currentLevelError
                        ? "mt-2 min-h-28 w-full rounded-xl border border-red-400 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-red-400"
                        : "mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
                    }
                  />

                  {currentLevelError && (
                    <p className="mt-2 text-sm font-medium text-red-300">
                      {currentLevelError}
                    </p>
                  )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Target Result</label>
                    <textarea
                      value={targetResult}
                      onChange={(event) => setTargetResult(event.target.value)}
                      placeholder="Example: I want to become Google SWE ready."
                      className={
                        targetResultError
                          ? "mt-2 min-h-28 w-full rounded-xl border border-red-400 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-red-400"
                          : "mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
                      }
                    />

                    {targetResultError && (
                      <p className="mt-2 text-sm font-medium text-red-300">
                        {targetResultError}
                      </p>
                    )}
                  </div>
                </>
              )}

             <button
                type="button"
                onClick={saveChanges}
                disabled={isSaving}
                className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>

              {message && (
                <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
                  {message}
                </div>
              )}
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
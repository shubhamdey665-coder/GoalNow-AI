"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Goal = {
  id: string;
  name: string;
  category: string;
  duration: string;
  priority?: string;
  dailyTime: string;
  currentLevel: string;
  targetResult: string;
  plan: string[];
  completedTasks: number[];
  createdAt: string;
};

export default function EditGoalPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Career / Job");
  const [duration, setDuration] = useState("7 Days");
  const [priority, setPriority] = useState("Medium");
  const [dailyTime, setDailyTime] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [targetResult, setTargetResult] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedGoals = localStorage.getItem("goalnow-goals");
    const goals: Goal[] = savedGoals ? JSON.parse(savedGoals) : [];

    const foundGoal = goals.find((item) => item.id === goalId);

    if (foundGoal) {
      setGoal(foundGoal);
      setName(foundGoal.name);
      setCategory(foundGoal.category);
      setDuration(foundGoal.duration);
      setPriority(foundGoal.priority || "Medium");
      setDailyTime(foundGoal.dailyTime);
      setCurrentLevel(foundGoal.currentLevel);
      setTargetResult(foundGoal.targetResult);
    }
  }, [goalId]);

  function saveChanges() {
    if (!goal) return;

    if (!name || !dailyTime || !currentLevel || !targetResult) {
      setMessage("Please fill all fields before saving.");
      return;
    }

    const savedGoals = localStorage.getItem("goalnow-goals");
    const goals: Goal[] = savedGoals ? JSON.parse(savedGoals) : [];

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
      name,
      category,
      duration,
      priority,
      dailyTime,
      currentLevel,
      targetResult,
    };

    const updatedGoals = goals.map((item) =>
      item.id === goal.id ? updatedGoal : item
    );

    localStorage.setItem("goalnow-goals", JSON.stringify(updatedGoals));

    router.push(`/goals/${goal.id}`);
  }

  if (!goal) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
            ← Back to Dashboard
          </Link>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8">
            <h1 className="text-3xl font-bold">Goal not found</h1>
            <p className="mt-3 text-zinc-400">
              This goal may have been deleted or not saved properly.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href={`/goals/${goal.id}`} className="text-sm text-zinc-400 hover:text-white">
          ← Back to Goal
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium text-blue-400">Edit Goal</p>
          <h1 className="mt-2 text-4xl font-bold">Update your goal</h1>
          <p className="mt-3 text-zinc-400">
            Change your goal details and save them.
          </p>
        </div>

        <form className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <label className="text-sm font-medium">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
            />
          </div>

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
            <label className="text-sm font-medium">Daily Available Time</label>
            <input
              type="text"
              value={dailyTime}
              onChange={(event) => setDailyTime(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Current Level</label>
            <textarea
              value={currentLevel}
              onChange={(event) => setCurrentLevel(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Target Result</label>
            <textarea
              value={targetResult}
              onChange={(event) => setTargetResult(event.target.value)}
              className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
            />
          </div>

          <button
            type="button"
            onClick={saveChanges}
            className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
          >
            Save Changes
          </button>

          {message && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {message}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
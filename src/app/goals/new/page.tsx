"use client";

import Link from "next/link";
import { useState } from "react";

export default function NewGoalPage() {
  const [goalName, setGoalName] = useState("");
  const [category, setCategory] = useState("Career / Job");
  const [duration, setDuration] = useState("7 Days");
  const [dailyTime, setDailyTime] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [targetResult, setTargetResult] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const progressPercentage =
  plan.length === 0 ? 0 : Math.round((completedTasks.length / plan.length) * 100);

  function handleGeneratePlan() {
    if (!goalName || !dailyTime || !currentLevel || !targetResult) {
      setMessage("Please fill all fields before generating your AI plan.");
      setPlan([]);
      setCompletedTasks([]);
      return;
    }

    const samplePlan = [
      `Day 1: Understand your goal "${goalName}" and prepare your study/work setup.`,
      `Day 2: Learn or revise the most basic foundation required for ${category}.`,
      `Day 3: Practice one small task for your goal for ${dailyTime}.`,
      `Day 4: Revise Day 1 to Day 3 and fix weak points.`,
      `Day 5: Complete one mini practical project or workout/task session.`,
      `Day 6: Take a short self-test and write mistakes.`,
      `Day 7: Weekly review, progress report, and next-week planning.`,
    ];

    setPlan(samplePlan);
    setCompletedTasks([]);
    setMessage(`Your 7-day starter plan for ${goalName} is ready.`);
  }

  function toggleTask(index: number) {
    if (completedTasks.includes(index)) {
      setCompletedTasks(completedTasks.filter((taskIndex) => taskIndex !== index));
    } else {
      setCompletedTasks([...completedTasks, index]);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
          ← Back to Dashboard
        </Link>

        <div className="mt-8">
          <p className="text-sm font-medium text-blue-400">Create Goal</p>
          <h1 className="mt-2 text-4xl font-bold">Tell AI your goal</h1>
          <p className="mt-3 text-zinc-400">
            Fill these details. Later, AI will create your daily plan, weekly tracker,
            tests, and progress report from this information.
          </p>
        </div>

        <form className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <label className="text-sm font-medium">Goal Name</label>
            <input
              type="text"
              value={goalName}
              onChange={(event) => setGoalName(event.target.value)}
              placeholder="Example: Google SWE Preparation"
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
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
            <label className="text-sm font-medium">Daily Available Time</label>
            <input
              type="text"
              value={dailyTime}
              onChange={(event) => setDailyTime(event.target.value)}
              placeholder="Example: 4 hours daily"
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Current Level</label>
            <textarea
              value={currentLevel}
              onChange={(event) => setCurrentLevel(event.target.value)}
              placeholder="Example: I know basic HTML, CSS, Python basics, but weak in DSA."
              className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Target Result</label>
            <textarea
              value={targetResult}
              onChange={(event) => setTargetResult(event.target.value)}
              placeholder="Example: I want to become job-ready for Google SWE role."
              className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
            />
          </div>

          <button
            type="button"
            onClick={handleGeneratePlan}
            className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
          >
            Generate AI Plan
          </button>

          {message && (
            <div className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-4 text-sm text-blue-200">
              {message}
            </div>
          )}

          {plan.length > 0 && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <h2 className="text-xl font-bold">Your 7-Day AI Starter Plan</h2>

             <div className="space-y-2">
  <div className="flex justify-between text-sm text-zinc-400">
    <span>
      Completed: {completedTasks.length} / {plan.length}
    </span>
    <span>{progressPercentage}% complete</span>
  </div>

  <div className="h-3 rounded-full bg-zinc-800">
    <div
      className="h-3 rounded-full bg-blue-400 transition-all"
      style={{ width: `${progressPercentage}%` }}
    />
  </div>
</div>

              <div className="space-y-3">
                {plan.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-200"
                  >
                    <input
                      type="checkbox"
                      checked={completedTasks.includes(index)}
                      onChange={() => toggleTask(index)}
                      className="mt-1 h-4 w-4"
                    />

                    <p
                      className={
                        completedTasks.includes(index)
                          ? "text-zinc-500 line-through"
                          : "text-zinc-200"
                      }
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
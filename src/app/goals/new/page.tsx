"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  createGoalInSupabase,
  getGoalsFromSupabase,
} from "@/lib/goals/supabaseGoals";
import {
  convertAiPlanToComplexPlanDays,
  generateComplexStarterPlan,
  getPlanDayCount,
} from "@/lib/planGenerator";
import type { Goal } from "@/types/goal";

export default function NewGoalPage() {
  const [goalName, setGoalName] = useState("");
  const [category, setCategory] = useState("Career / Job");
  const [duration, setDuration] = useState("1 Year");
  const [priority, setPriority] = useState("Medium");
  const [targetDate, setTargetDate] = useState("");
  const [dailyTime, setDailyTime] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [targetResult, setTargetResult] = useState("");
  const [message, setMessage] = useState("");
  const [plan, setPlan] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [goalSaved, setGoalSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [trackerType, setTrackerType] = useState<"normal" | "complex">("complex");
  const [normalTarget, setNormalTarget] = useState("");
  const [normalFrequency, setNormalFrequency] = useState<"daily" | "weekly">("daily");
  const goalNameError =
  goalName.trim().length > 0 && goalName.trim().length < 3
    ? "Goal name must be at least 3 characters."
    : "";
  let targetDateError = "";

  if (targetDate) {
    const today = new Date();
    const selectedDate = new Date(targetDate);

    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() <= today.getTime()) {
      targetDateError = "Please choose a future target date.";
    }
  }
  const progressPercentage =
  plan.length === 0 ? 0 : Math.round((completedTasks.length / plan.length) * 100);

  function useGoalTemplate(templateName: string) {
      const templateDuration = "1 Year";
      const targetDateFromDuration = new Date();
      targetDateFromDuration.setDate(
        targetDateFromDuration.getDate() + getPlanDayCount(templateDuration)
      );
      const formattedTargetDate = targetDateFromDuration.toISOString().split("T")[0];
    if (templateName === "google") {
      setGoalName("Google SWE Preparation");
      setCategory("Career / Job");
      setDuration(templateDuration);
      setPriority("High");
      setTargetDate(formattedTargetDate);
      setDailyTime("4 hours daily");
      setCurrentLevel("I know basic HTML, CSS, and Python. I am weak in DSA.");
      setTargetResult("I want to become job-ready for a Google SWE role.");
    }

    if (templateName === "fat-burning") {
      setGoalName("Fat Burning");
      setCategory("Fitness / Fat Burning");
      setDuration(templateDuration);
      setPriority("High");
      setTargetDate(formattedTargetDate);
      setDailyTime("1 hour daily");
      setCurrentLevel("I am a beginner and want to improve my fitness routine.");
      setTargetResult("I want to lose fat safely and build a consistent healthy routine.");
    }

    if (templateName === "english") {
      setGoalName("English Mastery");
      setCategory("English / Communication");
      setDuration(templateDuration);
      setPriority("Medium");
      setTargetDate(formattedTargetDate);
      setDailyTime("30 minutes daily");
      setCurrentLevel("I know basic English but I want to improve grammar and speaking.");
      setTargetResult("I want to speak English confidently and improve communication.");
    }

    if (templateName === "business") {
      setGoalName("Business Growth");
      setCategory("Business / Money");
      setDuration(templateDuration);
      setPriority("Medium");
      setTargetDate(formattedTargetDate);
      setDailyTime("1 hour daily");
      setCurrentLevel("I have a small business idea and want to plan growth steps.");
      setTargetResult("I want to improve sales, planning, and daily business execution.");
    }

    if (templateName === "exam") {
      setGoalName("Exam Preparation");
      setCategory("Education / Exam");
      setDuration(templateDuration);
      setPriority("High");
      setTargetDate(formattedTargetDate);
      setDailyTime("3 hours daily");
      setCurrentLevel("I have basic knowledge but need a structured revision plan.");
      setTargetResult("I want to prepare consistently and score better in my exam.");
    }

  setMessage("Template filled. You can edit it or generate the plan.");
  setPlan([]);
  setCompletedTasks([]);
}
  function resetForm() {
    setGoalName("");
    setCategory("Career / Job");
    setDuration("1 Year");
    setPriority("Medium");
    setTargetDate("");
    setDailyTime("");
    setCurrentLevel("");
    setTargetResult("");
    setMessage("");
    setPlan([]);
    setCompletedTasks([]);
    setGoalSaved(false);
    setTrackerType("complex");
    setNormalTarget("");
    setNormalFrequency("daily");
      }
  function validateGoalForm() {
    if (!goalName.trim()) {
      return "Please enter a goal name.";
    }

    if (trackerType === "normal") {
      if (!normalTarget.trim()) {
        return "Please enter your simple tracker target.";
      }

      if (goalName.trim().length < 3) {
        return "Goal name must be at least 3 characters.";
      }

      if (targetDateError) {
        return targetDateError;
      }

      return "";
    }

    if (!dailyTime.trim() || !currentLevel.trim() || !targetResult.trim()) {
      return "Please fill all required fields before generating your AI plan.";
    }

    if (goalName.trim().length < 3) {
      return "Goal name must be at least 3 characters.";
    }

    if (dailyTime.trim().length < 3) {
      return "Daily available time must be at least 3 characters.";
    }

    if (currentLevel.trim().length < 10) {
      return "Current level must be at least 10 characters.";
    }

    if (targetResult.trim().length < 10) {
      return "Target result must be at least 10 characters.";
    }

    if (targetDateError) {
      return targetDateError;
    }
    return "";
  }
  async function handleGeneratePlan() {
  if (goalNameError) {
    setMessage(goalNameError);
    setPlan([]);
    setCompletedTasks([]);
    setGoalSaved(false);
    return;
  }

  if (targetDateError) {
    setMessage(targetDateError);
    setPlan([]);
    setCompletedTasks([]);
    setGoalSaved(false);
    return;
  }

  const validationError = validateGoalForm();

  if (validationError) {
    setMessage(validationError);
    setPlan([]);
    setCompletedTasks([]);
    setGoalSaved(false);
    return;
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
      setPlan([]);
      setCompletedTasks([]);
      setGoalSaved(false);
      return;
    }

    const duplicateGoal = goals.find(
      (goal) =>
        goal.name.toLowerCase().trim() === goalName.toLowerCase().trim()
    );

    if (duplicateGoal) {
      setMessage("A goal with this name already exists. Please use a different name.");
      setPlan([]);
      setCompletedTasks([]);
      setGoalSaved(false);
      return;
    }

  setIsGenerating(true);

  let complexPlanDays =
    trackerType === "complex"
      ? generateComplexStarterPlan(
          goalName,
          category,
          duration,
          dailyTime,
          currentLevel,
          targetResult
        )
      : undefined;

  if (trackerType === "complex") {
    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalName,
          category,
          duration,
          dailyTime,
          currentLevel,
          targetResult,
        }),
      });

      const data = await response.json();

     if (response.ok && data.planDays) {
      complexPlanDays = convertAiPlanToComplexPlanDays(
        data.planDays,
        duration,
        dailyTime
      );
    } else {
        console.warn("Gemini plan failed, using local fallback plan:", data.error);
      }
    } catch (error) {
      console.warn("Gemini plan failed, using local fallback plan:", error);
    }
  }
if (trackerType === "complex" && complexPlanDays) {
  const expectedDayCount = getPlanDayCount(duration);

  if (complexPlanDays.length !== expectedDayCount) {
    complexPlanDays = convertAiPlanToComplexPlanDays(
      complexPlanDays.map((day) => ({
        dayNumber: day.dayNumber,
        title: day.title,
        focus: day.focus,
        tasks: day.tasks.map((task) => task.title),
      })),
      duration,
      dailyTime
    );
  }

  console.log("GoalNow final saved plan days:", complexPlanDays.length);
}
  const newGoal: Goal = {
    id: Date.now().toString(),
    name: goalName,
    category,
    trackerType,

    duration,
    priority,
    targetDate,

    dailyTime: trackerType === "complex" ? dailyTime : undefined,
    currentLevel: trackerType === "complex" ? currentLevel : undefined,
    targetResult: trackerType === "complex" ? targetResult : undefined,

    normalTarget: trackerType === "normal" ? normalTarget : undefined,
    normalFrequency: trackerType === "normal" ? normalFrequency : undefined,
    normalCheckIns: trackerType === "normal" ? [] : undefined,

    complexPlanDays,
    activeDayNumber: trackerType === "complex" ? 1 : undefined,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
  };

  let savedGoal: Goal;

    try {
      savedGoal = await createGoalInSupabase(newGoal);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save your goal to Supabase."
      );
      setGoalSaved(false);
      setIsGenerating(false);
      return;
    }
 if (trackerType === "complex") {
  const previewPlan =
    savedGoal.complexPlanDays?.map(
      (day) => `Day ${day.dayNumber}: ${day.title} - ${day.focus}`
    ) || [];

  setPlan(previewPlan);
  setMessage(
    `Your complex AI tracker for ${savedGoal.name} is saved successfully with a real Gemini-generated plan.`
  );
} else {
  setPlan([]);
  setMessage(`Your normal tracker for ${savedGoal.name} is saved successfully.`);
}

  setCompletedTasks([]);
  setGoalSaved(true);
  setIsGenerating(false);
}
  function toggleTask(index: number) {
    if (completedTasks.includes(index)) {
      setCompletedTasks(completedTasks.filter((taskIndex) => taskIndex !== index));
    } else {
      setCompletedTasks([...completedTasks, index]);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
          ← Back to Dashboard
        </Link>

      <div className="mt-8 space-y-6">
        <div>
          <p className="text-sm font-medium text-blue-400">Create Goal</p>
          <h1 className="mt-2 text-4xl font-bold">Tell AI your goal</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Fill these details. Later, AI will create your daily plan, weekly tracker,
            tests, and progress report from this information.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold text-white">Goal Templates</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Choose a template to auto-fill the form. You can edit everything before generating the plan.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => useGoalTemplate("google")}
              className="rounded-xl border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-400/20"
            >
              Google SWE
            </button>

            <button
              type="button"
              onClick={() => useGoalTemplate("fat-burning")}
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
            >
              Fat Burning
            </button>

            <button
              type="button"
              onClick={() => useGoalTemplate("english")}
              className="rounded-xl border border-purple-400/30 bg-purple-400/10 px-4 py-2 text-sm font-semibold text-purple-300 transition hover:bg-purple-400/20"
            >
              English
            </button>

            <button
              type="button"
              onClick={() => useGoalTemplate("business")}
              className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-400/20"
            >
              Business
            </button>

            <button
              type="button"
              onClick={() => useGoalTemplate("exam")}
              className="rounded-xl border border-pink-400/30 bg-pink-400/10 px-4 py-2 text-sm font-semibold text-pink-300 transition hover:bg-pink-400/20"
            >
              Exam
            </button>
          </div>
        </div>
      </div>
        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            {
              title: "1. Fill Goal",
              text: "Tell the app your goal, current level, time, and target result.",
            },
            {
              title: "2. Generate Plan",
              text: "Create a roadmap plan upto 1 yearbased on your goal details.",
            },
            {
              title: "3. Track Tasks",
              text: "Tick daily tasks and see your progress percentage update.",
            },
            {
              title: "4. Review Progress",
              text: "Use reports, tests, and mentor guidance to improve your plan.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="font-bold">{step.title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{step.text}</p>
            </div>
          ))}
        </section>

        <form className="mt-8 space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-xl font-bold">Choose Tracker Type</h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setTrackerType("normal")}
                  className={
                    trackerType === "normal"
                      ? "rounded-xl border border-emerald-400 bg-emerald-400/20 p-4 text-left"
                      : "rounded-xl border border-white/10 bg-zinc-900 p-4 text-left"
                  }
                >
                  <h3 className="font-bold">Normal Tracker</h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    Best for saving money, drinking water, walking, reading, and simple habits.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTrackerType("complex")}
                  className={
                    trackerType === "complex"
                      ? "rounded-xl border border-blue-400 bg-blue-400/20 p-4 text-left"
                      : "rounded-xl border border-white/10 bg-zinc-900 p-4 text-left"
                  }
                >
                  <h3 className="font-bold">Complex AI Tracker</h3>
                  <p className="mt-2 text-sm text-zinc-400">
                    Best for Google job preparation, exams, English, fitness, and long goals.
                  </p>
                </button>
              </div>
            </div>
            <label className="text-sm font-medium">Goal Name</label>
            <input
              type="text"
              value={goalName}
              onChange={(event) => setGoalName(event.target.value)}
              placeholder="Example: Google SWE Preparation"
              className={
                goalNameError
                  ? "mt-2 w-full rounded-xl border border-red-400 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-red-400"
                  : "mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
              }
            />

            {goalNameError && (
              <p className="mt-2 text-sm text-red-300">{goalNameError}</p>
            )}
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
            <label className="text-sm font-medium">Target Date</label>
            <input
              type="date"
              value={targetDate}
              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
              onChange={(event) => setTargetDate(event.target.value)}
              className={
                targetDateError
                  ? "mt-2 w-full rounded-xl border border-red-400 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-red-400"
                  : "mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-blue-400"
              }
            />

            {targetDateError && (
              <p className="mt-2 text-sm text-red-300">{targetDateError}</p>
            )}
          </div>

          
            {trackerType === "normal" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Simple Target</label>
                  <input
                    value={normalTarget}
                    onChange={(event) => setNormalTarget(event.target.value)}
                    placeholder="Example: Save ₹100 this week"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Frequency</label>
                  <select
                    value={normalFrequency}
                    onChange={(event) =>
                      setNormalFrequency(event.target.value as "daily" | "weekly")
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-emerald-400"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            )}
        {trackerType === "complex" && (
        <>
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
         </>
        )}

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating
                ? "Generating..."
                : trackerType === "normal"
                ? "Create Normal Tracker"
                : "Generate AI Plan"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20"
            >
              Reset Form
            </button>
          </div>

          {message && (
            <div className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-4 text-sm text-blue-200">
              {message}
            </div>
          )}
          {goalSaved && (
            <Link
              href="/dashboard"
              className="block rounded-xl bg-blue-500 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-600"
            >
              Go to Dashboard
            </Link>
          )}

          {plan.length > 0 && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-zinc-900 p-5">
              <h2 className="text-xl font-bold">Your AI Plan Preview</h2>

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
      <Footer />
    </>
  );
}
"use client";

import Link from "next/link";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import ConfirmModal from "@/components/ConfirmModal";
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
  const router = useRouter();
  const [goalName, setGoalName] = useState("");
  const [category, setCategory] = useState("Career / Job");
  const [duration, setDuration] = useState("1 Year");
  const [priority, setPriority] = useState("Medium");
  const [targetDate, setTargetDate] = useState("");
  const [dailyTime, setDailyTime] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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

function applyGoalTemplate(templateName: string) {
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
      function askResetForm() {
  setShowResetConfirm(true);
}

function confirmResetForm() {
  resetForm();
  setShowResetConfirm(false);
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
  if (isGenerating || goalSaved) return;

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

  setIsGenerating(true);
  setMessage("");

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
    setIsGenerating(false);
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
    setIsGenerating(false);
    return;
  }

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
  `Your complex AI tracker for ${savedGoal.name} is saved successfully. Opening your tracker...`
);
} else {
  setPlan([]);
  setMessage(`Your normal tracker for ${savedGoal.name} is saved successfully. Opening your tracker...`);
}

  setCompletedTasks([]);
  setGoalSaved(true);
  
  setTimeout(() => {
  router.push(`/goals/${savedGoal.id}`);
  router.refresh();
}, 900);
}
  function toggleTask(index: number) {
    if (completedTasks.includes(index)) {
      setCompletedTasks(completedTasks.filter((taskIndex) => taskIndex !== index));
    } else {
      setCompletedTasks([...completedTasks, index]);
    }
  }
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const minTargetDate = tomorrowDate.toISOString().split("T")[0];
return (
  <>
    <Navbar />

    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-10">
      <section className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                Create New Goal
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Build your personal goal system.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                Choose a simple Normal Tracker for habits, or a Complex AI
                Tracker for serious long-term goals with roadmap, daily tasks,
                weekly tests, reports, and mentor support.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm text-slate-400">Step 1</p>
                <p className="mt-1 font-black text-white">Choose tracker</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm text-slate-400">Step 2</p>
                <p className="mt-1 font-black text-white">Fill details</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-4">
                <p className="text-sm text-slate-400">Step 3</p>
                <p className="mt-1 font-black text-white">Save tracker</p>
              </div>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-black">Quick Templates</h2>
              <p className="mt-2 text-sm text-slate-400">
                Select a template to auto-fill the form. You can edit all fields
                before saving.
              </p>
            </div>

           <button
  type="button"
  onClick={askResetForm}
  className="w-fit rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
>
  Reset Form
</button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                id: "google",
                title: "Google SWE",
                icon: "💻",
                style: "border-blue-400/30 bg-blue-400/10 text-blue-200",
              },
              {
                id: "fat-burning",
                title: "Fat Burning",
                icon: "🔥",
                style:
                  "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
              },
              {
                id: "english",
                title: "English",
                icon: "🗣️",
                style:
                  "border-purple-400/30 bg-purple-400/10 text-purple-200",
              },
              {
                id: "business",
                title: "Business",
                icon: "💼",
                style:
                  "border-yellow-400/30 bg-yellow-400/10 text-yellow-200",
              },
              {
                id: "exam",
                title: "Exam",
                icon: "📚",
                style: "border-pink-400/30 bg-pink-400/10 text-pink-200",
              },
            ].map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyGoalTemplate(template.id)}
                className={`rounded-2xl border p-4 text-left transition hover:-translate-y-1 ${template.style}`}
              >
                <span className="text-2xl">{template.icon}</span>
                <p className="mt-2 text-sm font-black">{template.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Layout */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Left Info / Tracker Type */}
          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-6">
              <h2 className="text-2xl font-black">Choose Tracker Type</h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Pick the system that matches your goal. You can use simple
                tracking or AI roadmap tracking.
              </p>

              <div className="mt-5 grid gap-4">
                <button
                  type="button"
                  onClick={() => setTrackerType("normal")}
                  className={
                    trackerType === "normal"
                      ? "rounded-3xl border border-emerald-400 bg-emerald-400/15 p-5 text-left shadow-lg shadow-emerald-500/10"
                      : "rounded-3xl border border-white/10 bg-slate-950 p-5 text-left transition hover:bg-white/5"
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-xl font-black text-slate-950">
                      N
                    </div>

                    <div>
                      <h3 className="text-lg font-black">Normal Tracker</h3>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Best for habits and simple goals like saving money,
                        reading, walking, workout, drinking water, or daily
                        practice.
                      </p>

                      <p className="mt-3 text-xs font-bold text-emerald-300">
                        Calendar + streak + future day lock
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTrackerType("complex")}
                  className={
                    trackerType === "complex"
                      ? "rounded-3xl border border-cyan-400 bg-cyan-400/15 p-5 text-left shadow-lg shadow-cyan-500/10"
                      : "rounded-3xl border border-white/10 bg-slate-950 p-5 text-left transition hover:bg-white/5"
                  }
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950">
                      AI
                    </div>

                    <div>
                      <h3 className="text-lg font-black">Complex AI Tracker</h3>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Best for long-term serious goals like coding job prep,
                        exams, English mastery, business growth, or full
                        transformation goals.
                      </p>

                      <p className="mt-3 text-xs font-bold text-cyan-300">
                        AI roadmap + daily plan + weekly test + report
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 md:p-6">
              <h2 className="text-xl font-black">What happens next?</h2>

              <div className="mt-5 space-y-4">
                {trackerType === "normal" ? (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="font-bold text-white">1. Save tracker</p>
                      <p className="mt-1 text-sm text-slate-400">
                        A simple habit tracker will be created.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="font-bold text-white">2. Mark daily</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Tick today or past dates on the calendar.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="font-bold text-white">3. Build streak</p>
                      <p className="mt-1 text-sm text-slate-400">
                        See completed days and missed streak breaks.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="font-bold text-white">1. Generate plan</p>
                      <p className="mt-1 text-sm text-slate-400">
                        AI creates your daily roadmap based on your inputs.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="font-bold text-white">2. Follow active day</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Complete today&apos;s tasks to unlock the next day.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="font-bold text-white">3. Improve weekly</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Use mentor, weekly test, and progress report.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>
          </aside>

          {/* Right Form */}
          <form className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl md:p-6">
            <div className="mb-6">
              <p className="text-sm font-bold text-cyan-300">
                {trackerType === "normal"
                  ? "Normal Tracker Setup"
                  : "Complex AI Tracker Setup"}
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Fill your goal details
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Fields with clear details help GoalNow-AI create a better
                tracker experience.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-bold text-slate-200">
                  Goal Name
                </label>

                <input
                  type="text"
                  value={goalName}
                  onChange={(event) => setGoalName(event.target.value)}
                  placeholder={
                    trackerType === "normal"
                      ? "Example: Save ₹100 every week"
                      : "Example: Google SWE Preparation"
                  }
                  className={
                    goalNameError
                      ? "mt-2 w-full rounded-2xl border border-red-400 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-red-400"
                      : "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                  }
                />

                {goalNameError && (
                  <p className="mt-2 text-sm text-red-300">{goalNameError}</p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-200">
                    Goal Category
                  </label>

                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
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
                  <label className="text-sm font-bold text-slate-200">
                    Priority Level
                  </label>

                  <select
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-200">
                    Duration
                  </label>

                  <select
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                  >
                    <option>7 Days</option>
                    <option>30 Days</option>
                    <option>3 Months</option>
                    <option>6 Months</option>
                    <option>1 Year</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-200">
                    Target Date
                  </label>

                  <input
                    type="date"
                    value={targetDate}
                    min={minTargetDate}
                    onChange={(event) => setTargetDate(event.target.value)}
                    className={
                      targetDateError
                        ? "mt-2 w-full rounded-2xl border border-red-400 bg-slate-950 px-4 py-3 text-white outline-none focus:border-red-400"
                        : "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    }
                  />

                  {targetDateError && (
                    <p className="mt-2 text-sm text-red-300">
                      {targetDateError}
                    </p>
                  )}
                </div>
              </div>

              {trackerType === "normal" && (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                  <h3 className="text-lg font-black text-emerald-200">
                    Normal Tracker Details
                  </h3>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-bold text-slate-200">
                        Simple Target
                      </label>

                      <input
                        value={normalTarget}
                        onChange={(event) =>
                          setNormalTarget(event.target.value)
                        }
                        placeholder="Example: Save ₹100 this week"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-200">
                        Frequency
                      </label>

                      <select
                        value={normalFrequency}
                        onChange={(event) =>
                          setNormalFrequency(
                            event.target.value as "daily" | "weekly"
                          )
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-400"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {trackerType === "complex" && (
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                  <h3 className="text-lg font-black text-cyan-200">
                    AI Plan Details
                  </h3>

                  <div className="mt-5 space-y-5">
                    <div>
                      <label className="text-sm font-bold text-slate-200">
                        Daily Available Time
                      </label>

                      <input
                        type="text"
                        value={dailyTime}
                        onChange={(event) => setDailyTime(event.target.value)}
                        placeholder="Example: 4 hours daily"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-200">
                        Current Level
                      </label>

                      <textarea
                        value={currentLevel}
                        onChange={(event) =>
                          setCurrentLevel(event.target.value)
                        }
                        placeholder="Example: I know HTML, CSS, basic Python, but I am weak in DSA."
                        className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-200">
                        Target Result
                      </label>

                      <textarea
                        value={targetResult}
                        onChange={(event) =>
                          setTargetResult(event.target.value)
                        }
                        placeholder="Example: I want to become job-ready for Google SWE role."
                        className="mt-2 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={handleGeneratePlan}
                  disabled={isGenerating || goalSaved}
                  className={
                    trackerType === "normal"
                      ? "rounded-2xl bg-emerald-400 px-5 py-4 font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                      : "rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  }
                >
                  {goalSaved
                    ? "Goal Created"
                    : isGenerating
                    ? "Creating..."
                    : trackerType === "normal"
                    ? "Create Normal Tracker"
                    : "Generate AI Tracker"}
                </button>

               <button
  type="button"
  onClick={askResetForm}
  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold text-white transition hover:bg-white/20"
>
  Reset Form
</button>
              </div>

              {message && (
                <div
                  className={
                    goalSaved
                      ? "rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200"
                      : "rounded-2xl border border-blue-400/30 bg-blue-400/10 p-4 text-sm text-blue-200"
                  }
                >
                  {message}
                </div>
              )}

              {goalSaved && (
                <div className="grid gap-3 md:grid-cols-2">
                  <Link
                    href="/dashboard"
                    className="rounded-2xl bg-white px-5 py-4 text-center font-black text-slate-950 transition hover:bg-slate-200"
                  >
                    Go to Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 font-bold text-white transition hover:bg-white/20"
                  >
                    Create Another Goal
                  </button>
                </div>
              )}

              {plan.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-slate-950 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-black">
                        AI Plan Preview
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        This preview is already saved. Open the goal from the
                        dashboard to track it daily.
                      </p>
                    </div>

                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-bold text-cyan-200">
                      {plan.length} days
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm text-slate-400">
                      <span>
                        Completed: {completedTasks.length} / {plan.length}
                      </span>
                      <span>{progressPercentage}% complete</span>
                    </div>

                    <div className="h-3 rounded-full bg-slate-800">
                      <div
                        className="h-3 rounded-full bg-cyan-400 transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto pr-2">
                    {plan.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"
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
                              ? "text-slate-500 line-through"
                              : "text-slate-200"
                          }
                        >
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>

     <Footer />

    <ConfirmModal
      isOpen={showResetConfirm}
      title="Reset this form?"
      message="This will clear your current goal name, tracker type, target date, plan preview, and all form details. Use this only if you want to start again."
      confirmText="Yes, Reset"
      cancelText="Cancel"
      icon="↻"
      tone="danger"
      isLoading={false}
      onCancel={() => setShowResetConfirm(false)}
      onConfirm={confirmResetForm}
    />
  </>
);
}
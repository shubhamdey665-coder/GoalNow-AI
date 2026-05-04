"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  getGoalByIdFromSupabase,
  updateGoalInSupabase,
} from "@/lib/goals/supabaseGoals";
import type { Goal } from "@/types/goal";

type ChatMessage = {
  role: "user" | "mentor";
  text: string;
};

const defaultMentorMessage: ChatMessage = {
  role: "mentor",
  text: "Hi, I am your GoalNow AI Mentor. Ask me about your goal, weak points, daily plan, revision, or next best action.",
};

export default function MentorPage() {
  const params = useParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [mentorError, setMentorError] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    defaultMentorMessage,
  ]);
  const [isMentorThinking, setIsMentorThinking] = useState(false);
  const [mentorSource, setMentorSource] = useState<"gemini" | "fallback">(
    "fallback"
  );

  useEffect(() => {
  let isMounted = true;

  async function loadGoal() {
    setIsLoadingGoal(true);
    setMentorError("");

    try {
      const foundGoal = await getGoalByIdFromSupabase(goalId);

      if (!isMounted) return;

      if (!foundGoal) {
        setGoal(null);
        setMessages([defaultMentorMessage]);
        return;
      }

      setGoal(foundGoal);

      if (foundGoal.mentorMessages && foundGoal.mentorMessages.length > 0) {
        setMessages(foundGoal.mentorMessages);
      } else {
        setMessages([defaultMentorMessage]);
      }
    } catch (error) {
      if (!isMounted) return;

      setGoal(null);
      setMentorError(
        error instanceof Error ? error.message : "Could not load AI mentor."
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

  function getGoalStats() {
    if (!goal) {
      return {
        completed: 0,
        total: 0,
        progress: 0,
        activeDayText: "Not available",
        nextAction: "Create a goal first.",
      };
    }

    if (goal.trackerType === "normal") {
      const checkIns = goal.normalCheckIns || [];
      const completed = checkIns.filter((item) => item.completed).length;
      const total = checkIns.length;
      const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

      return {
        completed,
        total,
        progress,
        activeDayText: "Normal calendar tracker",
        nextAction:
          "Tick today's habit once. Keep the target small and consistent.",
      };
    }

    const planDays = goal.complexPlanDays || [];
    const completed = planDays.filter((day) => day.completed).length;
    const total = planDays.length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const activeDay = planDays.find(
      (day) => day.dayNumber === goal.activeDayNumber
    );

    const firstPendingTask = activeDay?.tasks.find((task) => !task.completed);

    return {
      completed,
      total,
      progress,
      activeDayText: activeDay
        ? `Day ${activeDay.dayNumber}: ${activeDay.title}`
        : `Day ${goal.activeDayNumber || 1}`,
      nextAction: firstPendingTask
        ? firstPendingTask.title
        : "Review your completed day and prepare for the next active day.",
    };
  }

  function createMentorReply(userText: string) {
    if (!goal) return "Please open a saved goal first.";

    const stats = getGoalStats();
    const lowerText = userText.toLowerCase();

    if (goal.trackerType === "normal") {
      if (
        lowerText.includes("progress") ||
        lowerText.includes("report") ||
        lowerText.includes("how")
      ) {
        return `For your normal tracker "${goal.name}", your progress is ${stats.progress}%. You have completed ${stats.completed}/${stats.total} ticks. Your best action now is: ${stats.nextAction}`;
      }

      if (
        lowerText.includes("miss") ||
        lowerText.includes("streak") ||
        lowerText.includes("break")
      ) {
        return `For a normal habit tracker, missing one day is not the end. Tick today first, then edit old dates only if you honestly completed them. Your current progress is ${stats.progress}%.`;
      }

      return `For "${goal.name}", keep it simple. Your next best action is: ${stats.nextAction}`;
    }

    if (
      lowerText.includes("next") ||
      lowerText.includes("today") ||
      lowerText.includes("do")
    ) {
      return `For your complex tracker "${goal.name}", you are currently on ${stats.activeDayText}. Your next best action is: ${stats.nextAction}`;
    }

    if (
      lowerText.includes("progress") ||
      lowerText.includes("report") ||
      lowerText.includes("how")
    ) {
      return `Your current progress is ${stats.progress}%. You have completed ${stats.completed}/${stats.total} plan days. Do not rush. Complete the current active day first, then move forward.`;
    }

    if (
      lowerText.includes("miss") ||
      lowerText.includes("streak") ||
      lowerText.includes("break")
    ) {
      return `If you miss a study day, your learning Day number should not move forward. Continue from ${stats.activeDayText}. This keeps your preparation honest and realistic.`;
    }

    if (
      lowerText.includes("weak") ||
      lowerText.includes("problem") ||
      lowerText.includes("improve")
    ) {
      return `Your weak area should be found from incomplete tasks. First complete: ${stats.nextAction}. After that, revise for 15 minutes and write one mistake note.`;
    }

    return `For "${goal.name}", focus on ${stats.activeDayText}. Your next best action is: ${stats.nextAction}`;
  }
  async function createGeminiMentorReply(userText: string) {
  if (!goal) {
    return createMentorReply(userText);
  }

  const stats = getGoalStats();

  try {
    const response = await fetch("/api/generate-mentor-reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goalName: goal.name,
        category: goal.category,
        currentLevel: goal.currentLevel,
        targetResult: goal.targetResult,
        dailyTime: goal.dailyTime,
        activeDayText: stats.activeDayText,
        nextAction: stats.nextAction,
        progress: stats.progress,
        completed: stats.completed,
        total: stats.total,
        userMessage: userText,
      }),
    });

    const data = await response.json();

    if (response.ok && data.reply) {
      setMentorSource("gemini");
      return data.reply as string;
    }

    console.warn("Gemini mentor failed, using fallback mentor:", data.error);
    setMentorSource("fallback");
    return createMentorReply(userText);
  } catch (error) {
    console.warn("Gemini mentor failed, using fallback mentor:", error);
    setMentorSource("fallback");
    return createMentorReply(userText);
  }
}

  async function sendMessage() {
  if (!goal) return;
  if (!input.trim()) return;
  if (isMentorThinking) return;

  const userText = input.trim();

  const userMessage: ChatMessage = {
    role: "user",
    text: userText,
  };

  const temporaryMessages = [...messages, userMessage];

  setMessages(temporaryMessages);
  setInput("");
  setIsMentorThinking(true);

  const mentorReplyText = await createGeminiMentorReply(userText);

  const mentorReply: ChatMessage = {
    role: "mentor",
    text: mentorReplyText,
  };

  const updatedMessages = [...temporaryMessages, mentorReply];

  const updatedGoal: Goal = {
    ...goal,
    mentorMessages: updatedMessages,
    updatedAt: new Date().toISOString(),
  };

  try {
  const savedGoal = await updateGoalInSupabase(updatedGoal);
  setGoal(savedGoal);
  setMessages(updatedMessages);
  setMentorError("");
} catch (error) {
  setMessages(temporaryMessages);
  setMentorError(
    error instanceof Error ? error.message : "Could not save mentor chat."
  );
} finally {
  setIsMentorThinking(false);
}
}

  async function clearChat() {
    if (!goal) return;

    const confirmClear = window.confirm("Clear mentor chat history?");
    if (!confirmClear) return;

    const updatedGoal: Goal = {
      ...goal,
      mentorMessages: [defaultMentorMessage],
      updatedAt: new Date().toISOString(),
    };

    try {
  const savedGoal = await updateGoalInSupabase(updatedGoal);
  setGoal(savedGoal);
  setMessages([defaultMentorMessage]);
  setMentorError("");
} catch (error) {
  setMentorError(
    error instanceof Error ? error.message : "Could not clear mentor chat."
  );
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
            <h1 className="text-3xl font-black">Loading AI Mentor...</h1>
            <p className="mt-3 text-zinc-400">
              Fetching mentor chat from your Supabase account.
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
                This mentor page needs a saved goal first.
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
              <h1 className="text-3xl font-black">AI Mentor is for Complex Goals</h1>
              <p className="mt-3 text-zinc-400">
                Normal trackers are simple calendar ticking goals. AI Mentor is
                mainly useful for complex goals like Google job preparation,
                exams, English learning, fitness, or business training.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  const stats = getGoalStats();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <section className="mx-auto max-w-5xl">
          <Link href={`/goals/${goal.id}`} className="text-sm text-blue-300">
            ← Back to Goal
          </Link>
          {mentorError && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {mentorError}
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-300">
                  GoalNow AI Mentor
                </p>

                <h1 className="mt-2 text-4xl font-black">{goal.name}</h1>

                <p className="mt-3 max-w-2xl text-zinc-400">
                  Ask your mentor about next actions, weak points, revision,
                  missed days, motivation, and progress.
                </p>
              </div>

              <button
                onClick={clearChat}
                className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-400/20"
              >
                Clear Chat
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Progress</p>
                <h2 className="mt-2 text-2xl font-black">{stats.progress}%</h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Completed Days</p>
                <h2 className="mt-2 text-2xl font-black">
                  {stats.completed}/{stats.total}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Active Plan</p>
                <h2 className="mt-2 text-lg font-bold">{stats.activeDayText}</h2>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <span
                  className={
                    mentorSource === "gemini"
                      ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300"
                      : "rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-sm font-semibold text-yellow-300"
                  }
                >
                  {mentorSource === "gemini"
                    ? "Gemini mentor active"
                    : "Fallback mentor ready"}
                </span>

                {isMentorThinking && (
                  <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-sm font-semibold text-blue-300">
                    Mentor is thinking...
                  </span>
                )}
              </div>
            </div>

            <div className="mt-8 h-[480px] overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[85%] rounded-2xl bg-white px-4 py-3 text-black"
                        : "mr-auto max-w-[85%] rounded-2xl border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-blue-100"
                    }
                  >
                    <p className="text-sm font-semibold">
                      {message.role === "user" ? "You" : "AI Mentor"}
                    </p>

                    <p className="mt-1 whitespace-pre-line">{message.text}</p>
                  </div>
                ))}
                {isMentorThinking && (
                  <div className="mr-auto max-w-[85%] rounded-2xl border border-blue-400/30 bg-blue-400/10 px-4 py-3 text-blue-100">
                    <p className="text-sm font-semibold">AI Mentor</p>
                    <p className="mt-1">Thinking...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void sendMessage();
                  }
                }}
                placeholder="Ask your AI mentor..."
                className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
              />

              <button
                onClick={() => void sendMessage()}
                disabled={isMentorThinking}
                className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isMentorThinking ? "Thinking..." : "Send"}
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <button
                onClick={() => setInput("What should I do today?")}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-white/20"
              >
                What should I do today?
              </button>

              <button
                onClick={() => setInput("How is my progress?")}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-white/20"
              >
                How is my progress?
              </button>

              <button
                onClick={() => setInput("What if I missed a day?")}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-white/20"
              >
                What if I missed a day?
              </button>

              <button
                onClick={() => setInput("What is my weak area?")}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-white/20"
              >
                What is my weak area?
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
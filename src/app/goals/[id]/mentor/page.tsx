"use client";

import Link from "next/link";
import { useEffect,useRef, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";
import {
  getGoalByIdFromSupabase,
  updateGoalInSupabase,
} from "@/lib/goals/supabaseGoals";
import type { Goal } from "@/types/goal";
import ConfirmModal from "@/components/ConfirmModal";

type ChatMessage = {
  role: "user" | "mentor";
  text: string;
};

const defaultMentorMessage: ChatMessage = {
  role: "mentor",
  text: "Hi, I am your GoalNow AI Mentor. Ask me about your goal, weak points, daily plan, revision, or next best action.",
};
function getDefaultMentorMessage(name?: string): ChatMessage {
  const firstName = name?.trim().split(" ")[0];

  return {
    role: "mentor",
    text: firstName
      ? `Hi ${firstName}, I am your GoalNow AI Mentor. Ask me about your goal, weak points, daily plan, revision, or next best action.`
      : "Hi, I am your GoalNow AI Mentor. Ask me about your goal, weak points, daily plan, revision, or next best action.",
  };
}

export default function MentorPage() {
  const params = useParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [mentorError, setMentorError] = useState("");
  const [input, setInput] = useState("");
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
const [isClearingChat, setIsClearingChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    defaultMentorMessage,
  ]);
  const [isMentorThinking, setIsMentorThinking] = useState(false);
  const [mentorSource, setMentorSource] = useState<"gemini" | "fallback">(
    "fallback"
  );
  const [userName, setUserName] = useState("");

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
  let isMounted = true;

  async function loadGoal() {
    setIsLoadingGoal(true);
    setMentorError("");

    try {
      const foundGoal = await getGoalByIdFromSupabase(goalId);
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();

        const metadata = userData.user?.user_metadata || {};
        const loadedUserName =
          metadata.full_name ||
          metadata.name ||
          userData.user?.email?.split("@")[0] ||
          "";

        setUserName(loadedUserName);

      if (!isMounted) return;

      if (!foundGoal) {
        setGoal(null);
        setMessages([getDefaultMentorMessage(loadedUserName)]);
        return;
      }

      setGoal(foundGoal);

      if (foundGoal.mentorMessages && foundGoal.mentorMessages.length > 0) {
        setMessages(foundGoal.mentorMessages);
      } else {
        setMessages([getDefaultMentorMessage(loadedUserName)]);
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
useEffect(() => {
  const chatContainer = chatContainerRef.current;

  if (!chatContainer) return;

  chatContainer.scrollTo({
    top: chatContainer.scrollHeight,
    behavior: "smooth",
  });
}, [messages, isMentorThinking]);
function getDisplayName() {
  const cleanName = userName.trim();

  if (!cleanName) return "";

  return cleanName.split(" ")[0];
}

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
  const displayName = getDisplayName();
  const namePrefix = displayName ? `${displayName}, ` : "";

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
    return `${namePrefix}for your complex tracker "${goal.name}", you are currently on ${stats.activeDayText}. Your next best action is: ${stats.nextAction}`;
    }

    if (
      lowerText.includes("progress") ||
      lowerText.includes("report") ||
      lowerText.includes("how")
    ) {
    return `${namePrefix}your current progress is ${stats.progress}%. You have completed ${stats.completed}/${stats.total} plan days. Do not rush. Complete the current active day first, then move forward.`;
    }

    if (
      lowerText.includes("miss") ||
      lowerText.includes("streak") ||
      lowerText.includes("break")
    ) {
      return `${namePrefix}If you miss a study day, your learning Day number should not move forward. Continue from ${stats.activeDayText}. This keeps your preparation honest and realistic.`;
    }

    if (
      lowerText.includes("weak") ||
      lowerText.includes("problem") ||
      lowerText.includes("improve")
    ) {
      return `Your weak area should be found from incomplete tasks. First complete: ${stats.nextAction}. After that, revise for 15 minutes and write one mistake note.`;
    }

  return `${namePrefix}for "${goal.name}", focus on ${stats.activeDayText}. Your next best action is: ${stats.nextAction}`;
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
        userName: getDisplayName(),
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

 function clearChat() {
  setShowClearChatConfirm(true);
}

async function confirmClearChat() {
  if (!goal) return;

  setIsClearingChat(true);
  setMentorError("");

  const defaultMessage = getDefaultMentorMessage(userName);

  const updatedGoal: Goal = {
    ...goal,
    mentorMessages: [defaultMessage],
    updatedAt: new Date().toISOString(),
  };

  try {
    const savedGoal = await updateGoalInSupabase(updatedGoal);
    setGoal(savedGoal);
    setMessages([defaultMessage]);
    setShowClearChatConfirm(false);
  } catch (error) {
    setMentorError(
      error instanceof Error ? error.message : "Could not clear mentor chat."
    );
  } finally {
    setIsClearingChat(false);
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

    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-10">
      <section className="mx-auto max-w-7xl">
        <Link
          href={`/goals/${goal.id}`}
          className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          ← Back to Goal
        </Link>

        {mentorError && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {mentorError}
          </div>
        )}

        {/* Header */}
        <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/40">
          <div className="relative p-6 md:p-8">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-300">
                    GoalNow AI Mentor
                  </span>

                  <span
                    className={
                      mentorSource === "gemini"
                        ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-300"
                        : "rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-300"
                    }
                  >
                    {mentorSource === "gemini"
                      ? "Gemini Active"
                      : "Fallback Ready"}
                  </span>

                  {isMentorThinking && (
                    <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-300">
                      Thinking...
                    </span>
                  )}
                </div>

                <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
                  AI Mentor for {goal.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                  Ask about today&apos;s next action, weak points, missed days,
                  revision strategy, weekly improvement, and how to stay
                  consistent with your active goal plan.
                </p>
              </div>

              <button
  type="button"
  onClick={clearChat}
  disabled={messages.length <= 1 || isClearingChat}
  className="w-fit rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm font-black text-red-200 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-50"
>
  {isClearingChat ? "Clearing..." : "Clear Chat"}
</button>
            </div>
          </div>

          <div className="grid border-t border-white/10 bg-black/20 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-white/10 p-5 sm:border-r">
              <p className="text-sm text-slate-500">Progress</p>
              <h2 className="mt-2 text-2xl font-black text-cyan-300">
                {stats.progress}%
              </h2>
            </div>

            <div className="border-white/10 p-5 lg:border-r">
              <p className="text-sm text-slate-500">Completed Days</p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {stats.completed}/{stats.total}
              </h2>
            </div>

            <div className="border-white/10 p-5 sm:border-r lg:border-r">
              <p className="text-sm text-slate-500">Active Plan</p>
              <h2 className="mt-2 line-clamp-2 text-lg font-black text-white">
                {stats.activeDayText}
              </h2>
            </div>

            <div className="p-5">
              <p className="text-sm text-slate-500">Next Action</p>
              <h2 className="mt-2 line-clamp-2 text-lg font-black text-blue-300">
                {stats.nextAction}
              </h2>
            </div>
          </div>
        </div>

        {/* Main Mentor Layout */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl md:p-6">
              <h2 className="text-2xl font-black">Mentor Shortcuts</h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Tap a question to quickly ask your AI mentor.
              </p>

              <div className="mt-5 grid gap-3">
                {[
                  "What should I do today?",
                  "How is my progress?",
                  "What if I missed a day?",
                  "What is my weak area?",
                  "Make my next 3 steps clear.",
                  "How can I improve this week?",
                ].map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => setInput(question)}
                    className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-left text-sm font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl md:p-6">
              <h2 className="text-2xl font-black">Goal Context</h2>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-slate-400">Category</p>
                  <p className="mt-1 font-bold text-white">{goal.category}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-slate-400">Daily Time</p>
                  <p className="mt-1 font-bold text-white">
                    {goal.dailyTime || "Not set"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-slate-400">Target Result</p>
                  <p className="mt-1 line-clamp-4 text-sm leading-6 text-slate-300">
                    {goal.targetResult || "Not added"}
                  </p>
                </div>
              </div>
            </section>
          </aside>

          {/* Chat Panel */}
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-black/20 px-5 py-4">
              <div>
                <h2 className="text-xl font-black">Mentor Chat</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Saved to this goal&apos;s mentor history
                </p>
              </div>

              <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-400 sm:block">
                {messages.length} messages
              </div>
            </div>

            <div
                  ref={chatContainerRef}
                  className="h-[560px] overflow-y-auto bg-slate-950/70 p-4 md:p-6"
                >
               <div className="space-y-5">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={
                      message.role === "user"
                        ? "ml-auto max-w-[90%] rounded-[1.5rem] bg-cyan-400 px-5 py-4 text-slate-950 shadow-lg shadow-cyan-500/10 md:max-w-[75%]"
                        : "mr-auto max-w-[90%] rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-slate-100 shadow-lg shadow-black/20 md:max-w-[75%]"
                    }
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={
                          message.role === "user"
                            ? "flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white"
                            : "flex h-7 w-7 items-center justify-center rounded-full bg-blue-400 text-xs font-black text-slate-950"
                        }
                      >
                        {message.role === "user" ? "Y" : "AI"}
                      </span>

                      <p className="text-sm font-black">
                        {message.role === "user" ? "You" : "AI Mentor"}
                      </p>
                    </div>

                    <p className="whitespace-pre-line text-sm leading-7">
                      {message.text}
                    </p>
                  </div>
                ))}

                {isMentorThinking && (
                  <div className="mr-auto max-w-[90%] rounded-[1.5rem] border border-blue-400/30 bg-blue-400/10 px-5 py-4 text-blue-100 md:max-w-[75%]">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-400 text-xs font-black text-slate-950">
                        AI
                      </span>
                      <p className="text-sm font-black">AI Mentor</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-blue-100">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-300" />
                      <span>Thinking and checking your goal context...</span>
                    </div>
                  </div>
                )}

                
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/30 p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage();
                    }
                  }}
                  placeholder="Ask your AI mentor about your next step..."
                  className="min-h-12 flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={() => void sendMessage()}
                  disabled={isMentorThinking || !input.trim()}
                  className="rounded-2xl bg-cyan-400 px-6 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isMentorThinking ? "Thinking..." : "Send"}
                </button>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Mentor replies are based on your saved goal, active day,
                progress, and task status.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>

        <Footer />

    <ConfirmModal
      isOpen={showClearChatConfirm}
      title="Clear mentor chat?"
      message="This will remove your saved AI mentor conversation for this goal and restart the chat with the default mentor message."
      confirmText="Yes, Clear"
      cancelText="Cancel"
      icon="🧹"
      tone="danger"
      isLoading={isClearingChat}
      onCancel={() => setShowClearChatConfirm(false)}
      onConfirm={confirmClearChat}
    />
  </>
);
}
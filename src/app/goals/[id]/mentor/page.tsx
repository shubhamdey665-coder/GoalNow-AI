"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Goal = {
  id: string;
  name: string;
  category: string;
  duration: string;
  dailyTime: string;
  currentLevel: string;
  targetResult: string;
  plan: string[];
  completedTasks: number[];
  createdAt: string;
};

type ChatMessage = {
  role: "user" | "mentor";
  text: string;
};

export default function MentorPage() {
  const params = useParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "mentor",
      text: "Hi, I am your GoalNow AI Mentor. Ask me about your goal, plan, weak points, or next action.",
    },
  ]);

  useEffect(() => {
    const savedGoals = localStorage.getItem("goalnow-goals");
    const goals: Goal[] = savedGoals ? JSON.parse(savedGoals) : [];

    const foundGoal = goals.find((item) => item.id === goalId);

    if (foundGoal) {
      setGoal(foundGoal);
    }
  }, [goalId]);

  function sendMessage() {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      text: input,
    };

    const completedCount = goal?.completedTasks.length || 0;
    const totalCount = goal?.plan.length || 0;

    const mentorReply: ChatMessage = {
      role: "mentor",
      text: `For your goal "${goal?.name}", you have completed ${completedCount}/${totalCount} tasks. Your next best action is to complete one pending task today, then revise what you learned for 15 minutes.`,
    };

    setMessages([...messages, userMessage, mentorReply]);
    setInput("");
  }

  if (!goal) {
    return (
      <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl">
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white">
            ← Back to Dashboard
          </Link>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8">
            <h1 className="text-3xl font-bold">Goal not found</h1>
            <p className="mt-3 text-zinc-400">
              This mentor page needs a saved goal first.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <Link href={`/goals/${goal.id}`} className="text-sm text-zinc-400 hover:text-white">
          ← Back to Goal
        </Link>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-blue-400">AI Mentor</p>
          <h1 className="mt-2 text-4xl font-bold">{goal.name}</h1>
          <p className="mt-3 text-zinc-400">
            Ask your mentor about next actions, weak points, revision, motivation,
            and progress.
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[80%] rounded-2xl bg-blue-500 p-4 text-sm text-white"
                    : "mr-auto max-w-[80%] rounded-2xl bg-zinc-900 p-4 text-sm text-zinc-200"
                }
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  sendMessage();
                }
              }}
              placeholder="Ask your AI mentor..."
              className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-blue-400"
            />

            <button
              type="button"
              onClick={sendMessage}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
            >
              Send
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
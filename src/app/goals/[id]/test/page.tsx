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

const questions = [
  {
    question: "Did you understand the main purpose of your goal?",
    options: ["Yes", "Partially", "No"],
  },
  {
    question: "How many days did you complete properly this week?",
    options: ["0-2 days", "3-5 days", "6-7 days"],
  },
  {
    question: "What is your biggest weak point right now?",
    options: ["Consistency", "Understanding", "Practice", "Time management"],
  },
  {
    question: "Are you ready for next week's harder plan?",
    options: ["Yes", "Need revision", "No"],
  },
];

export default function TestPage() {
  const params = useParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState("");

  useEffect(() => {
    const savedGoals = localStorage.getItem("goalnow-goals");
    const goals: Goal[] = savedGoals ? JSON.parse(savedGoals) : [];

    const foundGoal = goals.find((item) => item.id === goalId);

    if (foundGoal) {
      setGoal(foundGoal);
    }
  }, [goalId]);

  function selectAnswer(questionIndex: number, option: string) {
    setAnswers({
      ...answers,
      [questionIndex]: option,
    });
  }

  function submitTest() {
    if (Object.keys(answers).length < questions.length) {
      setResult("Please answer all questions before submitting the test.");
      return;
    }

    const completed = goal?.completedTasks.length || 0;
    const total = goal?.plan.length || 0;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (progress >= 80) {
      setResult(
        "Excellent. You are consistent this week. Next week you can increase difficulty slightly."
      );
    } else if (progress >= 40) {
      setResult(
        "Good start. You need more revision and consistency before increasing difficulty."
      );
    } else {
      setResult(
        "You need a lighter plan next week. Focus on completing fewer tasks properly."
      );
    }
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
              This test page needs a saved goal first.
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
          <p className="text-sm text-blue-400">Weekly Test</p>
          <h1 className="mt-2 text-4xl font-bold">{goal.name}</h1>
          <p className="mt-3 text-zinc-400">
            Answer these questions to check your weekly progress and readiness.
          </p>
        </section>

        <section className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6">
          {questions.map((item, questionIndex) => (
            <div key={questionIndex} className="rounded-xl bg-zinc-900 p-5">
              <h2 className="font-semibold">
                {questionIndex + 1}. {item.question}
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {item.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => selectAnswer(questionIndex, option)}
                    className={
                      answers[questionIndex] === option
                        ? "rounded-xl border border-blue-400 bg-blue-400/20 px-4 py-3 text-left text-blue-200"
                        : "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-zinc-300 hover:bg-white/10"
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={submitTest}
            className="w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
          >
            Submit Weekly Test
          </button>

          {result && (
            <div className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-4 text-sm text-blue-200">
              {result}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
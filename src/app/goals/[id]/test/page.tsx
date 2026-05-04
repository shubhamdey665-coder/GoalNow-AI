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

type TestQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type AnswerMap = Record<number, string>;

function getFallbackQuestions(goal: Goal): TestQuestion[] {
  const lowerGoal = `${goal.name} ${goal.category}`.toLowerCase();

  if (
    lowerGoal.includes("english") ||
    lowerGoal.includes("communication") ||
    lowerGoal.includes("speaking")
  ) {
    return [
      {
        question: "Which sentence is grammatically correct?",
        options: [
          "I goes to school.",
          "I go to school.",
          "I going to school.",
          "I gone to school.",
        ],
        correctAnswer: "I go to school.",
        explanation: "With I, we use go, not goes.",
      },
      {
        question: "Which phrase is best for starting self-introduction?",
        options: [
          "Myself Shubham.",
          "I am Shubham.",
          "Me Shubham.",
          "I Shubham.",
        ],
        correctAnswer: "I am Shubham.",
        explanation: "I am Shubham is natural and correct.",
      },
      {
        question: "Which word is a verb?",
        options: ["Beautiful", "Quickly", "Run", "Blue"],
        correctAnswer: "Run",
        explanation: "Run is an action word.",
      },
      {
        question: "Which sentence sounds more professional?",
        options: [
          "I want job.",
          "I need one job.",
          "I am looking for a suitable job opportunity.",
          "Give me job.",
        ],
        correctAnswer: "I am looking for a suitable job opportunity.",
        explanation: "This is polite and professional.",
      },
      {
        question: "What is the best way to improve speaking?",
        options: [
          "Only read silently",
          "Speak daily and record yourself",
          "Avoid mistakes always",
          "Memorize dictionary",
        ],
        correctAnswer: "Speak daily and record yourself",
        explanation: "Speaking practice builds fluency and confidence.",
      },
    ];
  }

  if (
    lowerGoal.includes("google") ||
    lowerGoal.includes("swe") ||
    lowerGoal.includes("coding") ||
    lowerGoal.includes("dsa") ||
    lowerGoal.includes("software")
  ) {
    return [
      {
        question: "Which data structure is best for storing an ordered list?",
        options: ["Array", "Color", "Font", "Browser"],
        correctAnswer: "Array",
        explanation: "An array stores ordered values.",
      },
      {
        question: "What does HTML mainly provide?",
        options: ["Structure", "Database", "Server", "Payment"],
        correctAnswer: "Structure",
        explanation: "HTML gives structure to a webpage.",
      },
      {
        question: "Which CSS property is used for spacing inside an element?",
        options: ["padding", "console", "return", "array"],
        correctAnswer: "padding",
        explanation: "Padding creates inner spacing.",
      },
      {
        question: "What does git commit do?",
        options: [
          "Deletes code",
          "Saves a snapshot of changes",
          "Starts browser",
          "Creates CSS",
        ],
        correctAnswer: "Saves a snapshot of changes",
        explanation: "A commit records a version of your code.",
      },
      {
        question: "What should you do after solving a wrong DSA problem?",
        options: [
          "Skip forever",
          "Copy answer only",
          "Understand mistake and revise",
          "Delete project",
        ],
        correctAnswer: "Understand mistake and revise",
        explanation: "Revision of mistakes improves problem solving.",
      },
    ];
  }

  return [
    {
      question: "What is the best first step for any goal?",
      options: [
        "Start with impossible tasks",
        "Write a clear target",
        "Ignore progress",
        "Change goal daily",
      ],
      correctAnswer: "Write a clear target",
      explanation: "A clear target makes planning easier.",
    },
    {
      question: "What should happen if you miss one day?",
      options: [
        "Quit the goal",
        "Continue from current active day",
        "Delete all progress",
        "Skip many days",
      ],
      correctAnswer: "Continue from current active day",
      explanation: "GoalNow should keep the active day honest.",
    },
    {
      question: "Which habit improves long-term progress?",
      options: [
        "Small daily consistency",
        "Random hard work only",
        "No tracking",
        "Avoid revision",
      ],
      correctAnswer: "Small daily consistency",
      explanation: "Consistency builds results.",
    },
    {
      question: "What should a weekly test check?",
      options: [
        "Real understanding",
        "Only mood",
        "Only design",
        "Nothing",
      ],
      correctAnswer: "Real understanding",
      explanation: "Tests should show what you truly understand.",
    },
    {
      question: "What is the best response to weak areas?",
      options: [
        "Hide them",
        "Revise and practice them",
        "Ignore them",
        "Change goal",
      ],
      correctAnswer: "Revise and practice them",
      explanation: "Weak areas improve through revision and practice.",
    },
  ];
}

export default function TestPage() {
  const params = useParams();
  const goalId = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [testError, setTestError] = useState("");
  const [isSavingResult, setIsSavingResult] = useState(false);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [result, setResult] = useState("");
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testSource, setTestSource] = useState<"gemini" | "fallback">(
    "fallback"
  );

 useEffect(() => {
  let isMounted = true;

  async function loadGoal() {
    setIsLoadingGoal(true);
    setTestError("");

    try {
      const foundGoal = await getGoalByIdFromSupabase(goalId);

      if (!isMounted) return;

      if (!foundGoal) {
        setGoal(null);
        return;
      }

      setGoal(foundGoal);

      if (foundGoal.trackerType === "complex") {
        const fallbackQuestions = getFallbackQuestions(foundGoal);
        setQuestions(fallbackQuestions);
        generateGeminiTest(foundGoal);
      }
    } catch (error) {
      if (!isMounted) return;

      setGoal(null);
      setTestError(
        error instanceof Error ? error.message : "Could not load weekly test."
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

  function getComplexProgress(currentGoal: Goal) {
    if (!currentGoal.complexPlanDays) {
      return {
        completedDays: 0,
        totalDays: 0,
        progressPercentage: 0,
      };
    }

    const completedDays = currentGoal.complexPlanDays.filter(
      (day) => day.completed
    ).length;

    const totalDays = currentGoal.complexPlanDays.length;

    const progressPercentage =
      totalDays === 0 ? 0 : Math.round((completedDays / totalDays) * 100);

    return {
      completedDays,
      totalDays,
      progressPercentage,
    };
  }

  async function generateGeminiTest(currentGoal: Goal) {
    if (currentGoal.trackerType !== "complex") return;

    setIsGeneratingTest(true);
    setTestSource("fallback");

    const activeDay = currentGoal.complexPlanDays?.find(
      (day) => day.dayNumber === currentGoal.activeDayNumber
    );

    const progress = getComplexProgress(currentGoal);

    try {
      const response = await fetch("/api/generate-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalName: currentGoal.name,
          category: currentGoal.category,
          currentLevel: currentGoal.currentLevel,
          targetResult: currentGoal.targetResult,
          activeDayTitle: activeDay?.title,
          activeDayFocus: activeDay?.focus,
          completedDays: progress.completedDays,
          totalDays: progress.totalDays,
        }),
      });

      const data = await response.json();

      if (response.ok && data.questions) {
        setQuestions(data.questions);
        setAnswers({});
        setResult("");
        setTestSource("gemini");
      } else {
        console.warn("Gemini test failed, using fallback test:", data.error);
      }
    } catch (error) {
      console.warn("Gemini test failed, using fallback test:", error);
    }

    setIsGeneratingTest(false);
  }

  function selectAnswer(questionIndex: number, option: string) {
    setAnswers({
      ...answers,
      [questionIndex]: option,
    });
  }

  async function submitTest() {
    if (!goal) return;

    if (questions.length === 0) {
      setResult("No test questions found.");
      return;
    }

    if (Object.keys(answers).length < questions.length) {
      setResult("Please answer all questions before submitting the weekly test.");
      return;
    }

    let correctCount = 0;

    questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    let testResult = "";

    if (scorePercentage >= 80) {
      testResult = `Excellent weekly test performance. Score: ${correctCount}/${questions.length} (${scorePercentage}%). You are ready for slightly harder tasks next week.`;
    } else if (scorePercentage >= 50) {
      testResult = `Good attempt. Score: ${correctCount}/${questions.length} (${scorePercentage}%). Revise the wrong answers before moving to harder tasks.`;
    } else {
      testResult = `Needs improvement. Score: ${correctCount}/${questions.length} (${scorePercentage}%). Keep the next plan lighter and revise weak areas first.`;
    }

    const updatedGoal: Goal = {
      ...goal,
      latestTestResult: testResult,
      latestTestDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSavingResult(true);
    setTestError("");

    try {
      const savedGoal = await updateGoalInSupabase(updatedGoal);
      setGoal(savedGoal);
      setResult(testResult);
    } catch (error) {
      setTestError(
        error instanceof Error ? error.message : "Could not save weekly test result."
      );
    } finally {
      setIsSavingResult(false);
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
            <h1 className="text-3xl font-black">Loading weekly test...</h1>
            <p className="mt-3 text-zinc-400">
              Fetching your goal test data from Supabase.
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
                This test page needs a saved goal first.
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
              <h1 className="text-3xl font-black">Weekly Test Not Needed</h1>
              <p className="mt-3 text-zinc-400">
                Weekly AI tests are only for complex trackers.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  const progress = getComplexProgress(goal);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <section className="mx-auto max-w-4xl">
          <Link href={`/goals/${goal.id}`} className="text-sm text-blue-300">
            ← Back to Goal
          </Link>
          {testError && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {testError}
            </div>
          )}

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-300">
                  GoalNow AI Weekly Test
                </p>

                <h1 className="mt-2 text-4xl font-black">{goal.name}</h1>

                <p className="mt-3 text-zinc-400">
                  This weekly test checks your real understanding and gives a
                  realistic next recommendation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => generateGeminiTest(goal)}
                disabled={isGeneratingTest}
                className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGeneratingTest ? "Generating..." : "Regenerate Test"}
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <span
                className={
                  testSource === "gemini"
                    ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300"
                    : "rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-sm font-semibold text-yellow-300"
                }
              >
                {testSource === "gemini"
                  ? "Gemini-generated test"
                  : "Fallback test"}
              </span>

              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-zinc-300">
                Active Day {goal.activeDayNumber || 1}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Completed Days</p>
                <h2 className="mt-2 text-2xl font-black">
                  {progress.completedDays}/{progress.totalDays}
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Progress</p>
                <h2 className="mt-2 text-2xl font-black">
                  {progress.progressPercentage}%
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-400">Questions</p>
                <h2 className="mt-2 text-2xl font-black">
                  {questions.length}
                </h2>
              </div>
            </div>

            {goal.latestTestResult && (
              <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5">
                <h2 className="text-xl font-bold text-emerald-200">
                  Latest Test Result
                </h2>

                <p className="mt-3 text-zinc-200">{goal.latestTestResult}</p>

                {goal.latestTestDate && (
                  <p className="mt-2 text-sm text-zinc-400">
                    Saved on{" "}
                    {new Date(goal.latestTestDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            <div className="mt-8 space-y-5">
              {questions.map((item, questionIndex) => (
                <div
                  key={`${item.question}-${questionIndex}`}
                  className="rounded-2xl border border-white/10 bg-black/40 p-5"
                >
                  <h2 className="text-xl font-bold">
                    {questionIndex + 1}. {item.question}
                  </h2>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {item.options.map((option) => {
                      const isSelected = answers[questionIndex] === option;
                      const hasSubmitted = result.length > 0;
                      const isCorrect = option === item.correctAnswer;

                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => selectAnswer(questionIndex, option)}
                          disabled={hasSubmitted}
                          className={
                            hasSubmitted && isCorrect
                              ? "rounded-xl border border-emerald-400 bg-emerald-400/20 px-4 py-3 text-left text-emerald-200"
                              : hasSubmitted && isSelected && !isCorrect
                              ? "rounded-xl border border-red-400 bg-red-400/20 px-4 py-3 text-left text-red-200"
                              : isSelected
                              ? "rounded-xl border border-blue-400 bg-blue-400/20 px-4 py-3 text-left text-blue-200"
                              : "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-zinc-300 hover:bg-white/10"
                          }
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {result && (
                    <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-300">
                      {item.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={submitTest}
              disabled={isSavingResult}
              className="mt-8 w-full rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingResult ? "Saving Result..." : "Submit Weekly Test"}
            </button>

            {result && (
              <div className="mt-6 rounded-2xl border border-blue-400/30 bg-blue-400/10 p-5 text-blue-100">
                {result}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
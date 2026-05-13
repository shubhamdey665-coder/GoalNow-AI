"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConfirmModal from "@/components/ConfirmModal";
import {
  getGoalByIdFromSupabase,
  updateGoalInSupabase,
} from "@/lib/goals/supabaseGoals";
import type { Goal } from "@/types/goal";

type TestQuestion = {
  type: "mcq" | "saq";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type AnswerMap = Record<number, string>;

type UnfinishedTest = {
  goalId: string;
  questionType: "mcq" | "saq";
  questionCount: 5 | 10 | 20;
  questions: TestQuestion[];
  answers: AnswerMap;
  savedAt: string;
};

type BaseQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

function getWeeklyTestStorageKey(goalId: string) {
  return `goalnow-unfinished-weekly-test-${goalId}`;
}

function normalizeAnswer(answer: string) {
  return answer.toLowerCase().trim().replace(/\s+/g, " ");
}

function isShortAnswerCorrect(userAnswer: string, correctAnswer: string) {
  const cleanUserAnswer = normalizeAnswer(userAnswer);
  const cleanCorrectAnswer = normalizeAnswer(correctAnswer);

  if (!cleanUserAnswer) return false;

  return (
    cleanUserAnswer === cleanCorrectAnswer ||
    cleanUserAnswer.includes(cleanCorrectAnswer) ||
    cleanCorrectAnswer.includes(cleanUserAnswer)
  );
}

function buildQuestions(
  baseQuestions: BaseQuestion[],
  questionType: "mcq" | "saq",
  questionCount: 5 | 10 | 20
): TestQuestion[] {
  const expandedQuestions: BaseQuestion[] = [];

  while (expandedQuestions.length < questionCount) {
    expandedQuestions.push(...baseQuestions);
  }

  return expandedQuestions.slice(0, questionCount).map((question, index) => ({
    type: questionType,
    question:
      questionType === "saq"
        ? `Short answer ${index + 1}: ${question.question}`
        : question.question,
    options: questionType === "mcq" ? question.options : undefined,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
  }));
}

function getFallbackQuestions(
  goal: Goal,
  questionType: "mcq" | "saq" = "mcq",
  questionCount: 5 | 10 | 20 = 5
): TestQuestion[] {
  const lowerGoal = `${goal.name} ${goal.category}`.toLowerCase();

  const englishQuestions: BaseQuestion[] = [
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
    {
      question: "What should you do after making a speaking mistake?",
      options: [
        "Stop speaking forever",
        "Record, correct, and repeat",
        "Ignore all grammar",
        "Only read books",
      ],
      correctAnswer: "Record, correct, and repeat",
      explanation: "Correction and repetition improve speaking.",
    },
    {
      question: "Which activity improves listening skill?",
      options: [
        "Watching short English videos actively",
        "Avoiding English audio",
        "Only memorizing spellings",
        "Not speaking at all",
      ],
      correctAnswer: "Watching short English videos actively",
      explanation: "Active listening helps pronunciation and understanding.",
    },
    {
      question: "Which is a good daily English habit?",
      options: [
        "Speak for 5 minutes daily",
        "Study once a month",
        "Avoid writing",
        "Only translate word by word",
      ],
      correctAnswer: "Speak for 5 minutes daily",
      explanation: "Small daily speaking builds confidence.",
    },
    {
      question: "What should you do to improve vocabulary?",
      options: [
        "Learn words with example sentences",
        "Memorize random dictionary pages",
        "Never use new words",
        "Only read grammar rules",
      ],
      correctAnswer: "Learn words with example sentences",
      explanation: "Words become useful when learned in context.",
    },
    {
      question: "Which sentence is more natural?",
      options: [
        "I am agree.",
        "I agree.",
        "I agreeing.",
        "I agreeding.",
      ],
      correctAnswer: "I agree.",
      explanation: "Agree is already a verb, so we say I agree.",
    },
  ];

  const codingQuestions: BaseQuestion[] = [
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
    {
      question: "What is debugging?",
      options: [
        "Finding and fixing errors",
        "Deleting all code",
        "Only designing buttons",
        "Opening browser",
      ],
      correctAnswer: "Finding and fixing errors",
      explanation: "Debugging means finding and fixing problems in code.",
    },
    {
      question: "Why is GitHub useful?",
      options: [
        "To store and share code versions",
        "To cook food",
        "To replace HTML",
        "To delete projects",
      ],
      correctAnswer: "To store and share code versions",
      explanation: "GitHub helps store, track, and share code.",
    },
    {
      question: "What should a beginner do after learning a concept?",
      options: [
        "Build a small project or solve problems",
        "Only watch more videos",
        "Never practice",
        "Forget it",
      ],
      correctAnswer: "Build a small project or solve problems",
      explanation: "Practice makes the concept real.",
    },
    {
      question: "Which topic is important for Google SWE preparation?",
      options: ["DSA", "Only font color", "Only wallpapers", "Only typing speed"],
      correctAnswer: "DSA",
      explanation: "DSA is a major part of software engineering interviews.",
    },
    {
      question: "What should you do before pushing code?",
      options: [
        "Test your changes",
        "Never run the project",
        "Delete package.json",
        "Ignore errors",
      ],
      correctAnswer: "Test your changes",
      explanation: "Testing helps avoid broken code on GitHub or deployment.",
    },
  ];

  const generalQuestions: BaseQuestion[] = [
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
      options: ["Real understanding", "Only mood", "Only design", "Nothing"],
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
    {
      question: "What makes a tracker honest?",
      options: [
        "Only marking completed work",
        "Marking future days",
        "Deleting missed days",
        "Never reviewing",
      ],
      correctAnswer: "Only marking completed work",
      explanation: "Honest tracking shows real progress.",
    },
    {
      question: "What is the best way to recover after low progress?",
      options: [
        "Restart with one clear action",
        "Quit immediately",
        "Ignore the goal",
        "Set impossible tasks",
      ],
      correctAnswer: "Restart with one clear action",
      explanation: "One clear action helps restart momentum.",
    },
    {
      question: "What should you do after a weekly test?",
      options: [
        "Review wrong answers",
        "Ignore mistakes",
        "Delete result",
        "Stop learning",
      ],
      correctAnswer: "Review wrong answers",
      explanation: "Reviewing mistakes is the main value of testing.",
    },
    {
      question: "What should daily planning focus on?",
      options: [
        "The next practical action",
        "Random goals",
        "Only motivation",
        "Nothing",
      ],
      correctAnswer: "The next practical action",
      explanation: "Progress comes from clear next actions.",
    },
    {
      question: "What is better than a huge unrealistic plan?",
      options: [
        "A small consistent plan",
        "No plan",
        "Only thinking",
        "Changing goals daily",
      ],
      correctAnswer: "A small consistent plan",
      explanation: "Small plans are easier to follow consistently.",
    },
  ];

  if (
    lowerGoal.includes("english") ||
    lowerGoal.includes("communication") ||
    lowerGoal.includes("speaking")
  ) {
    return buildQuestions(englishQuestions, questionType, questionCount);
  }

  if (
    lowerGoal.includes("google") ||
    lowerGoal.includes("swe") ||
    lowerGoal.includes("coding") ||
    lowerGoal.includes("dsa") ||
    lowerGoal.includes("software")
  ) {
    return buildQuestions(codingQuestions, questionType, questionCount);
  }

  return buildQuestions(generalQuestions, questionType, questionCount);
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
  const [showBackToSetupConfirm, setShowBackToSetupConfirm] = useState(false);
const [showDiscardTestConfirm, setShowDiscardTestConfirm] = useState(false);
const [showStartAnotherConfirm, setShowStartAnotherConfirm] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [questionType, setQuestionType] = useState<"mcq" | "saq">("mcq");
  const [questionCount, setQuestionCount] = useState<5 | 10 | 20>(5);
  const [unfinishedTest, setUnfinishedTest] =
    useState<UnfinishedTest | null>(null);

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
          const savedTest = localStorage.getItem(
            getWeeklyTestStorageKey(foundGoal.id)
          );

          if (savedTest) {
            try {
              const parsedTest = JSON.parse(savedTest) as UnfinishedTest;
              setUnfinishedTest(parsedTest);
            } catch {
              localStorage.removeItem(getWeeklyTestStorageKey(foundGoal.id));
            }
          }

          setQuestions([]);
          setAnswers({});
          setResult("");
          setTestStarted(false);
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

  useEffect(() => {
    if (!goal) return;
    if (!testStarted) return;
    if (result) return;
    if (questions.length === 0) return;

    const unfinished: UnfinishedTest = {
      goalId: goal.id,
      questionType,
      questionCount,
      questions,
      answers,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(
      getWeeklyTestStorageKey(goal.id),
      JSON.stringify(unfinished)
    );

    setUnfinishedTest(unfinished);
  }, [goal, testStarted, result, questions, answers, questionType, questionCount]);

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

  async function generateGeminiTest(
    currentGoal: Goal,
    selectedQuestionType: "mcq" | "saq",
    selectedQuestionCount: 5 | 10 | 20
  ) {
    if (currentGoal.trackerType !== "complex") return;

    setIsGeneratingTest(true);
    setTestSource("fallback");

    const activeDay = currentGoal.complexPlanDays?.find(
      (day) => day.dayNumber === currentGoal.activeDayNumber
    );

    const progress = getComplexProgress(currentGoal);

    const fallbackQuestions = getFallbackQuestions(
      currentGoal,
      selectedQuestionType,
      selectedQuestionCount
    );

    setQuestions(fallbackQuestions);

    try {
      const response = await fetch("/api/generate-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionType: selectedQuestionType,
          questionCount: selectedQuestionCount,
          goalName: currentGoal.name,
          category: currentGoal.category,
          currentLevel: currentGoal.currentLevel,
          targetResult: currentGoal.targetResult,
          dailyTime: currentGoal.dailyTime,
          activeDayNumber: currentGoal.activeDayNumber,
          activeDayTitle: activeDay?.title,
          activeDayFocus: activeDay?.focus,
          activeDayTasks: activeDay?.tasks.map((task) => task.title) || [],
          completedDays: progress.completedDays,
          totalDays: progress.totalDays,
        }),
      });

      const data = await response.json();

      if (response.ok && data.questions) {
        const cleanQuestions = (data.questions as TestQuestion[])
          .slice(0, selectedQuestionCount)
          .map((question) => ({
            ...question,
            type: selectedQuestionType,
            options:
              selectedQuestionType === "mcq"
                ? question.options || []
                : undefined,
          }));

        setQuestions(cleanQuestions);
        setAnswers({});
        setResult("");
        setTestSource("gemini");
      } else {
        console.warn("Gemini test failed, using fallback test:", data.error);
      }
    } catch (error) {
      console.warn("Gemini test failed, using fallback test:", error);
    } finally {
      setIsGeneratingTest(false);
    }
  }

  function selectAnswer(questionIndex: number, answer: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionIndex]: answer,
    }));
  }

  async function startNewTest() {
    if (!goal) return;

    setTestStarted(true);
    setAnswers({});
    setResult("");
    setQuestions([]);
    setUnfinishedTest(null);
    setTestError("");

    localStorage.removeItem(getWeeklyTestStorageKey(goal.id));

    const fallbackQuestions = getFallbackQuestions(
      goal,
      questionType,
      questionCount
    );

    setQuestions(fallbackQuestions);

    await generateGeminiTest(goal, questionType, questionCount);
  }

  function resumeUnfinishedTest() {
    if (!unfinishedTest) return;

    setQuestionType(unfinishedTest.questionType);
    setQuestionCount(unfinishedTest.questionCount);
    setQuestions(unfinishedTest.questions);
    setAnswers(unfinishedTest.answers);
    setResult("");
    setTestStarted(true);
    setTestError("");
  }

  function discardUnfinishedTest() {
    if (!goal) return;

    localStorage.removeItem(getWeeklyTestStorageKey(goal.id));
    setUnfinishedTest(null);
    setQuestions([]);
    setAnswers({});
    setResult("");
    setTestStarted(false);
  }

  function resetToSetup() {
    if (!goal) return;

    localStorage.removeItem(getWeeklyTestStorageKey(goal.id));
    setQuestions([]);
    setAnswers({});
    setResult("");
    setTestStarted(false);
    setUnfinishedTest(null);
    setTestError("");
  }
  function askBackToSetup() {
  setShowBackToSetupConfirm(true);
}

function confirmBackToSetup() {
  resetToSetup();
  setShowBackToSetupConfirm(false);
}

function askDiscardUnfinishedTest() {
  setShowDiscardTestConfirm(true);
}

function confirmDiscardUnfinishedTest() {
  discardUnfinishedTest();
  setShowDiscardTestConfirm(false);
}

function askStartAnotherTest() {
  setShowStartAnotherConfirm(true);
}

function confirmStartAnotherTest() {
  resetToSetup();
  setShowStartAnotherConfirm(false);
}

  async function submitTest() {
    if (!goal) return;

    if (questions.length === 0) {
      setTestError("No test questions found.");
      return;
    }

    const answeredCount = questions.filter(
      (_question, index) => (answers[index] || "").trim().length > 0
    ).length;

    if (answeredCount < questions.length) {
      setTestError("Please answer all questions before submitting the weekly test.");
      return;
    }

    let correctCount = 0;

    questions.forEach((question, index) => {
      if (question.type === "saq") {
        if (isShortAnswerCorrect(answers[index] || "", question.correctAnswer)) {
          correctCount++;
        }
        return;
      }

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
      localStorage.removeItem(getWeeklyTestStorageKey(goal.id));
      setUnfinishedTest(null);
    } catch (error) {
      setTestError(
        error instanceof Error
          ? error.message
          : "Could not save weekly test result."
      );
    } finally {
      setIsSavingResult(false);
    }
  }

  if (isLoadingGoal) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-10">
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

        <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-10">
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

        <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-10">
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

  const activeDay = goal.complexPlanDays?.find(
    (day) => day.dayNumber === goal.activeDayNumber
  );

  const answeredCount = questions.filter(
    (_question, index) => (answers[index] || "").trim().length > 0
  ).length;

  const testCompleted = result.length > 0;

  const sourceBadge = !testStarted
    ? "Choose test settings"
    : testSource === "gemini"
    ? "Gemini-generated test"
    : "Fallback test ready";

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

          {testError && (
            <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {testError}
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
                      GoalNow Weekly Test
                    </span>

                    <span
                      className={
                        testSource === "gemini" && testStarted
                          ? "rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-300"
                          : "rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-300"
                      }
                    >
                      {sourceBadge}
                    </span>

                    {isGeneratingTest && (
                      <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-300">
                        Generating...
                      </span>
                    )}
                  </div>

                  <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white md:text-5xl">
                    Weekly Test for {goal.name}
                  </h1>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                    Choose MCQ or short-answer mode, select the number of
                    questions, resume unfinished tests, and save your weekly
                    result inside your goal progress.
                  </p>
                </div>

                {testStarted && !testCompleted && (
                  <button
                    type="button"
                    onClick={() =>
                      void generateGeminiTest(goal, questionType, questionCount)
                    }
                    disabled={isGeneratingTest || isSavingResult}
                    className="w-fit rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGeneratingTest ? "Generating..." : "Regenerate Test"}
                  </button>
                )}
              </div>
            </div>

            <div className="grid border-t border-white/10 bg-black/20 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-white/10 p-5 sm:border-r">
                <p className="text-sm text-slate-500">Progress</p>
                <h2 className="mt-2 text-2xl font-black text-cyan-300">
                  {progress.progressPercentage}%
                </h2>
              </div>

              <div className="border-white/10 p-5 lg:border-r">
                <p className="text-sm text-slate-500">Completed Days</p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {progress.completedDays}/{progress.totalDays}
                </h2>
              </div>

              <div className="border-white/10 p-5 sm:border-r lg:border-r">
                <p className="text-sm text-slate-500">Active Day</p>
                <h2 className="mt-2 line-clamp-2 text-lg font-black text-white">
                  {activeDay
                    ? `Day ${activeDay.dayNumber}: ${activeDay.title}`
                    : `Day ${goal.activeDayNumber || 1}`}
                </h2>
              </div>

              <div className="p-5">
                <p className="text-sm text-slate-500">Answered</p>
                <h2 className="mt-2 text-2xl font-black text-blue-300">
                  {answeredCount}/{questions.length}
                </h2>
              </div>
            </div>
          </div>

          {/* Latest Result */}
          {goal.latestTestResult && (
            <div className="mt-6 rounded-[2rem] border border-emerald-400/30 bg-emerald-400/10 p-5 shadow-xl md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                    Latest Saved Result
                  </p>

                  <h2 className="mt-3 text-2xl font-black text-white">
                    Previous Weekly Test
                  </h2>

                  <p className="mt-3 leading-7 text-emerald-100">
                    {goal.latestTestResult}
                  </p>
                </div>

                {goal.latestTestDate && (
                  <span className="w-fit rounded-full border border-emerald-300/30 bg-black/20 px-3 py-1 text-xs font-bold text-emerald-200">
                    Saved on{" "}
                    {new Date(goal.latestTestDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {!testStarted ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
              {/* Setup */}
              <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                  Test Setup
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Choose your weekly test type
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Select MCQ or short-answer questions and choose how many
                  questions you want for this weekly test.
                </p>

                <div className="mt-6">
                  <label className="text-sm font-bold text-slate-200">
                    Question Type
                  </label>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setQuestionType("mcq")}
                      className={
                        questionType === "mcq"
                          ? "rounded-2xl border border-cyan-400 bg-cyan-400/20 p-4 text-left font-black text-cyan-100"
                          : "rounded-2xl border border-white/10 bg-slate-950 p-4 text-left font-bold text-slate-300 transition hover:bg-white/10"
                      }
                    >
                      MCQ
                      <p className="mt-1 text-sm font-normal text-slate-400">
                        Best for quick checking and scoring.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuestionType("saq")}
                      className={
                        questionType === "saq"
                          ? "rounded-2xl border border-cyan-400 bg-cyan-400/20 p-4 text-left font-black text-cyan-100"
                          : "rounded-2xl border border-white/10 bg-slate-950 p-4 text-left font-bold text-slate-300 transition hover:bg-white/10"
                      }
                    >
                      SAQ
                      <p className="mt-1 text-sm font-normal text-slate-400">
                        Best for deeper understanding.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-sm font-bold text-slate-200">
                    Number of Questions
                  </label>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {([5, 10, 20] as const).map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={
                          questionCount === count
                            ? "rounded-2xl border border-cyan-400 bg-cyan-400/20 px-4 py-3 font-black text-cyan-100"
                            : "rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-bold text-slate-300 transition hover:bg-white/10"
                        }
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void startNewTest()}
                  disabled={isGeneratingTest}
                  className="mt-7 w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isGeneratingTest ? "Preparing Test..." : "Start Test"}
                </button>
              </section>

              {/* Resume + Context */}
              <aside className="space-y-6">
                {unfinishedTest && (
                  <section className="rounded-[2rem] border border-yellow-400/30 bg-yellow-400/10 p-6 shadow-xl">
                    <h2 className="text-2xl font-black text-yellow-100">
                      Unfinished Test Found
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-yellow-100/80">
                      You have an unfinished{" "}
                      {unfinishedTest.questionType.toUpperCase()} test with{" "}
                      {unfinishedTest.questionCount} questions.
                    </p>

                    <p className="mt-2 text-xs text-yellow-100/70">
                      Saved on {new Date(unfinishedTest.savedAt).toLocaleString()}
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={resumeUnfinishedTest}
                        className="rounded-2xl bg-yellow-300 px-4 py-3 font-black text-slate-950 transition hover:bg-yellow-200"
                      >
                        Resume Test
                      </button>

                     <button
  type="button"
  onClick={askDiscardUnfinishedTest}
  className="rounded-2xl border border-yellow-300/30 bg-black/20 px-4 py-3 font-bold text-yellow-100 transition hover:bg-black/30"
>
  Discard
</button>
                    </div>
                  </section>
                )}

                <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl">
                  <h2 className="text-2xl font-black">Test Context</h2>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-sm text-slate-400">Active Day</p>
                      <p className="mt-1 font-bold text-white">
                        {activeDay
                          ? `Day ${activeDay.dayNumber}: ${activeDay.title}`
                          : `Day ${goal.activeDayNumber || 1}`}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-sm text-slate-400">Current Focus</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {activeDay?.focus || "Not available"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-sm text-slate-400">Progress</p>
                      <p className="mt-1 font-bold text-cyan-300">
                        {progress.completedDays}/{progress.totalDays} days
                        completed
                      </p>
                    </div>
                  </div>
                </section>
              </aside>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
              {/* Sidebar */}
              <aside className="space-y-6">
                <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl md:p-6">
                  <h2 className="text-2xl font-black">Test Overview</h2>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-sm text-slate-400">Type</p>
                      <p className="mt-1 text-2xl font-black text-white">
                        {questionType.toUpperCase()}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-sm text-slate-400">Questions</p>
                      <p className="mt-1 text-2xl font-black text-white">
                        {questions.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-sm text-slate-400">Answered</p>
                      <p className="mt-1 text-2xl font-black text-cyan-300">
                        {answeredCount}/{questions.length}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="text-sm text-slate-400">Test Status</p>
                      <p className="mt-1 font-bold text-white">
                        {testCompleted ? "Submitted" : "In Progress"}
                      </p>
                    </div>
                  </div>

                  {!testCompleted && (
                    <button
  type="button"
  onClick={askBackToSetup}
  className="mt-5 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20"
>
  Back to Setup
</button>
                  )}
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-xl md:p-6">
                  <h2 className="text-2xl font-black">How to take test</h2>

                  <div className="mt-5 space-y-3 text-sm leading-6 text-slate-400">
                    <p className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      1. Answer every question honestly.
                    </p>

                    <p className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      2. Submit once all questions are completed.
                    </p>

                    <p className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      3. Review wrong answers before moving ahead.
                    </p>
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
                      <p className="text-sm text-slate-400">Target Result</p>
                      <p className="mt-1 line-clamp-4 text-sm leading-6 text-slate-300">
                        {goal.targetResult || "Not added"}
                      </p>
                    </div>
                  </div>
                </section>
              </aside>

              {/* Questions */}
              <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl">
                <div className="flex flex-col gap-3 border-b border-white/10 bg-black/20 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-black">Weekly Questions</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {questionType === "mcq"
                        ? "Select one option for each question"
                        : "Write a short answer for each question"}
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-400">
                    {answeredCount}/{questions.length} answered
                  </span>
                </div>

                <div className="space-y-5 p-4 md:p-6">
                  {questions.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-slate-950 p-8 text-center">
                      <h2 className="text-2xl font-black">Preparing questions...</h2>
                      <p className="mt-3 text-slate-400">
                        Please wait while your weekly test is prepared.
                      </p>
                    </div>
                  ) : (
                    questions.map((item, questionIndex) => (
                      <div
                        key={`${item.question}-${questionIndex}`}
                        className="rounded-[1.5rem] border border-white/10 bg-slate-950 p-5 shadow-lg"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <h2 className="text-lg font-black leading-7 text-white md:text-xl">
                            {questionIndex + 1}. {item.question}
                          </h2>

                          <span
                            className={
                              answers[questionIndex]?.trim()
                                ? "w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300"
                                : "w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-500"
                            }
                          >
                            {answers[questionIndex]?.trim()
                              ? "Answered"
                              : "Pending"}
                          </span>
                        </div>

                        {item.type === "mcq" ? (
                          <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {(item.options || []).map((option) => {
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
                                      ? "rounded-2xl border border-emerald-400/50 bg-emerald-400/20 px-4 py-3 text-left font-semibold text-emerald-100"
                                      : hasSubmitted && isSelected && !isCorrect
                                      ? "rounded-2xl border border-red-400/50 bg-red-400/20 px-4 py-3 text-left font-semibold text-red-100"
                                      : isSelected
                                      ? "rounded-2xl border border-cyan-400/50 bg-cyan-400/20 px-4 py-3 text-left font-semibold text-cyan-100"
                                      : "rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left font-semibold text-slate-300 transition hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
                                  }
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-5">
                            <textarea
                              value={answers[questionIndex] || ""}
                              onChange={(event) =>
                                selectAnswer(questionIndex, event.target.value)
                              }
                              disabled={result.length > 0}
                              placeholder="Write your short answer here..."
                              className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400 disabled:opacity-70"
                            />

                            {result && (
                              <div className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                                <p className="font-black">Expected answer</p>
                                <p className="mt-2">{item.correctAnswer}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {result && (
                          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-sm font-black text-slate-300">
                              Explanation
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {item.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    onClick={submitTest}
                    disabled={
                      isSavingResult ||
                      testCompleted ||
                      questions.length === 0 ||
                      answeredCount < questions.length
                    }
                    className="w-full rounded-2xl bg-cyan-400 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {testCompleted
                      ? "Test Submitted"
                      : isSavingResult
                      ? "Saving Result..."
                      : answeredCount < questions.length
                      ? `Answer ${questions.length - answeredCount} More`
                      : "Submit Weekly Test"}
                  </button>

                  {result && (
                    <div className="rounded-[1.5rem] border border-blue-400/30 bg-blue-400/10 p-5 text-blue-100">
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
                        Result
                      </p>
                      <p className="mt-3 leading-7">{result}</p>

                     <button
  type="button"
  onClick={askStartAnotherTest}
  className="mt-5 rounded-2xl border border-blue-300/30 bg-blue-300/10 px-4 py-3 text-sm font-bold text-blue-100 transition hover:bg-blue-300/20"
>
  Start Another Test
</button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </section>
      </main>

         <Footer />

      <ConfirmModal
        isOpen={showBackToSetupConfirm}
        title="Go back to test setup?"
        message="Your current weekly test answers will be cleared from this screen. Use this only if you want to change test type or question count."
        confirmText="Yes, Go Back"
        cancelText="Cancel"
        icon="↩"
        tone="info"
        isLoading={false}
        onCancel={() => setShowBackToSetupConfirm(false)}
        onConfirm={confirmBackToSetup}
      />

      <ConfirmModal
        isOpen={showDiscardTestConfirm}
        title="Discard unfinished test?"
        message="This will remove the saved unfinished test from this device. You will need to start a new weekly test again."
        confirmText="Yes, Discard"
        cancelText="Cancel"
        icon="!"
        tone="danger"
        isLoading={false}
        onCancel={() => setShowDiscardTestConfirm(false)}
        onConfirm={confirmDiscardUnfinishedTest}
      />

      <ConfirmModal
        isOpen={showStartAnotherConfirm}
        title="Start another weekly test?"
        message="This will clear the current submitted result view and return you to the test setup screen. Your latest saved test result will remain saved in your goal."
        confirmText="Start Another"
        cancelText="Cancel"
        icon="↻"
        tone="info"
        isLoading={false}
        onCancel={() => setShowStartAnotherConfirm(false)}
        onConfirm={confirmStartAnotherTest}
      />
    </>
  );
}
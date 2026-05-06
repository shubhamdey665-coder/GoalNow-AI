"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (!isMounted) return;

      setUserEmail(data.user?.email ?? null);
      setIsCheckingAuth(false);
    }

    checkUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const isLoggedIn = Boolean(userEmail);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-950 text-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-20 md:py-28">
          <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />
          <div className="absolute right-0 top-40 h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-purple-500/10 blur-[100px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                AI-powered goal planning and tracking app
              </div>

              <h1 className="mt-7 max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl">
                Turn every goal into a clear daily system.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">
                GoalNow-AI helps you create simple habit trackers, complex AI
                study plans, daily progress systems, weekly tests, reports, and
                mentor-style guidance in one clean dashboard.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                {isCheckingAuth ? (
                  <div className="h-14 w-40 animate-pulse rounded-2xl bg-white/10" />
                ) : isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="rounded-2xl bg-cyan-400 px-7 py-4 text-center text-base font-black text-slate-950 transition hover:bg-cyan-300"
                  >
                    Open Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-2xl bg-cyan-400 px-7 py-4 text-center text-base font-black text-slate-950 transition hover:bg-cyan-300"
                  >
                    Login to Continue
                  </Link>
                )}

                <a
                  href="#trackers"
                  className="rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-center text-base font-bold text-white transition hover:bg-white/10"
                >
                  Explore Features
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-black text-cyan-300">2</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Tracker modes
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-black text-cyan-300">AI</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Mentor support
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-black text-cyan-300">7D</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Weekly testing
                  </p>
                </div>
              </div>
            </div>

            {/* Hero App Preview */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-cyan-300">
                      Example Dashboard Preview
                    </p>
                    <h2 className="mt-1 text-2xl font-black">
                      Your Goal System
                    </h2>
                  </div>

                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-bold text-white">38%</span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[38%] rounded-full bg-cyan-400" />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">Today</p>
                    <h3 className="mt-1 font-black text-white">
                      XY problem practice & Chapter Z revision 
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-400">AI Mentor</p>
                    <h3 className="mt-1 font-black text-white">
                      Weak point analysis
                    </h3>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <input type="checkbox" checked readOnly className="h-4 w-4" />
                    <span className="text-sm text-slate-300">
                      Complete today&apos;s problems
                    </span>
                  </label>

                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <input type="checkbox" readOnly className="h-4 w-4" />
                    <span className="text-sm text-slate-300">
                      Revise yesterday&apos;s mistakes
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tracker Types */}
        <section id="trackers" className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                Tracker Modes
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Choose the right system for your goal.
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-400">
                GoalNow-AI supports both simple daily tracking and complex
                roadmap-based tracking for long-term serious goals.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              {/* Normal Tracker */}
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl transition hover:bg-white/[0.07] md:p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400 text-2xl font-black text-slate-950">
                  N
                </div>

                <h3 className="mt-6 text-3xl font-black">Normal Tracker</h3>

                <p className="mt-4 text-base leading-7 text-slate-400">
                  Best for simple goals where you only need daily consistency.
                  Example: saving money, drinking water, walking, reading,
                  workout, prayer, or daily coding practice.
                </p>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="font-bold text-white">Calendar tracking</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Mark each day as completed and see your monthly progress.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="font-bold text-white">Future day lock</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Future dates stay locked so progress remains honest.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="font-bold text-white">Streak tracking</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Detect missed days and show streak breaks clearly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Complex Tracker */}
              <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-2xl shadow-cyan-500/10 transition hover:bg-cyan-400/[0.13] md:p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400 text-2xl font-black text-slate-950">
                  AI
                </div>

                <h3 className="mt-6 text-3xl font-black">
                  Complex AI Tracker
                </h3>

                <p className="mt-4 text-base leading-7 text-slate-300">
                  Best for big goals that need a structured roadmap. Example:
                  Google SWE preparation, exam preparation, business training,
                  fitness transformation, or any multi-month plan.
                </p>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="font-bold text-white">AI-generated roadmap</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Break your goal into daily tasks, weekly focus, and
                      long-term milestones.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="font-bold text-white">Active day system</p>
                    <p className="mt-1 text-sm text-slate-400">
                      The plan moves forward only when the current day is
                      completed.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="font-bold text-white">Weekly tests & reports</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Check performance, weak areas, and progress with reports.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-y border-white/10 bg-white/[0.03] px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                App Features
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Everything needed to stay consistent.
              </h2>

              <p className="mt-5 text-lg leading-8 text-slate-400">
                GoalNow-AI is built like a real productivity app, not just a
                simple todo list.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
  {
    icon: "🧠",
    title: "AI Roadmap",
    text: "Create structured goal plans based on your category, level, duration, and target result.",
  },
  {
    icon: "✅",
    title: "Daily Tracking",
    text: "Track today’s tasks clearly and keep your plan moving with honest completion.",
  },
  {
    icon: "📝",
    title: "Weekly Test",
    text: "Test your learning every week and understand whether you are improving.",
  },
  {
    icon: "📊",
    title: "Progress Report",
    text: "See completed days, missed dates, weak points, and overall progress.",
  },
  {
    icon: "🤖",
    title: "AI Mentor",
    text: "Ask for guidance, motivation, corrections, and next-step planning.",
  },
  {
    icon: "⚡",
    title: "Professional Dashboard",
    text: "Manage every goal from a clean dashboard with action menus and status views.",
  },
].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-[1.75rem] border border-white/10 bg-slate-950 p-6 transition hover:-translate-y-1 hover:bg-white/[0.04]"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-3xl shadow-lg shadow-cyan-500/10">
                    {feature.icon}
                  </div>

                  <h3 className="text-xl font-black text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                How It Works
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                From goal idea to daily execution.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Create a goal",
                  text: "Add goal name, category, target date, duration, and priority.",
                },
                {
                  step: "02",
                  title: "Choose tracker",
                  text: "Use Normal Tracker for habits or Complex AI Tracker for serious plans.",
                },
                {
                  step: "03",
                  title: "Track daily",
                  text: "Complete tasks, mark progress, and keep your streak honest.",
                },
                {
                  step: "04",
                  title: "Improve weekly",
                  text: "Use tests, reports, and AI mentor feedback to become better.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6"
                >
                  <p className="text-3xl font-black text-cyan-300">
                    {item.step}
                  </p>

                  <h3 className="mt-5 text-xl font-black">{item.title}</h3>

                  <p className="mt-3 text-sm leading-7 text-slate-400">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-400/20 to-blue-500/10 p-8 text-center md:p-12">
            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
              Ready to manage your goals properly?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              Open your dashboard and start building a system that helps you
              stay consistent every day.
            </p>

            <div className="mt-8">
              {isCheckingAuth ? (
                <div className="mx-auto h-14 w-44 animate-pulse rounded-2xl bg-white/10" />
              ) : isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex rounded-2xl bg-cyan-400 px-8 py-4 font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  Open Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex rounded-2xl bg-cyan-400 px-8 py-4 font-black text-slate-950 transition hover:bg-cyan-300"
                >
                  Login to Continue
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
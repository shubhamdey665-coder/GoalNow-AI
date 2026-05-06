"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("Study / Career");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setMessage("");
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 3) {
      setErrorMessage("Full name must be at least 3 characters.");
      setLoading(false);
      return;
    }

    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Password and confirm password do not match.");
      setLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage("Please accept the terms to create your account.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          name: cleanName,
          primary_goal: primaryGoal,
          onboarding_completed: false,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Account created successfully. Redirecting to login...");
    setLoading(false);

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  const goalOptions = [
    "Study / Career",
    "Coding / Software Job",
    "Fitness / Health",
    "Business / Side Income",
    "Personal Productivity",
    "Other",
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_1fr]">
        {/* Left Brand Side */}
        <div className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-xl font-black text-slate-950">
              G
            </div>

            <div>
              <p className="text-xl font-black">
                GoalNow<span className="text-cyan-300">-AI</span>
              </p>
              <p className="text-xs text-slate-400">Plan. Track. Improve.</p>
            </div>
          </Link>

          <div className="mt-12 max-w-xl">
            <p className="w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200">
              Start your journey
            </p>

            <h1 className="mt-6 text-5xl font-black tracking-tight">
              Build a goal system that actually keeps you consistent.
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              Create your account to generate goal plans, track daily progress,
              take weekly tests, and get AI mentor support based on your goal.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="font-black text-white">Personalized setup</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Your name and primary goal help GoalNow-AI create a better app
                  experience for you.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="font-black text-white">Professional dashboard</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Manage trackers, progress, AI mentor, tests, and reports from
                  one clean dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signup Card */}
        <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="lg:hidden">
            <Link href="/" className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 font-black text-slate-950">
                G
              </div>

              <div>
                <p className="text-lg font-black">
                  GoalNow<span className="text-cyan-300">-AI</span>
                </p>
                <p className="text-xs text-slate-400">Plan. Track. Improve.</p>
              </div>
            </Link>
          </div>

          <div>
            <p className="text-sm font-bold text-cyan-300">Create Account</p>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Start with GoalNow-AI
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Set up your profile so your dashboard and future AI mentor can
              feel more personal and useful.
            </p>
          </div>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white px-5 py-3 font-black text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-lg">G</span>
              {googleLoading ? "Connecting Google..." : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium text-slate-500">
                or create with email
              </span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-200">
                  Full name
                </label>

                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your full name"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-200">
                  Primary goal
                </label>

                <select
                  value={primaryGoal}
                  onChange={(event) => setPrimaryGoal(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                >
                  {goalOptions.map((goal) => (
                    <option key={goal} value={goal}>
                      {goal}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-200">
                Email address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-bold text-slate-200">
                  Password
                </label>

                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-200">
                  Confirm password
                </label>

                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat password"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1 h-4 w-4"
              />

              <span className="text-sm leading-6 text-slate-400">
                I agree to use GoalNow-AI responsibly and understand that my
                account will store my goals, plans, and progress data.
              </span>
            </label>

            {errorMessage && (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </p>
            )}

            {message && (
              <p className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-black text-cyan-300 transition hover:text-cyan-200"
            >
              Login
            </Link>
          </p>
        </section>
      </section>
    </main>
  );
}
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGoogleLogin() {
    setGoogleLoading(true);
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

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage("Please enter your email and password.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
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
              Welcome back
            </p>

            <h1 className="mt-6 text-5xl font-black tracking-tight">
              Continue building your future with GoalNow-AI.
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-400">
              Login to access your goals, daily trackers, AI mentor, weekly
              tests, and progress reports from one professional dashboard.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-black text-cyan-300">AI</p>
                <p className="mt-2 text-sm text-slate-400">Personal roadmap</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-black text-cyan-300">7D</p>
                <p className="mt-2 text-sm text-slate-400">Weekly progress</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-2xl font-black text-cyan-300">100%</p>
                <p className="mt-2 text-sm text-slate-400">Consistency focus</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <section className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:p-8">
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
            <p className="text-sm font-bold text-cyan-300">Account Login</p>

            <h2 className="mt-3 text-3xl font-black tracking-tight">
              Login to your account
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Continue your goal tracking journey with your saved plans and
              progress.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
                or login with email
              </span>
              <div className="h-px flex-1 bg-white/10" />
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

            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-bold text-slate-200">
                  Password
                </label>

                <span className="text-xs text-slate-500">
                  Minimum 6 characters
                </span>
              </div>

              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>

            {errorMessage && (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded-2xl bg-cyan-400 px-5 py-3 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            New to GoalNow-AI?{" "}
            <Link
              href="/signup"
              className="font-black text-cyan-300 transition hover:text-cyan-200"
            >
              Create account
            </Link>
          </p>
        </section>
      </section>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardWelcome() {
  const [firstName, setFirstName] = useState("User");

  useEffect(() => {
    async function loadUserName() {
      const supabase = createClient();

      const { data } = await supabase.auth.getUser();

      const user = data.user;

      if (!user) return;

      const metadata = user.user_metadata || {};

      const fullName =
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "User";

      const onlyFirstName = fullName.trim().split(" ")[0];

      setFirstName(onlyFirstName || "User");
    }

    loadUserName();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-2xl shadow-cyan-500/10 md:p-8">
      <div className="absolute right-0 top-0 h-64 w-64 animate-pulse rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-64 w-64 animate-pulse rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative">
        <div className="inline-flex animate-bounce items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-200">
          <span className="h-2 w-2 rounded-full bg-cyan-300" />
          Logged in successfully
        </div>

        <h1 className="mt-5 animate-fade-in-up text-4xl font-black tracking-tight text-white md:text-5xl">
          Welcome to GoalNow-AI,{" "}
          <span className="text-cyan-300">{firstName}!</span>
        </h1>

        <p className="mt-4 max-w-2xl animate-fade-in-up-delay-1 text-sm leading-7 text-slate-400 md:text-base">
          Your personal goal command center is ready. Create a new goal, track
          daily progress, check weekly tests, and use your AI mentor to stay
          consistent.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="animate-fade-in-up-delay-2 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm text-slate-400">Step 1</p>
            <p className="mt-1 font-black text-white">Choose a goal</p>
          </div>

          <div className="animate-fade-in-up-delay-3 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm text-slate-400">Step 2</p>
            <p className="mt-1 font-black text-white">Track daily</p>
          </div>

          <div className="animate-fade-in-up-delay-4 rounded-2xl border border-white/10 bg-black/30 p-4">
            <p className="text-sm text-slate-400">Step 3</p>
            <p className="mt-1 font-black text-white">Improve weekly</p>
          </div>
        </div>
      </div>
    </div>
  );
}
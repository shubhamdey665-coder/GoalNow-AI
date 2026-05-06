"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("Coding / Software Job");
  const [currentLevel, setCurrentLevel] = useState("Beginner");
  const [dailyTime, setDailyTime] = useState("1-2 hours");

  const [createdAt, setCreatedAt] = useState("");
  const [lastSignInAt, setLastSignInAt] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.push("/login");
        return;
      }

      const user = data.user;
      const metadata = user.user_metadata || {};

      setEmail(user.email || "");
      setFullName(
        metadata.full_name ||
          metadata.name ||
          user.email?.split("@")[0] ||
          ""
      );

      setPrimaryGoal(metadata.primary_goal || "Coding / Software Job");
      setCurrentLevel(metadata.current_level || "Beginner");
      setDailyTime(metadata.daily_time || "1-2 hours");

      setCreatedAt(user.created_at || "");
      setLastSignInAt(user.last_sign_in_at || "");

      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (fullName.trim().length < 3) {
      setErrorMessage("Name must be at least 3 characters.");
      return;
    }

    setSavingProfile(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        name: fullName.trim(),
        primary_goal: primaryGoal,
        current_level: currentLevel,
        daily_time: dailyTime,
      },
    });

    setSavingProfile(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Profile updated successfully.");
    router.refresh();
  }

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    setSavingPassword(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSavingPassword(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setSuccessMessage("Password updated successfully.");
  }

  async function handleLogout() {
    setLoggingOut(true);
    setErrorMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    setLoggingOut(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  const firstLetter =
    fullName.trim().charAt(0).toUpperCase() ||
    email.trim().charAt(0).toUpperCase() ||
    "U";

  const goalOptions = [
    "Coding / Software Job",
    "Study / Career",
    "Fitness / Health",
    "Business / Side Income",
    "Personal Productivity",
    "Other",
  ];

  const levelOptions = ["Beginner", "Intermediate", "Advanced"];

  const timeOptions = [
    "Less than 30 minutes",
    "30 minutes - 1 hour",
    "1-2 hours",
    "2-4 hours",
    "4+ hours",
  ];

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
          <section className="mx-auto max-w-5xl">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-10 text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              <h1 className="text-3xl font-black">Loading profile...</h1>
              <p className="mt-3 text-slate-400">
                Fetching your account details.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-950 px-4 py-6 text-white md:px-6 md:py-10">
        <section className="mx-auto max-w-7xl">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            ← Back to Dashboard
          </Link>

          {/* Header */}
          <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                  Account Settings
                </p>

                <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                  Manage your profile
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                  Update your personal details, goal preferences, account
                  settings, and password from one clean profile page.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-400 text-3xl font-black text-slate-950">
                    {firstLetter}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-black">
                      {fullName || "GoalNow User"}
                    </h2>

                    <p className="mt-1 truncate text-sm text-slate-400">
                      {email}
                    </p>

                    <span className="mt-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      Active Account
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {(successMessage || errorMessage) && (
            <div
              className={
                successMessage
                  ? "mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200"
                  : "mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200"
              }
            >
              {successMessage || errorMessage}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            {/* Left Side */}
            <aside className="space-y-6">
              <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl">
                <h2 className="text-2xl font-black">Account Overview</h2>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="mt-1 break-all font-bold text-white">
                      {email}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-slate-400">Primary Goal</p>
                    <p className="mt-1 font-bold text-white">{primaryGoal}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-slate-400">Current Level</p>
                    <p className="mt-1 font-bold text-white">{currentLevel}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-slate-400">
                      Daily Available Time
                    </p>
                    <p className="mt-1 font-bold text-white">{dailyTime}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl">
                <h2 className="text-2xl font-black">Account Activity</h2>

                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-slate-400">Account Created</p>
                    <p className="mt-1 font-bold text-white">
                      {createdAt
                        ? new Date(createdAt).toLocaleDateString()
                        : "Not available"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-slate-400">Last Sign In</p>
                    <p className="mt-1 font-bold text-white">
                      {lastSignInAt
                        ? new Date(lastSignInAt).toLocaleDateString()
                        : "Not available"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-6">
                <h2 className="text-xl font-black text-red-100">
                  Session Control
                </h2>

                <p className="mt-2 text-sm leading-6 text-red-100/80">
                  Logout from this device when you finish using GoalNow-AI.
                </p>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-5 w-full rounded-2xl border border-red-300/30 bg-red-300/10 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-300/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </section>
            </aside>

            {/* Right Side Forms */}
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl">
                <div>
                  <p className="text-sm font-bold text-cyan-300">
                    Personal Details
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Update profile information
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    These details help GoalNow-AI personalize your dashboard and
                    future mentor experience.
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
                  <div>
                    <label className="text-sm font-bold text-slate-200">
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Enter your full name"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-200">
                      Email Address
                    </label>

                    <input
                      type="email"
                      value={email}
                      disabled
                      className="mt-2 w-full cursor-not-allowed rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-400 outline-none"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Email changing is disabled for now to avoid account
                      verification issues.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-bold text-slate-200">
                        Primary Goal
                      </label>

                      <select
                        value={primaryGoal}
                        onChange={(event) =>
                          setPrimaryGoal(event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                      >
                        {goalOptions.map((goal) => (
                          <option key={goal} value={goal}>
                            {goal}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-200">
                        Current Level
                      </label>

                      <select
                        value={currentLevel}
                        onChange={(event) =>
                          setCurrentLevel(event.target.value)
                        }
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                      >
                        {levelOptions.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-200">
                      Daily Available Time
                    </label>

                    <select
                      value={dailyTime}
                      onChange={(event) => setDailyTime(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="rounded-2xl bg-cyan-400 px-6 py-4 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProfile ? "Saving Profile..." : "Save Profile"}
                  </button>
                </form>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl">
                <div>
                  <p className="text-sm font-bold text-purple-300">
                    Security
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    Change password
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Update your password to keep your GoalNow-AI account safe.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="mt-6 space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-bold text-slate-200">
                        New Password
                      </label>

                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(event.target.value)
                        }
                        placeholder="Minimum 6 characters"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-purple-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-slate-200">
                        Confirm Password
                      </label>

                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        placeholder="Repeat new password"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="rounded-2xl bg-white px-6 py-4 font-black text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
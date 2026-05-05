"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

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

      setEmail(data.user.email ?? "");
      setFullName(
        data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          ""
      );

      setLoading(false);
    }

    loadUser();
  }, [router]);

  async function handleUpdateName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (fullName.trim().length < 3) {
      setErrorMessage("Name must be at least 3 characters.");
      return;
    }

    setSavingName(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        name: fullName.trim(),
      },
    });

    setSavingName(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Profile name updated successfully.");
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

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <section className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-slate-300">Loading account...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
        <section className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-300">
                Account Settings
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                Manage your profile
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Update your name, password, and account preferences for your
                GoalNow-AI account.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="w-fit rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
            >
              Back to Dashboard
            </Link>
          </div>

          {(successMessage || errorMessage) && (
            <div
              className={
                successMessage
                  ? "mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200"
                  : "mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-4 text-sm text-red-200"
              }
            >
              {successMessage || errorMessage}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <aside className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-400 text-3xl font-black text-slate-950">
                    {firstLetter}
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-black">
                      {fullName || "GoalNow User"}
                    </h2>

                    <p className="mt-1 truncate text-sm text-slate-400">
                      {email}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-400">Account</span>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      Active
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-400">Email</span>
                    <span className="truncate text-sm font-semibold text-slate-200">
                      {email}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="mt-6 w-full rounded-2xl border border-red-400/30 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? "Logging out..." : "Logout"}
                </button>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-black">Professional app tips</h3>

                <ul className="mt-4 space-y-3 text-sm text-slate-400">
                  <li>• Keep your profile name real and readable.</li>
                  <li>• Use a strong password for account safety.</li>
                  <li>• Your email is used for login and account recovery.</li>
                </ul>
              </section>
            </aside>

            <div className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
                <div>
                  <h2 className="text-2xl font-black">Profile information</h2>

                  <p className="mt-2 text-sm text-slate-400">
                    This name can be used across GoalNow-AI pages and future AI
                    mentor personalization.
                  </p>
                </div>

                <form onSubmit={handleUpdateName} className="mt-6 space-y-5">
                  <div>
                    <label className="text-sm font-bold text-slate-200">
                      Full name
                    </label>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Enter your full name"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-200">
                      Email address
                    </label>

                    <input
                      type="email"
                      value={email}
                      disabled
                      className="mt-2 w-full cursor-not-allowed rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-400 outline-none"
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Email changing is kept disabled for now to avoid login
                      issues. We can add it later with email verification.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={savingName}
                    className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingName ? "Saving..." : "Save Profile"}
                  </button>
                </form>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
                <div>
                  <h2 className="text-2xl font-black">Change password</h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Update your login password. Choose something strong and
                    memorable.
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="mt-6 space-y-5">
                  <div>
                    <label className="text-sm font-bold text-slate-200">
                      New password
                    </label>

                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Enter new password"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-200">
                      Confirm new password
                    </label>

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      placeholder="Confirm new password"
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingPassword ? "Updating..." : "Update Password"}
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
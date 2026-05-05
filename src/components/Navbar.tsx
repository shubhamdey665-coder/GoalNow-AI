"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;

      setUserEmail(data.user?.email ?? null);
      setIsCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUserEmail(session?.user.email ?? null);
      setIsCheckingAuth(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    setIsLoggingOut(false);

    if (error) {
      alert(error.message);
      return;
    }

    setUserEmail(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/90 px-6 py-4 text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          GoalNow AI
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {isCheckingAuth ? (
            <span className="rounded-xl border border-white/10 px-4 py-2 text-zinc-400">
              Checking...
            </span>
          ) : userEmail ? (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-xl px-3 py-2 font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white sm:inline"
              >
                Dashboard
              </Link>

              <Link
                href="/goals/new"
                className="hidden rounded-xl px-3 py-2 font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white sm:inline"
              >
                Create Goal
              </Link>
              <Link
                href="/profile"
                className="hidden rounded-xl px-3 py-2 font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white sm:inline"
              >
                Profile
              </Link>

              <span className="hidden max-w-[180px] truncate rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-cyan-200 md:inline">
                {userEmail}
              </span>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-xl border border-red-400/30 px-4 py-2 font-semibold text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-white/15 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
              >
                Login
              </Link>

              <Link
                href="/signup"
                className="rounded-xl bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
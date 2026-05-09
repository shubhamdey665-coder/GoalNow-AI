"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;

      setUserEmail(data.user?.email ?? null);
      setUserName(
        data.user?.user_metadata?.full_name ||
          data.user?.user_metadata?.name ||
          ""
      );

      setIsCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setUserEmail(session?.user.email ?? null);
      setUserName(
        session?.user.user_metadata?.full_name ||
          session?.user.user_metadata?.name ||
          ""
      );

      setIsCheckingAuth(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const confirmLogout = window.confirm("Are you sure you want to logout?");

    if (!confirmLogout) return;

    setIsLoggingOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    setIsLoggingOut(false);

    if (error) {
      alert(error.message);
      return;
    }

    setUserEmail(null);
    setUserName("");
    setIsMobileMenuOpen(false);

    router.push("/login");
    router.refresh();
  }

  function isActive(path: string) {
    if (path === "/") {
      return pathname === "/";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  }

  const firstLetter =
    userName.trim().charAt(0).toUpperCase() ||
    userEmail?.trim().charAt(0).toUpperCase() ||
    "U";

  const displayName = userName || userEmail?.split("@")[0] || "User";

  const loggedInLinks = [
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Create Goal",
      href: "/goals/new",
    },
    {
      label: "Profile",
      href: "/profile",
    },
  ];

  const publicLinks = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Features",
      href: "/#features",
    },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/85 px-3 py-3 text-white backdrop-blur-2xl md:px-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 md:gap-4">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setIsMobileMenuOpen(false)}
          className="group flex min-w-0 items-center gap-3"
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-cyan-300/20 bg-slate-950 shadow-lg shadow-cyan-500/20 transition group-hover:scale-105 md:h-12 md:w-12">
            <Image
              src="/goalnow-logo-new.png"
              alt="GoalNow-AI Logo"
              fill
              sizes="48px"
              className="object-cover"
              priority
            />
          </div>

          <div className="min-w-0 leading-tight">
            <p className="truncate text-lg font-black tracking-tight md:text-xl">
              GoalNow<span className="text-cyan-300">-AI</span>
            </p>
            <p className="hidden text-xs font-medium text-slate-400 sm:block">
              Plan. Track. Improve.
            </p>
          </div>
        </Link>

        {/* Desktop Center Links */}
        <div className="hidden items-center rounded-2xl border border-white/10 bg-white/5 p-1 text-sm lg:flex">
          {userEmail
            ? loggedInLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive(item.href)
                      ? "rounded-xl bg-white px-4 py-2 font-bold text-slate-950 shadow-sm"
                      : "rounded-xl px-4 py-2 font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              ))
            : publicLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive(item.href)
                      ? "rounded-xl bg-white px-4 py-2 font-bold text-slate-950 shadow-sm"
                      : "rounded-xl px-4 py-2 font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              ))}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-3 lg:flex">
          {isCheckingAuth ? (
            <div className="h-11 w-32 animate-pulse rounded-2xl bg-white/10" />
          ) : userEmail ? (
            <>
              <Link
                href="/profile"
                className="flex max-w-[260px] items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400 text-sm font-black text-slate-950">
                  {firstLetter}
                </div>

                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-bold text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {userEmail}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-2xl border border-red-400/30 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((current) => !current)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-bold transition hover:bg-white/10 lg:hidden"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? "×" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="mx-auto mt-3 max-w-7xl rounded-3xl border border-white/10 bg-slate-900 p-3 shadow-2xl lg:hidden">
          {isCheckingAuth ? (
            <div className="rounded-2xl bg-white/5 px-4 py-4 text-sm text-slate-400">
              Checking account...
            </div>
          ) : userEmail ? (
            <>
              <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 font-black text-slate-950">
                  {firstLetter}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {userEmail}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {loggedInLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={
                      isActive(item.href)
                        ? "block rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950"
                        : "block rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                    }
                  >
                    {item.label}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="block w-full rounded-2xl border border-red-400/30 px-4 py-3 text-left text-sm font-bold text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              {publicLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={
                    isActive(item.href)
                      ? "block rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950"
                      : "block rounded-2xl px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-2xl border border-white/15 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
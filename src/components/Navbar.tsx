"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ConfirmModal from "@/components/ConfirmModal";

type NavLink = {
  label: string;
  href: string;
  icon: string;
  description: string;
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const loggedInLinks: NavLink[] = useMemo(
    () => [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: "▦",
        description: "Your goal command center",
      },
      {
        label: "Create Goal",
        href: "/goals/new",
        icon: "✦",
        description: "Start a new tracker",
      },
      {
        label: "Profile",
        href: "/profile",
        icon: "◎",
        description: "Account settings",
      },
    ],
    []
  );

  const publicLinks: NavLink[] = useMemo(
    () => [
      {
        label: "Home",
        href: "/",
        icon: "⌂",
        description: "Go to landing page",
      },
      {
        label: "Features",
        href: "/#features",
        icon: "✺",
        description: "Explore GoalNow-AI",
      },
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      setUserEmail(user?.email ?? null);
      setUserName(
        user?.user_metadata?.full_name || user?.user_metadata?.name || ""
      );
      setIsCheckingAuth(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      const user = session?.user;

      setUserEmail(user?.email ?? null);
      setUserName(
        user?.user_metadata?.full_name || user?.user_metadata?.name || ""
      );
      setIsCheckingAuth(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowLogoutConfirm(false);
  }, [pathname]);

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
    setUserName("");
    setIsMobileMenuOpen(false);
    setShowLogoutConfirm(false);

    router.push("/login");
    router.refresh();
  }

  function isActive(path: string) {
    if (path === "/") {
      return pathname === "/";
    }

    if (path.includes("#")) {
      return pathname === "/";
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  }

  const displayName = userName || userEmail?.split("@")[0] || "User";

  const firstLetter =
    displayName.trim().charAt(0).toUpperCase() ||
    userEmail?.trim().charAt(0).toUpperCase() ||
    "U";

  const navLinks = userEmail ? loggedInLinks : publicLinks;

  return (
    <>
      <nav className="sticky top-0 z-50 px-3 py-3 text-white md:px-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_30%_0%,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_75%_0%,rgba(59,130,246,0.18),transparent_30%)] blur-2xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="animated-navbar-shell relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/75 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <div className="navbar-aurora-line pointer-events-none absolute inset-x-0 top-0 h-px" />
            <div className="navbar-shine pointer-events-none absolute inset-0 opacity-70" />

            <div className="relative flex items-center justify-between gap-3 px-3 py-3 md:px-4">
              {/* Logo */}
              <Link
                href={userEmail ? "/dashboard" : "/"}
                className="group flex min-w-0 items-center gap-3"
              >
                <div className="logo-orbit relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
  <div className="absolute inset-0 rounded-2xl bg-cyan-300/20 blur-xl transition group-hover:bg-cyan-300/35" />

  <div className="relative z-10 h-12 w-12 overflow-hidden rounded-2xl border border-cyan-200/40 bg-slate-950 shadow-xl shadow-cyan-500/30 ring-1 ring-cyan-200/20 transition duration-500 group-hover:scale-110">
    <Image
      src="/goalnow-logo-new.png"
      alt="GoalNow-AI Logo"
      fill
      sizes="56px"
      className="object-contain p-1"
      priority
    />
  </div>
</div>

                <div className="min-w-0 leading-tight">
                  <p className="brand-text truncate text-lg font-black tracking-tight md:text-xl">
                    GoalNow<span className="text-cyan-300">-AI</span>
                  </p>
                  <p className="hidden text-xs font-semibold text-slate-400 sm:block">
                    Plan. Track. Improve.
                  </p>
                </div>
              </Link>

              {/* Desktop Links */}
              <div className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.055] p-1 shadow-inner shadow-white/5 lg:flex">
                {navLinks.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={
                        active
                          ? "nav-pill-active group relative flex items-center gap-2 overflow-hidden rounded-xl px-4 py-2 text-sm font-black text-slate-950"
                          : "nav-pill group relative flex items-center gap-2 overflow-hidden rounded-xl px-4 py-2 text-sm font-bold text-slate-300 transition hover:text-white"
                      }
                    >
                      <span
                        className={
                          active
                            ? "nav-icon-active text-sm"
                            : "nav-icon text-sm text-cyan-200"
                        }
                      >
                        {item.icon}
                      </span>

                      <span className="relative z-10">{item.label}</span>

                      {!active && (
                        <span className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition duration-300 group-hover:opacity-100" />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Desktop Right */}
              <div className="hidden items-center gap-3 lg:flex">
                {isCheckingAuth ? (
                  <div className="h-12 w-44 animate-pulse rounded-2xl bg-white/10" />
                ) : userEmail ? (
                  <>
                    <Link
                      href="/profile"
                      className="account-pill group flex max-w-[280px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 shadow-lg shadow-black/10 transition hover:border-cyan-300/40 hover:bg-white/10"
                    >
                      <div className="avatar-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-200 via-cyan-300 to-blue-400 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/25">
                        {firstLetter}
                      </div>

                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-sm font-black text-white group-hover:text-cyan-200">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {userEmail}
                        </p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(true)}
                      disabled={isLoggingOut}
                      className="danger-button rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-black text-red-100 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link
                      href="/login"
                      className="rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
                    >
                      Login
                    </Link>

                    <Link
                      href="/signup"
                      className="cta-button rounded-2xl px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/20"
                    >
                      Start Free
                    </Link>
                  </div>
                )}
              </div>

              {/* Mobile Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                className="hamburger-button flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-xl font-black transition hover:bg-white/10 lg:hidden"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                <span
                  className={
                    isMobileMenuOpen
                      ? "hamburger-line hamburger-open"
                      : "hamburger-line"
                  }
                />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="mobile-menu-enter relative mt-3 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/95 p-3 text-white shadow-2xl shadow-black/40 backdrop-blur-2xl lg:hidden">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.14),transparent_35%)]" />

              <div className="relative">
                {isCheckingAuth ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold text-slate-400">
                    Checking account...
                  </div>
                ) : userEmail ? (
                  <>
                    <Link
                      href="/profile"
                      className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 transition hover:bg-white/10"
                    >
                      <div className="avatar-glow flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-200 via-cyan-300 to-blue-400 font-black text-slate-950">
                        {firstLetter}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {userEmail}
                        </p>
                      </div>
                    </Link>

                    <div className="space-y-2">
                      {loggedInLinks.map((item, index) => {
                        const active = isActive(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={
                              active
                                ? "mobile-link mobile-link-active flex items-center gap-3 rounded-2xl px-4 py-3"
                                : "mobile-link flex items-center gap-3 rounded-2xl px-4 py-3"
                            }
                            style={{ animationDelay: `${index * 80}ms` }}
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                              {item.icon}
                            </span>

                            <span>
                              <span className="block text-sm font-black">
                                {item.label}
                              </span>
                              <span className="block text-xs text-slate-400">
                                {item.description}
                              </span>
                            </span>
                          </Link>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        disabled={isLoggingOut}
                        className="mobile-link flex w-full items-center gap-3 rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-left text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/15">
                          ↪
                        </span>

                        <span>
                          <span className="block text-sm font-black">
                            {isLoggingOut ? "Logging out..." : "Logout"}
                          </span>
                          <span className="block text-xs text-red-200/70">
                            Leave this session
                          </span>
                        </span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    {publicLinks.map((item, index) => {
                      const active = isActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={
                            active
                              ? "mobile-link mobile-link-active flex items-center gap-3 rounded-2xl px-4 py-3"
                              : "mobile-link flex items-center gap-3 rounded-2xl px-4 py-3"
                          }
                          style={{ animationDelay: `${index * 80}ms` }}
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-cyan-200">
                            {item.icon}
                          </span>

                          <span>
                            <span className="block text-sm font-black">
                              {item.label}
                            </span>
                            <span className="block text-xs text-slate-400">
                              {item.description}
                            </span>
                          </span>
                        </Link>
                      );
                    })}

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Link
                        href="/login"
                        className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
                      >
                        Login
                      </Link>

                      <Link
                        href="/signup"
                        className="cta-button rounded-2xl px-4 py-3 text-center text-sm font-black text-slate-950"
                      >
                        Start Free
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Modal */}
      <ConfirmModal
  isOpen={showLogoutConfirm}
  title="Logout from GoalNow-AI?"
  message="Your goals are saved with your account. You can login again anytime and continue your progress."
  confirmText="Yes, Logout"
  cancelText="Cancel"
  icon="↪"
  tone="danger"
  isLoading={isLoggingOut}
  onCancel={() => setShowLogoutConfirm(false)}
  onConfirm={handleLogout}
/>

      <style jsx global>{`
        .animated-navbar-shell::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 2rem;
          padding: 1px;
          background: linear-gradient(
            120deg,
            rgba(34, 211, 238, 0.45),
            rgba(255, 255, 255, 0.08),
            rgba(59, 130, 246, 0.35),
            rgba(34, 211, 238, 0.45)
          );
          background-size: 300% 300%;
          animation: navbarBorderFlow 7s ease infinite;
          pointer-events: none;
          opacity: 0.8;
        }

        .navbar-aurora-line {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(34, 211, 238, 0.85),
            rgba(255, 255, 255, 0.7),
            rgba(59, 130, 246, 0.85),
            transparent
          );
          background-size: 250% 100%;
          animation: auroraLine 4s linear infinite;
        }

        .navbar-shine {
          background: linear-gradient(
            110deg,
            transparent 0%,
            transparent 35%,
            rgba(255, 255, 255, 0.055) 50%,
            transparent 65%,
            transparent 100%
          );
          transform: translateX(-100%);
          animation: shineSweep 6s ease-in-out infinite;
        }

        .brand-text {
          background: linear-gradient(
            90deg,
            #ffffff,
            #bae6fd,
            #67e8f9,
            #ffffff
          );
          background-size: 250% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: brandGlow 5s ease-in-out infinite;
        }

        .logo-orbit::before {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 1.3rem;
  background: conic-gradient(
    from 0deg,
    transparent,
    rgba(34, 211, 238, 0.75),
    transparent,
    rgba(59, 130, 246, 0.55),
    transparent
  );
  animation: orbitSpin 6s linear infinite;
  opacity: 0.75;
}

        

        .nav-pill::before {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-110%);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.12),
            transparent
          );
          transition: transform 0.6s ease;
        }

        .nav-pill:hover::before {
          transform: translateX(110%);
        }

        .nav-pill-active {
          background: linear-gradient(135deg, #67e8f9, #22d3ee, #38bdf8);
          box-shadow: 0 10px 30px rgba(34, 211, 238, 0.22);
        }

        .nav-pill-active::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.28),
            transparent
          );
          transform: translateX(-100%);
          animation: activePillShine 3s ease-in-out infinite;
        }

        .nav-icon {
          animation: floatIcon 2.6s ease-in-out infinite;
        }

        .nav-icon-active {
          animation: pulseIcon 1.5s ease-in-out infinite;
        }

        .account-pill {
          position: relative;
          overflow: hidden;
        }

        .account-pill::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            110deg,
            transparent,
            rgba(34, 211, 238, 0.12),
            transparent
          );
          transform: translateX(-120%);
          transition: transform 0.7s ease;
        }

        .account-pill:hover::after {
          transform: translateX(120%);
        }

        .avatar-glow {
          animation: avatarPulse 3s ease-in-out infinite;
        }

        .cta-button {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #67e8f9, #22d3ee, #38bdf8);
          transition:
            transform 0.25s ease,
            box-shadow 0.25s ease,
            background 0.25s ease;
        }

        .cta-button:hover {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 18px 40px rgba(34, 211, 238, 0.24);
        }

        .cta-button::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.35),
            transparent
          );
          transform: translateX(-100%);
          animation: ctaSweep 3.2s ease-in-out infinite;
        }

        .danger-button {
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            rgba(248, 113, 113, 0.16),
            rgba(239, 68, 68, 0.18)
          );
          transition:
            transform 0.25s ease,
            background 0.25s ease,
            box-shadow 0.25s ease;
        }

        .danger-button:hover {
          transform: translateY(-1px);
          background: linear-gradient(
            135deg,
            rgba(248, 113, 113, 0.28),
            rgba(239, 68, 68, 0.3)
          );
          box-shadow: 0 14px 35px rgba(248, 113, 113, 0.14);
        }

        .hamburger-button {
          position: relative;
        }

        .hamburger-line,
        .hamburger-line::before,
        .hamburger-line::after {
          display: block;
          height: 2px;
          width: 20px;
          border-radius: 999px;
          background: white;
          transition:
            transform 0.3s ease,
            opacity 0.3s ease;
        }

        .hamburger-line::before,
        .hamburger-line::after {
          content: "";
          position: absolute;
        }

        .hamburger-line::before {
          transform: translateY(-7px);
        }

        .hamburger-line::after {
          transform: translateY(7px);
        }

        .hamburger-open {
          background: transparent;
        }

        .hamburger-open::before {
          transform: rotate(45deg);
        }

        .hamburger-open::after {
          transform: rotate(-45deg);
        }

        .mobile-menu-enter {
          animation: mobileMenuEnter 0.35s ease both;
        }

        .mobile-link {
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.045);
          color: rgb(226 232 240);
          animation: mobileItemEnter 0.42s ease both;
          transition:
            transform 0.25s ease,
            background 0.25s ease,
            border-color 0.25s ease;
        }

        .mobile-link:hover {
          transform: translateX(4px);
          border-color: rgba(34, 211, 238, 0.35);
          background: rgba(255, 255, 255, 0.09);
          color: white;
        }

        .mobile-link-active {
          border-color: rgba(34, 211, 238, 0.4);
          background: linear-gradient(
            135deg,
            rgba(34, 211, 238, 0.24),
            rgba(59, 130, 246, 0.18)
          );
          color: white;
        }

        

        @keyframes navbarBorderFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes auroraLine {
          from {
            background-position: 0% 50%;
          }
          to {
            background-position: 250% 50%;
          }
        }

        @keyframes shineSweep {
          0%,
          55% {
            transform: translateX(-110%);
          }
          75% {
            transform: translateX(110%);
          }
          100% {
            transform: translateX(110%);
          }
        }

        @keyframes brandGlow {
          0%,
          100% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
        }

        @keyframes orbitSpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes activePillShine {
          0%,
          45% {
            transform: translateX(-100%);
          }
          70% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes floatIcon {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }

        @keyframes pulseIcon {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.16);
          }
        }

        @keyframes avatarPulse {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(34, 211, 238, 0);
          }
          50% {
            box-shadow: 0 0 24px rgba(34, 211, 238, 0.28);
          }
        }

        @keyframes ctaSweep {
          0%,
          45% {
            transform: translateX(-100%);
          }
          70% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes mobileMenuEnter {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes mobileItemEnter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        

        @media (prefers-reduced-motion: reduce) {
  .animated-navbar-shell::before,
  .navbar-aurora-line,
  .navbar-shine,
  .brand-text,
  .logo-orbit::before,
  .nav-pill-active::after,
  .nav-icon,
  .nav-icon-active,
  .avatar-glow,
  .cta-button::after,
  .mobile-menu-enter,
  .mobile-link {
    animation: none !important;
  }
}
      `}</style>
    </>
  );
}
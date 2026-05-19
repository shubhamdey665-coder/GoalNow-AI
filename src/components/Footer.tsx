import Link from "next/link";
export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 px-6 py-10 text-slate-300">
  <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
    {/* Brand */}
    <div className="md:col-span-1">
      <h2 className="text-xl font-bold tracking-tight text-white">
        GoalNow-AI
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        AI-powered goal planning, daily tracking, weekly tests, progress reports,
        and personal mentorship to help you stay consistent.
      </p>
    </div>

    {/* Product */}
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
        Product
      </h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-400">
        <li>
          <Link href="/dashboard" className="transition hover:text-white">
            Dashboard
          </Link>
        </li>
        <li>
          <Link href="/goals/new" className="transition hover:text-white">
            Create Goal
          </Link>
        </li>
        <li>
          <Link href="/dashboard" className="transition hover:text-white">
            Daily Tracker
          </Link>
        </li>
        <li>
          <Link href="/dashboard" className="transition hover:text-white">
            Progress Report
          </Link>
        </li>
      </ul>
    </div>

    {/* Features */}
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
        Features
      </h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-400">
        <li>
          <Link href="/dashboard" className="transition hover:text-white">
            AI Roadmap
          </Link>
        </li>
        <li>
          <Link href="/dashboard" className="transition hover:text-white">
            AI Mentor
          </Link>
        </li>
        <li>
          <Link href="/dashboard" className="transition hover:text-white">
            Weekly Test
          </Link>
        </li>
        <li>
          <Link href="/dashboard" className="transition hover:text-white">
            Goal Analytics
          </Link>
        </li>
      </ul>
    </div>

    {/* Company */}
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
        Company
      </h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-400">
        <li>
          <Link href="/" className="transition hover:text-white">
            Home
          </Link>
        </li>
        <li>
          <Link href="/dashboard" className="transition hover:text-white">
            Get Started
          </Link>
        </li>
        <li>
          <a href="mailto:shubhamdey665@gmail.com" className="transition hover:text-white">
            Contact
          </a>
        </li>
        <li>
          <Link href="/" className="transition hover:text-white">
            About GoalNow-AI
          </Link>
        </li>
      </ul>
    </div>
  </div>

  {/* Bottom Bar */}
  <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 md:flex-row">
    <p>
      © 2026 Powered by{" "}
      <span className="font-semibold text-slate-300">GoalNow-AI</span>. All rights reserved.
    </p>

    <div className="flex items-center gap-5">
      <Link href="/" className="transition hover:text-white">
        Privacy Policy
      </Link>
      <Link href="/" className="transition hover:text-white">
        Terms
      </Link>
      <Link href="/" className="transition hover:text-white">
        Security
      </Link>
    </div>
  </div>
</footer>
  );
}
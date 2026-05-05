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
          <a href="/dashboard" className="transition hover:text-white">
            Dashboard
          </a>
        </li>
        <li>
          <a href="/goals/new" className="transition hover:text-white">
            Create Goal
          </a>
        </li>
        <li>
          <a href="/dashboard" className="transition hover:text-white">
            Daily Tracker
          </a>
        </li>
        <li>
          <a href="/dashboard" className="transition hover:text-white">
            Progress Report
          </a>
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
          <a href="/dashboard" className="transition hover:text-white">
            AI Roadmap
          </a>
        </li>
        <li>
          <a href="/dashboard" className="transition hover:text-white">
            AI Mentor
          </a>
        </li>
        <li>
          <a href="/dashboard" className="transition hover:text-white">
            Weekly Test
          </a>
        </li>
        <li>
          <a href="/dashboard" className="transition hover:text-white">
            Goal Analytics
          </a>
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
          <a href="/" className="transition hover:text-white">
            Home
          </a>
        </li>
        <li>
          <a href="/dashboard" className="transition hover:text-white">
            Get Started
          </a>
        </li>
        <li>
          <a href="mailto:shubhamdey665@gmail.com" className="transition hover:text-white">
            Contact
          </a>
        </li>
        <li>
          <a href="/" className="transition hover:text-white">
            About GoalNow-AI
          </a>
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
      <a href="/" className="transition hover:text-white">
        Privacy Policy
      </a>
      <a href="/" className="transition hover:text-white">
        Terms
      </a>
      <a href="/" className="transition hover:text-white">
        Security
      </a>
    </div>
  </div>
</footer>
  );
}
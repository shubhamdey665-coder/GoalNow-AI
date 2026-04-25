import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-zinc-950 px-6 py-4 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-lg font-bold">
          GoalNow AI
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-zinc-400 hover:text-white">
            Dashboard
          </Link>

          <Link href="/goals/new" className="text-zinc-400 hover:text-white">
            Create Goal
          </Link>
        </div>
      </div>
    </nav>
  );
}
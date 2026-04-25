import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 rounded-full border border-white/20 px-4 py-2 text-sm text-white/70">
          AI Goal Tracker + Personal Mentor
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          Achieve any goal with an AI-made daily roadmap.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-white/70">
          Create goals like Google job preparation, fat burning, English learning,
          exam preparation, or business growth. GoalNow AI creates your plan,
          tracker, test, progress report, and AI mentor guidance.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
          >
            Open Dashboard
          </Link>

          <Link
            href="/goals/new"
            className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Create Goal
          </Link>
        </div>
      </section>
    </main>
  );
}
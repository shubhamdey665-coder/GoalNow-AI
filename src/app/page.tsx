import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
     <Navbar />
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
            <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "AI Roadmap",
              description:
                "Create a goal and get a clear 7-day starter plan. Later, this will become a real AI-generated roadmap.",
            },
            {
              title: "Daily Tracker",
              description:
                "Tick completed tasks, track progress percentage, and keep your goal organized.",
            },
            {
              title: "Weekly Test",
              description:
                "Check your weekly consistency and understand whether your plan should become harder or easier.",
            },
            {
              title: "Progress Report",
              description:
                "See completed tasks, pending tasks, progress percentage, feedback and next recommendation.",
            },
            {
              title: "AI Mentor",
              description:
                "Ask goal-related questions and get mentor-style guidance for your next action.",
            },
            {
              title: "Goal Management",
              description:
                "Create, edit, delete and manage multiple goals from one dashboard.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl text-black">
                ✦
              </div>

              <h2 className="text-xl font-bold">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}
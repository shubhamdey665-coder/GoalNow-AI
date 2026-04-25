import Link from "next/link";

const goals = [
  {
    title: "Google SWE Preparation",
    description: "4-year coding, DSA, web development, projects and interview plan.",
    progress: 0,
    href: "/goals/google-swe",
  },
  {
    title: "Fat Burning",
    description: "Workout, diet, sleep, calorie tracking and weekly body progress.",
    progress: 0,
    href: "/goals/fat-burning",
  },
  {
    title: "English Mastery",
    description: "Grammar, communication, vocabulary, speaking and writing practice.",
    progress: 0,
    href: "/goals/english-mastery",
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">GoalNow AI</p>
            <h1 className="mt-2 text-4xl font-bold">Your Dashboard</h1>
            <p className="mt-3 max-w-2xl text-zinc-400">
              Track every goal with AI-made plans, daily tasks, weekly tests,
              progress reports and a personal mentor.
            </p>
          </div>

          <Link
            href="/goals/new"
            className="rounded-xl bg-white px-5 py-3 text-center font-semibold text-black transition hover:bg-zinc-200"
          >
            Create New Goal
          </Link>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {goals.map((goal) => (
            <Link
              key={goal.title}
              href={goal.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl text-black">
                ✦
              </div>

              <h2 className="text-xl font-bold">{goal.title}</h2>

              <p className="mt-3 min-h-20 text-sm leading-6 text-zinc-400">
                {goal.description}
              </p>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-zinc-400">Progress</span>
                  <span>{goal.progress}%</span>
                </div>

                <div className="h-2 rounded-full bg-zinc-800">
                  <div
                    className="h-2 rounded-full bg-white"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
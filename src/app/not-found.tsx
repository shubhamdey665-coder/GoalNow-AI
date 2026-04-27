import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-zinc-950 px-6 py-20 text-white">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl text-black">
            404
          </div>

          <h1 className="mt-6 text-4xl font-bold">Page not found</h1>

          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            The page you are looking for does not exist or may have been moved.
            Go back to your dashboard or create a new goal.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition hover:bg-zinc-200"
            >
              Back to Dashboard
            </Link>

            <Link
              href="/goals/new"
              className="rounded-xl border border-white/10 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
            >
              Create Goal
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
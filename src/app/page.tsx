import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold tracking-tight">
            Ticket<span className="text-green-500">Flow</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
            <Link href="/" className="hover:text-green-400">
              Home
            </Link>
            <Link href="/events" className="hover:text-green-400">
              Explore Events
            </Link>
            <Link href="/dashboard" className="hover:text-green-400">
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg px-4 py-2 text-sm font-semibold hover:text-green-400"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold hover:bg-green-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/40 via-black to-black" />

        <div className="relative mx-auto max-w-7xl px-6 py-28 text-center sm:py-36">
          <span className="inline-block rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
            Your Events. Your Experience.
          </span>

          <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-extrabold leading-tight tracking-tight sm:text-7xl">
            Discover Events.
            <br />
            <span className="text-green-500">Book Your Experience.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
            Find amazing events, choose your favorite seats, and book your
            tickets effortlessly. Your next unforgettable experience starts
            here.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/events"
              className="rounded-xl bg-green-600 px-8 py-4 font-bold transition hover:bg-green-700"
            >
              Explore Events →
            </Link>

            <Link
              href="/sign-up"
              className="rounded-xl border border-zinc-700 px-8 py-4 font-bold transition hover:border-green-500 hover:text-green-400"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-green-500">
            Why TicketFlow?
          </p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Everything You Need to Book
          </h2>
          <p className="mt-4 text-zinc-400">
            A simple and reliable event ticket booking experience.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7">
            <div className="text-3xl">🎫</div>
            <h3 className="mt-5 text-xl font-bold">Discover Events</h3>
            <p className="mt-3 leading-7 text-zinc-400">
              Explore upcoming events and find experiences that match your
              interests.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7">
            <div className="text-3xl">💺</div>
            <h3 className="mt-5 text-xl font-bold">Choose Your Seats</h3>
            <p className="mt-3 leading-7 text-zinc-400">
              Browse available seats and reserve your preferred spot with
              temporary seat holds.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-7">
            <div className="text-3xl">🔒</div>
            <h3 className="mt-5 text-xl font-bold">Secure Booking</h3>
            <p className="mt-3 leading-7 text-zinc-400">
              Enjoy a structured booking process with payment confirmation and
              booking updates.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl border border-green-900/50 bg-gradient-to-r from-green-950/70 to-zinc-900 p-10 text-center sm:p-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready for Your Next Experience?
          </h2>
          <p className="mt-4 text-zinc-400">
            Explore events and reserve your tickets today.
          </p>
          <Link
            href="/events"
            className="mt-8 inline-block rounded-xl bg-green-600 px-8 py-4 font-bold hover:bg-green-700"
          >
            Browse All Events →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <p className="text-lg font-extrabold">
            Ticket<span className="text-green-500">Flow</span>
          </p>
          <p className="text-sm text-zinc-500">
            © 2026 TicketFlow. Your Events, Your Experience.
          </p>
          <Link
            href="/events"
            className="text-sm text-zinc-400 hover:text-green-400"
          >
            Explore Events
          </Link>
        </div>
      </footer>
    </main>
  );
}

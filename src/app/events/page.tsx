"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Event = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venue: {
    name: string;
    city: string;
    address: string;
  };
  totalSeats: number;
  availableSeats: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          search,
          city,
          page: String(page),
          limit: "10",
        });

        const response = await fetch(
          `/api/public/events?${params.toString()}`,
          { signal }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load events");
        }

        setEvents(result.data);
        setPagination(result.pagination);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        setError(
          error instanceof Error ? error.message : "Something went wrong"
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [search, city, page]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchEvents(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchEvents]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-green-400">
            TicketFlow
          </p>

          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
            Discover Events
          </h1>

          <p className="mt-3 text-zinc-400">
            Find and explore upcoming events.
          </p>
        </div>

        {/* Search and Filter */}
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 md:grid-cols-3"
        >
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white outline-none placeholder:text-zinc-500 focus:border-green-500"
          />

          <input
            type="text"
            placeholder="Filter by city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white outline-none placeholder:text-zinc-500 focus:border-green-500"
          />

          <button
            type="submit"
            className="rounded-lg bg-green-600 p-3 font-semibold text-white transition hover:bg-green-700"
          >
            Search Events
          </button>
        </form>

        {/* Event List */}
        <div className="mt-8">
          {loading ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
              <p className="text-zinc-400">Loading events...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-900 bg-red-950/30 p-6 text-red-400">
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-10 text-center">
              <h2 className="text-xl font-semibold">No Events Found</h2>

              <p className="mt-2 text-zinc-400">
                Try searching with a different keyword or city.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Upcoming Events</h2>

                <span className="text-sm text-zinc-400">
                  {pagination.total} events found
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-green-500/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                        Upcoming Event
                      </span>

                      <span className="text-xs text-zinc-500">
                        {event.availableSeats > 0 ? "Available" : "Sold Out"}
                      </span>
                    </div>

                    <Link
                      href={`/events/${event.id}`}
                      className="mt-5 block text-xl font-bold transition hover:text-green-400"
                    >
                      {event.title}
                    </Link>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
                      {event.description}
                    </p>

                    <div className="mt-5 space-y-3 border-t border-zinc-800 pt-5 text-sm">
                      <div>
                        <p className="text-zinc-500">Venue</p>

                        <p className="mt-1 font-medium text-zinc-200">
                          {event.venue.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-500">Location</p>

                        <p className="mt-1 font-medium text-zinc-200">
                          {event.venue.city}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-500">Date</p>

                        <p className="mt-1 font-medium text-zinc-200">
                          {new Date(event.startsAt).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-zinc-500">Available Seats</p>

                        <p className="mt-1 font-medium text-zinc-200">
                          {event.availableSeats} / {event.totalSeats}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/events/${event.id}`}
                      className="mt-6 block rounded-lg bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-700"
                    >
                      View Event Details →
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && pagination.totalPages > 0 && (
          <div className="mt-10 flex items-center justify-center gap-5">
            <button
              onClick={() => setPage((prev) => prev - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-zinc-700 px-5 py-2 text-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-sm text-zinc-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={page >= pagination.totalPages}
              className="rounded-lg border border-zinc-700 px-5 py-2 text-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-800 pt-6 text-center">
          <p className="text-sm text-zinc-500">
            TicketFlow | Your Events, Your Experience.
          </p>
        </footer>
      </div>
    </main>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PublishButton from "./publish-button";

export default function OrganizerEventsPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading events...</p>}>
      <OrganizerEventsContent />
    </Suspense>
  );
}

async function OrganizerEventsContent() {
  const user = await requireRole(["ORGANIZER", "ADMIN"]);

  const events = await prisma.event.findMany({
    where: user.role === "ADMIN" ? {} : { organizerId: user.id },
    include: {
      venue: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Events</h1>

          <Link
            href="/organizer/events/new"
            className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            + Create Event
          </Link>
        </div>

        {/* Event List */}
        <div className="mt-8 space-y-4">
          {events.length === 0 ? (
            <p className="text-gray-500">No events created yet.</p>
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-lg border p-5">
                <h2 className="text-xl font-semibold">{event.title}</h2>

                <p className="mt-2 text-gray-600">
                  {event.venue.name}, {event.venue.city}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {new Date(event.startsAt).toLocaleString()}
                </p>

                <p className="mt-2 text-sm">Status: {event.status}</p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/organizer/events/${event.id}/seats`}
                    className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100"
                  >
                    Manage Seats
                  </Link>

                  <PublishButton eventId={event.id} status={event.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

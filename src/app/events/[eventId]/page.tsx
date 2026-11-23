import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SeatSelection from "./seat-selection";

export default function EventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black p-8 text-white">
          <p>Loading event details...</p>
        </main>
      }
    >
      <EventDetailsContent params={params} />
    </Suspense>
  );
}

async function EventDetailsContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      status: "PUBLISHED",
    },
    include: {
      venue: true,
      seats: {
        orderBy: [
          { category: "asc" },
          { rowLabel: "asc" },
          { seatNumber: "asc" },
        ],
      },
    },
  });

  if (!event) {
    notFound();
  }

  const now = new Date();

  const availableSeats = event.seats.filter((seat) => {
    if (seat.status === "AVAILABLE") {
      return true;
    }

    return (
      seat.status === "HELD" &&
      seat.holdExpiresAt !== null &&
      seat.holdExpiresAt.getTime() <= now.getTime()
    );
  });

  const categoryMap = new Map<
    string,
    {
      category: string;
      price: number;
      availableSeats: number;
    }
  >();

  for (const seat of availableSeats) {
    const price = Number(seat.price);
    const key = `${seat.category}-${price}`;

    const existing = categoryMap.get(key);

    if (existing) {
      existing.availableSeats++;
    } else {
      categoryMap.set(key, {
        category: seat.category,
        price,
        availableSeats: 1,
      });
    }
  }

  const seatCategories = Array.from(categoryMap.values());

  const seatSelectionData = event.seats.map((seat) => ({
    id: seat.id,
    rowLabel: seat.rowLabel,
    seatNumber: seat.seatNumber,
    category: seat.category,
    price: Number(seat.price),
    status: seat.status,
    holdExpiresAt: seat.holdExpiresAt?.toISOString() ?? null,
  }));

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <a
            href="/events"
            className="text-sm text-zinc-400 hover:text-green-400"
          >
            ← Back to Events
          </a>
        </div>

        {/* Event Information */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl sm:p-10">
          <span className="inline-block rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
            Upcoming Event
          </span>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            {event.title}
          </h1>

          <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
            {event.description}
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-xl bg-zinc-800/70 p-5">
              <p className="text-sm text-zinc-400">Venue</p>
              <p className="mt-2 text-lg font-semibold">{event.venue.name}</p>
            </div>

            <div className="rounded-xl bg-zinc-800/70 p-5">
              <p className="text-sm text-zinc-400">Location</p>
              <p className="mt-2 text-lg font-semibold">{event.venue.city}</p>
              <p className="mt-1 text-sm text-zinc-400">
                {event.venue.address}
              </p>
            </div>

            <div className="rounded-xl bg-zinc-800/70 p-5">
              <p className="text-sm text-zinc-400">Starts At</p>
              <p className="mt-2 text-lg font-semibold">
                {new Date(event.startsAt).toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl bg-zinc-800/70 p-5">
              <p className="text-sm text-zinc-400">Ends At</p>
              <p className="mt-2 text-lg font-semibold">
                {new Date(event.endsAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Available Seat Categories */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Available Seats</h2>

          <p className="mt-2 text-zinc-400">
            {availableSeats.length} seats currently available.
          </p>

          {seatCategories.length === 0 ? (
            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <p className="text-zinc-400">No seats available at the moment.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {seatCategories.map((item) => (
                <div
                  key={`${item.category}-${item.price}`}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
                >
                  <h3 className="text-xl font-bold">{item.category}</h3>

                  <p className="mt-3 text-2xl font-bold text-green-400">
                    ৳{item.price.toFixed(2)}
                  </p>

                  <p className="mt-2 text-sm text-zinc-400">
                    {item.availableSeats} seats available
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Interactive Seat Selection */}
        <section className="mt-12">
          <SeatSelection seats={seatSelectionData} eventId={event.id} />
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-zinc-800 pt-6 text-center">
          <p className="text-sm text-zinc-500">
            TicketFlow | Your Events, Your Experience.
          </p>
        </footer>
      </div>
    </main>
  );
}

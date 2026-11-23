import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SeatManager from "./seat-manager";

export default async function ManageSeatsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8">Loading seat manager...</p>}>
      <ManageSeatsContent params={params} />
    </Suspense>
  );
}

async function ManageSeatsContent({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await requireRole(["ORGANIZER", "ADMIN"]);
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      venue: true,
      seats: {
        orderBy: [{ rowLabel: "asc" }, { seatNumber: "asc" }],
      },
    },
  });

  if (!event) {
    notFound();
  }

  if (user.role !== "ADMIN" && event.organizerId !== user.id) {
    notFound();
  }

  const seats = event.seats.map((seat) => ({
    id: seat.id,
    rowLabel: seat.rowLabel,
    seatNumber: seat.seatNumber,
    category: seat.category,
    price: Number(seat.price),
    status: seat.status,
  }));

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Manage Seats</h1>

        <p className="mt-2 text-gray-600">
          {event.title} | {event.venue.name}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-500">Venue Capacity</p>
            <p className="text-2xl font-bold">{event.venue.capacity}</p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-500">Total Seats</p>
            <p className="text-2xl font-bold">{event.seats.length}</p>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-500">Remaining Capacity</p>
            <p className="text-2xl font-bold">
              {event.venue.capacity - event.seats.length}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <SeatManager eventId={event.id} initialSeats={seats} />
        </div>
      </div>
    </main>
  );
}

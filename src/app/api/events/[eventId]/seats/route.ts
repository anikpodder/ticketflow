import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const seatSchema = z
  .object({
    rows: z
      .array(
        z.object({
          rowLabel: z.string().trim().min(1).max(5),
          seatCount: z.number().int().min(1).max(500),
          category: z.enum(["STANDARD", "PREMIUM", "VIP"]),
          price: z.number().positive().max(1000000),
        })
      )
      .min(1)
      .max(100),
  })
  .refine(
    (data) => {
      const labels = data.rows.map((row) => row.rowLabel.toUpperCase());
      return new Set(labels).size === labels.length;
    },
    {
      message: "Duplicate row labels are not allowed",
      path: ["rows"],
    }
  );

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getCurrentDbUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You are not allowed to manage seats" },
        { status: 403 }
      );
    }

    const { eventId } = await params;
    const body = await request.json();
    const validation = seatSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        venue: true,
        _count: {
          select: { seats: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && event.organizerId !== user.id) {
      return NextResponse.json(
        { message: "You cannot manage this event" },
        { status: 403 }
      );
    }

    const rows = validation.data.rows;

    const totalNewSeats = rows.reduce((sum, row) => sum + row.seatCount, 0);

    if (event._count.seats + totalNewSeats > event.venue.capacity) {
      return NextResponse.json(
        {
          message: "Total seats cannot exceed venue capacity",
          venueCapacity: event.venue.capacity,
          existingSeats: event._count.seats,
          requestedSeats: totalNewSeats,
        },
        { status: 400 }
      );
    }

    const existingRows = await prisma.seat.findMany({
      where: {
        eventId,
        rowLabel: {
          in: rows.map((row) => row.rowLabel),
          mode: "insensitive",
        },
      },
      select: {
        rowLabel: true,
      },
      distinct: ["rowLabel"],
    });

    if (existingRows.length > 0) {
      return NextResponse.json(
        {
          message: "Some row labels already exist",
          existingRows: existingRows.map((row) => row.rowLabel),
        },
        { status: 409 }
      );
    }

    const seats = rows.flatMap((row) =>
      Array.from({ length: row.seatCount }, (_, index) => ({
        eventId,
        rowLabel: row.rowLabel,
        seatNumber: index + 1,
        category: row.category,
        price: row.price,
        status: "AVAILABLE" as const,
      }))
    );

    const result = await prisma.seat.createMany({
      data: seats,
    });

    return NextResponse.json(
      {
        message: "Seats created successfully",
        totalSeatsCreated: result.count,
        seatsPerRow: rows.map((row) => ({
          rowLabel: row.rowLabel,
          seatCount: row.seatCount,
          category: row.category,
          price: row.price,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create seats error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

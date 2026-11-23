import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const holdSchema = z.object({
  eventId: z.string().min(1),
  seatIds: z
    .array(z.string().min(1))
    .min(1)
    .max(10)
    .refine((ids) => new Set(ids).size === ids.length),
});

class SeatUnavailableError extends Error {
  constructor() {
    super("One or more selected seats are no longer available.");
    this.name = "SeatUnavailableError";
  }
}

export async function POST(request: Request) {
  try {
    // Validate request body
    const body = await request.json();
    const validation = holdSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid booking request.",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { eventId, seatIds } = validation.data;

    // Check authentication
    const user = await getCurrentDbUser();

    if (!user) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const now = new Date();
    const holdExpiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    // Sort IDs to maintain consistent lock order
    const sortedSeatIds = [...seatIds].sort();

    // Execute booking operation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find published event
      const event = await tx.event.findFirst({
        where: {
          id: eventId,
          status: "PUBLISHED",
        },
      });

      if (!event) {
        return {
          error: "Event not found or not published.",
          status: 404,
        };
      }

      if (event.startsAt <= now) {
        return {
          error: "This event has already started.",
          status: 400,
        };
      }

      // Find expired bookings
      const expiredBookings = await tx.booking.findMany({
        where: {
          eventId,
          status: {
            in: ["HELD", "PENDING_PAYMENT"],
          },
          holdExpiresAt: {
            lte: now,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      // Release expired seats
      await tx.seat.updateMany({
        where: {
          eventId,
          status: "HELD",
          holdExpiresAt: {
            lte: now,
          },
        },
        data: {
          status: "AVAILABLE",
          holdExpiresAt: null,
        },
      });

      // Expire old bookings and record history
      for (const oldBooking of expiredBookings) {
        const updated = await tx.booking.updateMany({
          where: {
            id: oldBooking.id,
            status: oldBooking.status,
            holdExpiresAt: {
              lte: now,
            },
          },
          data: {
            status: "EXPIRED",
          },
        });

        if (updated.count > 0) {
          await tx.bookingStatusHistory.create({
            data: {
              bookingId: oldBooking.id,
              fromStatus: oldBooking.status,
              toStatus: "EXPIRED",
              note: "Seat hold expired after 5 minutes.",
            },
          });
        }
      }

      // Verify selected seats belong to this event
      const seats = await tx.seat.findMany({
        where: {
          id: {
            in: seatIds,
          },
          eventId,
        },
      });

      if (seats.length !== seatIds.length) {
        return {
          error: "Some selected seats are invalid.",
          status: 400,
        };
      }

      // Calculate ticket prices
      const earlyBirdActive =
        event.pricingStrategy === "EARLY_BIRD" &&
        event.earlyBirdEndsAt !== null &&
        now < event.earlyBirdEndsAt;

      const discount = earlyBirdActive
        ? Math.min(Math.max(event.earlyBirdDiscount, 0), 100)
        : 0;

      const seatPrices = seats.map((seat) => {
        const basePrice = Number(seat.price);

        const finalPrice = earlyBirdActive
          ? Math.round(basePrice * (100 - discount)) / 100
          : basePrice;

        return {
          seatId: seat.id,
          price: finalPrice,
        };
      });

      const totalAmount = seatPrices.reduce(
        (total, seat) => total + seat.price,
        0
      );

      // Atomically claim each selected seat
      for (const seatId of sortedSeatIds) {
        const updated = await tx.seat.updateMany({
          where: {
            id: seatId,
            eventId,
            status: "AVAILABLE",
          },
          data: {
            status: "HELD",
            holdExpiresAt,
          },
        });

        if (updated.count !== 1) {
          throw new SeatUnavailableError();
        }
      }

      // Create booking, booking seats and initial history
      const booking = await tx.booking.create({
        data: {
          userId: user.id,
          eventId,
          status: "HELD",
          totalAmount,
          holdExpiresAt,

          bookingSeats: {
            create: seatPrices.map((seat) => ({
              seatId: seat.seatId,
              priceAtBooking: seat.price,
            })),
          },

          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: "HELD",
              note: "Seats held for 5 minutes.",
            },
          },
        },

        include: {
          bookingSeats: {
            include: {
              seat: true,
            },
          },
        },
      });

      return {
        booking: {
          id: booking.id,
          status: booking.status,
          totalAmount: Number(booking.totalAmount),
          holdExpiresAt: booking.holdExpiresAt.toISOString(),

          seats: booking.bookingSeats.map((item) => ({
            id: item.seat.id,
            rowLabel: item.seat.rowLabel,
            seatNumber: item.seat.seatNumber,
            category: item.seat.category,
            price: Number(item.priceAtBooking),
          })),
        },
      };
    });

    if ("error" in result) {
      return NextResponse.json(
        { message: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        message: "Seats successfully held for 5 minutes.",
        data: result.booking,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SeatUnavailableError) {
      return NextResponse.json(
        {
          message: error.message,
        },
        { status: 409 }
      );
    }

    console.error("Booking hold error:", error);

    return NextResponse.json(
      {
        message: "Failed to hold seats. Please try again.",
      },
      { status: 500 }
    );
  }
}

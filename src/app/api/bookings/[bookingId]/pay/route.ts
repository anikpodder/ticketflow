import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/lib/auth";
import { processPayment } from "@/lib/payments/payment.service";
import { sendBookingConfirmationNotification } from "@/lib/notifications/notification.service";

const paymentSchema = z.object({
  provider: z.enum(["MOCK_STRIPE", "MOCK_PAYPAL"]),
  idempotencyKey: z.string().min(10).max(100),
});

class PaymentConflictError extends Error {}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await getCurrentDbUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await context.params;

    const body = await request.json();
    const validation = paymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid payment request",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { provider, idempotencyKey } = validation.data;

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: user.id,
      },
      include: {
        bookingSeats: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { message: "Booking not found" },
        { status: 404 }
      );
    }

    // Lock booking and create or resume a payment attempt.
    const payment = await prisma.$transaction(async (tx) => {
      const lockedBookings = await tx.$queryRaw<
        { id: string; status: string; holdExpiresAt: Date }[]
      >`
                SELECT id, status, "holdExpiresAt"
                FROM "Booking"
                WHERE id = ${bookingId}
                AND "userId" = ${user.id}
                FOR UPDATE
            `;

      if (lockedBookings.length === 0) {
        throw new PaymentConflictError("Booking not found");
      }

      const lockedBooking = lockedBookings[0];

      // Check the same idempotency key first.
      const existingPayment = await tx.payment.findUnique({
        where: { idempotencyKey },
      });

      if (existingPayment) {
        if (existingPayment.bookingId !== bookingId) {
          throw new PaymentConflictError(
            "Idempotency key belongs to another booking"
          );
        }

        if (existingPayment.status === "SUCCEEDED") {
          return existingPayment;
        }

        if (existingPayment.status === "FAILED") {
          throw new PaymentConflictError(
            "This payment attempt failed. Use a new idempotency key."
          );
        }

        if (
          lockedBooking.status !== "PENDING_PAYMENT" ||
          lockedBooking.holdExpiresAt <= new Date()
        ) {
          throw new PaymentConflictError(
            "Booking is no longer eligible for payment"
          );
        }

        return existingPayment;
      }

      if (
        lockedBooking.status !== "HELD" &&
        lockedBooking.status !== "PENDING_PAYMENT"
      ) {
        throw new PaymentConflictError("Booking is not eligible for payment");
      }

      if (lockedBooking.holdExpiresAt <= new Date()) {
        throw new PaymentConflictError("Seat hold has expired");
      }

      const pendingPayment = await tx.payment.findFirst({
        where: {
          bookingId,
          status: "INITIATED",
        },
      });

      if (pendingPayment) {
        throw new PaymentConflictError(
          "Another payment attempt is already pending. Retry using its idempotency key."
        );
      }

      if (lockedBooking.status === "HELD") {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: "PENDING_PAYMENT" },
        });

        await tx.bookingStatusHistory.create({
          data: {
            bookingId,
            fromStatus: "HELD",
            toStatus: "PENDING_PAYMENT",
            note: "Payment initiated",
          },
        });
      }

      return await tx.payment.create({
        data: {
          bookingId,
          provider,
          amount: booking.totalAmount,
          idempotencyKey,
          status: "INITIATED",
        },
      });
    });

    // Already successful: return the previous result.
    if (payment.status === "SUCCEEDED") {
      return NextResponse.json({
        message: "Payment already completed",
        payment,
        bookingStatus: "CONFIRMED",
      });
    }

    // Retry the provider using the SAME idempotency key.
    let paymentResult;

    try {
      paymentResult = await processPayment(payment.provider, {
        bookingId,
        amount: Number(payment.amount),
        idempotencyKey: payment.idempotencyKey,
      });
    } catch (error) {
      console.error("Payment provider error:", error);

      return NextResponse.json(
        {
          message:
            "Payment outcome is uncertain. Retry using the same idempotency key.",
          paymentStatus: "INITIATED",
          idempotencyKey,
        },
        { status: 502 }
      );
    }

    if (!paymentResult.success) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        {
          message: "Payment failed",
          paymentStatus: "FAILED",
        },
        { status: 402 }
      );
    }

    // Confirm seats and booking atomically.
    const confirmation = await prisma.$transaction(async (tx) => {
      const lockedBookings = await tx.$queryRaw<
        { id: string; status: string; holdExpiresAt: Date }[]
      >`
                SELECT id, status, "holdExpiresAt"
                FROM "Booking"
                WHERE id = ${bookingId}
                AND "userId" = ${user.id}
                FOR UPDATE
            `;

      if (lockedBookings.length === 0) {
        throw new PaymentConflictError("Booking not found");
      }

      const lockedBooking = lockedBookings[0];

      // Another request may have completed this payment.
      if (lockedBooking.status === "CONFIRMED") {
        const currentPayment = await tx.payment.findUnique({
          where: { id: payment.id },
        });

        if (currentPayment?.status === "SUCCEEDED") {
          return currentPayment;
        }
      }

      if (
        lockedBooking.status !== "PENDING_PAYMENT" ||
        lockedBooking.holdExpiresAt <= new Date()
      ) {
        throw new PaymentConflictError(
          "Booking expired before confirmation. Payment needs reconciliation."
        );
      }

      const seatIds = booking.bookingSeats.map(
        (bookingSeat) => bookingSeat.seatId
      );

      const updatedSeats = await tx.seat.updateMany({
        where: {
          id: { in: seatIds },
          eventId: booking.eventId,
          status: "HELD",
          holdExpiresAt: { gt: new Date() },
        },
        data: {
          status: "BOOKED",
          holdExpiresAt: null,
        },
      });

      if (updatedSeats.count !== seatIds.length) {
        throw new PaymentConflictError(
          "One or more seats are no longer available. Payment needs reconciliation."
        );
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
      });

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCEEDED",
          providerReference: paymentResult.transactionId,
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: "PENDING_PAYMENT",
          toStatus: "CONFIRMED",
          note: "Payment successful",
        },
      });

      return updatedPayment;
    });

    // Send notifications after successful confirmation.
    try {
      await sendBookingConfirmationNotification({
        userId: user.id,
        bookingId,
        title: "Booking Confirmed!",
        message: `Your booking ${bookingId} has been confirmed successfully.`,
      });
    } catch (error) {
      console.error("Notification Error:", error);
    }

    return NextResponse.json({
      message: "Payment successful",
      payment: confirmation,
      bookingStatus: "CONFIRMED",
    });
  } catch (error) {
    if (error instanceof PaymentConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Payment API Error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

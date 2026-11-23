import { prisma } from "@/lib/prisma";
import { processRefund } from "@/lib/payments/refund.service";
import { sendBookingCancellationNotification } from "@/lib/notifications/notification.service";

const REFUND_WINDOW = 24 * 60 * 60 * 1000;

type CancellationResult = {
  bookingId: string;
  status: "CANCELLED";
  refunded: boolean;
  refundAmount: number;
  message: string;
};

export async function cancelBooking(
  bookingId: string,
  userId: string
): Promise<CancellationResult> {
  // Phase 1: Validate booking and prepare cancellation.
  const preparation = await prisma.$transaction(async (tx) => {
    // Lock the booking to prevent concurrent cancellation.
    await tx.$queryRaw`
            SELECT "id"
            FROM "Booking"
            WHERE "id" = ${bookingId}
            FOR UPDATE
        `;

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        event: true,
        bookingSeats: true,
        payments: true,
      },
    });

    if (!booking) {
      throw new Error("BOOKING_NOT_FOUND");
    }

    if (booking.userId !== userId) {
      throw new Error("FORBIDDEN");
    }

    if (booking.status !== "CONFIRMED") {
      throw new Error("BOOKING_NOT_CANCELLABLE");
    }

    const remainingTime = booking.event.startsAt.getTime() - Date.now();

    const refundRequired = remainingTime > REFUND_WINDOW;

    const seatIds = booking.bookingSeats.map(
      (bookingSeat) => bookingSeat.seatId
    );

    // No refund is allowed within 24 hours of the event.
    if (!refundRequired) {
      await tx.seat.updateMany({
        where: {
          id: { in: seatIds },
          status: "BOOKED",
        },
        data: {
          status: "AVAILABLE",
          holdExpiresAt: null,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
        },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          fromStatus: "CONFIRMED",
          toStatus: "CANCELLED",
          note: "Customer cancelled within 24 hours. No refund applicable.",
        },
      });

      return {
        refundRequired: false,
        userId: booking.userId,
        amount: 0,
      };
    }

    // Find the successful payment for this booking.
    const payment = booking.payments.find(
      (item) => item.status === "SUCCEEDED"
    );

    if (!payment) {
      throw new Error("SUCCESSFUL_PAYMENT_NOT_FOUND");
    }

    // Atomically reserve the refund operation.
    const paymentUpdate = await tx.payment.updateMany({
      where: {
        id: payment.id,
        status: "SUCCEEDED",
      },
      data: {
        status: "REFUND_PENDING",
      },
    });

    if (paymentUpdate.count !== 1) {
      throw new Error("REFUND_ALREADY_IN_PROGRESS");
    }

    return {
      refundRequired: true,
      userId: booking.userId,
      amount: Number(payment.amount),
      paymentId: payment.id,
      paymentProvider: payment.provider,
      seatIds,
    };
  });

  // Phase 2: No-refund cancellation is already complete.
  if (!preparation.refundRequired) {
    try {
      await sendBookingCancellationNotification({
        userId: preparation.userId,
        bookingId,
        title: "Booking Cancelled",
        message: `Your booking ${bookingId} has been cancelled. No refund is applicable.`,
      });
    } catch (error) {
      console.error("Cancellation notification failed:", error);
    }

    return {
      bookingId,
      status: "CANCELLED",
      refunded: false,
      refundAmount: 0,
      message: "Booking cancelled. No refund is applicable.",
    };
  }

  // Phase 3: Process external refund outside the DB transaction.
  let refundResult;

  try {
    refundResult = await processRefund(preparation.paymentProvider!, {
      bookingId,
      paymentId: preparation.paymentId!,
      amount: preparation.amount,
      idempotencyKey: `refund_${bookingId}_${preparation.paymentId}`,
    });

    if (!refundResult.success) {
      throw new Error("REFUND_FAILED");
    }
  } catch (error) {
    // Allow a retry if the provider reports failure.
    await prisma.payment.updateMany({
      where: {
        id: preparation.paymentId!,
        status: "REFUND_PENDING",
      },
      data: {
        status: "SUCCEEDED",
      },
    });

    throw error;
  }

  // Phase 4: Finalize cancellation after successful refund.
  // If this transaction fails, keep REFUND_PENDING for reconciliation.
  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
            SELECT "id"
            FROM "Booking"
            WHERE "id" = ${bookingId}
            FOR UPDATE
        `;

    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.status !== "CONFIRMED") {
      throw new Error("BOOKING_STATE_CHANGED");
    }

    const paymentUpdate = await tx.payment.updateMany({
      where: {
        id: preparation.paymentId!,
        status: "REFUND_PENDING",
      },
      data: {
        status: "REFUNDED",
        refundReference: refundResult.refundId,
        refundedAt: new Date(),
      },
    });

    if (paymentUpdate.count !== 1) {
      throw new Error("REFUND_STATE_CHANGED");
    }

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    await tx.seat.updateMany({
      where: {
        id: { in: preparation.seatIds! },
        status: "BOOKED",
      },
      data: {
        status: "AVAILABLE",
        holdExpiresAt: null,
      },
    });

    await tx.bookingStatusHistory.create({
      data: {
        bookingId,
        fromStatus: "CONFIRMED",
        toStatus: "CANCELLED",
        note: "Customer cancelled more than 24 hours before event. Full refund completed.",
      },
    });
  });

  // Phase 5: Send notifications after the transaction commits.
  try {
    await sendBookingCancellationNotification({
      userId: preparation.userId,
      bookingId,
      title: "Booking Cancelled - Refund Successful",
      message: `Your booking ${bookingId} has been cancelled. A full refund of ৳${preparation.amount.toFixed(
        2
      )} has been processed.`,
    });
  } catch (error) {
    console.error("Cancellation notification failed:", error);
  }

  return {
    bookingId,
    status: "CANCELLED",
    refunded: true,
    refundAmount: preparation.amount,
    message: "Booking cancelled and full refund processed successfully.",
  };
}

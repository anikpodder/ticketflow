import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth";
import { cancelBooking } from "@/lib/bookings/cancellation.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const user = await getCurrentDbUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await params;

    const result = await cancelBooking(bookingId, user.id);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Cancellation API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";

    const errorResponses: Record<string, { status: number; message: string }> =
      {
        BOOKING_NOT_FOUND: {
          status: 404,
          message: "Booking not found.",
        },
        FORBIDDEN: {
          status: 403,
          message: "You cannot cancel another user's booking.",
        },
        BOOKING_NOT_CANCELLABLE: {
          status: 409,
          message: "Only confirmed bookings can be cancelled.",
        },
        SUCCESSFUL_PAYMENT_NOT_FOUND: {
          status: 409,
          message: "Successful payment not found.",
        },
        REFUND_ALREADY_IN_PROGRESS: {
          status: 409,
          message: "Refund is already in progress.",
        },
      };

    const response = errorResponses[errorMessage];

    return NextResponse.json(
      {
        message: response?.message ?? "Failed to cancel booking.",
      },
      {
        status: response?.status ?? 500,
      }
    );
  }
}

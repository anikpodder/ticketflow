import { NextResponse } from "next/server";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await getCurrentDbUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            seats: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && event.organizerId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You cannot publish this event" },
        { status: 403 }
      );
    }

    if (event.status !== "DRAFT") {
      return NextResponse.json(
        { success: false, message: "Only draft events can be published" },
        { status: 400 }
      );
    }

    if (event._count.seats === 0) {
      return NextResponse.json(
        { success: false, message: "Add seats before publishing" },
        { status: 400 }
      );
    }

    if (event.startsAt <= new Date()) {
      return NextResponse.json(
        { success: false, message: "Event start time must be in the future" },
        { status: 400 }
      );
    }

    const updated = await prisma.event.updateMany({
      where: {
        id: eventId,
        status: "DRAFT",
      },
      data: {
        status: "PUBLISHED",
      },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { success: false, message: "Event could not be published" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Event published successfully",
    });
  } catch (error) {
    console.error("Publish Event API Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to publish event" },
      { status: 500 }
    );
  }
}

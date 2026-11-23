import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Read request parameters before entering the try-catch.
  // Next.js uses these request-time values to handle dynamic rendering.
  const searchParams = new URL(request.url).searchParams;

  try {
    const search = searchParams.get("search")?.trim() ?? "";
    const city = searchParams.get("city")?.trim() ?? "";

    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit")) || 10)
    );

    const where = {
      status: "PUBLISHED" as const,

      ...(search && {
        title: {
          contains: search,
          mode: "insensitive" as const,
        },
      }),

      ...(city && {
        venue: {
          city: {
            contains: city,
            mode: "insensitive" as const,
          },
        },
      }),
    };

    const [events, total] = await prisma.$transaction([
      prisma.event.findMany({
        where,
        include: {
          venue: true,
          _count: {
            select: {
              seats: true,
            },
          },
          seats: {
            where: {
              status: "AVAILABLE",
            },
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          startsAt: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.event.count({
        where,
      }),
    ]);

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      pricingStrategy: event.pricingStrategy,
      earlyBirdEndsAt: event.earlyBirdEndsAt,
      earlyBirdDiscount: event.earlyBirdDiscount,

      venue: {
        name: event.venue.name,
        city: event.venue.city,
        address: event.venue.address,
      },

      totalSeats: event._count.seats,
      availableSeats: event.seats.length,
    }));

    return NextResponse.json({
      success: true,
      data: formattedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Public Events API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events",
      },
      { status: 500 }
    );
  }
}

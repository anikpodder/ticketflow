import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const eventSchema = z
  .object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),

    venueName: z.string().trim().min(2),
    city: z.string().trim().min(2),
    address: z.string().trim().min(5),
    capacity: z.number().int().min(1).max(10000),

    pricingStrategy: z.enum(["BASE", "EARLY_BIRD"]).default("BASE"),
    earlyBirdEndsAt: z.coerce.date().optional(),
    earlyBirdDiscount: z.number().int().min(0).max(100).default(0),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "Event end time must be after start time",
    path: ["endsAt"],
  })
  .refine(
    (data) =>
      data.pricingStrategy !== "EARLY_BIRD" ||
      (data.earlyBirdEndsAt !== undefined && data.earlyBirdDiscount > 0),
    {
      message: "Early bird requires an expiry date and discount",
      path: ["earlyBirdEndsAt"],
    }
  )
  .refine(
    (data) =>
      data.earlyBirdEndsAt === undefined ||
      data.earlyBirdEndsAt < data.startsAt,
    {
      message: "Early bird expiry must be before the event starts",
      path: ["earlyBirdEndsAt"],
    }
  );

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentDbUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "You are not allowed to create events" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = eventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        status: "DRAFT",
        pricingStrategy: data.pricingStrategy,
        earlyBirdEndsAt: data.earlyBirdEndsAt,
        earlyBirdDiscount: data.earlyBirdDiscount,

        organizer: {
          connect: { id: user.id },
        },

        venue: {
          create: {
            name: data.venueName,
            city: data.city,
            address: data.address,
            capacity: data.capacity,
          },
        },
      },
      include: {
        venue: true,
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Event created successfully",
        event,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create event error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

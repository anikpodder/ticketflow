import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type UserRole = "CUSTOMER" | "ORGANIZER" | "ADMIN";

export async function getCurrentDbUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("User email not found");
  }

  const name = clerkUser.fullName ?? clerkUser.username ?? email.split("@")[0];

  return await prisma.user.upsert({
    where: {
      clerkId: clerkUser.id,
    },
    update: {
      email,
      name,
    },
    create: {
      clerkId: clerkUser.id,
      email,
      name,
    },
  });
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    redirect("/dashboard");
  }

  return user;
}

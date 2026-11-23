import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

export default function DashboardPage() {
  return (
    <Suspense fallback={<p>Loading dashboard...</p>}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("User email not found");
  }

  const name = user.fullName ?? user.username ?? email.split("@")[0];

  const dbUser = await prisma.user.upsert({
    where: {
      clerkId: user.id,
    },
    update: {
      email,
      name,
    },
    create: {
      clerkId: user.id,
      email,
      name,
    },
  });

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">TicketFlow Dashboard</h1>
        <UserButton />
      </div>

      <div className="mt-8 space-y-3">
        <p>Welcome, {dbUser.name}!</p>
        <p>Email: {dbUser.email}</p>
        <p>Role: {dbUser.role}</p>
        <p>Database ID: {dbUser.id}</p>
      </div>
    </main>
  );
}

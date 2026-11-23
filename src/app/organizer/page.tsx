import { Suspense } from "react";
import { requireRole } from "@/lib/auth";

export default function OrganizerPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading dashboard...</p>}>
      <OrganizerContent />
    </Suspense>
  );
}

async function OrganizerContent() {
  const user = await requireRole(["ORGANIZER", "ADMIN"]);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold">Organizer Dashboard</h1>

      <p className="mt-4">Welcome, {user.name}!</p>

      <p>Role: {user.role}</p>
    </main>
  );
}

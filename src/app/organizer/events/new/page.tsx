import { Suspense } from "react";
import { requireRole } from "@/lib/auth";
import EventForm from "./event-form";

export default function NewEventPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading...</p>}>
      <NewEventContent />
    </Suspense>
  );
}

async function NewEventContent() {
  await requireRole(["ORGANIZER", "ADMIN"]);

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">Create New Event</h1>

        <p className="mt-2 text-gray-500">
          Enter the event details to get started.
        </p>

        <div className="mt-8">
          <EventForm />
        </div>
      </div>
    </main>
  );
}

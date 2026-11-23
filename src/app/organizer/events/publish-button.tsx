"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PublishButtonProps = {
  eventId: string;
  status: string;
};

export default function PublishButton({ eventId, status }: PublishButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePublish() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${eventId}/publish`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to publish event");
      }

      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (status === "PUBLISHED") {
    return (
      <span className="rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
        Published
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={handlePublish}
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Publishing..." : "Publish Event"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = {
  id: string;
  bookingId: string | null;
  title: string;
  message: string;
  channel: string;
  status: string;
  createdAt: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const response = await fetch("/api/notifications");

        if (!response.ok) {
          throw new Error("Failed to load notifications");
        }

        const data = await response.json();
        setNotifications(data.notifications);
      } catch (error) {
        setError("Could not load notifications.");
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="text-sm text-green-400 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mt-6 text-3xl font-bold">Notifications</h1>

        {loading && (
          <p className="mt-8 text-zinc-400">Loading notifications...</p>
        )}

        {error && <p className="mt-8 text-red-400">{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <p className="mt-8 text-zinc-400">You have no notifications yet.</p>
        )}

        <div className="mt-8 space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold">{notification.title}</h2>

                <span className="text-xs text-green-400">
                  {notification.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-zinc-300">
                {notification.message}
              </p>

              <p className="mt-4 text-xs text-zinc-500">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

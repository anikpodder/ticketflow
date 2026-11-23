"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EventForm() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    venueName: "",
    city: "",
    address: "",
    capacity: 100,
    pricingStrategy: "BASE",
    earlyBirdEndsAt: "",
    earlyBirdDiscount: 0,
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "capacity" || name === "earlyBirdDiscount"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          earlyBirdEndsAt: form.earlyBirdEndsAt
            ? new Date(form.earlyBirdEndsAt).toISOString()
            : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Failed to create event");
        return;
      }

      setMessage("Event created successfully!");
      router.push("/organizer/events");
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 bg-white p-3 text-black";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block font-medium">Event Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className={inputClass}
          minLength={3}
          maxLength={150}
          required
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          className={inputClass}
          rows={4}
          minLength={10}
          required
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Start Date & Time</label>
        <input
          type="datetime-local"
          name="startsAt"
          value={form.startsAt}
          onChange={handleChange}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">End Date & Time</label>
        <input
          type="datetime-local"
          name="endsAt"
          value={form.endsAt}
          onChange={handleChange}
          className={inputClass}
          required
        />
      </div>

      <hr />

      <h2 className="text-xl font-semibold">Venue Details</h2>

      <div>
        <label className="mb-2 block font-medium">Venue Name</label>
        <input
          name="venueName"
          value={form.venueName}
          onChange={handleChange}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">City</label>
        <input
          name="city"
          value={form.city}
          onChange={handleChange}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Address</label>
        <input
          name="address"
          value={form.address}
          onChange={handleChange}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Venue Capacity</label>
        <input
          type="number"
          name="capacity"
          value={form.capacity}
          onChange={handleChange}
          className={inputClass}
          min={1}
          max={10000}
          required
        />
      </div>

      <hr />

      <h2 className="text-xl font-semibold">Pricing</h2>

      <div>
        <label className="mb-2 block font-medium">Pricing Strategy</label>
        <select
          name="pricingStrategy"
          value={form.pricingStrategy}
          onChange={handleChange}
          className={inputClass}
        >
          <option value="BASE">Base Pricing</option>
          <option value="EARLY_BIRD">Early Bird Pricing</option>
        </select>
      </div>

      {form.pricingStrategy === "EARLY_BIRD" && (
        <>
          <div>
            <label className="mb-2 block font-medium">Early Bird Expiry</label>
            <input
              type="datetime-local"
              name="earlyBirdEndsAt"
              value={form.earlyBirdEndsAt}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Discount Percentage
            </label>
            <input
              type="number"
              name="earlyBirdDiscount"
              value={form.earlyBirdDiscount}
              onChange={handleChange}
              className={inputClass}
              min={1}
              max={100}
              required
            />
          </div>
        </>
      )}

      {message && <p className="text-sm font-medium text-red-600">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-black p-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Creating Event..." : "Create Event"}
      </button>
    </form>
  );
}

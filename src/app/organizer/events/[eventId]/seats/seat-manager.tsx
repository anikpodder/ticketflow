"use client";

import { useState } from "react";

type Seat = {
  id: string;
  rowLabel: string;
  seatNumber: number;
  category: "STANDARD" | "PREMIUM" | "VIP";
  price: number;
  status: "AVAILABLE" | "HELD" | "BOOKED";
};

type Props = {
  eventId: string;
  initialSeats: Seat[];
};

export default function SeatManager({ eventId, initialSeats }: Props) {
  const [seats, setSeats] = useState(initialSeats);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [rows, setRows] = useState([
    {
      rowLabel: "",
      seatCount: 10,
      category: "STANDARD" as Seat["category"],
      price: 500,
    },
  ]);

  function handleRowChange(index: number, field: string, value: string) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]:
                field === "seatCount" || field === "price"
                  ? Number(value)
                  : value,
            }
          : row
      )
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        rowLabel: "",
        seatCount: 10,
        category: "STANDARD",
        price: 500,
      },
    ]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/events/${eventId}/seats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Failed to create seats");
        return;
      }

      setMessage(result.message);

      window.location.reload();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 bg-white p-2 text-black";

  const groupedSeats = Object.groupBy(seats, (seat) => seat.rowLabel);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-2xl font-bold">Create Seat Rows</h2>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-3 rounded-lg border p-4 md:grid-cols-5"
            >
              <input
                placeholder="Row Label (A)"
                value={row.rowLabel}
                onChange={(e) =>
                  handleRowChange(index, "rowLabel", e.target.value)
                }
                className={inputClass}
                required
              />

              <input
                type="number"
                placeholder="Seat Count"
                value={row.seatCount}
                onChange={(e) =>
                  handleRowChange(index, "seatCount", e.target.value)
                }
                className={inputClass}
                min={1}
                max={500}
                required
              />

              <select
                value={row.category}
                onChange={(e) =>
                  handleRowChange(index, "category", e.target.value)
                }
                className={inputClass}
              >
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
                <option value="VIP">VIP</option>
              </select>

              <input
                type="number"
                placeholder="Price"
                value={row.price}
                onChange={(e) =>
                  handleRowChange(index, "price", e.target.value)
                }
                className={inputClass}
                min={1}
                required
              />

              <button
                type="button"
                onClick={() => removeRow(index)}
                disabled={rows.length === 1}
                className="rounded-md bg-red-100 px-3 py-2 text-red-700 disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="rounded-md border px-4 py-2"
          >
            + Add Row
          </button>

          <button
            type="submit"
            disabled={loading}
            className="block w-full rounded-md bg-black p-3 font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Generating Seats..." : "Generate Seats"}
          </button>

          {message && <p className="text-sm font-medium">{message}</p>}
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Existing Seat Map</h2>

        {Object.entries(groupedSeats).map(([rowLabel, rowSeats]) => (
          <div key={rowLabel} className="mt-5 rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">Row {rowLabel}</h3>

            <div className="flex flex-wrap gap-2">
              {rowSeats?.map((seat) => (
                <div
                  key={seat.id}
                  title={`${seat.category} - ৳${seat.price} - ${seat.status}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-md text-xs font-semibold ${
                    seat.status === "BOOKED"
                      ? "bg-red-500 text-white"
                      : seat.status === "HELD"
                      ? "bg-yellow-400 text-black"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {seat.seatNumber}
                </div>
              ))}
            </div>

            <p className="mt-3 text-sm text-gray-500">
              {rowSeats?.length ?? 0} seats
            </p>
          </div>
        ))}

        {seats.length === 0 && (
          <p className="mt-4 text-gray-500">No seats created yet.</p>
        )}
      </section>
    </div>
  );
}

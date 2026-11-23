"use client";

import { useEffect, useState } from "react";

type Seat = {
  id: string;
  rowLabel: string;
  seatNumber: number;
  category: string;
  price: number;
  status: string;
  holdExpiresAt: string | null;
};

type SeatSelectionProps = {
  seats: Seat[];
  eventId: string;
};

type Booking = {
  id: string;
  status: string;
  totalAmount: number;
  holdExpiresAt: string;
  seats: {
    id: string;
    rowLabel: string;
    seatNumber: number;
    category: string;
    price: number;
  }[];
};

type PaymentProvider = "MOCK_STRIPE" | "MOCK_PAYPAL";

export default function SeatSelection({ seats, eventId }: SeatSelectionProps) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider>("MOCK_STRIPE");
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "IDLE" | "CONFIRMED" | "FAILED"
  >("IDLE");
  const [message, setMessage] = useState("");

  const rows = Array.from(new Set(seats.map((seat) => seat.rowLabel))).sort();

  // Update the seat hold countdown
  useEffect(() => {
    if (!booking || paymentStatus === "CONFIRMED") {
      return;
    }

    const currentBooking = booking;

    function updateTimer() {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(currentBooking.holdExpiresAt).getTime() - Date.now()) / 1000
        )
      );

      setRemainingTime(remaining);

      if (remaining === 0) {
        setMessage(
          "Your seat hold has expired. Please refresh and book again."
        );
      }
    }

    updateTimer();

    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [booking, paymentStatus]);

  // Check whether a seat is unavailable
  function isUnavailable(seat: Seat) {
    if (seat.status === "BOOKED") {
      return true;
    }

    if (seat.status === "HELD") {
      return (
        seat.holdExpiresAt === null ||
        new Date(seat.holdExpiresAt).getTime() > Date.now()
      );
    }

    return false;
  }

  // Select or deselect a seat
  function toggleSeat(seat: Seat) {
    if (isUnavailable(seat) || booking || loading) {
      return;
    }

    setSelectedSeats((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id);
      }

      if (prev.length >= 10) {
        setMessage("You can select a maximum of 10 seats.");
        return prev;
      }

      setMessage("");

      return [...prev, seat.id];
    });
  }

  // Create a temporary seat hold
  async function handleBooking() {
    if (selectedSeats.length === 0) {
      setMessage("Please select at least one seat.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          seatIds: selectedSeats,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Unable to hold selected seats.");
        return;
      }

      setBooking(result.data);

      setRemainingTime(
        Math.max(
          0,
          Math.ceil(
            (new Date(result.data.holdExpiresAt).getTime() - Date.now()) / 1000
          )
        )
      );

      setMessage("Seats successfully held!");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Process payment
  async function handlePayment() {
    if (!booking || remainingTime <= 0 || paymentLoading) {
      return;
    }

    setPaymentLoading(true);
    setMessage("");

    // Reuse the same key when retrying an uncertain payment.
    const currentKey = idempotencyKey ?? crypto.randomUUID();

    setIdempotencyKey(currentKey);

    try {
      const response = await fetch(`/api/bookings/${booking.id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: paymentProvider,
          idempotencyKey: currentKey,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setPaymentStatus("FAILED");
          setIdempotencyKey(null);
        }

        setMessage(
          result.message || "Payment could not be completed. Please try again."
        );

        return;
      }

      setPaymentStatus("CONFIRMED");

      setBooking((prev) => (prev ? { ...prev, status: "CONFIRMED" } : prev));

      setMessage("Payment successful! Your booking is confirmed.");
    } catch {
      // Keep the same key so the user can safely retry.
      setMessage(
        "Payment outcome is uncertain. Please retry using the same payment attempt."
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  // Calculate selected seat details
  const selectedSeatDetails = booking
    ? booking.seats
    : seats.filter((seat) => selectedSeats.includes(seat.id));

  // Calculate total price
  const totalPrice = booking
    ? booking.totalAmount
    : selectedSeatDetails.reduce((total, seat) => total + seat.price, 0);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="text-2xl font-bold">Select Your Seats</h2>

      <p className="mt-2 text-sm text-zinc-400">
        Choose your preferred seats. Maximum 10 seats.
      </p>

      {/* Screen */}
      <div className="mx-auto mt-8 max-w-xl">
        <div className="rounded-t-full border-t-4 border-green-500 bg-zinc-800/50 py-4 text-center">
          <p className="text-sm font-semibold tracking-widest text-zinc-300">
            STAGE / SCREEN
          </p>
        </div>
      </div>

      {/* Seat Legend */}
      <div className="mt-8 flex flex-wrap justify-center gap-5 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-green-600" />
          <span className="text-zinc-300">Available</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-blue-600" />
          <span className="text-zinc-300">Selected</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-red-600" />
          <span className="text-zinc-300">Booked / Held</span>
        </div>
      </div>

      {/* Seat Layout */}
      <div className="mt-10 space-y-5">
        {rows.map((row) => (
          <div
            key={row}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <span className="w-6 text-sm font-bold text-zinc-400">{row}</span>

            {seats
              .filter((seat) => seat.rowLabel === row)
              .sort((a, b) => a.seatNumber - b.seatNumber)
              .map((seat) => {
                const unavailable = isUnavailable(seat);
                const selected = selectedSeats.includes(seat.id);

                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={unavailable || !!booking || loading}
                    onClick={() => toggleSeat(seat)}
                    title={`${row}${seat.seatNumber} - ${seat.category} - ৳${seat.price}`}
                    className={`h-9 w-9 rounded-md text-xs font-semibold transition ${
                      unavailable
                        ? "cursor-not-allowed bg-red-600 text-white opacity-70"
                        : selected
                        ? "bg-blue-600 text-white ring-2 ring-blue-300"
                        : "bg-green-700 text-white hover:bg-green-600"
                    }`}
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      {/* Booking Summary */}
      <div className="mt-10 rounded-xl border border-zinc-800 bg-black p-5">
        <h3 className="font-semibold">Booking Summary</h3>

        <p className="mt-3 text-sm text-zinc-400">
          {booking ? "Held Seats" : "Selected Seats"}
        </p>

        <p className="mt-1 text-white">
          {selectedSeatDetails.length > 0
            ? selectedSeatDetails
                .map((seat) => `${seat.rowLabel}${seat.seatNumber}`)
                .join(", ")
            : "No seats selected"}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-zinc-800 pt-4">
          <span className="text-zinc-400">Total Amount</span>

          <span className="text-2xl font-bold text-green-400">
            ৳{totalPrice.toFixed(2)}
          </span>
        </div>

        {!booking && (
          <button
            type="button"
            onClick={handleBooking}
            disabled={loading || selectedSeats.length === 0}
            className="mt-5 w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Processing..." : "Continue to Booking"}
          </button>
        )}

        {message && <p className="mt-4 text-sm text-yellow-400">{message}</p>}

        {/* Booking Confirmation */}
        {booking && (
          <div className="mt-5 rounded-lg border border-green-700 bg-green-950/40 p-4">
            <h3 className="font-bold text-green-400">
              {paymentStatus === "CONFIRMED"
                ? "Booking Confirmed!"
                : "Seats Successfully Held!"}
            </h3>

            <p className="mt-2 text-sm text-zinc-300">
              Booking ID: {booking.id}
            </p>

            <p className="mt-2 text-sm text-zinc-300">
              Seats:{" "}
              {booking.seats
                .map((seat) => `${seat.rowLabel}${seat.seatNumber}`)
                .join(", ")}
            </p>

            <p className="mt-2 text-sm text-zinc-300">
              Amount: ৳{booking.totalAmount.toFixed(2)}
            </p>

            {paymentStatus !== "CONFIRMED" && (
              <>
                <p className="mt-4 text-lg font-bold text-yellow-400">
                  Time remaining: {Math.floor(remainingTime / 60)}:
                  {String(remainingTime % 60).padStart(2, "0")}
                </p>

                {remainingTime > 0 && (
                  <div className="mt-5 space-y-3">
                    <label
                      htmlFor="paymentProvider"
                      className="block text-sm font-medium text-zinc-300"
                    >
                      Select Payment Provider
                    </label>

                    <select
                      id="paymentProvider"
                      value={paymentProvider}
                      onChange={(event) =>
                        setPaymentProvider(
                          event.target.value as PaymentProvider
                        )
                      }
                      disabled={paymentLoading || idempotencyKey !== null}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
                    >
                      <option value="MOCK_STRIPE">Mock Stripe</option>
                      <option value="MOCK_PAYPAL">Mock PayPal</option>
                    </select>

                    <button
                      type="button"
                      onClick={handlePayment}
                      disabled={paymentLoading || remainingTime <= 0}
                      className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {paymentLoading ? "Processing Payment..." : "Pay Now"}
                    </button>
                  </div>
                )}
              </>
            )}

            {paymentStatus === "CONFIRMED" && (
              <p className="mt-4 font-semibold text-green-400">
                Payment completed successfully.
              </p>
            )}

            {remainingTime === 0 && paymentStatus !== "CONFIRMED" && (
              <p className="mt-2 text-sm text-red-400">
                Your hold has expired.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

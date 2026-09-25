"use client";

import { differenceInCalendarDays, format } from "date-fns";
import { CalendarDays, ChevronDown, ShieldCheck, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, DEMO_GUEST_ID } from "@/lib/api";
import { Booking, Listing } from "@/lib/types";
import Toast from "./Toast";

export default function BookingCard({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<Booking | null>(null);
  const nights = useMemo(() => checkIn && checkOut ? Math.max(0, differenceInCalendarDays(new Date(`${checkOut}T00:00:00`), new Date(`${checkIn}T00:00:00`))) : 0, [checkIn, checkOut]);
  const subtotal = nights * listing.price_per_night;
  const total = subtotal + listing.cleaning_fee + listing.service_fee;
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => { if (!checkIn) setCheckOut(""); }, [checkIn]);

  async function reserve(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!checkIn || !checkOut || nights < 1) { setError("Choose valid check-in and check-out dates."); return; }
    setBusy(true);
    try {
      const booking = await api<Booking>("/bookings", { method: "POST", body: JSON.stringify({ listing_id: listing.id, guest_id: DEMO_GUEST_ID, check_in: checkIn, check_out: checkOut, guests }) });
      setConfirmation(booking);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not complete the booking"); }
    finally { setBusy(false); }
  }

  return (
    <form className="booking-card" onSubmit={reserve}>
      <div className="booking-top"><div><strong>${listing.price_per_night}</strong> <span>night</span></div><div><Star size={14} fill="currentColor" /> {listing.rating} · <u>{listing.review_count} reviews</u></div></div>
      <div className="date-box">
        <label><span>CHECK-IN</span><input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></label>
        <label><span>CHECKOUT</span><input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></label>
        <label className="guest-select"><span>GUESTS</span><select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>{Array.from({ length: listing.max_guests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} guest{i ? "s" : ""}</option>)}</select><ChevronDown size={17} /></label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="reserve-button" disabled={busy}>{busy ? "Confirming…" : "Reserve"}</button>
      <p className="charge-note">You won’t be charged yet</p>
      {nights > 0 && <div className="price-breakdown"><div><u>${listing.price_per_night} × {nights} nights</u><span>${subtotal.toFixed(0)}</span></div><div><u>Cleaning fee</u><span>${listing.cleaning_fee.toFixed(0)}</span></div><div><u>Stayly service fee</u><span>${listing.service_fee.toFixed(0)}</span></div><div className="total-line"><strong>Total before taxes</strong><strong>${total.toFixed(0)}</strong></div></div>}
      <div className="booking-safe"><ShieldCheck size={19} /><span>Your reservation is protected by <strong>StayCover</strong></span></div>
      {confirmation && <div className="confirmation-modal"><div><CalendarDays size={36} /><span className="eyebrow">BOOKING CONFIRMED</span><h2>Your stay is all set.</h2><p>{format(new Date(`${confirmation.check_in}T00:00:00`), "MMM d")} – {format(new Date(`${confirmation.check_out}T00:00:00`), "MMM d, yyyy")}</p><code>{confirmation.confirmation_code}</code><button type="button" className="dark-button" onClick={() => router.push("/trips")}>View my trips</button><button type="button" className="text-button" onClick={() => setConfirmation(null)}>Close</button></div></div>}
    </form>
  );
}


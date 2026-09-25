"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [location, setLocation] = useState(params.get("location") || "");
  const [checkIn, setCheckIn] = useState(params.get("check_in") || "");
  const [checkOut, setCheckOut] = useState(params.get("check_out") || "");
  const [guests, setGuests] = useState(params.get("guests") || "");

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (location) next.set("location", location);
    if (checkIn) next.set("check_in", checkIn);
    if (checkOut) next.set("check_out", checkOut);
    if (guests) next.set("guests", guests);
    router.push(`/?${next.toString()}`);
  }

  return (
    <form className="search-bar" onSubmit={submit}>
      <label className="search-field search-destination">
        <span>Where</span>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Search destinations" />
      </label>
      <label className="search-field">
        <span>Check in</span>
        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} aria-label="Check-in date" />
      </label>
      <label className="search-field">
        <span>Check out</span>
        <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} aria-label="Check-out date" />
      </label>
      <label className="search-field guest-field">
        <span>Who</span>
        <input type="number" min="1" max="16" value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="Add guests" />
      </label>
      <button className="search-submit" aria-label="Search"><Search size={20} /><span>Search</span></button>
    </form>
  );
}


"use client";

import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { getTrips } from "@/lib/api";
import { Booking } from "@/lib/types";

export default function TripsPage() {
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getTrips().then(setTrips).finally(() => setLoading(false)); }, []);
  return <div className="standard-page page-shell"><div className="page-heading"><span className="eyebrow">YOUR JOURNEYS</span><h1>Trips</h1><p>Everything you need for your upcoming stays, all in one place.</p></div>{loading ? <div className="page-loader">Loading your trips…</div> : trips.length ? <div className="trip-list">{trips.map((trip) => <article className="trip-card" key={trip.id}><div className="trip-image"><Image fill src={trip.listing_image} alt={trip.listing_title} /></div><div className="trip-info"><span className="status-chip">{trip.status}</span><h2>{trip.listing_title}</h2><p><MapPin size={16} /> {trip.listing_city}</p><div className="trip-dates"><CalendarDays size={21} /><div><strong>{format(new Date(`${trip.check_in}T00:00:00`), "MMM d")} – {format(new Date(`${trip.check_out}T00:00:00`), "MMM d, yyyy")}</strong><span>{trip.nights} nights · {trip.guests} guests</span></div></div><div className="trip-bottom"><code>{trip.confirmation_code}</code><strong>${trip.total.toFixed(0)} total</strong></div><Link href={`/listings/${trip.listing_id}`}>View stay</Link></div></article>)}</div> : <div className="empty-state"><CalendarDays size={48} /><h2>No trips booked… yet!</h2><p>Time to dust off your bags and start planning your next adventure.</p><Link className="dark-button" href="/">Start searching</Link></div>}</div>;
}


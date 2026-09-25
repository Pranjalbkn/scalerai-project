"use client";

import { ArrowUpRight, Building2, CalendarCheck2, DollarSign, MoreHorizontal, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, DEMO_HOST_ID } from "@/lib/api";
import { Booking, Listing } from "@/lib/types";

interface Dashboard { listings: Listing[]; bookings: Booking[]; stats: { active_listings: number; total_bookings: number; revenue: number } }

export default function HostDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => api<Dashboard>(`/hosts/${DEMO_HOST_ID}/dashboard`).then(setData).catch((err) => setError(err.message)), []);
  useEffect(() => { load(); }, [load]);
  async function remove(id: number) { if (!window.confirm("Delete this listing? Existing bookings will also be removed.")) return; await api<void>(`/hosts/${DEMO_HOST_ID}/listings/${id}`, { method: "DELETE" }); load(); }
  if (error) return <div className="not-found"><h1>Dashboard unavailable</h1><p>{error}</p></div>;
  if (!data) return <div className="page-loader">Preparing your hosting dashboard…</div>;
  return <div className="host-page page-shell"><div className="host-heading"><div><span className="eyebrow">HOST MODE</span><h1>Welcome back, Maya</h1><p>Here’s what’s happening with your homes.</p></div><Link href="/host/listings/new" className="dark-button"><Plus size={18} /> Create listing</Link></div><div className="stats-grid"><div><span><Building2 /></span><p>Active listings</p><strong>{data.stats.active_listings}</strong><small>Live and bookable</small></div><div><span><CalendarCheck2 /></span><p>Total bookings</p><strong>{data.stats.total_bookings}</strong><small>Across all properties</small></div><div><span><DollarSign /></span><p>Gross revenue</p><strong>${data.stats.revenue.toLocaleString()}</strong><small>Confirmed bookings</small></div></div><section className="dashboard-section"><div className="dashboard-title"><div><h2>Your listings</h2><p>Manage availability, pricing, and details.</p></div><Link href="/">View public site <ArrowUpRight size={16} /></Link></div><div className="host-listings">{data.listings.map((listing) => <article key={listing.id}><div className="host-listing-image"><Image fill src={listing.images[0]?.url} alt={listing.title} /></div><div className="host-listing-main"><span className="status-chip">Live</span><h3>{listing.title}</h3><p>{listing.city} · ${listing.price_per_night} night</p></div><div className="host-listing-meta"><span>★ {listing.rating}</span><span>{listing.review_count} reviews</span></div><div className="row-actions"><Link href={`/host/listings/${listing.id}/edit`}>Edit</Link><button onClick={() => remove(listing.id)}>Delete</button><MoreHorizontal /></div></article>)}</div></section><section className="dashboard-section"><div className="dashboard-title"><div><h2>Recent reservations</h2><p>Guests booked across your portfolio.</p></div></div>{data.bookings.length ? <div className="booking-table"><div className="table-head"><span>Guest</span><span>Property</span><span>Dates</span><span>Total</span><span>Status</span></div>{data.bookings.map((booking) => <div className="table-row" key={booking.id}><span><strong>{booking.guest_name}</strong><small>{booking.guests} guests</small></span><span>{booking.listing_title}</span><span>{booking.check_in}<small>to {booking.check_out}</small></span><strong>${booking.total}</strong><span className="status-chip">{booking.status}</span></div>)}</div> : <div className="empty-small">No reservations yet.</div>}</section></div>;
}


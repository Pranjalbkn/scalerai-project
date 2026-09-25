"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ListingCard from "@/components/ListingCard";
import { getFavorites } from "@/lib/api";
import { Listing } from "@/lib/types";

export default function WishlistPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => getFavorites().then(setItems).finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);
  return <div className="standard-page page-shell"><div className="page-heading"><span className="eyebrow">PLACES TO REMEMBER</span><h1>Wishlists</h1><p>Keep your favourite escapes close.</p></div>{loading ? <div className="page-loader">Opening your wishlist…</div> : items.length ? <div className="listing-grid">{items.map((item) => <ListingCard listing={item} key={item.id} onFavoriteChange={load} />)}</div> : <div className="empty-state"><Heart size={48} /><h2>Create your first wishlist</h2><p>As you search, tap the heart icon to save the places you like.</p><Link className="dark-button" href="/">Explore homes</Link></div>}</div>;
}


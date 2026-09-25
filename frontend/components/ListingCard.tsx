"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { MouseEvent, useState } from "react";
import { toggleFavorite } from "@/lib/api";
import { Listing } from "@/lib/types";

export default function ListingCard({ listing, onFavoriteChange }: { listing: Listing; onFavoriteChange?: () => void }) {
  const [favorite, setFavorite] = useState(listing.is_favorite);
  const [busy, setBusy] = useState(false);

  async function favoriteClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await toggleFavorite(listing.id, favorite);
      setFavorite(!favorite);
      onFavoriteChange?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Link href={`/listings/${listing.id}`} className="listing-card">
      <div className="card-image-wrap">
        {listing.images[0] && (
          <Image src={listing.images[0].url} alt={listing.images[0].alt_text} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw" />
        )}
        <button onClick={favoriteClick} className={`heart-button ${favorite ? "saved" : ""}`} aria-label={favorite ? "Remove from wishlist" : "Save to wishlist"}>
          <Heart size={24} fill={favorite ? "#ff385c" : "rgba(0,0,0,.35)"} />
        </button>
        <span className="guest-favourite">Guest favourite</span>
        <div className="image-dots"><i className="active" /><i /><i /></div>
      </div>
      <div className="card-info">
        <div className="card-title-line"><strong>{listing.city}, {listing.country}</strong><span><Star size={14} fill="currentColor" /> {listing.rating.toFixed(2)}</span></div>
        <p>{listing.title}</p>
        <p>{listing.property_type} · {listing.beds} beds</p>
        <div className="price-line"><strong>${listing.price_per_night}</strong> night</div>
      </div>
    </Link>
  );
}


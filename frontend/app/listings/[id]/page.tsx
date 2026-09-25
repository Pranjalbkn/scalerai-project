"use client";

import { Bath, BedDouble, ChevronLeft, Grid3X3, Heart, Home, MapPin, Share, Star, UsersRound, Wifi, Waves, Car, Snowflake, UtensilsCrossed, BriefcaseBusiness, Mountain } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import BookingCard from "@/components/BookingCard";
import Toast from "@/components/Toast";
import { getListing, toggleFavorite } from "@/lib/api";
import { Listing } from "@/lib/types";

const amenityIcons: Record<string, typeof Wifi> = { Wifi, Kitchen: UtensilsCrossed, Pool: Waves, "Free parking": Car, "Air conditioning": Snowflake, Workspace: BriefcaseBusiness, "Mountain view": Mountain };

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [gallery, setGallery] = useState(false);

  useEffect(() => {
    getListing(params.id).then(setListing).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [params.id]);

  async function favorite() {
    if (!listing) return;
    await toggleFavorite(listing.id, listing.is_favorite);
    setListing({ ...listing, is_favorite: !listing.is_favorite });
    setToast(listing.is_favorite ? "Removed from your wishlist" : "Saved to your wishlist");
  }

  if (loading) return <div className="detail-skeleton page-shell"><div /><div /></div>;
  if (error || !listing) return <div className="not-found"><h1>We couldn’t find this stay</h1><p>{error}</p><Link className="dark-button" href="/">Explore homes</Link></div>;
  const photos = listing.images;

  return (
    <div className="detail-page page-shell">
      <div className="detail-back"><Link href="/"><ChevronLeft size={18} /> All homes</Link></div>
      <div className="detail-title"><div><h1>{listing.title}</h1><div className="detail-subline"><span><Star size={14} fill="currentColor" /> {listing.rating}</span><u>{listing.review_count} reviews</u><span>·</span><u>{listing.city}, {listing.country}</u></div></div><div className="detail-actions"><button onClick={() => navigator.clipboard.writeText(window.location.href).then(() => setToast("Link copied"))}><Share size={17} /> Share</button><button onClick={favorite}><Heart size={18} fill={listing.is_favorite ? "#ff385c" : "none"} color={listing.is_favorite ? "#ff385c" : "currentColor"} /> Save</button></div></div>
      <div className="photo-grid">
        {photos.slice(0, 5).map((photo, index) => <button key={`${photo.url}-${index}`} className={`photo-${index + 1}`} onClick={() => setGallery(true)}><Image fill sizes={index === 0 ? "50vw" : "25vw"} src={photo.url} alt={photo.alt_text} /></button>)}
        <button className="show-photos" onClick={() => setGallery(true)}><Grid3X3 size={17} /> Show all photos</button>
      </div>
      <div className="detail-content">
        <div className="detail-main">
          <section className="host-intro"><div><h2>{listing.property_type} hosted by {listing.host?.name}</h2><p>{listing.max_guests} guests · {listing.bedrooms} bedrooms · {listing.beds} beds · {listing.bathrooms} baths</p></div>{listing.host && <Image src={listing.host.avatar_url} alt={listing.host.name} width={58} height={58} />}</section>
          <section className="highlights"><div><Home /><div><strong>A guest favourite</strong><p>One of the most loved homes on Stayly, according to guests.</p></div></div><div><MapPin /><div><strong>Beautiful area</strong><p>Guests love the setting and nearby scenery.</p></div></div><div><UsersRound /><div><strong>Exceptional host</strong><p>{listing.host?.name} has earned consistently excellent reviews.</p></div></div></section>
          <section className="description"><p>{listing.description}</p><button>Show more</button></section>
          <section className="sleep-section"><h2>Where you’ll sleep</h2><div className="bedroom-card"><BedDouble size={30} /><strong>Primary bedroom</strong><span>1 queen bed</span></div></section>
          <section className="amenities"><h2>What this place offers</h2><div className="amenities-grid">{listing.amenities.map((item) => { const Icon = amenityIcons[item] || Bath; return <div key={item}><Icon size={22} /><span>{item}</span></div>; })}</div><button className="outline-button">Show all {listing.amenities.length} amenities</button></section>
          <section className="reviews-section"><h2><Star size={21} fill="currentColor" /> {listing.rating} · {listing.review_count} reviews</h2><div className="review-grid">{listing.reviews?.map((review) => <article key={review.id}><div className="review-author"><Image src={review.author_avatar} width={44} height={44} alt={review.author_name} /><div><strong>{review.author_name}</strong><span>Stayed recently</span></div></div><div className="review-stars">★★★★★ <span>· {new Date(review.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span></div><p>{review.comment}</p></article>)}</div></section>
          <section className="map-section"><h2>Where you’ll be</h2><p><MapPin size={17} /> {listing.city}, {listing.country}</p><div className="static-map"><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-water" /><span className="map-pin"><Home size={20} /></span><i>Exact location provided after booking</i></div></section>
        </div>
        <aside><BookingCard listing={listing} /></aside>
      </div>
      {gallery && <div className="gallery-overlay"><button className="gallery-close" onClick={() => setGallery(false)}>×</button><h2>{listing.title}</h2><div>{photos.map((photo, index) => <Image key={`${photo.url}-${index}`} src={photo.url} alt={photo.alt_text} width={1000} height={700} />)}</div></div>}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

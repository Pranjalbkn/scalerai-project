"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { saveListing } from "@/lib/api";
import { Listing, ListingPayload } from "@/lib/types";

const amenityChoices = ["Wifi", "Kitchen", "Pool", "Free parking", "Air conditioning", "Workspace", "Mountain view", "Washer", "Pet friendly", "Breakfast"];
const initial: ListingPayload = { title: "", description: "", city: "", country: "India", address: "", property_type: "Villa", category: "Amazing views", price_per_night: 120, cleaning_fee: 25, service_fee: 20, bedrooms: 2, beds: 2, bathrooms: 2, max_guests: 4, latitude: 0, longitude: 0, amenities: ["Wifi", "Kitchen"], images: [{ url: "", alt_text: "Property photo" }] };

function fromListing(listing?: Listing): ListingPayload {
  if (!listing) return initial;
  return { title: listing.title, description: listing.description, city: listing.city, country: listing.country, address: listing.address, property_type: listing.property_type, category: listing.category, price_per_night: listing.price_per_night, cleaning_fee: listing.cleaning_fee, service_fee: listing.service_fee, bedrooms: listing.bedrooms, beds: listing.beds, bathrooms: listing.bathrooms, max_guests: listing.max_guests, latitude: listing.latitude, longitude: listing.longitude, amenities: listing.amenities, images: listing.images };
}

export default function ListingForm({ listing }: { listing?: Listing }) {
  const router = useRouter();
  const [data, setData] = useState<ListingPayload>(() => fromListing(listing));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const field = (key: keyof ListingPayload, value: string | number) => setData((current) => ({ ...current, [key]: value }));
  const toggleAmenity = (name: string) => setData((current) => ({ ...current, amenities: current.amenities.includes(name) ? current.amenities.filter((item) => item !== name) : [...current.amenities, name] }));
  const setImage = (index: number, url: string) => setData((current) => ({ ...current, images: current.images.map((image, i) => i === index ? { ...image, url } : image) }));

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { await saveListing({ ...data, images: data.images.filter((image) => image.url.trim()) }, listing?.id); router.push("/host"); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save the listing"); }
    finally { setBusy(false); }
  }

  return <form className="listing-form" onSubmit={submit}>
    <section><span className="form-step">01</span><div><h2>Tell guests about your place</h2><p>Give your home a clear name and a description that sets the scene.</p></div><div className="form-fields full"><label>Listing title<input required minLength={5} value={data.title} onChange={(e) => field("title", e.target.value)} placeholder="e.g. Quiet villa overlooking the valley" /></label><label>Description<textarea required minLength={20} rows={5} value={data.description} onChange={(e) => field("description", e.target.value)} placeholder="What makes this place special?" /></label></div></section>
    <section><span className="form-step">02</span><div><h2>Location and type</h2><p>Help guests understand where they’ll stay.</p></div><div className="form-fields"><label>City<input required value={data.city} onChange={(e) => field("city", e.target.value)} /></label><label>Country<input required value={data.country} onChange={(e) => field("country", e.target.value)} /></label><label className="wide">Address<input required value={data.address} onChange={(e) => field("address", e.target.value)} /></label><label>Property type<select value={data.property_type} onChange={(e) => field("property_type", e.target.value)}>{["Villa", "Cottage", "Cabin", "Apartment", "Beach house", "Bungalow", "Home", "Dome"].map((x) => <option key={x}>{x}</option>)}</select></label><label>Category<select value={data.category} onChange={(e) => field("category", e.target.value)}>{["Amazing views", "Beachfront", "Cabins", "Countryside", "Historical homes", "Tropical", "Design", "OMG!"].map((x) => <option key={x}>{x}</option>)}</select></label></div></section>
    <section><span className="form-step">03</span><div><h2>The essentials</h2><p>Set capacity, rooms, and a transparent price.</p></div><div className="form-fields numeric">{[["max_guests", "Guests"], ["bedrooms", "Bedrooms"], ["beds", "Beds"], ["bathrooms", "Bathrooms"], ["price_per_night", "Price / night ($)"], ["cleaning_fee", "Cleaning fee ($)"], ["service_fee", "Service fee ($)"]].map(([key, label]) => <label key={key}>{label}<input required type="number" min={key === "bathrooms" ? ".5" : "0"} step={key === "bathrooms" ? ".5" : "1"} value={String(data[key as keyof ListingPayload])} onChange={(e) => field(key as keyof ListingPayload, Number(e.target.value))} /></label>)}</div></section>
    <section><span className="form-step">04</span><div><h2>Amenities</h2><p>Select everything guests can enjoy.</p></div><div className="amenity-choices">{amenityChoices.map((name) => <button type="button" key={name} onClick={() => toggleAmenity(name)} className={data.amenities.includes(name) ? "selected" : ""}>{name}</button>)}</div></section>
    <section><span className="form-step">05</span><div><h2>Add your best photos</h2><p>Paste direct image URLs. The first image becomes the cover.</p></div><div className="image-inputs">{data.images.map((image, index) => <div key={index}><span>{index === 0 ? "Cover" : `Photo ${index + 1}`}</span><input required={index === 0} type="url" value={image.url} onChange={(e) => setImage(index, e.target.value)} placeholder="https://…" />{data.images.length > 1 && <button type="button" onClick={() => setData({ ...data, images: data.images.filter((_, i) => i !== index) })}><X size={18} /></button>}</div>)}<button className="add-image" type="button" onClick={() => setData({ ...data, images: [...data.images, { url: "", alt_text: `${data.title || "Property"} photo` }] })}><Plus size={18} /> Add another photo</button></div></section>
    {error && <p className="form-error">{error}</p>}<div className="form-submit"><button type="button" className="outline-button" onClick={() => router.back()}>Cancel</button><button className="reserve-button" disabled={busy}>{busy ? "Saving…" : listing ? "Save changes" : "Publish listing"}</button></div>
  </form>;
}


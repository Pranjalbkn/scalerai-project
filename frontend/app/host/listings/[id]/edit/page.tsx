"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ListingForm from "@/components/ListingForm";
import { getListing } from "@/lib/api";
import { Listing } from "@/lib/types";

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  useEffect(() => { getListing(id).then(setListing); }, [id]);
  if (!listing) return <div className="page-loader">Opening your listing…</div>;
  return <div className="editor-page page-shell"><div className="editor-heading"><span className="eyebrow">EDIT HOME</span><h1>Refine your listing</h1><p>Keep the details current so guests know exactly what to expect.</p></div><ListingForm listing={listing} /></div>;
}


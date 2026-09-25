"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Categories from "@/components/Categories";
import FilterModal, { FilterState } from "@/components/FilterModal";
import ListingCard from "@/components/ListingCard";
import SearchBar from "@/components/SearchBar";
import { getListings } from "@/lib/api";
import { ListingPage } from "@/lib/types";

const emptyFilters: FilterState = { min_price: "", max_price: "", property_type: "", amenities: [] };

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [result, setResult] = useState<ListingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(searchParams.toString());
      if (category !== "All") params.set("category", category); else params.delete("category");
      Object.entries(filters).forEach(([key, value]) => {
        const normalized = Array.isArray(value) ? value.join(",") : value;
        if (normalized) params.set(key, normalized); else params.delete(key);
      });
      const data = await getListings(params);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load stays");
    } finally {
      setLoading(false);
    }
  }, [searchParams, category, filters]);

  useEffect(() => { load(); }, [load]);

  function movePage(page: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(page));
    router.push(`/?${next.toString()}`);
    window.scrollTo({ top: 300, behavior: "smooth" });
  }

  return (
    <>
      <section className="search-hero">
        <SearchBar />
      </section>
      <Categories active={category} onChange={setCategory} onFilters={() => setFilterOpen(true)} />
      <section className="listing-section page-shell">
        <div className="section-heading">
          <div><h2>{searchParams.get("location") ? `Stays in ${searchParams.get("location")}` : "Homes guests love"}</h2><p>{result ? `${result.total} thoughtfully selected places` : "Discovering beautiful stays..."}</p></div>
        </div>
        {error && <div className="error-state"><h3>We couldn’t load these homes</h3><p>{error}</p><button onClick={load} className="dark-button">Try again</button></div>}
        {loading ? <div className="listing-grid">{Array.from({ length: 8 }).map((_, i) => <div className="card-skeleton" key={i}><div /><span /><span /></div>)}</div> : result?.items.length ? (
          <div className="listing-grid">{result.items.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
        ) : !error && <div className="empty-state"><h3>No exact matches</h3><p>Try changing your dates, destination, or filters.</p><button className="outline-button" onClick={() => { setCategory("All"); setFilters(emptyFilters); router.push("/"); }}>Clear all filters</button></div>}
        {result && result.pages > 1 && <div className="pagination"><button disabled={result.page <= 1} onClick={() => movePage(result.page - 1)}><ChevronLeft size={18} /></button><span>Page {result.page} of {result.pages}</span><button disabled={result.page >= result.pages} onClick={() => movePage(result.page + 1)}><ChevronRight size={18} /></button></div>}
      </section>
      <section className="inspiration"><div className="page-shell"><span className="eyebrow light">LIVE A LITTLE DIFFERENTLY</span><h2>Not sure where to go?</h2><p>Let the feeling lead. Explore stays made for slow mornings, big views, and stories worth keeping.</p><button onClick={() => { setCategory("Amazing views"); window.scrollTo({ top: 500, behavior: "smooth" }); }}>Explore extraordinary homes <ChevronRight size={18} /></button></div></section>
      {filterOpen && <FilterModal value={filters} onClose={() => setFilterOpen(false)} onApply={(next) => { setFilters(next); setFilterOpen(false); }} />}
    </>
  );
}

export default function HomePage() {
  return <Suspense fallback={<div className="page-loader">Finding beautiful places…</div>}><HomeContent /></Suspense>;
}

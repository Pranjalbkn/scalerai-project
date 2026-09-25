"use client";

import { X } from "lucide-react";
import { FormEvent, useState } from "react";

export interface FilterState {
  min_price: string;
  max_price: string;
  property_type: string;
  amenities: string[];
}

const propertyTypes = ["", "Villa", "Cottage", "Cabin", "Apartment", "Beach house", "Bungalow", "Home"];
const amenityOptions = ["Wifi", "Kitchen", "Pool", "Free parking", "Air conditioning", "Workspace"];

export default function FilterModal({ value, onClose, onApply }: { value: FilterState; onClose: () => void; onApply: (next: FilterState) => void }) {
  const [filters, setFilters] = useState(value);
  function submit(e: FormEvent) { e.preventDefault(); onApply(filters); }
  function toggle(name: string) {
    setFilters((current) => ({ ...current, amenities: current.amenities.includes(name) ? current.amenities.filter((x) => x !== name) : [...current.amenities, name] }));
  }
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="filter-modal" onSubmit={submit} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header"><button type="button" onClick={onClose}><X size={20} /></button><strong>Filters</strong><span /></div>
        <section><h3>Price range</h3><p>Nightly prices before fees and taxes</p><div className="range-fields"><label>Minimum<input type="number" min="0" placeholder="$0" value={filters.min_price} onChange={(e) => setFilters({ ...filters, min_price: e.target.value })} /></label><label>Maximum<input type="number" min="0" placeholder="$500+" value={filters.max_price} onChange={(e) => setFilters({ ...filters, max_price: e.target.value })} /></label></div></section>
        <section><h3>Type of place</h3><div className="type-buttons">{propertyTypes.map((type) => <button type="button" key={type || "any"} className={filters.property_type === type ? "selected" : ""} onClick={() => setFilters({ ...filters, property_type: type })}>{type || "Any type"}</button>)}</div></section>
        <section><h3>Amenities</h3><div className="check-grid">{amenityOptions.map((item) => <label key={item}><input type="checkbox" checked={filters.amenities.includes(item)} onChange={() => toggle(item)} />{item}</label>)}</div></section>
        <div className="modal-footer"><button type="button" className="text-button" onClick={() => setFilters({ min_price: "", max_price: "", property_type: "", amenities: [] })}>Clear all</button><button className="dark-button">Show places</button></div>
      </form>
    </div>
  );
}


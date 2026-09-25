"use client";

import { Waves, Mountain, Palmtree, Building2, TentTree, Landmark, Sparkles, Home, SlidersHorizontal } from "lucide-react";

const categories = [
  { name: "All", icon: Home },
  { name: "Amazing views", icon: Sparkles },
  { name: "Beachfront", icon: Waves },
  { name: "Cabins", icon: TentTree },
  { name: "Countryside", icon: Mountain },
  { name: "Historical homes", icon: Landmark },
  { name: "Tropical", icon: Palmtree },
  { name: "Design", icon: Building2 },
];

interface Props {
  active: string;
  onChange: (category: string) => void;
  onFilters: () => void;
}

export default function Categories({ active, onChange, onFilters }: Props) {
  return (
    <div className="category-wrap page-shell">
      <div className="category-list">
        {categories.map(({ name, icon: Icon }) => (
          <button key={name} className={`category-item ${active === name ? "active" : ""}`} onClick={() => onChange(name)}>
            <Icon size={24} strokeWidth={1.6} /><span>{name}</span>
          </button>
        ))}
      </div>
      <button className="filter-button" onClick={onFilters}><SlidersHorizontal size={17} /> Filters</button>
    </div>
  );
}


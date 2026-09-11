"use client";

import { CATEGORIES, CATEGORY_COLORS, categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface SidebarProps {
  places: Array<{
    id: string;
    name: string;
    category: Category;
    created_by?: string | null;
  }>;
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
  activeCategory: Category | "all";
  onCategoryChange: (category: Category | "all") => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  places,
  selectedPlaceId,
  onSelectPlace,
  activeCategory,
  onCategoryChange,
  isOpen,
  onClose,
}: SidebarProps) {
  if (!isOpen) return null;

  const filtered =
    activeCategory === "all"
      ? places
      : places.filter((p) => p.category === activeCategory);

  return (
    <aside className="absolute left-3 top-3 z-10 flex max-h-[42vh] w-56 max-w-[55vw] flex-col overflow-hidden rounded border bg-card shadow-sm sm:bottom-3 sm:max-h-none sm:w-60 sm:max-w-[80vw]">
      <div className="flex items-center justify-between border-b border-[#e3e7cf] bg-[#f1f3e0] px-3 py-2.5">
        <h2 className="text-sm font-semibold text-[#3d5226]">
          Mesta u Novom Sadu
        </h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground hover:bg-muted"
          aria-label="Zatvori"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b px-2 py-2 [scrollbar-width:none]">
        <button
          onClick={() => onCategoryChange("all")}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-sm border px-2.5 py-1 text-xs font-medium",
            activeCategory === "all"
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 bg-background hover:bg-muted"
          )}
        >
          Sve
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm border px-2.5 py-1 text-xs font-medium",
              activeCategory === cat.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-background hover:bg-muted"
            )}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full border border-neutral-900/20"
              style={{ backgroundColor: CATEGORY_COLORS[cat.id] }}
            />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {filtered.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Nema mesta u ovoj kategoriji jos.
            <br />
            Dodaj prvi.
          </p>
        )}
        {filtered.map((place) => (
          <button
            key={place.id}
            onClick={() => onSelectPlace(place.id)}
            className={cn(
              "w-full rounded border bg-card p-2.5 text-left",
              selectedPlaceId === place.id
                ? "border-neutral-900 bg-neutral-100"
                : "border-neutral-300 hover:bg-neutral-50"
            )}
          >
            <div className="font-medium leading-snug">{place.name}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {place.created_by && (
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
              )}
              {categoryLabel(place.category)}
              {place.created_by && " · korisnik"}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
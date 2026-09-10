"use client";

import { useState } from "react";

import { CATEGORIES, NOVI_SAD_CENTER } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import type { Category, Place } from "@/types";

interface StarterPackProps {
  places: Place[];
  onClose: () => void;
  onSelectPlace: (id: string) => void;
}

const ESSENTIAL_CATEGORIES: Category[] = [
  "fakulteti-obrazovanje",
  "domovi",
  "menze",
  "hrana",
  "pekare",
  "kafa-bleja",
  "mesta-za-ucenje",
  "parkovi",
  "prodavnice",
  "apoteke",
  "bankomati",
  "poste",
  "kopirnice",
  "teretane",
  "prevoz",
  "korisne-lokacije",
];

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function StarterPack({
  places,
  onClose,
  onSelectPlace,
}: StarterPackProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const essentials = ESSENTIAL_CATEGORIES.map((cat) => {
    const catPlaces = places.filter((p) => p.category === cat);
    return {
      category: cat,
      places: catPlaces.sort(
        (a, b) =>
          haversineDistance(
            a.lat,
            a.lng,
            NOVI_SAD_CENTER[0],
            NOVI_SAD_CENTER[1]
          ) -
          haversineDistance(
            b.lat,
            b.lng,
            NOVI_SAD_CENTER[0],
            NOVI_SAD_CENTER[1]
          )
      ),
    };
  });

  const activeGroup = essentials.find(
    (g) => g.category === selectedCategory
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded border bg-card shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <div>
            <h2 className="text-base font-bold">Student Starter Pack</h2>
            <p className="text-sm text-muted-foreground">
              Prvi put u Novom Sadu? Evo najvaznijih stvari u centru grada.
            </p>
          </div>
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

        {!selectedCategory && (
          <div className="grid flex-1 gap-2 overflow-y-auto p-4 sm:grid-cols-2">
            {essentials.map(({ category, places: catPlaces }) => {
              const info = CATEGORIES.find((c) => c.id === category)!;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className="rounded border bg-background p-3 text-left hover:border-neutral-900 hover:bg-neutral-50"
                >
                  <div className="font-semibold">{info.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {catPlaces.length > 0
                      ? `${catPlaces.length} mesta u bazi`
                      : "Nema jos mesta. Dodaj prvi."}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedCategory && activeGroup && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <button
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-1 border-b px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Nazad
            </button>
            <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
              {activeGroup.places.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Jos nema mesta u ovoj kategoriji. Dodaj prvo mesto i pomozi
                  drugim studentima.
                </p>
              )}
              {activeGroup.places.map((place) => (
                <button
                  key={place.id}
                  onClick={() => {
                    onSelectPlace(place.id);
                    onClose();
                  }}
                  className="w-full rounded border bg-background p-3 text-left hover:border-neutral-900 hover:bg-neutral-50"
                >
                  <div className="font-medium">{place.name}</div>
                  {place.address && (
                    <div className="text-sm text-muted-foreground">
                      {place.address}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t px-5 py-3">
          <Button className="w-full" variant="outline" onClick={onClose}>
            Zatvori
          </Button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { CATEGORY_COLORS, categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Place, Profile, Review } from "@/types";

interface PlaceCardProps {
  place: Place;
  userLocation?: { lat: number; lng: number } | null;
  author?: Profile | null;
  reviews?: Review[];
  isFavorite?: boolean;
  canModerate?: boolean;
  onToggleFavorite: () => void;
  onOpenReviews: () => void;
  onOpenProfile: (userId: string) => void;
  onDeletePlace?: (() => Promise<void>) | null;
  onClose: () => void;
}

const NOISE_LABELS: Record<string, string> = {
  quiet: "Miran",
  moderate: "Umerena buka",
  loud: "Buka",
};

const CROWDED_LABELS: Record<string, string> = {
  low: "Bez guzve",
  medium: "Umerena guzva",
  high: "Velika guzva",
};

const PRICE_LABELS: Record<number, string> = {
  1: "Jeftino",
  2: "Srednje",
  3: "Skuplje",
};

export default function PlaceCard({
  place,
  userLocation,
  author,
  reviews = [],
  isFavorite = false,
  canModerate = false,
  onToggleFavorite,
  onOpenReviews,
  onOpenProfile,
  onDeletePlace = null,
  onClose,
}: PlaceCardProps) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1${
    userLocation
      ? `&origin=${userLocation.lat},${userLocation.lng}`
      : ""
  }&destination=${place.lat},${place.lng}&travelmode=walking`;

  const reviewCount = reviews.length;
  let ratingSum = 0;
  for (const r of reviews) ratingSum += r.rating;
  const avg = reviewCount > 0 ? ratingSum / reviewCount : null;

  return (
    <div className="absolute right-3 top-3 z-10 flex max-h-[calc(100%-1.5rem)] w-80 max-w-[85vw] flex-col overflow-hidden rounded border bg-card shadow-sm">
      {place.image_url && (
        <img
          src={place.image_url}
          alt={place.name}
          className="h-40 w-full border-b object-cover"
        />
      )}
      <div className="flex items-start justify-between gap-2 border-b p-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full border border-neutral-900/20"
              style={{ backgroundColor: CATEGORY_COLORS[place.category] }}
            />
            {categoryLabel(place.category)}
          </p>
          <h3 className="text-base font-bold leading-tight">{place.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleFavorite}
            aria-label={
              isFavorite ? "Ukloni iz favorita" : "Sacuvaj u favorite"
            }
            title={isFavorite ? "Ukloni iz favorita" : "Sacuvaj u favorite"}
            className={cn(
              "rounded p-1 hover:bg-muted",
              isFavorite ? "text-[#b8860b]" : "text-neutral-400"
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
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
      </div>

      {place.created_by && (
        <button
          onClick={() => onOpenProfile(place.created_by as string)}
          className="flex w-full items-center gap-2 border-b border-orange-200 bg-orange-50 px-3 py-2 text-left hover:bg-orange-100"
        >
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.username}
              className="h-7 w-7 shrink-0 rounded-full border border-orange-300 object-cover"
            />
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-orange-300 bg-white text-xs font-bold text-orange-800">
              {(author?.username ?? "?").slice(0, 2).toUpperCase()}
            </span>
          )}
          <span>
            <span className="block text-xs font-semibold text-orange-800">
              Dodao/la korisnik
            </span>
            <span className="block text-xs text-orange-900/70">
              {author ? `@${author.username}` : "Pogledaj profil"}
            </span>
          </span>
        </button>
      )}

      <div className="p-3">
        {place.address && (
          <p className="text-sm text-muted-foreground">Adresa: {place.address}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
          {place.price_level && (
            <span className="border border-neutral-300 px-2 py-0.5 text-xs">
              Cene: {PRICE_LABELS[place.price_level]}
            </span>
          )}
          {place.has_wifi != null && (
            <span className="border border-neutral-300 px-2 py-0.5 text-xs">
              {place.has_wifi ? "Ima Wi-Fi" : "Nema Wi-Fi"}
            </span>
          )}
          {place.has_outlets != null && (
            <span className="border border-neutral-300 px-2 py-0.5 text-xs">
              {place.has_outlets ? "Ima uticnice" : "Nema uticnice"}
            </span>
          )}
          {place.noise_level && (
            <span className="border border-neutral-300 px-2 py-0.5 text-xs">
              Buka: {NOISE_LABELS[place.noise_level]}
            </span>
          )}
          {place.crowded && (
            <span className="border border-neutral-300 px-2 py-0.5 text-xs">
              Guzva: {CROWDED_LABELS[place.crowded]}
            </span>
          )}
        </div>

        {place.description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {place.description}
          </p>
        )}

        {avg != null && (
          <p className="mt-2 border border-neutral-300 px-2 py-1 text-xs">
            <span className="font-semibold text-neutral-900">
              Ocena {avg.toFixed(1)}/5
            </span>{" "}
            ({reviewCount} {reviewCount === 1 ? "recenzija" : "recenzije"})
          </p>
        )}

        <button
          onClick={onOpenReviews}
          className="mt-2 w-full rounded border border-neutral-300 bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {reviewCount === 0 ? "Oceni mesto" : `Recenzije (${reviewCount})`}
        </button>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Navigacija (Google Maps)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
          </svg>
        </a>

        {canModerate && onDeletePlace && (
          <button
            onClick={async () => {
              if (!window.confirm("Obrisati ovo mesto?")) return;
              try {
                await onDeletePlace();
              } catch {
                // greska se prikazuje kroz tihi povratak; mesto ostaje
              }
            }}
            className="mt-2 w-full rounded border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Obriši mesto
          </button>
        )}
      </div>
    </div>
  );
}
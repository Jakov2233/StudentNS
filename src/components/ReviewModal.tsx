"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  NewReviewData,
  Place,
  Profile,
  Review,
} from "@/types";

interface ReviewModalProps {
  place: Place;
  reviews: Review[];
  profilesById: Record<string, Profile>;
  isAuthed: boolean;
  userId: string | null;
  canModerate?: boolean;
  onSave: (data: NewReviewData) => Promise<void>;
  onDelete: (reviewId: string) => Promise<void>;
  onClose: () => void;
}

const MAX_COMMENT = 1000;

const SUBJECTS = [
  { key: "coffee" as const, label: "Kafa" },
  { key: "food" as const, label: "Hrana" },
  { key: "study_friendly" as const, label: "Za ucenje" },
];

const LEVEL_LABELS: Record<string, string> = {
  quiet: "Miran",
  moderate: "Umerena buka",
  loud: "Buka",
};

const CROWDED_LABELS: Record<string, string> = {
  low: "Bez guzve",
  medium: "Umerena guzva",
  high: "Velika guzva",
};

function initialsOf(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("sr-RS", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function ReviewModal({
  place,
  reviews,
  profilesById,
  isAuthed,
  userId,
  canModerate = false,
  onSave,
  onDelete,
  onClose,
}: ReviewModalProps) {
  const ownReview =
    reviews.find((r) => userId != null && r.author_id === userId) ?? null;

  const [rating, setRating] = useState<number>(ownReview?.rating ?? 5);
  const [coffee, setCoffee] = useState<number | null>(
    ownReview?.coffee ?? null
  );
  const [food, setFood] = useState<number | null>(ownReview?.food ?? null);
  const [study, setStudy] = useState<number | null>(
    ownReview?.study_friendly ?? null
  );
  const [comment, setComment] = useState(ownReview?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const count = reviews.length;
  let ratingSum = 0;
  let coffeeSum = 0;
  let coffeeN = 0;
  let foodSum = 0;
  let foodN = 0;
  let studySum = 0;
  let studyN = 0;
  for (const r of reviews) {
    ratingSum += r.rating;
    if (r.coffee != null) {
      coffeeSum += r.coffee;
      coffeeN += 1;
    }
    if (r.food != null) {
      foodSum += r.food;
      foodN += 1;
    }
    if (r.study_friendly != null) {
      studySum += r.study_friendly;
      studyN += 1;
    }
  }
  const avg = count > 0 ? ratingSum / count : null;

  const handleSave = async () => {
    if (![1, 2, 3, 4, 5].includes(rating)) {
      setError("Izaberi ocenu od 1 do 5.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSave({
        place_id: place.id,
        rating,
        coffee,
        food,
        study_friendly: study,
        comment,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Doslo je do greske pri cuvanju recenzije."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!ownReview) return;
    setError(null);
    setBusy(true);
    try {
      await onDelete(ownReview.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Doslo je do greske pri brisanju recenzije."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleModerateDelete = async (reviewId: string) => {
    if (!window.confirm("Obrisati ovu recenziju?")) return;
    setError(null);
    setBusy(true);
    try {
      await onDelete(reviewId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Doslo je do greske pri brisanju recenzije."
      );
    } finally {
      setBusy(false);
    }
  };

  const subjectSelect = (
    key: "coffee" | "food" | "study_friendly",
    label: string,
    value: number | null,
    onChange: (v: number | null) => void
  ) => (
    <div>
      <label className="mb-1 block text-xs font-medium">{label}</label>
      <select
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
        className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:border-neutral-600"
      >
        <option value="">Bez ocene</option>
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n}/5
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-bold leading-tight">
            Recenzije — {place.name}
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

        <div className="flex-1 overflow-y-auto">
          {avg != null && (
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">
                Ocena: {avg.toFixed(1)}/5 ({count}{" "}
                {count === 1 ? "recenzija" : "recenzije"})
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                {coffeeN > 0 && (
                  <span className="border border-neutral-300 px-2 py-0.5">
                    Kafa: {(coffeeSum / coffeeN).toFixed(1)}
                  </span>
                )}
                {foodN > 0 && (
                  <span className="border border-neutral-300 px-2 py-0.5">
                    Hrana: {(foodSum / foodN).toFixed(1)}
                  </span>
                )}
                {studyN > 0 && (
                  <span className="border border-neutral-300 px-2 py-0.5">
                    Za učenje: {(studySum / studyN).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          )}

          {isAuthed ? (
            <div className="border-b px-4 py-3">
              <p className="mb-2 text-sm font-semibold">
                {ownReview ? "Moja recenzija" : "Nova recenzija"}
              </p>
              <div className="mb-2">
                <label className="mb-1 block text-xs font-medium">
                  Ukupna ocena *
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full rounded border bg-background px-2 py-1.5 text-sm outline-none focus:border-neutral-600"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}/5
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {subjectSelect("coffee", SUBJECTS[0].label, coffee, setCoffee)}
                {subjectSelect("food", SUBJECTS[1].label, food, setFood)}
                {subjectSelect(
                  "study_friendly",
                  SUBJECTS[2].label,
                  study,
                  setStudy
                )}
              </div>
              <textarea
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value.slice(0, MAX_COMMENT))
                }
                maxLength={MAX_COMMENT}
                rows={3}
                placeholder="Utisak o mestu..."
                className="mt-2 w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {comment.length}/{MAX_COMMENT}
              </p>
              {error && (
                <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="mt-2 flex gap-2">
                <Button className="flex-1" disabled={busy} onClick={handleSave}>
                  {busy ? "Cuvanje..." : "Sacuvaj recenziju"}
                </Button>
                {ownReview && (
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={handleDelete}
                  >
                    Obrisi
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <p className="border-b px-4 py-3 text-sm text-muted-foreground">
              Prijavi se da ostavis recenziju i ocenu.
            </p>
          )}

          {reviews.length === 0 && (
            <p className="px-4 py-6 text-center text-sm italic text-muted-foreground">
              Jos nema recenzija.
            </p>
          )}
          {reviews.map((r) => {
            const author = profilesById[r.author_id] ?? null;
            const subjectLines: string[] = [];
            if (r.coffee != null) subjectLines.push(`Kafa ${r.coffee}/5`);
            if (r.food != null) subjectLines.push(`Hrana ${r.food}/5`);
            if (r.study_friendly != null)
              subjectLines.push(`Ucenje ${r.study_friendly}/5`);
            return (
              <div key={r.id} className="border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  {author?.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt={author.username}
                      className="h-6 w-6 shrink-0 rounded-full border border-neutral-300 object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-[#f1f3e0] text-[10px] font-bold text-[#5a6f43]">
                      {initialsOf(author?.username ?? "?")}
                    </span>
                  )}
                  <span className="text-sm font-semibold">
                    {author ? `@${author.username}` : "Student"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(r.created_at)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold">
                    {r.rating}/5
                  </span>
                  {subjectLines.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {subjectLines.join(" · ")}
                    </span>
                  )}
                </div>
                {r.comment && (
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {r.comment}
                  </p>
                )}
                {canModerate && (
                  <button
                    onClick={() => handleModerateDelete(r.id)}
                    className="mt-1 text-xs font-medium text-red-700 underline hover:text-red-900"
                  >
                    Obriši (moderator)
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {place.noise_level || place.crowded ? (
          <div className="border-t px-4 py-2 text-xs text-muted-foreground">
            {place.noise_level && (
              <span className="mr-3">
                Buka: {LEVEL_LABELS[place.noise_level]}
              </span>
            )}
            {place.crowded && (
              <span>Guzva: {CROWDED_LABELS[place.crowded]}</span>
            )}
          </div>
        ) : null}

        <div className="border-t px-4 py-3">
          <Button variant="outline" className="w-full" onClick={onClose}>
            Zatvori
          </Button>
        </div>
      </div>
    </div>
  );
}
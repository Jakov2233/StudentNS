"use client";

import { useState } from "react";

import { CATEGORIES } from "@/lib/categories";
import { isHeicLike, isImageType, MAX_IMAGE_SIZE, prepareImage } from "@/lib/image";
import { Button } from "@/components/ui/button";
import type { Category, NewPlaceData } from "@/types";

interface AddPlaceModalProps {
  pickedLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  onSave: (data: NewPlaceData) => Promise<void>;
}

const MAX_NAME = 80;
const MAX_DESCRIPTION = 500;
const MAX_ADDRESS = 120;

function sanitizeText(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}

export default function AddPlaceModal({
  pickedLocation,
  onClose,
  onSave,
}: AddPlaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<Category>("hrana");
  const [priceLevel, setPriceLevel] = useState<null | 1 | 2 | 3>(null);
  const [hasWifi, setHasWifi] = useState<boolean | null>(null);
  const [hasOutlets, setHasOutlets] = useState<boolean | null>(null);
  const [noiseLevel, setNoiseLevel] = useState<"quiet" | "moderate" | "loud">(
    "moderate"
  );
  const [crowded, setCrowded] = useState<"low" | "medium" | "high">("medium");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSave = sanitizeText(name).length > 0 && pickedLocation !== null;

  const handleImageChange = async (file: File | null) => {
    setSubmitError(null);
    if (!file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImage(null);
      setImagePreview(null);
      return;
    }
    if (!isImageType(file.type)) {
      setSubmitError("Dozvoljene su samo slike (JPG, PNG, WEBP, HEIC).");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE && !isHeicLike(file.type)) {
      setSubmitError("Slika mora biti manja od 8 MB.");
      return;
    }
if (isHeicLike(file.type) || file.size > MAX_IMAGE_SIZE) {
        setProcessingImage(true);
        try {
          const converted = await prepareImage(file);
          if (imagePreview) URL.revokeObjectURL(imagePreview);
          setImage(converted);
          setImagePreview(URL.createObjectURL(converted));
        } catch (err) {
          setSubmitError(
            err instanceof Error ? err.message : "Ne mogu da obradim sliku."
          );
          if (imagePreview) URL.revokeObjectURL(imagePreview);
          setImage(null);
          setImagePreview(null);
        } finally {
          setProcessingImage(false);
        }
        return;
      }
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!pickedLocation || sanitizeText(name).length === 0) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await onSave({
        name: sanitizeText(name).slice(0, MAX_NAME),
        description: sanitizeText(description).slice(0, MAX_DESCRIPTION),
        category,
        address: sanitizeText(address).slice(0, MAX_ADDRESS),
        lat: pickedLocation.lat,
        lng: pickedLocation.lng,
        price_level: priceLevel,
        has_wifi: hasWifi,
        has_outlets: hasOutlets,
        noise_level: noiseLevel,
        crowded,
        image: image ?? undefined,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Doslo je do greske pri cuvanju mesta."
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-bold">Dodaj mesto</h2>
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

        {!pickedLocation && (
          <div className="mb-4 rounded border border-dashed bg-muted/50 p-3 text-center text-sm text-muted-foreground">
            Klikni na mapu da odaberes lokaciju mesta. Trenutno{" "}
            <span className="font-semibold text-foreground">nije odabrana</span>.
          </div>
        )}
        {pickedLocation && (
          <div className="mb-4 rounded border border-dashed p-3 text-sm">
            Lokacija:{" "}
            <span className="font-mono text-xs">
              {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Naziv *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
              maxLength={MAX_NAME}
              placeholder="npr. Dnevni boravak"
              className="w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Kategorija</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Adresa</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value.slice(0, MAX_ADDRESS))}
              maxLength={MAX_ADDRESS}
              placeholder="npr. Bulevar oslobodjenja 5"
              className="w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Opis</label>
            <textarea
              value={description}
              onChange={(e) =>
                setDescription(e.target.value.slice(0, MAX_DESCRIPTION))
              }
              maxLength={MAX_DESCRIPTION}
              rows={3}
              placeholder="Sta je tu zanimljivo za studente?"
              className="w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Fotografija</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, WEBP ili HEIC (iPhone). Velike slike se automatski
              smanjuju.
            </p>
            {processingImage && (
              <p className="mt-1 text-xs text-muted-foreground">
                Obradjujem sliku...
              </p>
            )}
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Pregled izabrane fotografije"
                  className="max-h-40 rounded border object-cover"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Cene (okvirno)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[null, 1, 2, 3].map((level) => (
                <button
                  key={String(level)}
                  type="button"
                  onClick={() => setPriceLevel(level as null | 1 | 2 | 3)}
                  className={`rounded border px-3 py-2 text-sm font-medium ${
                    priceLevel === level
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 bg-background hover:bg-muted"
                  }`}
                >
                  {level === null ? "Bez izbora" : "$".repeat(level)}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              $ = jeftino, $$ = srednje, $$$ = skuplje
            </p>
          </div>

          {(category === "kafa-bleja" ||
            category === "mesta-za-ucenje" ||
            category === "zabava") && (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={hasWifi === true}
                  onChange={(e) => setHasWifi(e.target.checked)}
                />
                Wi-Fi (ostavi prazno ako ne znas)
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={hasOutlets === true}
                  onChange={(e) => setHasOutlets(e.target.checked)}
                />
                Uticnice (ostavi prazno ako ne znas)
              </label>
            </div>
          )}

          {(category === "kafa-bleja" ||
            category === "mesta-za-ucenje" ||
            category === "zabava") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Buka</label>
                <select
                  value={noiseLevel}
                  onChange={(e) =>
                    setNoiseLevel(e.target.value as typeof noiseLevel)
                  }
                  className="w-full rounded border bg-background px-3 py-2 text-sm outline-none"
                >
                  <option value="quiet">Miran</option>
                  <option value="moderate">Umerena</option>
                  <option value="loud">Buka</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Guzva</label>
                <select
                  value={crowded}
                  onChange={(e) =>
                    setCrowded(e.target.value as typeof crowded)
                  }
                  className="w-full rounded border bg-background px-3 py-2 text-sm outline-none"
                >
                  <option value="low">Nema</option>
                  <option value="medium">Umerena</option>
                  <option value="high">Velika</option>
                </select>
              </div>
            </div>
          )}

          {submitError && (
            <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={saving}
            >
              Otkazi
            </Button>
            <Button
              className="flex-1"
              disabled={!canSave || saving || processingImage}
              onClick={handleSubmit}
            >
              {saving
                ? "Cuvanje..."
                : processingImage
                ? "Obradjujem sliku..."
                : "Sacuvaj mesto"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
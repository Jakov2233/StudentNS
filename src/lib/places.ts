import { inNoviSad } from "@/lib/categories";
import { supabase } from "@/lib/supabase";
import {
  deleteStorageObject,
  pathFromStorageUrl,
} from "@/lib/storage";
import type { NewPlaceData, Place } from "@/types";

const VALID_CATEGORIES: Place["category"][] = [
  "fakulteti-obrazovanje",
  "domovi",
  "menze",
  "hrana",
  "pekare",
  "kafa-bleja",
  "pubovi",
  "mesta-za-ucenje",
  "parkovi",
  "prodavnice",
  "apoteke",
  "bankomati",
  "poste",
  "kopirnice",
  "teretane",
  "prevoz",
  "zabava",
  "korisne-lokacije",
];

function mapRow(row: Record<string, unknown>): Place {
  const category = row.category as Place["category"];
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    category: VALID_CATEGORIES.includes(category)
      ? category
      : "korisne-lokacije",
    lat: row.lat as number,
    lng: row.lng as number,
    address: (row.address as string | null) ?? null,
    price_level: (row.price_level as 1 | 2 | 3 | null) ?? null,
    has_wifi: row.has_wifi == null ? null : Boolean(row.has_wifi),
    has_outlets: row.has_outlets == null ? null : Boolean(row.has_outlets),
    noise_level: (row.noise_level as Place["noise_level"]) ?? null,
    crowded: (row.crowded as Place["crowded"]) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: row.created_at as string,
    image_url: (row.image_url as string | null) ?? null,
  };
}

export async function fetchPlaces(): Promise<Place[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapRow(row));
}

export async function insertPlace(
  data: NewPlaceData,
  userId: string,
  imageUrl: string | null
): Promise<Place> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");

  if (!VALID_CATEGORIES.includes(data.category)) {
    throw new Error("Nepoznata kategorija mesta.");
  }
  if (typeof data.lat !== "number" || typeof data.lng !== "number") {
    throw new Error("Nedostaje lokacija mesta.");
  }
  if (!inNoviSad(data.lat, data.lng)) {
    throw new Error("Odaberi lokaciju unutar Novog Sada.");
  }

  const row = {
    name: data.name,
    description: data.description || null,
    category: data.category,
    lat: data.lat,
    lng: data.lng,
    address: data.address || null,
    price_level: data.price_level,
    has_wifi: data.has_wifi ?? null,
    has_outlets: data.has_outlets ?? null,
    noise_level: data.noise_level,
    crowded: data.crowded,
    image_url: imageUrl,
    created_by: userId,
  };

  const { data: inserted, error } = await supabase
    .from("places")
    .insert(row)
    .select("*")
    .maybeSingle();

  if (error) throw error;

  if (inserted) return mapRow(inserted as Record<string, unknown>);

  const all = await fetchPlaces();
  const match = all.find(
    (p) =>
      p.created_by === userId &&
      p.name === data.name &&
      p.address === (data.address || null)
  );
  if (match) return match;

  throw new Error(
    "Mesto nije potvrđeno zbog istekle prijave. Pokušaj ponovo — obično odmah prođe."
  );
}

export async function uploadPlaceImage(
  file: File,
  userId: string
): Promise<string> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
  const path = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${safeExt}`;

  const { error } = await supabase.storage
    .from("place-photos")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from("place-photos")
    .getPublicUrl(path);
  return data.publicUrl;
}

export async function deletePlacePhoto(imageUrl: string): Promise<void> {
  const path = pathFromStorageUrl(imageUrl, "place-photos");
  if (!path) return;
  await deleteStorageObject("place-photos", path);
}

export async function deletePlace(
  placeId: string,
  imageUrl?: string | null
): Promise<void> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { error } = await supabase.from("places").delete().eq("id", placeId);
  if (error) throw error;
  if (imageUrl) {
    try {
      await deletePlacePhoto(imageUrl);
    } catch {
      // fotografija moze da ostane; brisanje mesta je proslo
    }
  }
}
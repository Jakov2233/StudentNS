import { supabase } from "@/lib/supabase";

export async function fetchFavorites(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("favorites")
    .select("place_id");
  if (error) throw error;
  return (data ?? []).map(
    (row: Record<string, unknown>) => row.place_id as string
  );
}

export async function addFavorite(
  userId: string,
  placeId: string
): Promise<void> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, place_id: placeId });
  if (error) {
    // Duplikat (vec u favoritima) nije greska; ostalo se prosledjuje
    if (String(error.code) !== "23505") throw error;
  }
}

export async function removeFavorite(
  userId: string,
  placeId: string
): Promise<void> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("place_id", placeId);
  if (error) throw error;
}
import { supabase } from "@/lib/supabase";
import type { NewReviewData, Review } from "@/types";

function mapRow(row: Record<string, unknown>): Review {
  return {
    id: row.id as string,
    place_id: row.place_id as string,
    author_id: row.author_id as string,
    rating: row.rating as number,
    coffee: row.coffee == null ? null : Number(row.coffee),
    food: row.food == null ? null : Number(row.food),
    study_friendly:
      row.study_friendly == null ? null : Number(row.study_friendly),
    comment: (row.comment as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

export async function fetchReviews(): Promise<Review[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapRow(row));
}

export async function upsertReview(
  authorId: string,
  data: NewReviewData
): Promise<Review> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  if (![1, 2, 3, 4, 5].includes(data.rating)) {
    throw new Error("Ocena mora biti od 1 do 5.");
  }
  if (data.comment && data.comment.length > 1000) {
    throw new Error("Recenzija moze imati najvise 1000 karaktera.");
  }

  const row = {
    place_id: data.place_id,
    author_id: authorId,
    rating: data.rating,
    coffee: data.coffee ?? null,
    food: data.food ?? null,
    study_friendly: data.study_friendly ?? null,
    comment: data.comment.trim() ? data.comment.trim().slice(0, 1000) : null,
  };

  const { data: inserted, error } = await supabase
    .from("reviews")
    .upsert(row, { onConflict: "place_id,author_id" })
    .select("*")
    .single();

  if (error) throw error;
  return mapRow(inserted as Record<string, unknown>);
}

export async function deleteReview(reviewId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
  if (error) throw error;
}
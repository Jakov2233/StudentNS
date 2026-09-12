import { supabase } from "@/lib/supabase";
import {
  deleteStorageObject,
  pathFromStorageUrl,
} from "@/lib/storage";
import type { Profile } from "@/types";

function mapRow(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    username: row.username as string,
    bio: (row.bio as string | null) ?? null,
    instagram: (row.instagram as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

export async function fetchProfiles(): Promise<Profile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("username");
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => mapRow(row));
}

export interface ProfileUpdate {
  bio: string | null;
  instagram: string | null;
  avatar_url: string | null;
}

export async function updateProfile(
  userId: string,
  fields: ProfileUpdate
): Promise<Profile> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { data, error } = await supabase
    .from("profiles")
    .update({
      bio: fields.bio?.trim() ? fields.bio.trim().slice(0, 300) : null,
      instagram: fields.instagram?.trim() ? fields.instagram.trim() : null,
      avatar_url: fields.avatar_url,
    })
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function uploadAvatar(
  file: File,
  userId: string
): Promise<string> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");

  const path = `${userId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}.jpg`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/jpeg",
    });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteAvatar(avatarUrl: string): Promise<void> {
  const path = pathFromStorageUrl(avatarUrl, "avatars");
  if (!path) return;
  await deleteStorageObject("avatars", path);
}
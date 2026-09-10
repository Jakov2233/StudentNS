import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types";

export async function checkModerator(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from("moderators")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

export async function fetchIsModerator(userId: string): Promise<boolean> {
  return checkModerator(userId);
}

export async function fetchModeratorIds(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("moderators")
    .select("user_id");
  if (error) throw error;
  return (data ?? []).map((row) => row.user_id as string);
}

export interface ModerationStatus {
  banned: boolean;
  reason: string | null;
  is_moderator: boolean;
}

export async function fetchModerationStatus(
  userId: string
): Promise<ModerationStatus> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const [ban, mod] = await Promise.all([
    supabase
      .from("bans")
      .select("user_id, reason")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("moderators")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  if (ban.error) throw ban.error;
  if (mod.error) throw mod.error;
  return {
    banned: !!ban.data,
    reason: (ban.data?.reason as string | null) ?? null,
    is_moderator: !!mod.data,
  };
}

export interface ModerationUser extends Profile {
  banned: boolean;
  is_moderator: boolean;
}

export async function fetchModerationUsers(): Promise<ModerationUser[]> {
  if (!supabase) return [];
  const [profiles, bans, mods] = await Promise.all([
    supabase.from("profiles").select("*").order("username").limit(200),
    supabase.from("bans").select("user_id"),
    supabase.from("moderators").select("user_id"),
  ]);
  if (profiles.error) throw profiles.error;
  if (bans.error) throw bans.error;
  if (mods.error) throw mods.error;

  const banned = new Set((bans.data ?? []).map((r) => r.user_id as string));
  const moderatorIds = new Set(
    (mods.data ?? []).map((r) => r.user_id as string)
  );

  return (profiles.data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    username: row.username as string,
    bio: (row.bio as string | null) ?? null,
    instagram: (row.instagram as string | null) ?? null,
    avatar_url: (row.avatar_url as string | null) ?? null,
    created_at: row.created_at as string,
    banned: banned.has(row.id as string),
    is_moderator: moderatorIds.has(row.id as string),
  }));
}

export async function banUser(userId: string, reason: string): Promise<void> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { error } = await supabase
    .from("bans")
    .insert({ user_id: userId, reason });
  if (error) throw error;
}

export async function unbanUser(userId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { error } = await supabase
    .from("bans")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

export async function addModerator(userId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { error } = await supabase
    .from("moderators")
    .insert({ user_id: userId });
  if (error) throw error;
}

export async function removeModerator(userId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { error } = await supabase
    .from("moderators")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}
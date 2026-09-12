import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/types";

function mapRow(row: Record<string, unknown>): ChatMessage {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    message: row.message as string,
    created_at: row.created_at as string,
  };
}

export async function fetchRecentMessages(limit = 100): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapRow).reverse();
}

export async function sendChatMessage(
  userId: string,
  message: string
): Promise<ChatMessage> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ user_id: userId, message })
    .select("*")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>);
}

export async function deleteChatMessage(messageId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase nije konfigurisan.");
  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", messageId);
  if (error) throw error;
}

export async function fetchProfileForChat(
  userId: string
): Promise<{ username: string; avatar_url: string | null } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    username: data.username as string,
    avatar_url: data.avatar_url as string | null,
  };
}
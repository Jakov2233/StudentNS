import { supabase } from "@/lib/supabase";

export function pathFromStorageUrl(
  url: string,
  bucket: string
): string | null {
  const marker = `/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const path = url.slice(idx + marker.length).split("?")[0];
  return path || null;
}

export async function deleteStorageObject(
  bucket: string,
  path: string
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
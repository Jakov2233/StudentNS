import { supabase } from "@/lib/supabase";

let lastLogAt = 0;

export function reportError(component: string, err: unknown): void {
  const now = Date.now();
  if (now - lastLogAt < 2000) return;
  lastLogAt = now;
  const detail = err as
    | { message?: unknown; stack?: unknown }
    | null
    | undefined;
  const message =
    detail && detail.message !== undefined
      ? detail.message
      : String(err ?? "Nepoznata greska");
  const payload = {
    url:
      typeof window !== "undefined"
        ? window.location.href.slice(0, 1000)
        : "",
    message: String(message).slice(0, 2000),
    stack: String(
      detail && detail.stack !== undefined ? detail.stack : ""
    ).slice(0, 2000),
    component,
    user_agent:
      typeof navigator !== "undefined"
        ? navigator.userAgent.slice(0, 500)
        : "",
  };
  try {
    supabase
      ?.from("client_errors")
      .insert(payload)
      .then(() => undefined, () => undefined);
  } catch {
    // ovaj snimac ne sme da izazove dodatne greske
  }
}
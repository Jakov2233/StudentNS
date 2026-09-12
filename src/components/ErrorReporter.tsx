"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

let lastLogAt = 0;

export default function ErrorReporter() {
  useEffect(() => {
    const report = (kind: string, err: unknown) => {
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
        url: window.location.href.slice(0, 1000),
        message: String(message).slice(0, 2000),
        stack: String(
          detail && detail.stack !== undefined ? detail.stack : ""
        ).slice(0, 2000),
        component: kind,
        user_agent: navigator.userAgent.slice(0, 500),
      };
      try {
        supabase
          ?.from("client_errors")
          .insert(payload)
          .then(() => undefined, () => undefined);
      } catch {
        // ovaj snimac ne sme da izazove dodatne greske
      }
    };

    const onError = (event: ErrorEvent) =>
      report("window.onerror", event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) =>
      report("unhandledrejection", event.reason);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
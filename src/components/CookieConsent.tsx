"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "studentns_cookie_consent";
const CONSENT_EVENT = "studentns-consent-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_EVENT, callback);
  };
}

function getConsent(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const consent = useSyncExternalStore(subscribe, getConsent, () => null);
  const visible = consent === null;

  const decide = (value: "accepted" | "rejected") => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      return;
    }
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card p-3">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Ovaj sajt koristi samo tehnicki neophodno skladistenje da bi
          zapamtio tvoj izbor o kolacicima i podesavanja prikaza. Ne koristimo
          reklamne ni analiticke kolacice.{" "}
          <Link href="/cookies" className="underline">
            Politika kolacica
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => decide("rejected")}
          >
            Odbij
          </Button>
          <Button size="sm" onClick={() => decide("accepted")}>
            Prihvati
          </Button>
        </div>
      </div>
    </div>
  );
}
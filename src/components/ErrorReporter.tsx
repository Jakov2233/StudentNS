"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/errorLog";

export default function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) =>
      reportError("window.onerror", event.error ?? event.message);
    const onRejection = (event: PromiseRejectionEvent) =>
      reportError("unhandledrejection", event.reason);

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
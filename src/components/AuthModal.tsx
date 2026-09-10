"use client";

import { useState } from "react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  if (!supabase) return null;

  const client = supabase;

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        if (username.trim().length < 2) {
          throw new Error("Korisnicko ime mora imati najmanje 2 karaktera.");
        }
        if (password.length < 8) {
          throw new Error("Lozinka mora imati najmanje 8 karaktera.");
        }
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: username.trim() } },
        });
        if (error) throw error;
        if (
          data.user &&
          data.user.identities &&
          data.user.identities.length === 0
        ) {
          throw new Error(
            "Nalog sa ovim emailom vec postoji. Otvorite link iz ranijeg mejla ili se prijavite."
          );
        }
        if (data.session) {
          onClose();
          return;
        }
        setEmailSentTo(email.trim());
        setResent(false);
      } else {
        const { error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Doslo je do greske pri prijavljivanju."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Doslo je do greske pri prijavljivanju preko Google-a."
      );
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    setBusy(true);
    setResent(false);
    try {
      const { error } = await client.auth.signUp({
        email: emailSentTo ?? email.trim(),
        password,
        options: { data: { username: username.trim() } },
      });
      if (error) throw error;
      setResent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Doslo je do greske pri slanju mejla."
      );
    } finally {
      setBusy(false);
    }
  };

  if (emailSentTo) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded border border-[#d8dcc4] bg-card p-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between border-b border-[#e3e7cf] pb-3">
            <h2 className="text-base font-bold">Potvrdi email</h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-muted"
              aria-label="Zatvori"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm">
            Na adresu <span className="font-semibold">{emailSentTo}</span>{" "}
            poslali smo link za potvrdu registracije.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Otvori link iz mejla da aktiviras nalog, pa se onda prijavi.
            Poruka moze stici i u „Promocije” ili „Spam”.
          </p>

          {resent && (
            <p className="mt-3 rounded border border-[#c8d5b0] bg-[#eef2e2] px-3 py-2 text-sm text-[#3d5226]">
              Email je ponovo poslat.
            </p>
          )}
          {error && (
            <p className="mt-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2">
            <Button className="w-full" onClick={onClose}>
              U redu
            </Button>
            <button
              onClick={resend}
              disabled={busy}
              className="w-full text-center text-sm text-muted-foreground underline hover:text-foreground"
            >
              {busy ? "Salje se..." : "Nije stigao email? Posalji ponovo"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded border bg-card p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h2 className="text-base font-bold">
            {mode === "signin" ? "Prijava" : "Registracija"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Zatvori"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium">
                Korisnicko ime
              </label>
              <input
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value.slice(0, 30))
                }
                maxLength={30}
                autoComplete="username"
                className="w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Lozinka</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              className="w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
            />
          </div>

          {error && (
            <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {mode === "signup" && (
            <p className="text-xs text-muted-foreground">
              Nakon registracije na email stize link za potvrdu naloga —
              otvori ga, pa se onda prijavi. Registracijom se prikupljaju samo
              email i korisnicko ime, neophodni za koriscenje aplikacije.
            </p>
          )}

          <Button className="w-full" disabled={busy} onClick={submit}>
            {busy
              ? "Molim sacekajte..."
              : mode === "signin"
              ? "Prijavi se"
              : "Registruj se"}
          </Button>

          <div className="flex items-center gap-2 py-1" aria-hidden="true">
            <span className="h-px flex-1 bg-neutral-300" />
            <span className="text-xs text-muted-foreground">ili</span>
            <span className="h-px flex-1 bg-neutral-300" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={handleGoogle}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />
              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
            Nastavi sa Google-om
          </Button>

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="w-full text-center text-sm text-muted-foreground underline hover:text-foreground"
          >
            {mode === "signin"
              ? "Nemate nalog? Registrujte se"
              : "Imate nalog? Prijavite se"}
          </button>
        </div>
      </div>
    </div>
  );
}
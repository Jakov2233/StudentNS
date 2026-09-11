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
              Nakon registracije bicete odmah prijavljeni. Za registraciju se
              prikupljaju samo email i korisnicko ime, neophodni za koriscenje
              aplikacije.
            </p>
          )}

          <Button className="w-full" disabled={busy} onClick={submit}>
            {busy
              ? "Molim sacekajte..."
              : mode === "signin"
              ? "Prijavi se"
              : "Registruj se"}
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
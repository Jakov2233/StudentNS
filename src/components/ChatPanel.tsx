"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  deleteChatMessage,
  fetchProfileForChat,
  fetchProfilesForChat,
  fetchRecentMessages,
  sendChatMessage,
} from "@/lib/chat";
import { fetchModeratorIds } from "@/lib/moderators";
import { supabase } from "@/lib/supabase";
import type { ChatMessage, Profile } from "@/types";

interface ChatPanelProps {
  userId: string | null;
  profilesById: Record<string, Profile>;
  canModerate: boolean;
  onRequireLogin: () => void;
  onOpenProfile: (userId: string) => void;
  onClose: () => void;
}

const MAX_MESSAGE = 500;

function initialsOf(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function formatTime(value: string): string {
  try {
    return new Date(value).toLocaleTimeString("sr-RS", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ChatPanel({
  userId,
  profilesById,
  canModerate,
  onRequireLogin,
  onOpenProfile,
  onClose,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [modIds, setModIds] = useState<Set<string>>(new Set());
  const [chatProfiles, setChatProfiles] = useState<
    Record<string, { username: string; avatar_url: string | null } | null>
  >({});
  const listRef = useRef<HTMLDivElement | null>(null);
  const seenProfiles = useRef<Set<string>>(new Set());

  const client = supabase;

  useEffect(() => {
    if (!client) return;
    // Privremeno iskljuceno radi testiranja — websocket se ne otvara,
    // cet radi preko 15s pollinga u useEffect-u ispod.
    console.log("CHAT: realtime iskljucen (websocket ne radi)");
    return;
  }, [client]);

  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    fetchRecentMessages(50)
      .then((rows) => {
        if (!cancelled) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const merged = [...prev];
            for (const m of rows) {
              if (!seen.has(m.id)) merged.push(m);
            }
            return merged.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          });
        }
      })
      .catch(() => undefined);
    fetchModeratorIds()
      .then((ids) => {
        if (!cancelled) setModIds(new Set(ids));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [client]);

  useEffect(() => {
    if (!client) return;
    const timer = window.setInterval(() => {
      fetchRecentMessages(50)
        .then((rows) => {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const merged = [...prev];
            for (const m of rows) {
              if (!seen.has(m.id)) merged.push(m);
            }
            return merged.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );
          });
        })
        .catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [client]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    if (!client) return;
    const missing = [...new Set(messages.map((m) => m.user_id))].filter(
      (uid) =>
        !profilesById[uid] &&
        !(uid in chatProfiles) &&
        !seenProfiles.current.has(uid)
    );
    if (missing.length === 0) return;
    missing.forEach((uid) => seenProfiles.current.add(uid));
    fetchProfilesForChat(missing)
      .then((result) => {
        setChatProfiles((prev) => {
          const next = { ...prev };
          for (const uid of missing) {
            next[uid] = result[uid] ?? null;
          }
          return next;
        });
      })
      .catch(() => undefined);
  }, [messages, profilesById, chatProfiles, client]);

  const authorOf = (uid: string) => {
    const p = profilesById[uid] ?? chatProfiles[uid];
    return {
      username: p?.username ?? "Student",
      avatar_url: p?.avatar_url ?? null,
    };
  };

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg) return;
    if (!userId) {
      onRequireLogin();
      return;
    }
    if (!client) return;
    setError(null);
    setSending(true);
    try {
      const saved = await sendChatMessage(
        userId,
        msg.slice(0, MAX_MESSAGE)
      );
      setMessages((prev) =>
        prev.some((m) => m.id === saved.id)
          ? prev
          : [...prev, saved].sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            )
      );
      setText("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Doslo je do greske pri slanju poruke."
      );
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Obrisati ovu poruku?")) return;
    if (!client) return;
    setError(null);
    try {
      await deleteChatMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greska pri brisanju poruke."
      );
    }
  };

  if (!client) return null;

  return (
    <div className="absolute bottom-3 left-3 top-24 z-20 flex w-80 max-w-[92vw] flex-col overflow-hidden rounded border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <div>
          <h2 className="text-sm font-bold leading-tight">Global chat</h2>
          <p className="text-[11px] text-muted-foreground">
            Svi studenti aplikacije u jednoj sobi
          </p>
        </div>
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

      <div ref={listRef} className="flex-1 overflow-y-auto bg-[#fbfcf6]">
        {messages.length === 0 && (
          <p className="px-4 py-6 text-center text-sm italic text-muted-foreground">
            Jos nema poruka — budi prvi.
          </p>
        )}
        {messages.map((m) => {
          const author = authorOf(m.user_id);
          const isMod = modIds.has(m.user_id);
          return (
            <div key={m.id} className="border-b border-neutral-100 px-3 py-2">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onOpenProfile(m.user_id)}
                  className="group flex min-w-0 items-center gap-2 rounded px-1 py-0.5 hover:bg-neutral-100"
                  title="Pogledaj profil"
                >
                  {author.avatar_url ? (
                    <img
                      src={author.avatar_url}
                      alt={author.username}
                      className="h-6 w-6 shrink-0 rounded-full border border-neutral-300 object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-[#f1f3e0] text-[10px] font-bold text-[#5a6f43]">
                      {initialsOf(author.username)}
                    </span>
                  )}
                  <span className="truncate text-sm font-semibold group-hover:underline">
                    {`@${author.username}`}
                  </span>
                </button>
                {isMod && (
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#5a6f43]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                    >
                      <path d="M12 1l2.5 5.4L20 6.9l-4 3.9.9 5.7L12 13.8l-4.9 2.7.9-5.7-4-3.9 5.5-.5z" />
                    </svg>
                    mod
                  </span>
                )}
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                    {formatTime(m.created_at)}
                  </span>
                {canModerate && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    aria-label="Obrisi poruku"
                    className="shrink-0 text-xs leading-none text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="mt-1 break-words text-sm leading-snug">
                {m.message}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t p-3">
        {!userId && (
          <p className="mb-2 text-xs text-muted-foreground">
            Prijavljeni korisnici mogu da pisu.
          </p>
        )}
        {error && (
          <p className="mb-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_MESSAGE))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            maxLength={MAX_MESSAGE}
            placeholder={
              userId ? "Nesto za nekoga u gradu..." : "Prijavi se da pises..."
            }
            className="min-w-0 flex-1 rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
          />
          <Button
            size="sm"
            disabled={sending || !text.trim()}
            onClick={handleSend}
          >
            {sending ? "..." : "Posalji"}
          </Button>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { categoryLabel } from "@/lib/categories";
import { isHeicLike, isImageType, prepareImage } from "@/lib/image";
import {
  addModerator,
  banUser,
  fetchIsModerator,
  fetchModerationStatus,
  removeModerator,
  type ModerationStatus,
  unbanUser,
} from "@/lib/moderators";
import { deleteAvatar, uploadAvatar } from "@/lib/profiles";
import { reportError } from "@/lib/errorLog";
import type { Place, Profile } from "@/types";

interface ProfileModalProps {
  profile: Profile;
  isOwner: boolean;
  viewerIsModerator: boolean;
  places: Array<Pick<Place, "id" | "name" | "category">>;
  onSelectPlace: (id: string) => void;
  onSave: (fields: {
    bio: string;
    instagram: string;
    avatar_url: string | null;
  }) => Promise<Profile>;
  onClose: () => void;
}

const MAX_BIO = 300;
const MAX_INSTAGRAM = 30;

function initialsOf(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export default function ProfileModal({
  profile,
  isOwner,
  viewerIsModerator,
  places,
  onSelectPlace,
  onSave,
  onClose,
}: ProfileModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [instagram, setInstagram] = useState(profile.instagram ?? "");
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarNote, setAvatarNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const [modStatus, setModStatus] = useState<ModerationStatus | null>(null);
  const [modBusy, setModBusy] = useState(false);
  const [modError, setModError] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("Trolovanje");
  const [isProfileModerator, setIsProfileModerator] = useState(false);

  const moderating = viewerIsModerator && !isOwner;

  useEffect(() => {
    let cancelled = false;
    fetchIsModerator(profile.id)
      .then((isMod) => {
        if (!cancelled) setIsProfileModerator(isMod);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  useEffect(() => {
    if (!moderating) return;
    let cancelled = false;
    fetchModerationStatus(profile.id)
      .then((status) => {
        if (!cancelled) setModStatus(status);
      })
      .catch(() => {
        if (!cancelled) {
          setModStatus({ banned: false, reason: null, is_moderator: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [moderating, profile.id]);

  const handleBan = async () => {
    if (!modStatus) return;
    setModError(null);
    setModBusy(true);
    try {
      const reason = banReason.trim().slice(0, 200) || "Trolovanje";
      await banUser(profile.id, reason);
      setModStatus({ ...modStatus, banned: true, reason });
    } catch (err) {
      setModError(
        err instanceof Error ? err.message : "Doslo je do greske pri banovanju."
      );
    } finally {
      setModBusy(false);
    }
  };

  const handleUnban = async () => {
    if (!modStatus) return;
    setModError(null);
    setModBusy(true);
    try {
      await unbanUser(profile.id);
      setModStatus({ ...modStatus, banned: false, reason: null });
    } catch (err) {
      setModError(
        err instanceof Error ? err.message : "Doslo je do greske pri skidanju bana."
      );
    } finally {
      setModBusy(false);
    }
  };

  const handleToggleModerator = async () => {
    if (!modStatus) return;
    setModError(null);
    setModBusy(true);
    try {
      if (modStatus.is_moderator) {
        await removeModerator(profile.id);
      } else {
        await addModerator(profile.id);
      }
      setModStatus({
        ...modStatus,
        is_moderator: !modStatus.is_moderator,
      });
    } catch (err) {
      setModError(
        err instanceof Error
          ? err.message
          : "Doslo je do greske pri promeni moderatora."
      );
    } finally {
      setModBusy(false);
    }
  };

  const displayedAvatar =
    pendingAvatarUrl ?? (removeAvatar ? null : profile.avatar_url);

  const canSave = bio.trim().length <= MAX_BIO && !avatarBusy;

  const startEdit = () => {
    setBio(profile.bio ?? "");
    setInstagram(profile.instagram ?? "");
    setError(null);
    setEditMode(true);
  };

  const closeEdit = () => {
    setEditMode(false);
    setError(null);
  };

  const handleAvatarFile = async (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!isImageType(file.type)) {
      setError("Dozvoljene su samo slike (JPG, PNG, WEBP, HEIC).");
      return;
    }
    setAvatarBusy(true);
    try {
      const ready =
        isHeicLike(file.type) || file.size >= 512 * 1024
          ? await prepareImage(file, { maxDim: 512, square: true })
          : file;
      setPendingAvatar(ready);
      setPendingAvatarUrl(URL.createObjectURL(ready));
      setRemoveAvatar(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ne mogu da obradim sliku."
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const handleRemoveAvatar = () => {
    setPendingAvatar(null);
    if (pendingAvatarUrl) {
      URL.revokeObjectURL(pendingAvatarUrl);
    }
    setPendingAvatarUrl(null);
    setRemoveAvatar(true);
  };

  const handleSave = async () => {
    const insta = instagram.trim();
    if (insta && !/^[A-Za-z0-9._]{1,30}$/.test(insta)) {
      setError(
        "Instagram nalog moze da ima samo slova, brojeve, tacku i donju crtu."
      );
      return;
    }
    setError(null);
    setAvatarNote(null);
    setBusy(true);
    try {
      const oldAvatarUrl = profile.avatar_url;
      let avatarUrl: string | null = null;
      if (pendingAvatar) {
        try {
          avatarUrl = await uploadAvatar(pendingAvatar, profile.id);
        } catch (err) {
          avatarUrl = profile.avatar_url;
          const msg =
            err instanceof Error
              ? err.message
              : "Nepoznata greska pri snimanju slike.";
          setAvatarNote(`Profilna slika nije sačuvana: ${msg}`);
          reportError("ProfileModal.uploadAvatar", err);
        }
      } else if (!removeAvatar) {
        avatarUrl = profile.avatar_url;
      }
      await onSave({
        bio: bio.trim().slice(0, MAX_BIO),
        instagram: insta,
        avatar_url: avatarUrl,
      });
      if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
        try {
          await deleteAvatar(oldAvatarUrl);
        } catch {
          // stara slika moze da ostane; nije blokirajuce
        }
      }
      setEditMode(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Doslo je do greske pri cuvanju."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded border bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-bold">
            {editMode ? "Izmeni profil" : "Profil korisnika"}
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

        {!editMode ? (
          <div className="max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-3 px-4 py-4">
              {displayedAvatar ? (
                <img
                  src={displayedAvatar}
                  alt={profile.username}
                  className="h-20 w-20 shrink-0 rounded-full border border-neutral-300 object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-[#f1f3e0] text-2xl font-bold text-[#5a6f43]">
                  {initialsOf(profile.username)}
                </div>
              )}
              <div>
                <p className="text-lg font-bold leading-tight">
                  {profile.username}
                </p>
                {isProfileModerator ? (
                  <p className="flex items-center gap-1 text-xs font-semibold text-[#5a6f43]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                    >
                      <path d="M12 1l2.5 5.4L20 6.9l-4 3.9.9 5.7L12 13.8l-4.9 2.7.9-5.7-4-3.9 5.5-.5z" />
                    </svg>
                    Moderator
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Korisnik aplikacije StudentNS
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3 px-4 pb-4">
              {profile.bio ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {profile.bio}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Nema biografije jos.
                </p>
              )}

              {profile.instagram ? (
                <a
                  href={`https://www.instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7d4f9e] hover:underline"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  @{profile.instagram}
                </a>
              ) : (
                <p className="text-xs italic text-muted-foreground">
                  Nije povezao/la Instagram.
                </p>
              )}

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Mesta koja je dodao/la ({places.length})
                </p>
                {places.length === 0 ? (
                  <p className="text-sm italic text-muted-foreground">
                    Jos nije dodao/la nijedno mesto.
                  </p>
                ) : (
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {places.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => onSelectPlace(place.id)}
                        className="w-full rounded border border-neutral-300 bg-background p-2 text-left hover:bg-muted"
                      >
                        <span className="block text-sm font-medium leading-snug">
                          {place.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {categoryLabel(place.category)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

{moderating && modStatus && (
                <div className="rounded border border-[#d8dcc4] bg-[#f6f7ec] p-3">
                  <p className="mb-2 text-xs font-semibold text-[#5a6f43]">
                    Moderacija
                  </p>
                  {modStatus.banned ? (
                    <div className="space-y-2">
                      <p className="text-xs text-red-800">
                        Profil je banovan
                        {modStatus.reason
                          ? ` — razlog: „${modStatus.reason}”`
                          : ""}
                        .
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={modBusy}
                        onClick={handleUnban}
                      >
                        {modBusy ? "Cekaj..." : "Skloni ban"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        value={banReason}
                        onChange={(e) => setBanReason(e.target.value.slice(0, 200))}
                        maxLength={200}
                        placeholder="Razlog (npr. „Trolovanje”)"
                        className="w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        disabled={modBusy || !banReason.trim()}
                        onClick={handleBan}
                      >
                        {modBusy ? "Cekaj..." : "Banuj profil"}
                      </Button>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    disabled={modBusy}
                    onClick={handleToggleModerator}
                  >
                    {modStatus.is_moderator
                      ? "Ukloni sa liste moderatora"
                      : "Postavi za moderatora"}
                  </Button>
                  {modError && (
                    <p className="mt-2 text-xs text-red-700">{modError}</p>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {isOwner && (
                  <Button variant="secondary" className="flex-1" onClick={startEdit}>
                    Izmeni profil
                  </Button>
                )}
                <Button variant={isOwner ? "outline" : "default"} className="flex-1" onClick={onClose}>
                  Zatvori
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto space-y-4 px-4 py-4">
            <div className="flex items-center gap-3">
              {pendingAvatarUrl ?? (removeAvatar ? null : profile.avatar_url) ? (
                <img
                  src={pendingAvatarUrl ?? profile.avatar_url ?? undefined}
                  alt="Profilna slika"
                  className="h-16 w-16 shrink-0 rounded-full border border-neutral-300 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-[#f1f3e0] text-xl font-bold text-[#5a6f43]">
                  {initialsOf(profile.username)}
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Ništa od ovoga nije obavezno.
                </p>
                {avatarNote && (
                  <p className="text-xs font-medium text-amber-800">
                    {avatarNote}
                  </p>
                )}
                <label className="block cursor-pointer text-sm font-medium text-[#5a6f43] hover:underline">
                  {avatarBusy
                    ? "Obradjujem sliku..."
                    : displayedAvatar
                    ? "Promeni profilnu sliku"
                    : "Dodaj profilnu sliku"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                    className="hidden"
                    onChange={(e) =>
                      handleAvatarFile(e.target.files?.[0] ?? null)
                    }
                  />
                </label>
                {(displayedAvatar || (profile.avatar_url && !removeAvatar)) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarBusy}
                    className="block text-xs font-medium text-red-700 hover:underline"
                  >
                    Ukloni profilnu sliku
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Biografija</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
                maxLength={MAX_BIO}
                rows={4}
                placeholder="Nesto o sebi, sta studiras, sta volis..."
                className="w-full rounded border bg-background px-3 py-2 text-sm outline-none focus:border-neutral-600"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {bio.length}/{MAX_BIO}
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Instagram (opciono)
              </label>
              <div className="flex items-center rounded border bg-background focus-within:border-neutral-600">
                <span className="px-2 text-sm text-muted-foreground">@</span>
                <input
                  value={instagram}
                  onChange={(e) =>
                    setInstagram(
                      e.target.value
                        .replace(/^@+/, "")
                        .replace(/[^A-Za-z0-9._]/g, "")
                        .slice(0, MAX_INSTAGRAM)
                    )
                  }
                  maxLength={MAX_INSTAGRAM}
                  placeholder="korisnicko_ime"
                  className="w-full px-2 py-2 pr-3 text-sm outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Link ka profilu ce biti vidljiv svima.
              </p>
            </div>

            {error && (
              <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeEdit}
                disabled={busy}
              >
                Otkazi
              </Button>
              <Button
                className="flex-1"
                disabled={!canSave || busy}
                onClick={handleSave}
              >
                {busy ? "Cuvanje..." : "Sacuvaj profil"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { Button } from "@/components/ui/button";

interface HeaderProps {
  onAddPlace: () => void;
  onOpenStarterPack: () => void;
  onOpenChat: () => void;
  isPickingLocation: boolean;
  onCancelPick: () => void;
  showAuth: boolean;
  isAuthed: boolean;
  userName: string | null;
  onLogin: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export default function Header({
  onAddPlace,
  onOpenStarterPack,
  onOpenChat,
  isPickingLocation,
  onCancelPick,
  showAuth,
  isAuthed,
  userName,
  onLogin,
  onOpenProfile,
  onLogout,
}: HeaderProps) {
  return (
    <header className="z-20 relative flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b bg-card px-3 py-2 shadow-sm sm:px-4 sm:py-2.5">
      <span
        className="absolute inset-x-0 top-0 h-1 bg-[#5a6f43]"
        aria-hidden="true"
      />
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-4 w-4 shrink-0 rounded-[3px] bg-[#5a6f43]"
          aria-hidden="true"
        />
        <div>
          <h1 className="text-base font-bold leading-tight sm:text-lg">StudentNS</h1>
          <p className="hidden text-xs text-muted-foreground min-[420px]:block">
            Studentski vodič kroz Novi Sad
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1.5 sm:gap-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenStarterPack}
        >
          Starter Pack
        </Button>

        <Button variant="outline" size="sm" onClick={onOpenChat}>
          Ćaskanje
        </Button>

        {showAuth &&
          (isAuthed ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenProfile}
                title={userName ?? undefined}
              >
                Moj profil
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                Odjavi se
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={onLogin}>
              Prijavi se
            </Button>
          ))}

        {isPickingLocation ? (
          <Button variant="destructive" size="sm" onClick={onCancelPick}>
            Odustani
          </Button>
        ) : (
          <Button size="sm" onClick={onAddPlace}>
            + Dodaj mesto
          </Button>
        )}
      </div>
    </header>
  );
}
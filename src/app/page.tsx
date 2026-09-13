"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { User } from "@supabase/supabase-js";

import AddPlaceModal from "@/components/AddPlaceModal";
import AuthModal from "@/components/AuthModal";
import ChatPanel from "@/components/ChatPanel";
import Header from "@/components/Header";
import PlaceCard from "@/components/PlaceCard";
import PlaceMap from "@/components/PlaceMap";
import ProfileModal from "@/components/ProfileModal";
import ReviewModal from "@/components/ReviewModal";
import Sidebar from "@/components/Sidebar";
import StarterPack from "@/components/StarterPack";
import { inNoviSad } from "@/lib/categories";
import {
  fetchPlaces,
  insertPlace,
  uploadPlaceImage,
  deletePlace,
  deletePlacePhoto,
} from "@/lib/places";
import { fetchProfiles, fetchProfileById, updateProfile } from "@/lib/profiles";
import { addFavorite, fetchFavorites, removeFavorite } from "@/lib/favorites";
import { checkModerator } from "@/lib/moderators";
import { deleteReview, fetchReviews, upsertReview } from "@/lib/reviews";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type {
  Category,
  NewPlaceData,
  NewReviewData,
  Place,
  Profile,
  Review,
} from "@/types";

const INITIAL_PLACES: Place[] = [
  {
    id: "dom-slobodan-bajic",
    name: "Studentski dom „Slobodan Bajić”",
    description:
      "Najveći studentski dom u Novom Sadu, na Limanu I. Čitaonica, biblioteka i računarska učionica.",
    category: "korisne-lokacije",
    lat: 45.2451283,
    lng: 19.8497323,
    address: "Dr Sime Miloševića 10",
    created_at: new Date().toISOString(),
  },
  {
    id: "dom-veljko-vlahovic",
    name: "Studentski dom „Veljko Vlahović”",
    description:
      "Studentski dom na Limanu I, pored doma Slobodan Bajić. Kapacitet 340 mesta.",
    category: "korisne-lokacije",
    lat: 45.2455779,
    lng: 19.848505,
    address: "Dr Sime Miloševića 8",
    created_at: new Date().toISOString(),
  },
  {
    id: "dom-zivojin-culum",
    name: "Studentski dom „Prof. Živojin Ćulum”",
    description:
      "Dom I kategorije na Limanu, sa čitaonicama, bibliotekom, ateljeom i teretanom.",
    category: "korisne-lokacije",
    lat: 45.236384,
    lng: 19.8408789,
    address: "Bulevar despota Stefana 5a",
    created_at: new Date().toISOString(),
  },
  {
    id: "dom-car-lazar",
    name: "Studentski dom „Car Lazar”",
    description:
      "Dom I kategorije na Limanu, sa više čitaonica i sala za učenje.",
    category: "korisne-lokacije",
    lat: 45.2361491,
    lng: 19.8388829,
    address: "Bulevar despota Stefana 7",
    created_at: new Date().toISOString(),
  },
  {
    id: "dom-nikola-tesla",
    name: "Studentski dom „Nikola Tesla”",
    description:
      "Najmlađi dom u Novom Sadu, komforne dvokrevetne sobe i čitaonice.",
    category: "korisne-lokacije",
    lat: 45.2356936,
    lng: 19.8387435,
    address: "Bulevar despota Stefana 7a",
    created_at: new Date().toISOString(),
  },
  {
    id: "dom-sajmiste",
    name: "Studentski dom „Sajmište”",
    description:
      "Dom I kategorije blizu Sajma i centra, sa prostorijama za učenje.",
    category: "korisne-lokacije",
    lat: 45.2567363,
    lng: 19.8267847,
    address: "Slobodana Bajića 17",
    created_at: new Date().toISOString(),
  },
  {
    id: "dom-23-oktobar",
    name: "Studentski dom „23. oktobar”",
    description:
      "Studentski dom na Grbavici, u ulici Danila Kiša.",
    category: "korisne-lokacije",
    lat: 45.2465129,
    lng: 19.8368574,
    address: "Danila Kiša 29",
    created_at: new Date().toISOString(),
  },
  {
    id: "dom-fejes-klara",
    name: "Studentski dom „Feješ Klara”",
    description:
      "Dom I kategorije na Grbavici, blizu Futoškog parka.",
    category: "korisne-lokacije",
    lat: 45.2450966,
    lng: 19.83581,
    address: "Alekse Šantića 4",
    created_at: new Date().toISOString(),
  },
  {
    id: "ftn",
    name: "Fakultet tehničkih nauka",
    description:
      "Najveći fakultet u Novom Sadu sa preko 20.000 studenata. Kampus sa menzom, bibliotekom i brojnim katedrama.",
    category: "fakulteti-obrazovanje",
    lat: 45.2461924,
    lng: 19.8513954,
    address: "Trg Dositeja Obradovića 6",
    created_at: new Date().toISOString(),
  },
  {
    id: "prirodno-mat",
    name: "Prirodno-matematički fakultet",
    description:
      "PMF u Novom Sadu. Prirodne nauke, matematika i informatika.",
    category: "fakulteti-obrazovanje",
    lat: 45.2454429,
    lng: 19.8529296,
    address: "Trg Dositeja Obradovića 3",
    created_at: new Date().toISOString(),
  },
  {
    id: "poljoprivredni",
    name: "Poljoprivredni fakultet",
    description:
      "Poljoprivredni fakultet na kampusu Univerziteta u Novom Sadu.",
    category: "fakulteti-obrazovanje",
    lat: 45.2474278,
    lng: 19.8507397,
    address: "Trg Dositeja Obradovića 8",
    created_at: new Date().toISOString(),
  },
  {
    id: "medicinski",
    name: "Medicinski fakultet",
    description:
      "Medicinski fakultet Univerziteta u Novom Sadu.",
    category: "fakulteti-obrazovanje",
    lat: 45.2529483,
    lng: 19.8237382,
    address: "Hajduk Veljkova 3",
    created_at: new Date().toISOString(),
  },
  {
    id: "tehnoloski",
    name: "Tehnološki fakultet",
    description:
      "Tehnološki fakultet Novi Sad, na početku Bulevara cara Lazara.",
    category: "fakulteti-obrazovanje",
    lat: 45.2477463,
    lng: 19.8507782,
    address: "Bulevar cara Lazara 1",
    created_at: new Date().toISOString(),
  },
  {
    id: "filozofski",
    name: "Filozofski fakultet",
    description:
      "Filozofski fakultet - društvene i humanističke nauke.",
    category: "fakulteti-obrazovanje",
    lat: 45.2465958,
    lng: 19.8534911,
    address: "Dr Zorana Đinđića 2",
    created_at: new Date().toISOString(),
  },
  {
    id: "pravni",
    name: "Pravni fakultet",
    description:
      "Pravni fakultet na Trgu Dositeja Obradovića.",
    category: "fakulteti-obrazovanje",
    lat: 45.2464098,
    lng: 19.8529159,
    address: "Trg Dositeja Obradovića 1",
    created_at: new Date().toISOString(),
  },
  {
    id: "fsfv",
    name: "Fakultet sporta i fizičkog vaspitanja",
    description:
      "Fakultet sporta i fizičkog vaspitanja na Bulevaru cara Lazara.",
    category: "fakulteti-obrazovanje",
    lat: 45.2472222,
    lng: 19.8478376,
    address: "Bulevar cara Lazara 50",
    created_at: new Date().toISOString(),
  },
  {
    id: "akademija-umetnosti",
    name: "Akademija umetnosti",
    description:
      "Akademija umetnosti u samom centru, u Đure Jakšića.",
    category: "fakulteti-obrazovanje",
    lat: 45.2586565,
    lng: 19.843779,
    address: "Đure Jakšića 5",
    created_at: new Date().toISOString(),
  },
  {
    id: "biblioteka-matice-srpske",
    name: "Biblioteka Matice srpske",
    description:
      "Najstarija i najbogatija srpska biblioteka, u centru grada.",
    category: "mesta-za-ucenje",
    lat: 45.2595333,
    lng: 19.8455843,
    address: "Matice srpske 1",
    created_at: new Date().toISOString(),
  },
  {
    id: "gradska-biblioteka",
    name: "Gradska biblioteka Novi Sad",
    description:
      "Čitaonica i biblioteka na Dunavskoj, u samom centru. Tiho mesto za učenje.",
    category: "mesta-za-ucenje",
    lat: 45.25689,
    lng: 19.8484335,
    address: "Dunavska 1",
    created_at: new Date().toISOString(),
  },
  {
    id: "univerzitetska-biblioteka",
    name: "Univerzitetska biblioteka „Svetozar Marković”",
    description:
      "Centralna biblioteka Univerziteta u Novom Sadu, otvorena za sve studente.",
    category: "mesta-za-ucenje",
    lat: 45.2468124,
    lng: 19.8501227,
    address: "Bulevar cara Lazara 3",
    created_at: new Date().toISOString(),
  },
  {
    id: "zs-petrovaradin",
    name: "Železnička stanica Petrovaradin",
    description:
      "Železnička stanica na petrovaradinskoj strani Dunava.",
    category: "prevoz",
    lat: 45.2389298,
    lng: 19.8857511,
    address: "Petrovaradin",
    created_at: new Date().toISOString(),
  },
];

export default function Home() {
  const [places, setPlaces] = useState<Place[]>(INITIAL_PLACES);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStarterPack, setShowStarterPack] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [pickWarning, setPickWarning] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const [profileViewId, setProfileViewId] = useState<string | null>(null);
  const [reviewsByPlace, setReviewsByPlace] = useState<
    Record<string, Review[]>
  >({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [viewerIsModerator, setViewerIsModerator] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const mapRef = useRef<MapRef | null>(null);

  const handleLocate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocateError("Geolokacija nije podrzana u ovom pregledacu.");
      return;
    }
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        mapRef.current?.flyTo({
          center: [lng, lat],
          zoom: Math.max(mapRef.current.getZoom(), 15),
          duration: 1200,
        });
      },
      (err) => {
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? "Dozvoli pristup lokaciji u pregledacu da bi se video na mapi."
            : "Nije moguce odrediti poziciju. Pokusaj ponovo."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      const rows = await fetchProfiles();
      setProfilesById(Object.fromEntries(rows.map((p) => [p.id, p])));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;
    fetchPlaces()
      .then((rows) => {
        if (!cancelled && rows.length > 0) setPlaces(rows);
      })
      .catch(() => undefined);

    fetchProfiles()
      .then((rows) => {
        setProfilesById(Object.fromEntries(rows.map((p) => [p.id, p])));
      })
      .catch(() => undefined);

    fetchReviews()
      .then((rows) => {
        const grouped: Record<string, Review[]> = {};
        for (const r of rows) {
          (grouped[r.place_id] ??= []).push(r);
        }
        setReviewsByPlace(grouped);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [loadProfiles]);

  useEffect(() => {
    if (!supabase) return;

    const loadFavorites = () => {
      fetchFavorites()
        .then((ids) => setFavoriteIds(new Set(ids)))
        .catch(() => undefined);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadFavorites();
        checkModerator(session.user.id).then(setViewerIsModerator);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        loadProfiles();
        if (session?.user) {
          loadFavorites();
          checkModerator(session.user.id).then(setViewerIsModerator);
        } else {
          setFavoriteIds(new Set());
          setViewerIsModerator(false);
        }
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [loadProfiles]);

  const selectedPlace =
    places.find((p) => p.id === selectedPlaceId) ?? null;

  const profileForView = profileViewId
    ? profilesById[profileViewId] ?? null
    : null;

  const userName =
    typeof user?.user_metadata?.username === "string"
      ? user.user_metadata.username
      : (user?.email ?? null);

  const openAddPlace = () => {
    if (isSupabaseConfigured && !user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedPlaceId(null);
    setPickedLocation(null);
    setPickWarning(null);
    setPickingLocation(true);
  };

  const handlePickLocation = useCallback((lat: number, lng: number) => {
    if (!inNoviSad(lat, lng)) {
      setPickWarning("Odaberi lokaciju unutar Novog Sada.");
      return;
    }
    setPickWarning(null);
    setPickedLocation({ lat, lng });
  }, []);

  const handleCancelPick = () => {
    setPickingLocation(false);
    setPickedLocation(null);
    setPickWarning(null);
    setShowAddModal(false);
  };

  const handleSavePlace = async (data: NewPlaceData) => {
    if (isSupabaseConfigured && supabase) {
      if (!user) {
        throw new Error("Morate biti prijavljeni da biste dodali mesto.");
      }

      let imageUrl: string | null = null;
      if (data.image) {
        imageUrl = await uploadPlaceImage(data.image, user.id);
      }

      let saved: Place;
      try {
        saved = await insertPlace(data, user.id, imageUrl);
      } catch (err) {
        if (imageUrl) {
          try {
            await deletePlacePhoto(imageUrl);
          } catch {
            // fotografija moze da ostane; ne blokira korisnika
          }
        }
        throw err;
      }
      setPlaces((prev) => [saved, ...prev]);
      setSelectedPlaceId(saved.id);
    } else {
      const newPlace: Place = {
        id: `place-${Date.now()}`,
        name: data.name,
        description: data.description || null,
        category: data.category,
        lat: data.lat,
        lng: data.lng,
        address: data.address || null,
        created_at: new Date().toISOString(),
        price_level: data.price_level,
        has_wifi: data.has_wifi,
        has_outlets: data.has_outlets,
        noise_level: data.noise_level,
        crowded: data.crowded,
      };

      setPlaces((prev) => [newPlace, ...prev]);
      setSelectedPlaceId(newPlace.id);
    }

    setShowAddModal(false);
    setPickedLocation(null);
    setPickingLocation(false);
    setPickWarning(null);
  };

  const handleSelectPlace = (id: string) => {
    setReviewOpen(false);
    setSelectedPlaceId(id);
    const place = places.find((p) => p.id === id);
    if (place) {
      mapRef.current?.flyTo({
        center: [place.lng, place.lat],
        zoom: Math.max(mapRef.current.getZoom(), 15),
        duration: 600,
      });
    }
  };

  const handleOpenProfile = useCallback(
    (userId: string) => {
      setProfileViewId(userId);
      if (!profilesById[userId]) {
        fetchProfileById(userId)
          .then((p) => {
            if (p) {
              setProfilesById((prev) => ({ ...prev, [p.id]: p }));
            }
          })
          .catch(() => undefined);
      }
    },
    [profilesById]
  );

  const handleLogout = async () => {
    await supabase?.auth.signOut();
  };

  const handleUpdateProfile = async (fields: {
    bio: string;
    instagram: string;
    avatar_url: string | null;
  }) => {
    if (!user) throw new Error("Morate biti prijavljeni.");
    const updated = await updateProfile(user.id, fields);
    setProfilesById((prev) => ({ ...prev, [updated.id]: updated }));
    return updated;
  };

  const handleSaveReview = async (data: NewReviewData) => {
    if (!user) throw new Error("Morate biti prijavljeni.");
    const saved = await upsertReview(user.id, data);
    setReviewsByPlace((prev) => {
      const list = (prev[data.place_id] ?? []).filter((r) => r.id !== saved.id);
      return { ...prev, [data.place_id]: [saved, ...list] };
    });
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user && !viewerIsModerator) throw new Error("Morate biti prijavljeni.");
    await deleteReview(reviewId);
    setReviewsByPlace((prev) => {
      const next: Record<string, Review[]> = {};
      for (const [placeId, list] of Object.entries(prev)) {
        next[placeId] = list.filter((r) => r.id !== reviewId);
      }
      return next;
    });
  };

  const handleDeletePlace = async (placeId: string) => {
    const place = places.find((p) => p.id === placeId);
    await deletePlace(placeId, place?.image_url);
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    setReviewsByPlace((prev) => {
      const next = { ...prev };
      delete next[placeId];
      return next;
    });
    setSelectedPlaceId(null);
  };

  const handleToggleFavorite = async (placeId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      if (favoriteIds.has(placeId)) {
        await removeFavorite(user.id, placeId);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(placeId);
          return next;
        });
      } else {
        await addFavorite(user.id, placeId);
        setFavoriteIds((prev) => new Set(prev).add(placeId));
      }
    } catch {
      // greska se ignorise tihano kod novog studenta
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Header
        onAddPlace={openAddPlace}
        onOpenStarterPack={() => setShowStarterPack(true)}
        onOpenChat={() => setChatOpen(true)}
        isPickingLocation={pickingLocation}
        onCancelPick={handleCancelPick}
        showAuth={isSupabaseConfigured}
        isAuthed={user !== null}
        userName={userName}
        onLogin={() => setShowAuthModal(true)}
        onOpenProfile={() => {
          if (user) setProfileViewId(user.id);
        }}
        onLogout={handleLogout}
      />

      <main className="relative flex-1 overflow-hidden">
        {sidebarOpen && (
          <Sidebar
            places={places}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={handleSelectPlace}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-3 top-3 z-10 rounded border bg-card px-3 py-2 text-sm font-medium shadow-sm hover:bg-neutral-50"
          >
            Lista mesta
          </button>
        )}

        <PlaceMap
          places={places}
          profilesById={profilesById}
          favoriteIds={favoriteIds}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={(place) =>
            setSelectedPlaceId(place ? place.id : null)
          }
          pickingLocation={pickingLocation}
          pickedLocation={pickedLocation}
          pickWarning={pickWarning}
          onPickLocation={handlePickLocation}
          mapRef={mapRef}
          userLocation={userLocation}
          locateError={locateError}
          onLocate={handleLocate}
        />

        {selectedPlace && !pickingLocation && (
          <PlaceCard
            place={selectedPlace}
            userLocation={userLocation}
            author={
              selectedPlace.created_by
                ? profilesById[selectedPlace.created_by] ?? null
                : null
            }
            reviews={reviewsByPlace[selectedPlace.id] ?? []}
            isFavorite={favoriteIds.has(selectedPlace.id)}
            canModerate={viewerIsModerator}
            onToggleFavorite={() => handleToggleFavorite(selectedPlace.id)}
            onOpenReviews={() => setReviewOpen(true)}
            onOpenProfile={(userId) => setProfileViewId(userId)}
            onDeletePlace={
              viewerIsModerator
                ? () => handleDeletePlace(selectedPlace.id)
                : null
            }
            onClose={() => setSelectedPlaceId(null)}
          />
        )}

        {selectedPlace && reviewOpen && (
          <ReviewModal
            place={selectedPlace}
            reviews={reviewsByPlace[selectedPlace.id] ?? []}
            profilesById={profilesById}
            isAuthed={user !== null}
            userId={user?.id ?? null}
            canModerate={viewerIsModerator}
            onSave={handleSaveReview}
            onDelete={handleDeleteReview}
            onClose={() => setReviewOpen(false)}
          />
        )}

        {pickingLocation && pickedLocation && !showAddModal && (
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 max-w-[90vw] flex-wrap items-center justify-center gap-2 rounded border bg-card px-3 py-2 shadow-sm">
            <span className="font-mono text-[11px] text-muted-foreground">
              {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
            </span>
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Dalje: opis i slika
            </button>
            <button
              onClick={handleCancelPick}
              className="rounded border border-neutral-300 bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
            >
              Ponisti
            </button>
          </div>
        )}

        {showAddModal && pickedLocation && (
          <AddPlaceModal
            pickedLocation={pickedLocation}
            onClose={() => setShowAddModal(false)}
            onSave={handleSavePlace}
          />
        )}

        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}

        {profileForView && (
          <ProfileModal
            key={profileForView.id}
            profile={profileForView}
            isOwner={user?.id === profileForView.id}
            viewerIsModerator={viewerIsModerator}
            places={places.filter(
              (p) => p.created_by === profileForView.id
            )}
            onSelectPlace={(id) => {
              setProfileViewId(null);
              handleSelectPlace(id);
            }}
            onSave={handleUpdateProfile}
            onClose={() => setProfileViewId(null)}
          />
        )}

        {showStarterPack && (
          <StarterPack
            places={places}
            onClose={() => setShowStarterPack(false)}
            onSelectPlace={handleSelectPlace}
          />
        )}

        {chatOpen && (
          <ChatPanel
            userId={user?.id ?? null}
            profilesById={profilesById}
            canModerate={viewerIsModerator}
            onRequireLogin={() => setShowAuthModal(true)}
            onOpenProfile={(uid) => {
              setChatOpen(false);
              handleOpenProfile(uid);
            }}
            onClose={() => setChatOpen(false)}
          />
        )}
      </main>

      <footer className="flex items-center justify-center gap-4 border-t bg-background px-4 py-1.5 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:underline">
          Privatnost
        </Link>
        <Link href="/terms" className="hover:underline">
          Uslovi korišćenja
        </Link>
        <Link href="/cookies" className="hover:underline">
          Politika kolačića
        </Link>
      </footer>
    </div>
  );
}
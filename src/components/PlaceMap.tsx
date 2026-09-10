"use client";

import { useMemo, useState } from "react";
import Map, {
  Marker,
  NavigationControl,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";

import { CATEGORY_COLORS, NOVI_SAD_CENTER, categoryShort } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { Place, Profile } from "@/types";

const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  name: "OpenStreetMap standard",
  sources: {
    basemap: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "basemap",
      type: "raster",
      source: "basemap",
    },
  ],
};

interface PlaceMapProps {
  places: Place[];
  profilesById?: Record<string, Profile>;
  favoriteIds?: Set<string>;
  selectedPlaceId: string | null;
  onSelectPlace: (place: Place | null) => void;
  pickingLocation: boolean;
  pickedLocation: { lat: number; lng: number } | null;
  pickWarning: string | null;
  onPickLocation: (lat: number, lng: number) => void;
  mapRef?: React.RefObject<MapRef | null>;
  userLocation: { lat: number; lng: number } | null;
  locateError: string | null;
  onLocate: () => void;
}

export default function PlaceMap({
  places,
  profilesById,
  favoriteIds,
  selectedPlaceId,
  onSelectPlace,
  pickingLocation,
  pickedLocation,
  pickWarning,
  onPickLocation,
  mapRef,
  userLocation,
  locateError,
  onLocate,
}: PlaceMapProps) {
  const [zoom, setZoom] = useState(13);
  const labelOpacity = Math.min(1, Math.max(0, (zoom - 13.5) / 2));

  const starBadge = (
    <span className="absolute -right-1.5 -top-1.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#b8860b] shadow-sm">
      <svg
        width="8"
        height="8"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-white"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </span>
  );

  const markers = useMemo(
    () =>
      places.map((place) => {
        const color = CATEGORY_COLORS[place.category] ?? "#3d3d3d";
        const isSelected = place.id === selectedPlaceId;
        const isStudy = place.category === "mesta-za-ucenje";
        const isUserAdded = place.created_by != null;
        const isFavorite = favoriteIds?.has(place.id) ?? false;
        const author = isUserAdded
          ? profilesById?.[place.created_by as string] ?? null
          : null;
        return (
          <Marker
            key={place.id}
            longitude={place.lng}
            latitude={place.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onSelectPlace(place);
            }}
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "mb-0.5 max-w-[160px] rounded-sm border bg-white/95 px-1 py-[2px] text-center shadow-sm",
                  isSelected ? "border-neutral-900" : "border-neutral-300",
                  isStudy && "border-emerald-800",
                  isUserAdded && "border-orange-500"
                )}
                style={{ opacity: labelOpacity }}
              >
                <div
                  className={cn(
                    "max-w-[148px] truncate text-[10px] leading-none text-neutral-900",
                    isStudy && "font-bold"
                  )}
                >
                  {place.name}
                </div>
                <div
                  className={cn(
                    "mt-[2px] flex items-center justify-center gap-0.5 text-[9px] leading-none",
                    isStudy
                      ? "font-semibold text-emerald-800"
                      : "font-medium text-neutral-600"
                  )}
                >
                  {isUserAdded && (
                    <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                  )}
                  {categoryShort(place.category)}
                </div>
              </div>
              {isUserAdded ? (
                author?.avatar_url ? (
                  <div className="relative">
                    <img
                      src={author.avatar_url}
                      alt={author.username}
                      title={place.name}
                      className={cn(
                        "h-7 w-7 rounded-full border-2 object-cover shadow-sm",
                        isSelected ? "border-neutral-900" : "border-orange-500"
                      )}
                    />
                    {isFavorite && starBadge}
                  </div>
                ) : (
                  <div className="relative">
                    <span
                      title={place.name}
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border-2 bg-orange-100 text-[11px] font-bold text-orange-800 shadow-sm",
                        isSelected ? "border-neutral-900" : "border-orange-500"
                      )}
                    >
                      {author?.username.slice(0, 2).toUpperCase() ?? "U"}
                    </span>
                    {isFavorite && starBadge}
                  </div>
                )
              ) : (
                <div className="relative">
                  <div
                    className={cn(
                      "rounded-full border-2",
                      isSelected
                        ? "border-neutral-900"
                        : isFavorite
                          ? "border-[#b8860b]"
                          : "border-white",
                      isFavorite
                        ? "h-[16px] w-[16px] ring-1 ring-[#b8860b]/70"
                        : isStudy
                          ? "h-[18px] w-[18px] ring-2 ring-amber-500"
                          : "h-[14px] w-[14px]"
                    )}
                    style={{ backgroundColor: color }}
                    title={place.name}
                  />
                  {isFavorite && starBadge}
                </div>
              )}
            </div>
          </Marker>
        );
      }),
    [places, selectedPlaceId, onSelectPlace, profilesById, favoriteIds, labelOpacity]
  );

  const handleClick = (e: MapLayerMouseEvent) => {
    if (!pickingLocation) return;
    onPickLocation(e.lngLat.lat, e.lngLat.lng);
  };

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: NOVI_SAD_CENTER[0],
          latitude: NOVI_SAD_CENTER[1],
          zoom: 13,
        }}
        mapStyle={BASEMAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        onClick={handleClick}
        cursor={pickingLocation ? "crosshair" : "grab"}
        onZoom={(e) => setZoom(e.viewState.zoom)}
      >
        <NavigationControl position="bottom-right" />
        {!pickingLocation && markers}
        {pickingLocation && pickedLocation && (
          <Marker
            longitude={pickedLocation.lng}
            latitude={pickedLocation.lat}
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="mb-0.5 whitespace-nowrap rounded-sm border border-neutral-900 bg-white px-1.5 py-0.5 text-[10px] font-bold leading-tight text-neutral-900 shadow-sm">
                ODABRANO
              </div>
              <div className="h-6 w-6 rounded-full border-[3px] border-white bg-red-600 shadow-sm" />
            </div>
          </Marker>
        )}
        {userLocation && (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="center"
          >
            <div className="flex flex-col items-center">
              <div className="h-4 w-4 rounded-full border-[3px] border-white bg-blue-600 shadow-sm" />
              <div className="mt-0.5 whitespace-nowrap rounded-sm border border-neutral-300 bg-white/95 px-1 text-[9px] font-bold leading-tight text-blue-700">
                TI
              </div>
            </div>
          </Marker>
        )}
      </Map>
      {pickWarning && (
        <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 max-w-[85vw] rounded-sm border border-red-300 bg-red-50 px-4 py-2 text-center text-sm text-red-800 shadow-sm">
          {pickWarning}
        </div>
      )}
      {!pickWarning && pickingLocation && (
        <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 max-w-[85vw] rounded-sm border border-[#d8dcc4] bg-card px-4 py-2 text-center text-sm shadow-sm">
          Klikni na mapu da odaberes lokaciju — samo unutar Novog Sada. Klikom
          ponovo mozes da pomeris oznaku.
        </div>
      )}
      {!pickingLocation && (
        <button
          onClick={onLocate}
          className="absolute bottom-[212px] right-3 rounded-sm border border-neutral-400 bg-white px-2 py-1 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-100"
        >
          Prikazi me
        </button>
      )}
      {locateError && (
        <div className="absolute bottom-[244px] right-3 max-w-[240px] rounded-sm border border-red-300 bg-red-50 px-2 py-1.5 text-xs text-red-800 shadow-sm">
          {locateError}
        </div>
      )}
    </div>
  );
}
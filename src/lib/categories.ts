import type { CategoryInfo } from "@/types";

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "fakulteti-obrazovanje",
    label: "Fakulteti i obrazovanje",
  },
  { id: "domovi", label: "Studentski domovi" },
  { id: "menze", label: "Menze" },
  { id: "hrana", label: "Hrana" },
  { id: "pekare", label: "Pekare i buregdžinice" },
  { id: "kafa-bleja", label: "Kafa i bleja" },
  { id: "pubovi", label: "Pubovi i barovi" },
  { id: "mesta-za-ucenje", label: "Mesta za učenje" },
  { id: "parkovi", label: "Parkovi" },
  { id: "prodavnice", label: "Prodavnice i supermarketi" },
  { id: "apoteke", label: "Apoteke" },
  { id: "bankomati", label: "Bankomati" },
  { id: "poste", label: "Pošte" },
  { id: "kopirnice", label: "Kopirnice i štampa" },
  { id: "teretane", label: "Teretane" },
  { id: "prevoz", label: "Prevoz i stajališta" },
  { id: "zabava", label: "Zabava" },
  { id: "korisne-lokacije", label: "Ostale korisne lokacije" },
];

export const CATEGORY_COLORS: Record<string, string> = {
  "fakulteti-obrazovanje": "#1a5fb4",
  domovi: "#6b4e8e",
  menze: "#9c4f96",
  hrana: "#b3261e",
  pekare: "#a3662a",
  "kafa-bleja": "#8a5a00",
  pubovi: "#43609e",
  "mesta-za-ucenje": "#2e8b3c",
  parkovi: "#4f9d5f",
  prodavnice: "#d0601a",
  apoteke: "#0e8a7e",
  bankomati: "#9c7a1f",
  poste: "#2f7fa8",
  kopirnice: "#7a5cbf",
  teretane: "#b04040",
  prevoz: "#556b2f",
  zabava: "#7d4f9e",
  "korisne-lokacije": "#3d3d3d",
};

export const CATEGORY_SHORT: Record<string, string> = {
  "fakulteti-obrazovanje": "Fakultet",
  domovi: "Dom",
  menze: "Menza",
  hrana: "Hrana",
  pekare: "Pekara",
  "kafa-bleja": "Kafić",
  pubovi: "Pub",
  "mesta-za-ucenje": "Učenje",
  parkovi: "Park",
  prodavnice: "Prodavnica",
  apoteke: "Apoteka",
  bankomati: "Bankomat",
  poste: "Pošta",
  kopirnice: "Kopirnica",
  teretane: "Teretana",
  prevoz: "Prevoz",
  zabava: "Zabava",
  "korisne-lokacije": "Lokacija",
};

export const NOVI_SAD_CENTER: [number, number] = [19.8335, 45.2671];

export const NOVI_SAD_BOUNDS = {
  south: 45.19,
  north: 45.32,
  west: 19.72,
  east: 19.94,
};

export function inNoviSad(lat: number, lng: number): boolean {
  return (
    lat >= NOVI_SAD_BOUNDS.south &&
    lat <= NOVI_SAD_BOUNDS.north &&
    lng >= NOVI_SAD_BOUNDS.west &&
    lng <= NOVI_SAD_BOUNDS.east
  );
}

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function categoryShort(id: string): string {
  return CATEGORY_SHORT[id] ?? categoryLabel(id);
}
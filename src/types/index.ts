export type Category =
  | "fakulteti-obrazovanje"
  | "domovi"
  | "menze"
  | "hrana"
  | "pekare"
  | "kafa-bleja"
  | "pubovi"
  | "mesta-za-ucenje"
  | "parkovi"
  | "prodavnice"
  | "apoteke"
  | "bankomati"
  | "poste"
  | "kopirnice"
  | "teretane"
  | "prevoz"
  | "zabava"
  | "korisne-lokacije";

export interface Place {
  id: string;
  name: string;
  description: string | null;
  category: Category;
  lat: number;
  lng: number;
  address: string | null;
  price_level?: 1 | 2 | 3 | null;
  has_wifi?: boolean | null;
  has_outlets?: boolean | null;
  noise_level?: "quiet" | "moderate" | "loud" | null;
  crowded?: "low" | "medium" | "high" | null;
  created_by?: string | null;
  created_at: string;
  image_url?: string | null;
}

export interface User {
  id: string;
  username: string;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  bio: string | null;
  instagram: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface NewPlaceData {
  name: string;
  description: string;
  category: Category;
  address: string;
  lat: number;
  lng: number;
  price_level: 1 | 2 | 3 | null;
  has_wifi: boolean | null;
  has_outlets: boolean | null;
  noise_level: "quiet" | "moderate" | "loud";
  crowded: "low" | "medium" | "high";
  image?: File | null;
}

export interface CategoryInfo {
  id: Category;
  label: string;
}

export interface Review {
  id: string;
  place_id: string;
  author_id: string;
  rating: number;
  coffee: number | null;
  food: number | null;
  study_friendly: number | null;
  comment: string | null;
  created_at: string;
}

export interface NewReviewData {
  place_id: string;
  rating: number;
  coffee: number | null;
  food: number | null;
  study_friendly: number | null;
  comment: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
}
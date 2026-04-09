// src/types/index.ts

export type MediaType   = "movie" | "tv" | "book" | "manga";
export type MediaStatus = "watching" | "watched" | "reading" | "read" | "plan_to_watch" | "plan_to_read" | "dropped";
export type Platform = "YouTube" | "Netflix" | "Disney+" | "iQiyi" | "WeTV" | "MonoMax" | "HBO" | "Amazon Prime" | "Apple TV+" | "MajorCineplex" | "SF Cinema" | "House Samyan" | "Other";

export interface MediaItem {
  id:              string;
  created_at:      string;
  updated_at:      string;
  title:           string;
  type:            MediaType;
  status:          MediaStatus;
  rating:          number | null;
  release_year:    number | null;
  image_url:       string | null;
  genre:           string[] | null;
  notes:           string | null;
  // Movie / TV
  watched_with:    string | null;
  watched_date:    string | null;
  platform:        Platform | null;
  episodes:        number | null;
  current_episode: number | null;
  // Book / Manga
  author:          string | null;
  total_chapters:  number | null;
  current_chapter: number | null;
  publisher:       string | null;
}

export type MediaItemInsert = Omit<MediaItem, "id" | "created_at" | "updated_at">;
export type MediaItemUpdate = Partial<MediaItemInsert>;

export interface FetchMediaParams {
  type?:   MediaType;
  status?: MediaStatus;
  search?: string;
  genre?:  string;
  platform?: Platform;
  page?:   number;
  limit?:  number;
  sortBy?: "rating" | "created_at" | "release_year" | "title";
  sortDir?: "asc" | "desc";
}

export interface DashboardStats {
  totalMovies:       number;
  totalTV:           number;
  totalBooks:        number;
  totalManga:        number;
  watchedThisYear:   number;
  readThisYear:      number;
  avgRating:         number;
  topPlatform:       string | null;
  topGenre:          string | null;
  recentlyAdded:     MediaItem[];
  topRated:          MediaItem[];
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary",
  "Drama", "Fantasy", "History", "Horror", "Mystery", "Romance",
  "Sci-Fi", "Self-Help", "Thriller", "Biography", "Slice of Life", "Other",
];

export const STATUS_LABELS: Record<MediaStatus, string> = {
  watching:      "Watching",
  watched:       "Watched",
  reading:       "Reading",
  read:          "Read",
  plan_to_watch: "Plan to Watch",
  plan_to_read:  "Plan to Read",
  dropped:       "Dropped",
};

export const TYPE_STATUSES: Record<MediaType, MediaStatus[]> = {
  movie: ["plan_to_watch", "watched",  "dropped"],
  tv:    ["plan_to_watch", "watching", "watched", "dropped"],
  book:  ["plan_to_read",  "reading",  "read",    "dropped"],
  manga: ["plan_to_read",  "reading",  "read",    "dropped"],
};

export const TYPE_LABELS: Record<MediaType, string> = {
  movie: "Movies",
  tv:    "TV Series",
  book:  "Books",
  manga: "Manga",
};

export const PLATFORMS: Platform[] = [
  // Streaming
  "Netflix", "Disney+", "HBO", "Amazon Prime", "Apple TV+",
  "YouTube", "iQiyi", "WeTV", "MonoMax",
  // Cinema
  "MajorCineplex", "SF Cinema", "House Samyan",
  "Other",
];

// "Solo" → ไม่แสดงช่องกรอกชื่อ
// อื่น ๆ → แสดงช่องกรอกชื่อคนที่ไปด้วย
export const WATCHED_WITH_OPTIONS = ["Solo", "Partner", "Family", "Friends", "Online Party", "Other"];

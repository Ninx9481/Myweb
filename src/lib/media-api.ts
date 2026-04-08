// src/lib/media-api.ts
import { supabase }                             from "./supabase";
import type { FetchMediaParams, MediaItem, MediaItemInsert, MediaItemUpdate, DashboardStats } from "@/types";

const PAGE_SIZE = 20;

// ─── Fetch (list) ─────────────────────────────────────────────────────────────

export async function fetchMediaItems(params: FetchMediaParams = {}): Promise<{
  data: MediaItem[];
  count: number;
}> {
  const {
    type, status, search, genre, platform,
    page    = 1,
    limit   = PAGE_SIZE,
    sortBy  = "created_at",
    sortDir = "desc",
  } = params;

  let query = supabase
    .from("media_items")
    .select("*", { count: "exact" });

  if (type)     query = query.eq("type", type);
  if (status)   query = query.eq("status", status);
  if (platform) query = query.eq("platform", platform);
  if (genre)    query = query.contains("genre", [genre]);
  if (search)   query = query.ilike("title", `%${search}%`);

  const from = (page - 1) * limit;
  const to   = from + limit - 1;

  query = query
    .order(sortBy, { ascending: sortDir === "asc", nullsFirst: false })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { data: (data ?? []) as MediaItem[], count: count ?? 0 };
}

// ─── Infinite scroll pages ────────────────────────────────────────────────────

export async function fetchMediaPage(
  params: FetchMediaParams,
  pageParam: number,
): Promise<{ data: MediaItem[]; nextPage: number | null; count: number }> {
  const result = await fetchMediaItems({ ...params, page: pageParam, limit: PAGE_SIZE });
  const hasMore = pageParam * PAGE_SIZE < result.count;
  return {
    data:     result.data,
    nextPage: hasMore ? pageParam + 1 : null,
    count:    result.count,
  };
}

// ─── Single item ──────────────────────────────────────────────────────────────

export async function fetchMediaItem(id: string): Promise<MediaItem> {
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as MediaItem;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createMediaItem(item: MediaItemInsert): Promise<MediaItem> {
  const { data, error } = await supabase
    .from("media_items")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data as MediaItem;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateMediaItem(id: string, updates: MediaItemUpdate): Promise<MediaItem> {
  const { data, error } = await supabase
    .from("media_items")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as MediaItem;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteMediaItem(id: string): Promise<void> {
  const { error } = await supabase.from("media_items").delete().eq("id", id);
  if (error) throw error;
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data: all, error } = await supabase.from("media_items").select("*");
  if (error) throw error;

  const items = (all ?? []) as MediaItem[];
  const year  = new Date().getFullYear();

  // Counts
  const totalMovies = items.filter(i => i.type === "movie").length;
  const totalTV     = items.filter(i => i.type === "tv").length;
  const totalBooks  = items.filter(i => i.type === "book").length;
  const totalManga  = items.filter(i => i.type === "manga").length;

  // This year watched/read
  const watchedThisYear = items.filter(
    i => (i.type === "movie" || i.type === "tv") &&
         i.watched_date?.startsWith(String(year))
  ).length;
  const readThisYear = items.filter(
    i => (i.type === "book" || i.type === "manga") &&
         i.status === "read" &&
         i.created_at?.startsWith(String(year))
  ).length;

  // Avg rating
  const rated    = items.filter(i => i.rating !== null);
  const avgRating = rated.length
    ? rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length
    : 0;

  // Top platform
  const platformCounts: Record<string, number> = {};
  items.forEach(i => { if (i.platform) platformCounts[i.platform] = (platformCounts[i.platform] ?? 0) + 1; });
  const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Top genre
  const genreCounts: Record<string, number> = {};
  items.forEach(i => (i.genre ?? []).forEach(g => { genreCounts[g] = (genreCounts[g] ?? 0) + 1; }));
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Recently added (last 6)
  const recentlyAdded = [...items]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // Top rated
  const topRated = [...items]
    .filter(i => i.rating !== null)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 6);

  return {
    totalMovies, totalTV, totalBooks, totalManga,
    watchedThisYear, readThisYear, avgRating,
    topPlatform, topGenre, recentlyAdded, topRated,
  };
}

// ─── Storage (Upload Image) ──────────────────────────────────────────────────

export async function uploadMediaImage(file: File): Promise<string> {
  // 1. ตั้งชื่อไฟล์ใหม่ให้ไม่ซ้ำกัน
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = fileName;

  // 2. อัพโหลดไปที่ Bucket ชื่อ 'media'
  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // 3. เอา URL ของรูปออกมา
  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
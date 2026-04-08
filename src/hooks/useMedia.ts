// src/hooks/useMedia.ts
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchMediaItems,
  fetchMediaPage,
  fetchMediaItem,
  createMediaItem,
  updateMediaItem,
  deleteMediaItem,
  fetchDashboardStats,
} from "@/lib/media-api";
import type { FetchMediaParams, MediaItemInsert, MediaItemUpdate } from "@/types";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const mediaKeys = {
  all:       ["media"] as const,
  lists:     () => [...mediaKeys.all, "list"] as const,
  list:      (params: FetchMediaParams) => [...mediaKeys.lists(), params] as const,
  infinite:  (params: FetchMediaParams) => [...mediaKeys.all, "infinite", params] as const,
  detail:    (id: string) => [...mediaKeys.all, "detail", id] as const,
  dashboard: () => [...mediaKeys.all, "dashboard"] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useMediaItems(params: FetchMediaParams = {}) {
  return useQuery({
    queryKey: mediaKeys.list(params),
    queryFn:  () => fetchMediaItems(params),
  });
}

export function useInfiniteMedia(params: FetchMediaParams = {}) {
  return useInfiniteQuery({
    queryKey:         mediaKeys.infinite(params),
    queryFn:          ({ pageParam }) => fetchMediaPage(params, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });
}

export function useMediaItem(id: string) {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn:  () => fetchMediaItem(id),
    enabled:  !!id,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: mediaKeys.dashboard(),
    queryFn:  fetchDashboardStats,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: MediaItemInsert) => createMediaItem(item),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: MediaItemUpdate }) =>
      updateMediaItem(id, updates),
    onSuccess:  (_, { id }) => {
      qc.invalidateQueries({ queryKey: mediaKeys.all });
      qc.invalidateQueries({ queryKey: mediaKeys.detail(id) });
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMediaItem(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

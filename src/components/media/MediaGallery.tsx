"use client";
// src/components/media/MediaGallery.tsx

import { useState, useEffect, useRef } from "react";
import { useInfiniteMedia }  from "@/hooks/useMedia";
import { MediaCard, MediaCardSkeleton } from "./MediaCard";
import { MediaFormModal }    from "../forms/MediaFormModal";
import { useDeleteMedia }    from "@/hooks/useMedia";
import { Search, SlidersHorizontal, X, Plus } from "lucide-react";
import { useInView }         from "react-intersection-observer";
import toast                 from "react-hot-toast";
import clsx                  from "clsx";
import type { MediaType, MediaStatus, Platform, MediaItem } from "@/types";
import { TYPE_STATUSES, STATUS_LABELS, GENRES, PLATFORMS, TYPE_LABELS } from "@/types";

interface MediaGalleryProps {
  type: MediaType;
}

const TAB_ALL = "__all__";

export function MediaGallery({ type }: MediaGalleryProps) {
  const [search,    setSearch]    = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<MediaStatus | typeof TAB_ALL>(TAB_ALL);
  const [genre,     setGenre]     = useState<string>("");
  const [platform,  setPlatform]  = useState<Platform | "">("");
  const [showFilter, setShowFilter] = useState(false);
  const [editItem,  setEditItem]  = useState<MediaItem | null>(null);
  const [showAdd,   setShowAdd]   = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = {
    type,
    status:   activeStatus === TAB_ALL ? undefined : activeStatus,
    search:   debouncedSearch || undefined,
    genre:    genre     || undefined,
    platform: (platform || undefined) as Platform | undefined,
  };

  const {
    data, fetchNextPage, hasNextPage,
    isFetchingNextPage, isLoading,
  } = useInfiniteMedia(params);

  const { ref: loaderRef, inView } = useInView({ threshold: 0.5 });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const deleteMutation = useDeleteMedia();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    toast.promise(deleteMutation.mutateAsync(id), {
      loading: "Deleting…",
      success: "Deleted!",
      error:   "Failed to delete",
    });
  };

  const allItems = data?.pages.flatMap(p => p.data) ?? [];
  const totalCount = data?.pages[0]?.count ?? 0;
  const statuses = TYPE_STATUSES[type];

  const hasFilters = !!genre || !!platform;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            {TYPE_LABELS[type]}
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {isLoading ? "…" : `${totalCount} items in your collection`}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:opacity-90 transition-all shrink-0"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide animate-fade-up" style={{ animationDelay: "50ms" }}>
        <TabButton
          active={activeStatus === TAB_ALL}
          onClick={() => setActiveStatus(TAB_ALL)}
        >
          All
        </TabButton>
        {statuses.map(s => (
          <TabButton
            key={s}
            active={activeStatus === s}
            onClick={() => setActiveStatus(s)}
          >
            {STATUS_LABELS[s]}
          </TabButton>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2 animate-fade-up" style={{ animationDelay: "100ms" }}>
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${TYPE_LABELS[type].toLowerCase()}…`}
            className={clsx(
              "w-full pl-9 pr-4 py-2.5 rounded-xl text-sm",
              "bg-[var(--card)] border border-[var(--border)]",
              "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30",
              "transition-all",
            )}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilter(!showFilter)}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all",
            hasFilters || showFilter
              ? "bg-[var(--accent-light)] border-[var(--accent)]/30 text-[var(--accent)]"
              : "bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
          )}
        >
          <SlidersHorizontal size={15} />
          Filter
          {hasFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] animate-fade-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Genre filter */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Genre</label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="">All Genres</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Platform filter (only for movies/tv) */}
            {(type === "movie" || type === "tv") && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Platform</label>
                <select
                  value={platform}
                  onChange={e => setPlatform(e.target.value as Platform)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">All Platforms</option>
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
          </div>

          {hasFilters && (
            <button
              onClick={() => { setGenre(""); setPlatform(""); }}
              className="mt-3 text-xs text-[var(--accent)] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <MediaCardSkeleton key={i} />)}
        </div>
      ) : allItems.length === 0 ? (
        <EmptyGallery type={type} onAdd={() => setShowAdd(true)} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {allItems.map((item, i) => (
            <div key={item.id} style={{ animationDelay: `${(i % 10) * 30}ms` }}>
              <MediaCard
                item={item}
                onEdit={setEditItem}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={loaderRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        )}
        {!hasNextPage && allItems.length > 0 && (
          <p className="text-xs text-[var(--text-muted)]">All {totalCount} items loaded</p>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <MediaFormModal
          defaultType={type}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editItem && (
        <MediaFormModal
          item={editItem}
          defaultType={type}
          onClose={() => setEditItem(null)}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
        active
          ? "bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent-glow)]"
          : "bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
      )}
    >
      {children}
    </button>
  );
}

function EmptyGallery({ type, onAdd }: { type: MediaType; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-[var(--border)]">
      <div className="text-5xl mb-4">
        {type === "movie" ? "🎬" : type === "tv" ? "📺" : type === "book" ? "📚" : "📖"}
      </div>
      <p className="font-display text-xl font-bold mb-2">No {TYPE_LABELS[type]} yet</p>
      <p className="text-[var(--text-muted)] text-sm mb-6">Start tracking your {TYPE_LABELS[type].toLowerCase()}!</p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:opacity-90 transition-all"
      >
        <Plus size={16} />
        Add your first {type}
      </button>
    </div>
  );
}

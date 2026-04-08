"use client";
// src/components/media/RankingView.tsx

import { useState }     from "react";
import { useMediaItems } from "@/hooks/useMedia";
import { useDeleteMedia, useUpdateMedia } from "@/hooks/useMedia";
import { MediaFormModal } from "../forms/MediaFormModal";
import { Star, Trophy, Medal, Award, Film, Tv2, BookOpen, BookMarked } from "lucide-react";
import toast             from "react-hot-toast";
import clsx              from "clsx";
import Image             from "next/image";
import type { MediaItem, MediaType } from "@/types";
import { TYPE_LABELS, STATUS_LABELS } from "@/types";

const TYPE_ICONS: Record<MediaType, React.ReactNode> = {
  movie: <Film size={14} />,
  tv:    <Tv2 size={14} />,
  book:  <BookOpen size={14} />,
  manga: <BookMarked size={14} />,
};

const RANK_ICONS = [
  <Trophy size={20} className="text-yellow-400" key="1" />,
  <Medal  size={20} className="text-gray-300"   key="2" />,
  <Award  size={20} className="text-amber-600"  key="3" />,
];

const FILTER_TYPES: Array<MediaType | "all"> = ["all", "movie", "tv", "book", "manga"];

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} size={14} className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-600"} />
      ))}
    </div>
  );
}

export function RankingView() {
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [editItem, setEditItem]     = useState<MediaItem | null>(null);

  const { data, isLoading } = useMediaItems({
    type:    typeFilter === "all" ? undefined : typeFilter,
    sortBy:  "rating",
    sortDir: "desc",
    limit:   100,
  });

  const deleteMutation = useDeleteMedia();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    toast.promise(deleteMutation.mutateAsync(id), {
      loading: "Deleting…",
      success: "Deleted!",
      error:   "Failed",
    });
  };

  const items = (data?.data ?? []).filter(i => i.rating !== null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center">
            <Trophy size={20} className="text-yellow-400" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Rankings</h1>
        </div>
        <p className="text-[var(--text-muted)] text-sm pl-[52px]">
          {isLoading ? "…" : `${items.length} rated items, sorted by your stars`}
        </p>
      </div>

      {/* Type filter */}
      <div className="flex gap-1.5 flex-wrap animate-fade-up" style={{ animationDelay: "50ms" }}>
        {FILTER_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={clsx(
              "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all",
              typeFilter === t
                ? "bg-[var(--accent)] text-black border-transparent shadow-lg shadow-[var(--accent-glow)]"
                : "bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
            )}
          >
            {t !== "all" && TYPE_ICONS[t as MediaType]}
            {t === "all" ? "All" : TYPE_LABELS[t as MediaType]}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl skeleton" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-[var(--border)]">
          <Trophy size={40} className="text-[var(--border)] mb-3" />
          <p className="font-display text-xl font-bold mb-2">No ratings yet</p>
          <p className="text-[var(--text-muted)] text-sm">Rate your items to see them ranked here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <RankRow
              key={item.id}
              item={item}
              rank={index + 1}
              rankIcon={index < 3 ? RANK_ICONS[index] : null}
              onEdit={() => setEditItem(item)}
              onDelete={() => handleDelete(item.id)}
              delay={index * 20}
            />
          ))}
        </div>
      )}

      {editItem && (
        <MediaFormModal item={editItem} defaultType={editItem.type} onClose={() => setEditItem(null)} />
      )}
    </div>
  );
}

// ─── Rank row ─────────────────────────────────────────────────────────────────

interface RankRowProps {
  item:     MediaItem;
  rank:     number;
  rankIcon: React.ReactNode | null;
  onEdit:   () => void;
  onDelete: () => void;
  delay:    number;
}

function RankRow({ item, rank, rankIcon, onEdit, onDelete, delay }: RankRowProps) {
  const [imgError, setImgError] = useState(false);

  const isPodium = rank <= 3;

  return (
    <div
      className={clsx(
        "group flex items-center gap-4 p-3 rounded-2xl border transition-all duration-200 animate-fade-up",
        "hover:border-[var(--accent)]/30 hover:bg-[var(--card)]",
        isPodium
          ? "bg-[var(--card)] border-[var(--accent)]/20"
          : "bg-transparent border-[var(--border)]",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Rank */}
      <div className="w-8 flex items-center justify-center shrink-0">
        {rankIcon ?? (
          <span className="text-sm font-bold text-[var(--text-muted)]">#{rank}</span>
        )}
      </div>

      {/* Poster thumbnail */}
      <div className="relative w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-[var(--surface)]">
        {item.image_url && !imgError ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="48px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[var(--border)]">{TYPE_ICONS[item.type]}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display font-bold text-sm truncate">{item.title}</h3>
          {isPodium && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold border border-[var(--accent)]/20 shrink-0">
              Top {rank}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className={clsx(
            "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
            "bg-[var(--accent-light)] text-[var(--accent)]",
          )}>
            {TYPE_ICONS[item.type]}
            {TYPE_LABELS[item.type]}
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {STATUS_LABELS[item.status]}
          </span>
          {item.release_year && (
            <span className="text-[10px] text-[var(--text-muted)]">{item.release_year}</span>
          )}
          {item.platform && (
            <span className="text-[10px] text-[var(--text-muted)]">📺 {item.platform}</span>
          )}
        </div>
      </div>

      {/* Stars */}
      <div className="shrink-0">
        <StarRow rating={item.rating ?? 0} />
        <p className="text-center text-[10px] text-[var(--text-muted)] mt-0.5">{item.rating}/5</p>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] transition-colors"
        >
          ✏️
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

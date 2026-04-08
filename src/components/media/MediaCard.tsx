"use client";
// src/components/media/MediaCard.tsx

import Link          from "next/link";
import Image         from "next/image";
import { useState }  from "react";
import { Star, Edit2, Trash2, Eye, BookOpen, Clock } from "lucide-react";
// MediaCard — clicking poster navigates to /item/[id]
import clsx          from "clsx";
import type { MediaItem } from "@/types";
import { STATUS_LABELS }  from "@/types";

interface MediaCardProps {
  item:       MediaItem;
  onEdit?:    (item: MediaItem) => void;
  onDelete?:  (id: string)      => void;
}

const STATUS_COLORS: Record<string, string> = {
  watched:       "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  watching:      "bg-blue-500/20    text-blue-400    border-blue-500/30",
  read:          "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  reading:       "bg-blue-500/20    text-blue-400    border-blue-500/30",
  plan_to_watch: "bg-gray-500/20    text-gray-400    border-gray-500/30",
  plan_to_read:  "bg-gray-500/20    text-gray-400    border-gray-500/30",
  dropped:       "bg-red-500/20     text-red-400     border-red-500/30",
};

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={11}
          className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}
        />
      ))}
    </div>
  );
}

function Placeholder({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    movie: <Eye size={32}      className="text-[var(--border)]" />,
    tv:    <Eye size={32}      className="text-[var(--border)]" />,
    book:  <BookOpen size={32} className="text-[var(--border)]" />,
    manga: <BookOpen size={32} className="text-[var(--border)]" />,
  };
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--border)]/30">
      {icons[type]}
    </div>
  );
}

export function MediaCard({ item, onEdit, onDelete }: MediaCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [imgError,    setImgError]    = useState(false);

  return (
    <div
      className={clsx(
        "group relative rounded-2xl overflow-hidden",
        "bg-[var(--card)] border border-[var(--border)]",
        "card-hover cursor-pointer",
        "animate-fade-up",
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Poster — links to detail page */}
      <Link href={`/item/${item.id}`}>
      <div className="relative aspect-[2/3] overflow-hidden bg-[var(--surface)]">
        {item.image_url && !imgError ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <Placeholder type={item.type} />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating badge */}
        {item.rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-sm">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold text-white">{item.rating}</span>
          </div>
        )}

        {/* Actions overlay */}
        {(onEdit || onDelete) && (
          <div className={clsx(
            "absolute top-2 left-2 flex gap-1.5 transition-all duration-200",
            showActions ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
          )}>
            {onEdit && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(item); }}
                className="p-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white hover:bg-[var(--accent)] hover:text-black transition-colors"
                title="Edit"
              >
                <Edit2 size={12} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(item.id); }}
                className="p-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white hover:bg-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}

        {/* Year */}
        {item.release_year && (
          <div className="absolute bottom-2 left-2 text-[10px] text-white/70 font-medium">
            {item.release_year}
          </div>
        )}
      </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-display font-bold text-sm leading-tight line-clamp-2 mb-2 text-[var(--text-primary)]">
          {item.title}
        </h3>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Status badge */}
          <span className={clsx(
            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
            STATUS_COLORS[item.status] ?? STATUS_COLORS.plan_to_watch,
          )}>
            <Clock size={8} />
            {STATUS_LABELS[item.status]}
          </span>

          <StarRating rating={item.rating} />
        </div>

        {/* Genre chips */}
        {item.genre && item.genre.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {item.genre.slice(0, 2).map(g => (
              <span
                key={g}
                className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)]/60 text-[var(--text-muted)]"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Author (books/manga) */}
        {item.author && (
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5 truncate">
            by {item.author}
          </p>
        )}

        {/* Platform (movies/tv) */}
        {item.platform && (
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5 truncate">
            📺 {item.platform}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

export function MediaCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)]">
      <div className="aspect-[2/3] skeleton" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-4 rounded w-3/4" />
        <div className="skeleton h-3 rounded w-1/2" />
        <div className="flex gap-1">
          <div className="skeleton h-4 rounded-full w-16" />
          <div className="skeleton h-4 rounded-full w-12" />
        </div>
      </div>
    </div>
  );
}

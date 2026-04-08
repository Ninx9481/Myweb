"use client";
// src/app/item/[id]/page.tsx

import { useState }        from "react";
import { useRouter }       from "next/navigation";
import { useParams }       from "next/navigation";
import { useMediaItem, useDeleteMedia } from "@/hooks/useMedia";
import { MediaFormModal }  from "@/components/forms/MediaFormModal";
import {
  ArrowLeft, Star, Calendar, Monitor, Users,
  Edit2, Trash2, BookOpen, Film, Tv2, BookMarked,
  Tag,
} from "lucide-react";
import Image  from "next/image";
import toast  from "react-hot-toast";
import clsx   from "clsx";
import { STATUS_LABELS, TYPE_LABELS } from "@/types";
import type { MediaType } from "@/types";

const TYPE_ICONS: Record<MediaType, React.ReactNode> = {
  movie: <Film size={16} />,
  tv:    <Tv2 size={16} />,
  book:  <BookOpen size={16} />,
  manga: <BookMarked size={16} />,
};

function StarDisplay({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-sm text-[var(--text-muted)]">Not rated</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={18} className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-[var(--border)]"} />
        ))}
      </div>
      <span className="text-sm font-bold text-[var(--text-primary)]">{rating}/5</span>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--border)] last:border-0">
      <div className="w-5 h-5 mt-0.5 flex items-center justify-center text-[var(--accent)] shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-0.5">{label}</p>
        <div className="text-sm text-[var(--text-primary)]">{value}</div>
      </div>
    </div>
  );
}

export default function ItemDetailPage() {
  const params    = useParams();
  const router    = useRouter();
  const id        = params.id as string;
  const [editing, setEditing] = useState(false);
  const [imgErr,  setImgErr]  = useState(false);

  const { data: item, isLoading, isError } = useMediaItem(id);
  const deleteMutation = useDeleteMedia();

  const handleDelete = async () => {
    if (!confirm(`Delete "${item?.title}"? This cannot be undone.`)) return;
    toast.promise(
      deleteMutation.mutateAsync(id).then(() => router.back()),
      { loading: "Deleting…", success: "Deleted!", error: "Failed" },
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-up">
        <div className="h-8 skeleton rounded-xl w-32" />
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          <div className="aspect-[2/3] skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-10 skeleton rounded-xl w-3/4" />
            <div className="h-4 skeleton rounded w-1/2" />
            <div className="h-32 skeleton rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-red-400 font-semibold">Item not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-[var(--accent)] hover:underline">Go back</button>
      </div>
    );
  }

  // Progress for TV / Manga
  const tvProgress    = item.type === "tv"    && item.episodes        ? Math.round(((item.current_episode ?? 0) / item.episodes) * 100) : null;
  const mangaProgress = item.type === "manga" && item.total_chapters  ? Math.round(((item.current_chapter ?? 0) / item.total_chapters) * 100) : null;
  const progress      = tvProgress ?? mangaProgress;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back
      </button>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
        {/* Poster */}
        <div className="space-y-4">
          <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)] shadow-2xl shadow-[var(--accent-glow)]">
            {item.image_url && !imgErr ? (
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover"
                sizes="260px"
                onError={() => setImgErr(true)}
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--card)] to-[var(--border)]/20">
                <span className="text-[var(--border)]">{TYPE_ICONS[item.type]}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)] hover:text-black transition-all"
            >
              <Edit2 size={14} /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          {/* Title + type badge */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={clsx(
                "flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full",
                "bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/20",
              )}>
                {TYPE_ICONS[item.type]}
                {TYPE_LABELS[item.type]}
              </span>
              {item.release_year && (
                <span className="text-xs text-[var(--text-muted)] font-medium">{item.release_year}</span>
              )}
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              {item.title}
            </h1>

            {item.author && (
              <p className="text-[var(--text-muted)] mt-2">by <span className="font-semibold text-[var(--text-primary)]">{item.author}</span></p>
            )}
          </div>

          {/* Status + rating */}
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Status</p>
              <span className="text-sm font-semibold px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/20">
                {STATUS_LABELS[item.status]}
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1.5">Rating</p>
              <StarDisplay rating={item.rating} />
            </div>
          </div>

          {/* Genre chips */}
          {item.genre && item.genre.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2">Genres</p>
              <div className="flex flex-wrap gap-1.5">
                {item.genre.map(g => (
                  <span key={g} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--card)] border border-[var(--border)] text-[var(--text-muted)]">
                    <Tag size={10} />
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Progress bar (TV / Manga) */}
          {progress !== null && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-[var(--text-muted)]">
                  {item.type === "tv"
                    ? `Episode ${item.current_episode ?? 0} / ${item.episodes}`
                    : `Chapter ${item.current_chapter ?? 0} / ${item.total_chapters}`}
                </p>
                <p className="text-xs font-bold text-[var(--accent)]">{progress}%</p>
              </div>
              <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Details card */}
          <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden">
            <InfoRow icon={<Calendar size={14} />} label="Watch / Read Date"
              value={item.watched_date ? new Date(item.watched_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null} />
            <InfoRow icon={<Monitor size={14} />}  label="Platform"  value={item.platform} />
            <InfoRow icon={<Users size={14} />}    label="Watched With" value={item.watched_with} />
            <InfoRow icon={<BookOpen size={14} />} label="Publisher" value={item.publisher} />
          </div>

          {/* Notes */}
          {item.notes && (
            <div className="p-4 rounded-2xl bg-[var(--accent-light)] border border-[var(--accent)]/20">
              <p className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-bold mb-2">My Notes</p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{item.notes}</p>
            </div>
          )}

          {/* Added date */}
          <p className="text-xs text-[var(--text-muted)]">
            Added {new Date(item.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {editing && (
        <MediaFormModal item={item} defaultType={item.type} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

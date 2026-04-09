"use client";
// src/components/forms/MediaFormModal.tsx

import { useState }                   from "react";
import { useCreateMedia, useUpdateMedia } from "@/hooks/useMedia";
import { X, Link as LinkIcon, Image as ImageIcon, Loader2 } from "lucide-react";
import toast                          from "react-hot-toast";
import clsx                           from "clsx";
import type { MediaItem, MediaItemInsert, MediaType, MediaStatus } from "@/types";
import {
  TYPE_LABELS, GENRES, PLATFORMS, WATCHED_WITH_OPTIONS,
  TYPE_STATUSES, STATUS_LABELS,
} from "@/types";

interface MediaFormModalProps {
  item?:        MediaItem;
  defaultType?: MediaType;
  onClose:      () => void;
}

const MEDIA_TYPES: MediaType[] = ["movie", "tv", "book", "manga"];

type FormData = Omit<MediaItemInsert, "genre"> & { genre: string };

function defaultForm(type: MediaType, item?: MediaItem): FormData {
  return {
    title:           item?.title           ?? "",
    type:            item?.type            ?? type,
    status:          item?.status          ?? (type === "book" || type === "manga" ? "plan_to_read" : "plan_to_watch"),
    rating:          item?.rating          ?? null,
    release_year:    item?.release_year    ?? null,
    image_url:       item?.image_url       ?? null,
    genre:           item?.genre?.join(", ") ?? "",
    notes:           item?.notes           ?? null,
    watched_with:    item?.watched_with    ?? null,
    watched_date:    item?.watched_date    ?? null,
    platform:        item?.platform        ?? null,
    episodes:        item?.episodes        ?? null,
    current_episode: item?.current_episode ?? null,
    author:          item?.author          ?? null,
    total_chapters:  item?.total_chapters  ?? null,
    current_chapter: item?.current_chapter ?? null,
    publisher:       item?.publisher       ?? null,
  };
}

export function MediaFormModal({ item, defaultType = "movie", onClose }: MediaFormModalProps) {
  const [form,     setForm]     = useState<FormData>(() => defaultForm(defaultType, item));
  const [imageUrl, setImageUrl] = useState<string>(item?.image_url ?? "");
  const [previewOk, setPreviewOk] = useState(!!item?.image_url);
  const [saving,   setSaving]   = useState(false);

  const createMutation = useCreateMedia();
  const updateMutation = useUpdateMedia();

  const isEdit = !!item;

  const set = (key: keyof FormData, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }

    setSaving(true);
    try {
      // Parse genre string → array
      const genreArr = form.genre
        .split(",")
        .map(g => g.trim())
        .filter(Boolean);

      const payload: MediaItemInsert = {
        ...form,
        genre:     genreArr.length ? genreArr : null,
        image_url: imageUrl.trim() || null,
      };

      let savedId = item?.id;

      if (isEdit) {
        await updateMutation.mutateAsync({ id: item!.id, updates: payload });
        savedId = item!.id;
      } else {
        const created = await createMutation.mutateAsync(payload);
        savedId = created.id;
      }

      toast.success(isEdit ? "Updated!" : "Added to library!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const statuses = TYPE_STATUSES[form.type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl animate-fade-up">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[var(--surface)] border-b border-[var(--border)]">
          <h2 className="font-display text-xl font-bold">
            {isEdit ? "Edit" : "Add"}{" "}
            <span className="text-[var(--accent)]">{TYPE_LABELS[form.type]}</span>
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--border)]/50 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Type selector */}
          <div>
            <Label>Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {MEDIA_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    set("type", t);
                    set("status", TYPE_STATUSES[t][0]);
                  }}
                  className={clsx(
                    "py-2 rounded-xl text-sm font-semibold border transition-all",
                    form.type === t
                      ? "bg-[var(--accent)] text-black border-transparent"
                      : "bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {TYPE_LABELS[t].replace("TV Series", "TV")}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Enter title…"
              required
            />
          </div>

          {/* Status + Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={form.status} onChange={e => set("status", e.target.value as MediaStatus)}>
                {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </Select>
            </div>
            <div>
              <Label>Rating</Label>
              <div className="flex gap-1.5 mt-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => set("rating", form.rating === n ? null : n)}
                    className={clsx(
                      "flex-1 py-2 rounded-xl text-sm font-bold border transition-all",
                      form.rating && form.rating >= n
                        ? "bg-yellow-400 text-black border-transparent"
                        : "bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)]",
                    )}
                  >
                    {n}★
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Year + Genre */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Release Year</Label>
              <Input
                type="number"
                value={form.release_year ?? ""}
                onChange={e => set("release_year", e.target.value ? Number(e.target.value) : null)}
                placeholder="2024"
                min={1800}
                max={2100}
              />
            </div>
            <div>
              <Label>Genre (comma-separated)</Label>
              <Input
                value={form.genre}
                onChange={e => set("genre", e.target.value)}
                placeholder="Action, Drama…"
                list="genre-list"
              />
              <datalist id="genre-list">
                {GENRES.map(g => <option key={g} value={g} />)}
              </datalist>
            </div>
          </div>

          {/* Movie/TV fields */}
          {(form.type === "movie" || form.type === "tv") && (
            <div className="space-y-4 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {TYPE_LABELS[form.type]} Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Platform</Label>
                  <Select value={form.platform ?? ""} onChange={e => set("platform", e.target.value || null)}>
                    <option value="">Select platform…</option>
                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Watched With</Label>
                  <Select value={form.watched_with ?? ""} onChange={e => set("watched_with", e.target.value || null)}>
                    <option value="">Select…</option>
                    {WATCHED_WITH_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Watch Date</Label>
                  <Input type="date" value={form.watched_date ?? ""} onChange={e => set("watched_date", e.target.value || null)} />
                </div>
                {form.type === "tv" && (
                  <div>
                    <Label>Episodes (current / total)</Label>
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Current" value={form.current_episode ?? ""} onChange={e => set("current_episode", e.target.value ? Number(e.target.value) : null)} />
                      <Input type="number" placeholder="Total" value={form.episodes ?? ""} onChange={e => set("episodes", e.target.value ? Number(e.target.value) : null)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Book/Manga fields */}
          {(form.type === "book" || form.type === "manga") && (
            <div className="space-y-4 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {TYPE_LABELS[form.type]} Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Author</Label>
                  <Input value={form.author ?? ""} onChange={e => set("author", e.target.value || null)} placeholder="Author name…" />
                </div>
                <div>
                  <Label>Publisher</Label>
                  <Input value={form.publisher ?? ""} onChange={e => set("publisher", e.target.value || null)} placeholder="Publisher…" />
                </div>
              </div>
              {form.type === "manga" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Current Chapter</Label>
                    <Input type="number" value={form.current_chapter ?? ""} onChange={e => set("current_chapter", e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <div>
                    <Label>Total Chapters</Label>
                    <Input type="number" value={form.total_chapters ?? ""} onChange={e => set("total_chapters", e.target.value ? Number(e.target.value) : null)} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <textarea
              value={form.notes ?? ""}
              onChange={e => set("notes", e.target.value || null)}
              placeholder="Your thoughts…"
              rows={3}
              className={clsx(
                "w-full px-4 py-2.5 rounded-xl text-sm resize-none",
                "bg-[var(--card)] border border-[var(--border)]",
                "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
                "focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30",
                "transition-all",
              )}
            />
          </div>

          {/* Poster / Cover URL */}
          <div>
            <Label>Poster / Cover URL</Label>
            <div className="space-y-3">
              {/* URL input */}
              <div className="relative">
                <LinkIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={e => {
                    setImageUrl(e.target.value);
                    setPreviewOk(false);
                  }}
                  placeholder="https://image.tmdb.org/… หรือ URL รูปภาพใด ๆ"
                  className="pl-9 pr-10"
                />
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => { setImageUrl(""); setPreviewOk(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    title="ล้าง URL"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Preview box */}
              {imageUrl.trim() ? (
                <div className={clsx(
                  "relative rounded-xl overflow-hidden border transition-all",
                  previewOk
                    ? "border-[var(--accent)]/30 bg-[var(--card)]"
                    : "border-[var(--border)] bg-[var(--card)]",
                )}>
                  <div className="flex items-center justify-center" style={{ height: 160 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-h-full max-w-full object-contain"
                      onLoad={() => setPreviewOk(true)}
                      onError={() => setPreviewOk(false)}
                    />
                    {!previewOk && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--card)]">
                        <ImageIcon size={28} className="text-[var(--border)]" />
                        <p className="text-xs text-[var(--text-muted)]">ไม่สามารถโหลดรูปได้ — ตรวจสอบ URL อีกครั้ง</p>
                      </div>
                    )}
                  </div>
                  {previewOk && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-[var(--accent)] text-black text-[10px] font-bold">
                      ✓ โหลดสำเร็จ
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-24 rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center gap-2 text-[var(--text-muted)]">
                  <ImageIcon size={18} />
                  <span className="text-sm">ตัวอย่างรูปจะแสดงที่นี่</span>
                </div>
              )}

              <p className="text-[11px] text-[var(--text-muted)]">
                💡 แนะนำ: ใช้ลิงก์จาก{" "}
                <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">TMDB</a>
                {", "}
                <a href="https://myanimelist.net" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">MyAnimeList</a>
                {" หรือ "}
                <a href="https://www.google.com/imghp" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">Google Images</a>
                {" (คลิกขวา → คัดลอก URL รูปภาพ)"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[var(--accent)] text-black hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : (isEdit ? "Save Changes" : "Add to Library")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">{children}</label>;
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full px-4 py-2.5 rounded-xl text-sm",
        "bg-[var(--card)] border border-[var(--border)]",
        "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
        "focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30",
        "transition-all",
        className,
      )}
    />
  );
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full px-4 py-2.5 rounded-xl text-sm",
        "bg-[var(--card)] border border-[var(--border)]",
        "text-[var(--text-primary)]",
        "focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30",
        "transition-all",
        className,
      )}
    >
      {children}
    </select>
  );
}

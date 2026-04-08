"use client";
// src/components/forms/MediaFormModal.tsx

import { useState, useCallback }      from "react";
import { useDropzone }                from "react-dropzone";
import { useCreateMedia, useUpdateMedia } from "@/hooks/useMedia";
import { uploadPoster }               from "@/lib/supabase";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
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
  const [form,      setForm]      = useState<FormData>(() => defaultForm(defaultType, item));
  const [file,      setFile]      = useState<File | null>(null);
  const [preview,   setPreview]   = useState<string | null>(item?.image_url ?? null);
  const [saving,    setSaving]    = useState(false);

  const createMutation = useCreateMedia();
  const updateMutation = useUpdateMedia();

  const isEdit = !!item;

  // File drop
  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

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
        image_url: form.image_url,
      };

      let savedId = item?.id;

      if (isEdit) {
        const updated = await updateMutation.mutateAsync({ id: item!.id, updates: payload });
        savedId = updated.id;
      } else {
        const created = await createMutation.mutateAsync(payload);
        savedId = created.id;
      }

      // Upload image if new file selected
      if (file && savedId) {
        const url = await uploadPoster(file, savedId);
        if (url) {
          await updateMutation.mutateAsync({ id: savedId, updates: { image_url: url } });
        }
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

          {/* Poster upload */}
          <div>
            <Label>Poster / Cover</Label>
            <div
              {...getRootProps()}
              className={clsx(
                "relative flex flex-col items-center justify-center gap-3",
                "h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all",
                isDragActive
                  ? "border-[var(--accent)] bg-[var(--accent-light)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--card)]",
              )}
            >
              <input {...getInputProps()} />
              {preview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="h-full w-full object-contain rounded-2xl p-1" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-semibold">Click to replace</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
                    <Upload size={18} className="text-[var(--accent)]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {isDragActive ? "Drop it here!" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">JPG, PNG, WebP · max 5MB</p>
                  </div>
                </>
              )}
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

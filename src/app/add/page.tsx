"use client";
// src/app/add/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateMedia } from "@/hooks/useMedia";
import {
  ArrowLeft, Loader2, Star,
  Film, Tv2, BookOpen, BookMarked,
  Link as LinkIcon, Image as ImageIcon, X,
} from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import type { MediaType, MediaStatus, Platform } from "@/types";
import {
  TYPE_LABELS, GENRES, PLATFORMS, WATCHED_WITH_OPTIONS,
  TYPE_STATUSES, STATUS_LABELS,
} from "@/types";

const MEDIA_TYPES: MediaType[] = ["movie", "tv", "book", "manga"];

const TYPE_ICONS: Record<MediaType, React.ReactNode> = {
  movie: <Film size={20} />,
  tv:    <Tv2 size={20} />,
  book:  <BookOpen size={20} />,
  manga: <BookMarked size={20} />,
};

type FormData = {
  title:           string;
  type:            MediaType;
  status:          MediaStatus;
  rating:          number | null;
  release_year:    number | null;
  genre:           string;
  notes:           string;
  watched_with:    string;
  watched_date:    string;
  platform:        Platform | "";
  episodes:        number | null;
  current_episode: number | null;
  author:          string;
  total_chapters:  number | null;
  current_chapter: number | null;
  publisher:       string;
};

const INITIAL: FormData = {
  title: "", type: "movie", status: "plan_to_watch",
  rating: null, release_year: null, genre: "", notes: "",
  watched_with: "", watched_date: "", platform: "",
  episodes: null, current_episode: null,
  author: "", total_chapters: null, current_chapter: null, publisher: "",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] px-2">{title}</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">{children}</label>;
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--card)] border border-[var(--border)]",
        "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
        "focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all",
        className,
      )}
    />
  );
}

function SelectField({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full px-4 py-2.5 rounded-xl text-sm bg-[var(--card)] border border-[var(--border)]",
        "text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all",
        className,
      )}
    >
      {children}
    </select>
  );
}

export default function AddPage() {
  const router = useRouter();
  const [form,      setForm]      = useState<FormData>(INITIAL);
  const [imageUrl,  setImageUrl]  = useState("");
  const [previewOk, setPreviewOk] = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [hover,            setHover]            = useState<number | null>(null);
  const [watchedWithType,  setWatchedWithType]  = useState("Solo");
  const [watchedWithNames, setWatchedWithNames] = useState("");

  const createMutation = useCreateMedia();

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleTypeChange = (t: MediaType) => {
    const defaultStatus = t === "book" || t === "manga" ? "plan_to_read" : "plan_to_watch";
    setForm(f => ({ ...f, type: t, status: defaultStatus as MediaStatus }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }

    setSaving(true);
    try {
      const genreArr = form.genre.split(",").map(g => g.trim()).filter(Boolean);

        // ถ้าเลือก Solo → บันทึก "Solo"
        // ถ้าเลือกอื่น → บันทึกชื่อที่กรอก (fallback เป็น category ถ้าไม่ได้กรอก)
        const watchedWithValue = watchedWithType === "Solo"
          ? "Solo"
          : watchedWithNames.trim() || watchedWithType;

      const payload = {
        title:           form.title,
        type:            form.type,
        status:          form.status,
        rating:          form.rating,
        release_year:    form.release_year,
        image_url:       imageUrl.trim() || null,
        genre:           genreArr.length ? genreArr : null,
        notes:           form.notes || null,
        watched_with:    watchedWithValue || null,
        watched_date:    form.watched_date || null,
        platform:        (form.platform || null) as Platform | null,
        episodes:        form.episodes,
        current_episode: form.current_episode,
        author:          form.author || null,
        total_chapters:  form.total_chapters,
        current_chapter: form.current_chapter,
        publisher:       form.publisher || null,
      };

      await createMutation.mutateAsync(payload);
      toast.success("Added to your library! 🎉");
      router.push(`/${form.type === "tv" ? "tv" : form.type === "movie" ? "movies" : form.type === "book" ? "books" : "manga"}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save. Check your Supabase connection.");
    } finally {
      setSaving(false);
    }
  };

  const statuses = TYPE_STATUSES[form.type];
  const ratingDisplay = hover ?? form.rating ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card)] transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Add to <span className="text-[var(--accent)]">Library</span>
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Track a new movie, show, book or manga</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Image URL ── */}
        <Section title="Cover / Poster URL">
          <div className="space-y-3">
            <div className="relative">
              <LinkIcon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                type="url"
                value={imageUrl}
                onChange={e => { setImageUrl(e.target.value); setPreviewOk(false); }}
                placeholder="วาง URL รูปภาพที่นี่ เช่น https://image.tmdb.org/..."
                className="pl-9 pr-10"
              />
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => { setImageUrl(""); setPreviewOk(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {imageUrl.trim() ? (
              <div className={clsx(
                "relative rounded-2xl overflow-hidden border",
                previewOk ? "border-[var(--accent)]/40" : "border-[var(--border)]",
              )}>
                <div className="flex items-center justify-center bg-[var(--card)]" style={{ minHeight: 180 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="preview"
                    className="max-h-48 max-w-full object-contain p-2"
                    onLoad={() => setPreviewOk(true)}
                    onError={() => setPreviewOk(false)}
                  />
                  {!previewOk && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <ImageIcon size={28} className="text-[var(--border)]" />
                      <p className="text-xs text-[var(--text-muted)]">โหลดรูปไม่ได้ — ตรวจสอบ URL อีกครั้ง</p>
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
              <div className="h-24 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center gap-2 text-[var(--text-muted)]">
                <ImageIcon size={18} />
                <span className="text-sm">ตัวอย่างรูปจะแสดงที่นี่</span>
              </div>
            )}

            <p className="text-[11px] text-[var(--text-muted)]">
              💡 คัดลอก URL จาก TMDB, MyAnimeList หรือ Google Images (คลิกขวาที่รูป → คัดลอก URL รูปภาพ)
            </p>
          </div>
        </Section>

        {/* ── Media Type ── */}
        <Section title="Media Type">
          <div className="grid grid-cols-4 gap-3">
            {MEDIA_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={clsx(
                  "flex flex-col items-center gap-2 py-4 rounded-2xl border-2 font-semibold text-sm transition-all",
                  form.type === t
                    ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--card)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)]",
                )}
              >
                <span className={clsx("transition-transform", form.type === t && "scale-125")}>
                  {TYPE_ICONS[t]}
                </span>
                <span className="text-xs">{TYPE_LABELS[t].replace("TV Series", "TV")}</span>
              </button>
            ))}
          </div>
        </Section>

        {/* ── Details ── */}
        <Section title="Details">
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Enter title…"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <SelectField value={form.status} onChange={e => set("status", e.target.value as MediaStatus)}>
                {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </SelectField>
            </div>
            <div>
              <Label>Release Year</Label>
              <Input
                type="number"
                value={form.release_year ?? ""}
                onChange={e => set("release_year", e.target.value ? Number(e.target.value) : null)}
                placeholder="2024" min={1800} max={2100}
              />
            </div>
          </div>
          <div>
            <Label>Genre (comma-separated)</Label>
            <Input
              value={form.genre}
              onChange={e => set("genre", e.target.value)}
              placeholder="Action, Drama, Sci-Fi…"
              list="genre-suggestions"
            />
            <datalist id="genre-suggestions">
              {GENRES.map(g => <option key={g} value={g} />)}
            </datalist>
          </div>
        </Section>

        {/* ── Rating ── */}
        <Section title="Your Rating">
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex gap-2" onMouseLeave={() => setHover(null)}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onClick={() => set("rating", form.rating === n ? null : n)}
                  className="transition-transform hover:scale-125 active:scale-110"
                >
                  <Star
                    size={36}
                    className={clsx(
                      "transition-colors duration-100",
                      n <= ratingDisplay ? "fill-yellow-400 text-yellow-400" : "text-[var(--border)] fill-[var(--border)]",
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-[var(--text-muted)] h-5">
              {ratingDisplay > 0 ? ["", "Poor", "Fair", "Good", "Great", "Masterpiece"][ratingDisplay] : "Click to rate"}
            </p>
          </div>
        </Section>

        {/* ── Movie / TV ── */}
        {(form.type === "movie" || form.type === "tv") && (
          <Section title="Watch Details">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Platform</Label>
                <SelectField value={form.platform} onChange={e => set("platform", e.target.value as Platform | "")}>
                  <option value="">Select platform…</option>
                  <optgroup label="🎬 โรงหนัง">
                    <option value="MajorCineplex">MajorCineplex</option>
                    <option value="SF Cinema">SF Cinema</option>
                    <option value="House Samyan">House Samyan</option>
                  </optgroup>
                  <optgroup label="📺 Streaming">
                    <option value="Netflix">Netflix</option>
                    <option value="Disney+">Disney+</option>
                    <option value="HBO">HBO</option>
                    <option value="Amazon Prime">Amazon Prime</option>
                    <option value="Apple TV+">Apple TV+</option>
                    <option value="YouTube">YouTube</option>
                    <option value="iQiyi">iQiyi</option>
                    <option value="WeTV">WeTV</option>
                    <option value="MonoMax">MonoMax</option>
                  </optgroup>
                  <optgroup label="อื่น ๆ">
                    <option value="Other">Other</option>
                  </optgroup>
                </SelectField>
              </div>
              <div>
                <Label>Watched With</Label>
                <SelectField
                  value={watchedWithType}
                  onChange={e => {
                    setWatchedWithType(e.target.value);
                    if (e.target.value === "Solo") setWatchedWithNames("");
                  }}
                >
                  {WATCHED_WITH_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </SelectField>
              </div>
            </div>

            {/* ช่องกรอกชื่อ — แสดงเมื่อไม่ใช่ Solo */}
            {watchedWithType !== "Solo" && (
              <div>
                <Label>ชื่อคนที่ไปดูด้วย</Label>
                <Input
                  value={watchedWithNames}
                  onChange={e => setWatchedWithNames(e.target.value)}
                  placeholder="เช่น มิ้ง, โบ, เจน…"
                />
              </div>
            )}

            <div>
              <Label>Watch Date</Label>
              <Input type="date" value={form.watched_date} onChange={e => set("watched_date", e.target.value)} />
            </div>
            {form.type === "tv" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Episode</Label>
                  <Input type="number" value={form.current_episode ?? ""} onChange={e => set("current_episode", e.target.value ? Number(e.target.value) : null)} placeholder="0" min={0} />
                </div>
                <div>
                  <Label>Total Episodes</Label>
                  <Input type="number" value={form.episodes ?? ""} onChange={e => set("episodes", e.target.value ? Number(e.target.value) : null)} placeholder="24" min={0} />
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ── Book / Manga ── */}
        {(form.type === "book" || form.type === "manga") && (
          <Section title={`${TYPE_LABELS[form.type]} Details`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Author</Label>
                <Input value={form.author} onChange={e => set("author", e.target.value)} placeholder="Author name…" />
              </div>
              <div>
                <Label>Publisher</Label>
                <Input value={form.publisher} onChange={e => set("publisher", e.target.value)} placeholder="Publisher…" />
              </div>
            </div>
            {form.type === "manga" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Current Chapter</Label>
                  <Input type="number" value={form.current_chapter ?? ""} onChange={e => set("current_chapter", e.target.value ? Number(e.target.value) : null)} placeholder="0" min={0} />
                </div>
                <div>
                  <Label>Total Chapters</Label>
                  <Input type="number" value={form.total_chapters ?? ""} onChange={e => set("total_chapters", e.target.value ? Number(e.target.value) : null)} placeholder="400" min={0} />
                </div>
              </div>
            )}
          </Section>
        )}

        {/* ── Notes ── */}
        <Section title="Notes">
          <textarea
            value={form.notes}
            onChange={e => set("notes", e.target.value)}
            placeholder="Your personal thoughts…"
            rows={4}
            className={clsx(
              "w-full px-4 py-3 rounded-xl text-sm resize-none",
              "bg-[var(--card)] border border-[var(--border)]",
              "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
              "focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all",
            )}
          />
        </Section>

        {/* ── Submit ── */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--card)] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-[2] flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-bold bg-[var(--accent)] text-black hover:opacity-90 transition-all shadow-lg shadow-[var(--accent-glow)] disabled:opacity-50"
          >
            {saving ? <><Loader2 size={18} className="animate-spin" /> Saving…</> : <>+ Add to Library</>}
          </button>
        </div>
      </form>
    </div>
  );
}

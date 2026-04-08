"use client";
// src/components/Dashboard.tsx

import { useDashboardStats } from "@/hooks/useMedia";
import { MediaCard, MediaCardSkeleton } from "@/components/media/MediaCard";
import {
  Film, Tv2, BookOpen, BookMarked, Star,
  Calendar, Monitor, Tag, TrendingUp,
} from "lucide-react";
import clsx from "clsx";

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:    string;
  value:    string | number;
  icon:     React.ReactNode;
  sub?:     string;
  accent?:  boolean;
  delay?:   number;
}

function StatCard({ label, value, icon, sub, accent, delay = 0 }: StatCardProps) {
  return (
    <div
      className={clsx(
        "relative rounded-2xl p-5 border animate-fade-up overflow-hidden",
        accent
          ? "bg-[var(--accent)] text-black border-transparent"
          : "bg-[var(--card)] border-[var(--border)]",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background decoration */}
      <div className={clsx(
        "absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20",
        accent ? "bg-black" : "bg-[var(--accent)]",
      )} />

      <div className="relative">
        <div className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
          accent ? "bg-black/20" : "bg-[var(--accent-light)]",
        )}>
          <span className={accent ? "text-black" : "text-[var(--accent)]"}>{icon}</span>
        </div>

        <div className={clsx("text-3xl font-display font-bold tracking-tight",
          accent ? "text-black" : "text-[var(--text-primary)]")}>
          {value}
        </div>
        <div className={clsx("text-sm font-medium mt-0.5",
          accent ? "text-black/70" : "text-[var(--text-muted)]")}>
          {label}
        </div>
        {sub && (
          <div className={clsx("text-xs mt-2 font-semibold px-2 py-0.5 rounded-full inline-block",
            accent ? "bg-black/20 text-black" : "bg-[var(--accent-light)] text-[var(--accent)]")}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[var(--accent-light)] flex items-center justify-center">
        <span className="text-[var(--accent)]">{icon}</span>
      </div>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 font-semibold">Failed to load dashboard</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">Check your Supabase connection</p>
        </div>
      </div>
    );
  }

  const year = new Date().getFullYear();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-[var(--text-muted)] text-sm font-medium mb-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Your <span className="text-[var(--accent)]">Library</span>
        </h1>
        <p className="text-[var(--text-muted)] mt-1">Here's your personal entertainment overview.</p>
      </div>

      {/* Main stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl skeleton h-36" />
          ))
        ) : (
          <>
            <StatCard label="Movies"    value={stats!.totalMovies} icon={<Film size={18} />}      delay={0}   />
            <StatCard label="TV Series" value={stats!.totalTV}     icon={<Tv2 size={18} />}       delay={50}  />
            <StatCard label="Books"     value={stats!.totalBooks}  icon={<BookOpen size={18} />}  delay={100} />
            <StatCard label="Manga"     value={stats!.totalManga}  icon={<BookMarked size={18} />} delay={150} />
          </>
        )}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl skeleton h-36" />
          ))
        ) : (
          <>
            <StatCard
              label="Watched this year"
              value={stats!.watchedThisYear}
              icon={<Calendar size={18} />}
              sub={String(year)}
              accent
              delay={200}
            />
            <StatCard
              label="Read this year"
              value={stats!.readThisYear}
              icon={<TrendingUp size={18} />}
              sub={String(year)}
              delay={250}
            />
            <StatCard
              label="Avg Rating"
              value={stats!.avgRating ? stats!.avgRating.toFixed(1) : "—"}
              icon={<Star size={18} />}
              sub="out of 5"
              delay={300}
            />
            <StatCard
              label="Top Platform"
              value={stats!.topPlatform ?? "—"}
              icon={<Monitor size={18} />}
              sub="most used"
              delay={350}
            />
          </>
        )}
      </div>

      {/* Genre insight */}
      {!isLoading && stats?.topGenre && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] animate-fade-up" style={{ animationDelay: "400ms" }}>
          <Tag size={18} className="text-[var(--accent)] shrink-0" />
          <div>
            <span className="text-[var(--text-muted)] text-sm">Your favourite genre is </span>
            <span className="font-display font-bold text-[var(--accent)]">{stats.topGenre}</span>
          </div>
        </div>
      )}

      {/* Recently added */}
      <div>
        <SectionHeader title="Recently Added" icon={<TrendingUp size={14} />} />
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <MediaCardSkeleton key={i} />)}
          </div>
        ) : stats?.recentlyAdded?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {stats.recentlyAdded.map((item, i) => (
              <div key={item.id} style={{ animationDelay: `${i * 50}ms` }}>
                <MediaCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No items yet — start adding to your library!" />
        )}
      </div>

      {/* Top rated */}
      <div>
        <SectionHeader title="Top Rated" icon={<Star size={14} />} />
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <MediaCardSkeleton key={i} />)}
          </div>
        ) : stats?.topRated?.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {stats.topRated.map((item, i) => (
              <div key={item.id} style={{ animationDelay: `${i * 50}ms` }}>
                <MediaCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Rate some items to see them here!" />
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-32 rounded-2xl border border-dashed border-[var(--border)]">
      <p className="text-[var(--text-muted)] text-sm">{message}</p>
    </div>
  );
}

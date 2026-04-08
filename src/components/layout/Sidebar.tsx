"use client";
// src/components/layout/Sidebar.tsx

import Link           from "next/link";
import { usePathname } from "next/navigation";
import { useState }   from "react";
import {
  Film, Tv2, BookOpen, BookMarked, Trophy,
  LayoutDashboard, Menu, X, Sun, Moon,
  Clapperboard, Plus,
} from "lucide-react";
import { useTheme }   from "@/contexts/ThemeContext";
import clsx           from "clsx";

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",        label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { href: "/movies",  label: "Movies",    icon: <Film size={18} />            },
  { href: "/tv",      label: "TV Series", icon: <Tv2 size={18} />             },
  { href: "/books",   label: "Books",     icon: <BookOpen size={18} />        },
  { href: "/manga",   label: "Manga",     icon: <BookMarked size={18} />      },
  { href: "/ranking", label: "Ranking",   icon: <Trophy size={18} />          },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname    = usePathname();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--sidebar-border)]">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={onClose}>
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
            <Clapperboard size={16} className="text-black" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            Media<span className="text-[var(--accent)]">Log</span>
          </span>
        </Link>
        {/* Mobile close */}
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Add button */}
      <div className="px-4 pt-4">
        <Link
          href="/add"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:opacity-90 transition-all hover:shadow-lg hover:shadow-[var(--accent-glow)] active:scale-95"
        >
          <Plus size={16} />
          Add New
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
          Library
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent)]/20"
                  : "text-[var(--text-muted)] hover:bg-[var(--border)]/50 hover:text-[var(--text-primary)]",
              )}
            >
              <span className={clsx("transition-transform", isActive && "scale-110")}>
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: theme toggle + version */}
      <div className="px-4 pb-5 border-t border-[var(--sidebar-border)] pt-4 space-y-3">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--border)]/50 hover:text-[var(--text-primary)] transition-all"
        >
          {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-400" />}
          {isDark ? "Light Mode" : "Dark Mode"}
          {/* Toggle pill */}
          <span className="ml-auto relative inline-flex h-5 w-9 items-center rounded-full transition-colors bg-[var(--border)]">
            <span className={clsx(
              "inline-block h-3.5 w-3.5 rounded-full bg-[var(--accent)] shadow transition-transform",
              isDark ? "translate-x-4" : "translate-x-1",
            )} />
          </span>
        </button>

        <p className="text-center text-[10px] text-[var(--text-muted)]">
          MediaLog v1.0 · Built with ♥
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 flex-col bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] z-40 transition-colors duration-300">
        <SidebarContent />
      </aside>

      {/* Mobile: Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-lg text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile: Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile: Drawer */}
      <aside className={clsx(
        "lg:hidden fixed left-0 top-0 h-full w-72 z-50 flex flex-col",
        "bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] shadow-2xl",
        "transition-transform duration-300",
        open ? "translate-x-0" : "-translate-x-full",
      )}>
        <SidebarContent onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}

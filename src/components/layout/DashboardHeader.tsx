"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Plus,
  ClipboardCheck,
  Heart,
} from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { SearchModal } from "@/components/search";

interface DashboardHeaderProps {
  userName?: string | null;
  userImage?: string | null;
}

export function DashboardHeader({ userName, userImage }: DashboardHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="glass-card border-0 border-b border-white/10 rounded-none">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Book Manager</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/books/new"
              className="btn-primary flex items-center gap-2 py-2 px-3 sm:px-4"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">本を追加</span>
            </Link>

            <Link
              href="/inventory"
              className="btn-secondary flex items-center gap-2 py-2 px-3 sm:px-4"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">点検</span>
            </Link>

            <Link
              href="/wanted"
              className="btn-secondary flex items-center gap-2 py-2 px-3 sm:px-4"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">欲しい本</span>
            </Link>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="btn-secondary flex items-center gap-2 py-2 px-3 sm:px-4"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">検索</span>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded bg-white/10 text-text-muted ml-1">
                <span className="text-[9px]">⌘</span>K
              </kbd>
            </button>

            <div className="flex items-center gap-3">
              {userImage && (
                <img
                  src={userImage}
                  alt={userName || "User"}
                  className="w-8 h-8 rounded-full border border-white/20"
                />
              )}
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <SearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </>
  );
}

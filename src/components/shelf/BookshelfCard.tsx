"use client";

import Link from "next/link";
import { BookOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface BookshelfCardProps {
  id: string;
  name: string;
  memo?: string | null;
  bookCount: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function BookshelfCard({
  id,
  name,
  memo,
  bookCount,
  onEdit,
  onDelete,
}: BookshelfCardProps) {
  return (
    <div className="shelf-card group relative">
      {/* Accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-cyan to-accent-purple" />

      <div className="flex items-start justify-between">
        <Link href={`/shelves/${id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-accent-cyan shelf-icon" />
            </div>
            <h3 className="text-lg font-semibold truncate group-hover:text-accent-cyan transition-colors">
              {name}
            </h3>
          </div>

          {memo && (
            <p className="text-text-secondary text-sm mb-3 line-clamp-2">
              {memo}
            </p>
          )}

          <div className="flex items-center gap-2 text-text-muted text-sm">
            <BookOpen className="w-4 h-4" />
            <span>{bookCount}冊</span>
          </div>
        </Link>

        {/* Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="メニュー"
            >
              <MoreVertical className="w-5 h-5 text-text-secondary" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="glass-card-elevated min-w-[160px] p-1 z-50"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-white/10 outline-none"
                onSelect={() => onEdit?.(id)}
              >
                <Pencil className="w-4 h-4" />
                編集
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-white/10 text-accent-pink outline-none"
                onSelect={() => onDelete?.(id)}
              >
                <Trash2 className="w-4 h-4" />
                削除
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  );
}

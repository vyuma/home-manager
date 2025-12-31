"use client";

import { useState } from "react";
import { BookOpen, MoreVertical, FolderPlus, Trash2, Loader2 } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { parseAuthors } from "@/types/book";

interface UnshelvedBookCardProps {
  id: string;
  book: {
    id: string;
    title: string;
    authors: string;
    coverImageUrl: string | null;
  };
  onShelve: (id: string) => void;
  onDelete: (id: string) => void;
}

export function UnshelvedBookCard({
  id,
  book,
  onShelve,
  onDelete,
}: UnshelvedBookCardProps) {
  const authors = parseAuthors(book.authors);

  return (
    <div className="glass-card p-3 flex gap-3 group">
      {/* Book Cover */}
      <div className="w-16 flex-shrink-0">
        <div className="aspect-[2/3] rounded-lg bg-bg-tertiary overflow-hidden">
          {book.coverImageUrl ? (
            <img
              src={book.coverImageUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-text-muted" />
            </div>
          )}
        </div>
      </div>

      {/* Book Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h4 className="font-medium text-sm line-clamp-2">{book.title}</h4>
        {authors.length > 0 && (
          <p className="text-text-muted text-xs mt-1 truncate">
            {authors.join(", ")}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onShelve(id)}
          className="p-2 rounded-lg bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 transition-colors"
          title="本棚に配置"
        >
          <FolderPlus className="w-4 h-4" />
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="メニュー"
            >
              <MoreVertical className="w-4 h-4 text-text-secondary" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="glass-card-elevated min-w-[140px] p-1 z-50"
              sideOffset={5}
              align="end"
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer hover:bg-white/10 text-accent-pink outline-none"
                onSelect={() => onDelete(id)}
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

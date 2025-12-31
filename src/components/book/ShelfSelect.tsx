"use client";

import { useEffect, useState } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check, BookOpen, Loader2 } from "lucide-react";

interface Bookshelf {
  id: string;
  name: string;
  _count?: {
    ownedBooks: number;
  };
}

interface ShelfSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ShelfSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "本棚を選択",
}: ShelfSelectProps) {
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookshelves() {
      try {
        const response = await fetch("/api/shelves");
        if (!response.ok) {
          throw new Error("Failed to fetch bookshelves");
        }
        const data = await response.json();
        setBookshelves(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "エラーが発生しました");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBookshelves();
  }, []);

  if (isLoading) {
    return (
      <div className="input-glass flex items-center justify-center py-3">
        <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="input-glass text-accent-pink text-sm py-3 px-4">
        {error}
      </div>
    );
  }

  if (bookshelves.length === 0) {
    return (
      <div className="input-glass text-text-secondary text-sm py-3 px-4">
        本棚がありません。先に本棚を作成してください。
      </div>
    );
  }

  const selectedShelf = bookshelves.find((shelf) => shelf.id === value);

  return (
    <Select.Root value={value} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        className="input-glass flex items-center justify-between w-full py-3 px-4 data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
        aria-label="本棚を選択"
      >
        <Select.Value placeholder={placeholder}>
          {selectedShelf ? (
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent-cyan" />
              {selectedShelf.name}
            </span>
          ) : (
            <span className="text-text-muted">{placeholder}</span>
          )}
        </Select.Value>
        <Select.Icon>
          <ChevronDown className="w-5 h-5 text-text-muted" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="glass-card-elevated overflow-hidden z-50 min-w-[200px]"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {bookshelves.map((shelf) => (
              <Select.Item
                key={shelf.id}
                value={shelf.id}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 outline-none data-[highlighted]:bg-white/10 data-[state=checked]:text-accent-cyan"
              >
                <Select.ItemIndicator className="w-4">
                  <Check className="w-4 h-4" />
                </Select.ItemIndicator>
                <BookOpen className="w-4 h-4" />
                <Select.ItemText>{shelf.name}</Select.ItemText>
                {shelf._count && (
                  <span className="ml-auto text-text-muted text-xs">
                    {shelf._count.ownedBooks}冊
                  </span>
                )}
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

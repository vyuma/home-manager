"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, BookOpen, Loader2, Heart, Check } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { parseAuthors, READING_STATUS_LABELS } from "@/types/book";
import type { ReadingStatus } from "@prisma/client";

interface Book {
  id: string;
  title: string;
  authors: string | null;
  coverImageUrl: string | null;
  isbn: string | null;
}

interface OwnedBook {
  id: string;
  book: Book;
  bookshelf: { id: string; name: string };
  readingStatus: ReadingStatus;
}

interface WantedBook {
  id: string;
  book: Book;
}

interface UnshelvedBook {
  id: string;
  book: Book;
}

interface SearchResult {
  type: "owned" | "wanted" | "unshelved";
  item: OwnedBook | WantedBook | UnshelvedBook;
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const [ownedRes, wantedRes, unshelvedRes] = await Promise.all([
        fetch("/api/owned-books"),
        fetch("/api/wanted-books"),
        fetch("/api/unshelved-books"),
      ]);

      const searchResults: SearchResult[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      if (ownedRes.ok) {
        const ownedBooks: OwnedBook[] = await ownedRes.json();
        ownedBooks.forEach((item) => {
          const authors = parseAuthors(item.book.authors);
          if (
            item.book.title.toLowerCase().includes(lowerQuery) ||
            authors.some((a) => a.toLowerCase().includes(lowerQuery)) ||
            item.book.isbn?.includes(searchQuery)
          ) {
            searchResults.push({ type: "owned", item });
          }
        });
      }

      if (wantedRes.ok) {
        const wantedBooks: WantedBook[] = await wantedRes.json();
        wantedBooks.forEach((item) => {
          const authors = parseAuthors(item.book.authors);
          if (
            item.book.title.toLowerCase().includes(lowerQuery) ||
            authors.some((a) => a.toLowerCase().includes(lowerQuery)) ||
            item.book.isbn?.includes(searchQuery)
          ) {
            searchResults.push({ type: "wanted", item });
          }
        });
      }

      if (unshelvedRes.ok) {
        const unshelvedBooks: UnshelvedBook[] = await unshelvedRes.json();
        unshelvedBooks.forEach((item) => {
          const authors = parseAuthors(item.book.authors);
          if (
            item.book.title.toLowerCase().includes(lowerQuery) ||
            authors.some((a) => a.toLowerCase().includes(lowerQuery)) ||
            item.book.isbn?.includes(searchQuery)
          ) {
            searchResults.push({ type: "unshelved", item });
          }
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    },
    [performSearch]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const getTypeBadge = (type: SearchResult["type"]) => {
    switch (type) {
      case "owned":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-accent-cyan/20 text-accent-cyan">
            所有
          </span>
        );
      case "wanted":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-accent-pink/20 text-accent-pink flex items-center gap-1">
            <Heart className="w-3 h-3" />
            欲しい
          </span>
        );
      case "unshelved":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-accent-purple/20 text-accent-purple">
            未確定
          </span>
        );
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" />
        <Dialog.Content className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-2xl max-h-[80vh] z-50 animate-slide-up">
          <div className="glass-card-elevated mx-4 overflow-hidden">
            {/* Search Input */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="タイトル、著者、ISBNで検索..."
                  className="input-glass w-full pl-12 pr-12 py-3"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-text-muted" />
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isSearching ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-accent-cyan mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">検索中...</p>
                </div>
              ) : query && results.length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-text-secondary">
                    「{query}」に一致する本が見つかりませんでした
                  </p>
                </div>
              ) : results.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {results.map((result) => {
                    const book = result.item.book;
                    const authors = parseAuthors(book.authors);

                    return (
                      <div
                        key={`${result.type}-${result.item.id}`}
                        className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => onOpenChange(false)}
                      >
                        <div className="flex gap-3">
                          {/* Book Cover */}
                          <div className="w-12 flex-shrink-0">
                            <div className="aspect-[2/3] rounded-lg bg-bg-tertiary overflow-hidden">
                              {book.coverImageUrl ? (
                                <img
                                  src={book.coverImageUrl}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-5 h-5 text-text-muted" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Book Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <h4 className="font-medium text-sm line-clamp-1 flex-1">
                                {book.title}
                              </h4>
                              {getTypeBadge(result.type)}
                            </div>
                            {authors.length > 0 && (
                              <p className="text-text-muted text-xs truncate mb-1">
                                {authors.join(", ")}
                              </p>
                            )}
                            {result.type === "owned" && (
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-text-muted">
                                  {(result.item as OwnedBook).bookshelf.name}
                                </span>
                                <span
                                  className={`status-badge ${
                                    (result.item as OwnedBook).readingStatus ===
                                    "COMPLETED"
                                      ? "status-completed"
                                      : (result.item as OwnedBook)
                                          .readingStatus === "READING"
                                      ? "status-reading"
                                      : "status-not-read"
                                  }`}
                                >
                                  {
                                    READING_STATUS_LABELS[
                                      (result.item as OwnedBook).readingStatus
                                    ]
                                  }
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">
                    本を検索してください
                  </p>
                  <p className="text-text-muted text-xs mt-1">
                    所有本・欲しい本・未確定の本を検索できます
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs text-text-muted">
              <div className="flex items-center gap-4">
                <span>{results.length}件の結果</span>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="px-3 py-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ESC で閉じる
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

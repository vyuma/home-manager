"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  AlertCircle,
  Loader2,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import * as Select from "@radix-ui/react-select";
import { BarcodeScanner } from "@/components/scanner";
import { useToast } from "@/components/ui/Toast";
import { parseAuthors, READING_STATUS_LABELS } from "@/types/book";
import type { ReadingStatus } from "@prisma/client";

interface Bookshelf {
  id: string;
  name: string;
  _count: {
    ownedBooks: number;
  };
}

interface ScannedBook {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  coverImageUrl: string | null;
  readingStatus: ReadingStatus;
  ownedBookId: string;
  found: boolean;
  isNew?: boolean;
}

export default function InventoryPage() {
  const { success, error: showError, info } = useToast();

  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<string>("");
  const [isLoadingShelves, setIsLoadingShelves] = useState(true);
  const [scannedBooks, setScannedBooks] = useState<ScannedBook[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch bookshelves on mount
  useEffect(() => {
    async function fetchBookshelves() {
      try {
        const response = await fetch("/api/shelves");
        if (response.ok) {
          const data = await response.json();
          setBookshelves(data);
          if (data.length > 0) {
            setSelectedShelfId(data[0].id);
          }
        }
      } catch {
        showError("本棚の取得に失敗しました");
      } finally {
        setIsLoadingShelves(false);
      }
    }
    fetchBookshelves();
  }, [showError]);

  const handleScan = useCallback(
    async (isbn: string) => {
      if (!selectedShelfId || isSearching) return;

      // Check if already scanned
      const alreadyScanned = scannedBooks.some((b) => b.isbn === isbn);
      if (alreadyScanned) {
        info("この本は既にスキャン済みです");
        return;
      }

      setIsSearching(true);

      try {
        // Search for the book in the selected bookshelf
        const response = await fetch(
          `/api/owned-books?bookshelfId=${selectedShelfId}`
        );

        if (!response.ok) {
          throw new Error("検索に失敗しました");
        }

        const ownedBooks = await response.json();

        // Find the book by ISBN
        const foundBook = ownedBooks.find(
          (ob: { book: { isbn: string | null } }) => ob.book.isbn === isbn
        );

        if (foundBook) {
          const newScannedBook: ScannedBook = {
            id: foundBook.book.id,
            isbn,
            title: foundBook.book.title,
            authors: parseAuthors(foundBook.book.authors),
            coverImageUrl: foundBook.book.coverImageUrl,
            readingStatus: foundBook.readingStatus,
            ownedBookId: foundBook.id,
            found: true,
            isNew: true,
          };

          setScannedBooks((prev) => [newScannedBook, ...prev]);
          success("本を確認しました", foundBook.book.title);

          // Remove isNew flag after animation
          setTimeout(() => {
            setScannedBooks((prev) =>
              prev.map((b) => (b.isbn === isbn ? { ...b, isNew: false } : b))
            );
          }, 1000);
        } else {
          // Book not found in this shelf, search in all user's books
          const allBooksResponse = await fetch("/api/owned-books");
          if (allBooksResponse.ok) {
            const allBooks = await allBooksResponse.json();
            const bookInOtherShelf = allBooks.find(
              (ob: { book: { isbn: string | null } }) => ob.book.isbn === isbn
            );

            if (bookInOtherShelf) {
              info(
                `この本は「${bookInOtherShelf.bookshelf.name}」にあります`,
                bookInOtherShelf.book.title
              );
            } else {
              // Check unshelved books
              const unshelvedResponse = await fetch("/api/unshelved-books");
              if (unshelvedResponse.ok) {
                const unshelvedBooks = await unshelvedResponse.json();
                const bookInUnshelved = unshelvedBooks.find(
                  (ub: { book: { isbn: string | null } }) =>
                    ub.book.isbn === isbn
                );

                if (bookInUnshelved) {
                  info(
                    "この本は「未確定の本」にあります",
                    bookInUnshelved.book.title
                  );
                } else {
                  showError("この本は登録されていません", `ISBN: ${isbn}`);
                }
              }
            }
          }
        }
      } catch (err) {
        showError(
          "検索に失敗しました",
          err instanceof Error ? err.message : undefined
        );
      } finally {
        setIsSearching(false);
      }
    },
    [selectedShelfId, scannedBooks, isSearching, success, info, showError]
  );

  const handleStatusChange = useCallback(
    async (ownedBookId: string, newStatus: ReadingStatus) => {
      try {
        const response = await fetch(`/api/owned-books/${ownedBookId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readingStatus: newStatus }),
        });

        if (!response.ok) {
          throw new Error("更新に失敗しました");
        }

        setScannedBooks((prev) =>
          prev.map((b) =>
            b.ownedBookId === ownedBookId
              ? { ...b, readingStatus: newStatus }
              : b
          )
        );

        success("読書状況を更新しました");
      } catch (err) {
        showError(
          "更新に失敗しました",
          err instanceof Error ? err.message : undefined
        );
      }
    },
    [success, showError]
  );

  const handleReset = useCallback(() => {
    setScannedBooks([]);
  }, []);

  const selectedShelf = bookshelves.find((s) => s.id === selectedShelfId);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-0 border-b border-white/10 rounded-none">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">蔵書点検</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Bookshelf Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            点検する本棚
          </label>
          {isLoadingShelves ? (
            <div className="input-glass flex items-center justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : bookshelves.length === 0 ? (
            <div className="input-glass text-text-secondary text-sm py-3 px-4">
              本棚がありません。先に本棚を作成してください。
            </div>
          ) : (
            <Select.Root
              value={selectedShelfId}
              onValueChange={setSelectedShelfId}
            >
              <Select.Trigger className="input-glass flex items-center justify-between w-full py-3 px-4">
                <Select.Value>
                  {selectedShelf ? (
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-accent-cyan" />
                      {selectedShelf.name}
                      <span className="text-text-muted text-sm">
                        ({selectedShelf._count.ownedBooks}冊)
                      </span>
                    </span>
                  ) : (
                    <span className="text-text-muted">本棚を選択</span>
                  )}
                </Select.Value>
                <Select.Icon>
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content
                  className="glass-card-elevated overflow-hidden z-50"
                  position="popper"
                  sideOffset={4}
                >
                  <Select.Viewport className="p-1">
                    {bookshelves.map((shelf) => (
                      <Select.Item
                        key={shelf.id}
                        value={shelf.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 outline-none data-[highlighted]:bg-white/10"
                      >
                        <Select.ItemIndicator className="w-4">
                          <Check className="w-4 h-4" />
                        </Select.ItemIndicator>
                        <BookOpen className="w-4 h-4" />
                        <Select.ItemText>{shelf.name}</Select.ItemText>
                        <span className="ml-auto text-text-muted text-xs">
                          {shelf._count.ownedBooks}冊
                        </span>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          )}
        </div>

        {/* Scanner */}
        {selectedShelfId && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-secondary">
                バーコードスキャン
              </span>
              {isSearching && (
                <span className="flex items-center gap-1 text-xs text-accent-cyan">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  検索中...
                </span>
              )}
            </div>
            <BarcodeScanner onScan={handleScan} continuous paused={isSearching} />
          </div>
        )}

        {/* Scanned Books List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              点検済み ({scannedBooks.length}冊)
            </h2>
            {scannedBooks.length > 0 && (
              <button
                onClick={handleReset}
                className="btn-secondary py-1 px-3 text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                リセット
              </button>
            )}
          </div>

          {scannedBooks.length === 0 ? (
            <div className="glass-card p-6 text-center text-text-secondary">
              <p>本をスキャンして点検を開始してください</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scannedBooks.map((book) => (
                <div
                  key={book.isbn}
                  className={`glass-card p-3 flex gap-3 transition-all ${
                    book.isNew
                      ? "ring-2 ring-accent-green animate-pulse"
                      : ""
                  }`}
                >
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
                    <div className="flex items-start gap-2">
                      {book.found ? (
                        <Check className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-accent-pink flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {book.title}
                        </h4>
                        {book.authors.length > 0 && (
                          <p className="text-text-muted text-xs truncate">
                            {book.authors.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Status Change */}
                  <div className="flex-shrink-0">
                    <Select.Root
                      value={book.readingStatus}
                      onValueChange={(val) =>
                        handleStatusChange(book.ownedBookId, val as ReadingStatus)
                      }
                    >
                      <Select.Trigger className="py-1 px-2 rounded-lg bg-bg-tertiary hover:bg-white/10 transition-colors">
                        <span
                          className={`status-badge text-xs ${
                            book.readingStatus === "COMPLETED"
                              ? "status-completed"
                              : book.readingStatus === "READING"
                              ? "status-reading"
                              : "status-not-read"
                          }`}
                        >
                          {READING_STATUS_LABELS[book.readingStatus]}
                        </span>
                      </Select.Trigger>

                      <Select.Portal>
                        <Select.Content
                          className="glass-card-elevated overflow-hidden z-50"
                          position="popper"
                          sideOffset={4}
                          align="end"
                        >
                          <Select.Viewport className="p-1">
                            {(
                              Object.keys(
                                READING_STATUS_LABELS
                              ) as ReadingStatus[]
                            ).map((status) => (
                              <Select.Item
                                key={status}
                                value={status}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 outline-none text-sm"
                              >
                                <Select.ItemIndicator className="w-3">
                                  <Check className="w-3 h-3" />
                                </Select.ItemIndicator>
                                <span
                                  className={`status-badge text-xs ${
                                    status === "COMPLETED"
                                      ? "status-completed"
                                      : status === "READING"
                                      ? "status-reading"
                                      : "status-not-read"
                                  }`}
                                >
                                  {READING_STATUS_LABELS[status]}
                                </span>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

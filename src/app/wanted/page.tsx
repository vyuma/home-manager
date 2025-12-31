"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Heart,
  ShoppingCart,
  Trash2,
  Loader2,
  ExternalLink,
  ChevronDown,
  Check,
} from "lucide-react";
import * as Select from "@radix-ui/react-select";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { useToast } from "@/components/ui/Toast";
import { parseAuthors } from "@/types/book";

interface Book {
  id: string;
  title: string;
  authors: string | null;
  coverImageUrl: string | null;
  isbn: string | null;
}

interface WantedBook {
  id: string;
  bookId: string;
  book: Book;
  createdAt: string;
}

interface Bookshelf {
  id: string;
  name: string;
}

export default function WantedBooksPage() {
  const { success, error: showError } = useToast();

  const [wantedBooks, setWantedBooks] = useState<WantedBook[]>([]);
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch wanted books and bookshelves
  useEffect(() => {
    async function fetchData() {
      try {
        const [wantedRes, shelvesRes] = await Promise.all([
          fetch("/api/wanted-books"),
          fetch("/api/shelves"),
        ]);

        if (wantedRes.ok) {
          const wantedData = await wantedRes.json();
          setWantedBooks(wantedData);
        }

        if (shelvesRes.ok) {
          const shelvesData = await shelvesRes.json();
          setBookshelves(shelvesData);
        }
      } catch {
        showError("データの取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [showError]);

  const handlePurchase = useCallback(
    async (wantedBookId: string, bookshelfId?: string) => {
      setPurchasingId(wantedBookId);

      try {
        const response = await fetch(
          `/api/wanted-books/${wantedBookId}/purchase`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookshelfId }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "購入処理に失敗しました");
        }

        const data = await response.json();

        // Remove from list
        setWantedBooks((prev) => prev.filter((wb) => wb.id !== wantedBookId));

        if (data.alreadyOwned) {
          success("この本は既に所有しています", "欲しい本リストから削除しました");
        } else if (data.alreadyUnshelved) {
          success("この本は既に未確定の本にあります", "欲しい本リストから削除しました");
        } else if (data.addedToShelf) {
          success("本を購入しました", `「${data.ownedBook.bookshelf.name}」に追加しました`);
        } else {
          success("本を購入しました", "未確定の本に追加しました");
        }
      } catch (err) {
        showError(
          "購入処理に失敗しました",
          err instanceof Error ? err.message : undefined
        );
      } finally {
        setPurchasingId(null);
      }
    },
    [success, showError]
  );

  const handleDelete = useCallback(
    async (wantedBookId: string) => {
      setDeletingId(wantedBookId);
      setDeleteConfirmId(null);

      try {
        const response = await fetch(`/api/wanted-books/${wantedBookId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("削除に失敗しました");
        }

        setWantedBooks((prev) => prev.filter((wb) => wb.id !== wantedBookId));
        success("欲しい本リストから削除しました");
      } catch (err) {
        showError(
          "削除に失敗しました",
          err instanceof Error ? err.message : undefined
        );
      } finally {
        setDeletingId(null);
      }
    },
    [success, showError]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-0 border-b border-white/10 rounded-none">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-accent-pink" />
            <h1 className="text-xl font-bold">欲しい本</h1>
          </div>
          <span className="ml-auto text-text-muted text-sm">
            {wantedBooks.length}冊
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {wantedBooks.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-bg-tertiary flex items-center justify-center">
              <Heart className="w-10 h-10 text-text-muted" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              欲しい本がありません
            </h2>
            <p className="text-text-secondary mb-6">
              本を検索して欲しい本リストに追加しましょう
            </p>
            <Link
              href="/books/new"
              className="btn-primary inline-flex items-center gap-2 py-3 px-6"
            >
              <BookOpen className="w-5 h-5" />
              本を探す
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {wantedBooks.map((wantedBook) => {
              const authors = parseAuthors(wantedBook.book.authors);
              const isPurchasing = purchasingId === wantedBook.id;
              const isDeleting = deletingId === wantedBook.id;

              return (
                <div
                  key={wantedBook.id}
                  className="glass-card p-4 flex gap-4"
                >
                  {/* Book Cover */}
                  <div className="w-20 flex-shrink-0">
                    <div className="aspect-[2/3] rounded-lg bg-bg-tertiary overflow-hidden">
                      {wantedBook.book.coverImageUrl ? (
                        <img
                          src={wantedBook.book.coverImageUrl}
                          alt={wantedBook.book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-text-muted" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold line-clamp-2 mb-1">
                      {wantedBook.book.title}
                    </h3>
                    {authors.length > 0 && (
                      <p className="text-text-secondary text-sm mb-2">
                        {authors.join(", ")}
                      </p>
                    )}
                    {wantedBook.book.isbn && (
                      <p className="text-text-muted text-xs mb-3">
                        ISBN: {wantedBook.book.isbn}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Quick Purchase to Unshelved */}
                      <button
                        onClick={() => handlePurchase(wantedBook.id)}
                        disabled={isPurchasing || isDeleting}
                        className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1.5"
                      >
                        {isPurchasing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-4 h-4" />
                        )}
                        購入した
                      </button>

                      {/* Purchase to specific shelf */}
                      {bookshelves.length > 0 && (
                        <Select.Root
                          onValueChange={(shelfId) =>
                            handlePurchase(wantedBook.id, shelfId)
                          }
                          disabled={isPurchasing || isDeleting}
                        >
                          <Select.Trigger className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            本棚に追加
                            <ChevronDown className="w-3 h-3" />
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
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 outline-none text-sm"
                                  >
                                    <Select.ItemIndicator className="w-4">
                                      <Check className="w-4 h-4" />
                                    </Select.ItemIndicator>
                                    <BookOpen className="w-4 h-4" />
                                    <Select.ItemText>{shelf.name}</Select.ItemText>
                                  </Select.Item>
                                ))}
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      )}

                      {/* Amazon Link */}
                      {wantedBook.book.isbn && (
                        <a
                          href={`https://www.amazon.co.jp/dp/${wantedBook.book.isbn}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1.5"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Amazon
                        </a>
                      )}

                      {/* Delete Button */}
                      <AlertDialog.Root
                        open={deleteConfirmId === wantedBook.id}
                        onOpenChange={(open) =>
                          setDeleteConfirmId(open ? wantedBook.id : null)
                        }
                      >
                        <AlertDialog.Trigger asChild>
                          <button
                            disabled={isPurchasing || isDeleting}
                            className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1.5 text-accent-pink hover:bg-accent-pink/20"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            削除
                          </button>
                        </AlertDialog.Trigger>

                        <AlertDialog.Portal>
                          <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                          <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-card-elevated p-6 w-full max-w-md z-50">
                            <AlertDialog.Title className="text-lg font-semibold mb-2">
                              欲しい本リストから削除
                            </AlertDialog.Title>
                            <AlertDialog.Description className="text-text-secondary mb-6">
                              「{wantedBook.book.title}」を欲しい本リストから削除しますか？
                            </AlertDialog.Description>
                            <div className="flex justify-end gap-3">
                              <AlertDialog.Cancel asChild>
                                <button className="btn-secondary py-2 px-4">
                                  キャンセル
                                </button>
                              </AlertDialog.Cancel>
                              <AlertDialog.Action asChild>
                                <button
                                  onClick={() => handleDelete(wantedBook.id)}
                                  className="btn-primary py-2 px-4 bg-accent-pink hover:bg-accent-pink/80"
                                >
                                  削除する
                                </button>
                              </AlertDialog.Action>
                            </div>
                          </AlertDialog.Content>
                        </AlertDialog.Portal>
                      </AlertDialog.Root>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

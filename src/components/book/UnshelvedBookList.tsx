"use client";

import { useState, useCallback } from "react";
import { Package, Loader2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { UnshelvedBookCard } from "./UnshelvedBookCard";
import { ShelfSelect } from "./ShelfSelect";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { parseAuthors } from "@/types/book";

interface UnshelvedBook {
  id: string;
  bookId: string;
  book: {
    id: string;
    title: string;
    authors: string;
    coverImageUrl: string | null;
  };
}

interface UnshelvedBookListProps {
  initialBooks: UnshelvedBook[];
}

export function UnshelvedBookList({ initialBooks }: UnshelvedBookListProps) {
  const { success, error: showError } = useToast();

  const [books, setBooks] = useState<UnshelvedBook[]>(initialBooks);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedShelfId, setSelectedShelfId] = useState<string>("");
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedBook = books.find((b) => b.id === selectedBookId);
  const deletingBook = books.find((b) => b.id === deletingBookId);

  const handleShelveClick = useCallback((id: string) => {
    setSelectedBookId(id);
    setSelectedShelfId("");
    setIsShelfModalOpen(true);
  }, []);

  const handleConfirmShelve = useCallback(async () => {
    if (!selectedBookId || !selectedShelfId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/unshelved-books/${selectedBookId}/shelve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookshelfId: selectedShelfId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "配置に失敗しました");
      }

      const book = books.find((b) => b.id === selectedBookId);
      success("本棚に配置しました", book?.book.title);

      setBooks((prev) => prev.filter((b) => b.id !== selectedBookId));
      setIsShelfModalOpen(false);
      setSelectedBookId(null);
      setSelectedShelfId("");
    } catch (err) {
      showError(
        "配置に失敗しました",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedBookId, selectedShelfId, books, success, showError]);

  const handleDelete = useCallback(async () => {
    if (!deletingBookId) return;

    const response = await fetch(`/api/unshelved-books/${deletingBookId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "削除に失敗しました");
    }

    const book = books.find((b) => b.id === deletingBookId);
    success("削除しました", book?.book.title);

    setBooks((prev) => prev.filter((b) => b.id !== deletingBookId));
    setDeletingBookId(null);
  }, [deletingBookId, books, success]);

  if (books.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-text-secondary">
        <p>未確定の本はありません</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {books.map((unshelvedBook) => (
          <UnshelvedBookCard
            key={unshelvedBook.id}
            id={unshelvedBook.id}
            book={unshelvedBook.book}
            onShelve={handleShelveClick}
            onDelete={setDeletingBookId}
          />
        ))}
      </div>

      {/* Shelf Selection Modal */}
      <Dialog.Root open={isShelfModalOpen} onOpenChange={setIsShelfModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay fixed inset-0 z-40" />
          <Dialog.Content className="modal-content fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 z-50">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold">
                本棚に配置
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="閉じる"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            {selectedBook && (
              <div className="flex gap-3 mb-6 p-3 rounded-xl bg-bg-tertiary/50">
                <div className="w-12 flex-shrink-0">
                  <div className="aspect-[2/3] rounded-lg bg-bg-tertiary overflow-hidden">
                    {selectedBook.book.coverImageUrl ? (
                      <img
                        src={selectedBook.book.coverImageUrl}
                        alt={selectedBook.book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5 text-text-muted" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2">
                    {selectedBook.book.title}
                  </h4>
                  <p className="text-text-muted text-xs mt-1">
                    {parseAuthors(selectedBook.book.authors).join(", ")}
                  </p>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                配置先の本棚
              </label>
              <ShelfSelect
                value={selectedShelfId}
                onChange={setSelectedShelfId}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3">
              <Dialog.Close asChild>
                <button
                  className="btn-secondary flex-1 py-3"
                  disabled={isLoading}
                >
                  キャンセル
                </button>
              </Dialog.Close>
              <button
                onClick={handleConfirmShelve}
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                disabled={!selectedShelfId || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    配置中...
                  </>
                ) : (
                  "配置する"
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deletingBookId}
        onOpenChange={(open) => !open && setDeletingBookId(null)}
        title="本を削除"
        description={
          deletingBook
            ? `「${deletingBook.book.title}」を未確定リストから削除しますか？`
            : ""
        }
        onConfirm={handleDelete}
      />
    </>
  );
}

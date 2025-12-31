"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  BookOpen,
  Loader2,
  Check,
  ChevronDown,
  Trash2,
  FolderMinus,
  FolderPlus,
} from "lucide-react";
import * as Select from "@radix-ui/react-select";
import { ShelfSelect } from "./ShelfSelect";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { parseAuthors, READING_STATUS_LABELS } from "@/types/book";
import type { ReadingStatus } from "@prisma/client";

interface OwnedBookDetail {
  id: string;
  bookId: string;
  bookshelfId: string;
  readingStatus: ReadingStatus;
  note: string | null;
  marathonPosted: boolean;
  book: {
    id: string;
    isbn: string | null;
    title: string;
    subtitle: string | null;
    authors: string;
    publisher: string | null;
    publishedDate: string | null;
    description: string | null;
    coverImageUrl: string | null;
    pageCount: number | null;
  };
  bookshelf: {
    id: string;
    name: string;
  };
}

interface BookDetailModalProps {
  ownedBook: OwnedBookDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

type DeleteType = "remove" | "unshelve" | "delete_all";

export function BookDetailModal({
  ownedBook,
  open,
  onOpenChange,
  onUpdate,
}: BookDetailModalProps) {
  const { success, error: showError } = useToast();

  const [readingStatus, setReadingStatus] = useState<ReadingStatus>("NOT_READ");
  const [bookshelfId, setBookshelfId] = useState("");
  const [note, setNote] = useState("");
  const [marathonPosted, setMarathonPosted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [deleteType, setDeleteType] = useState<DeleteType | null>(null);

  // Initialize form when ownedBook changes
  useEffect(() => {
    if (ownedBook) {
      setReadingStatus(ownedBook.readingStatus);
      setBookshelfId(ownedBook.bookshelfId);
      setNote(ownedBook.note || "");
      setMarathonPosted(ownedBook.marathonPosted);
      setHasChanges(false);
    }
  }, [ownedBook]);

  // Track changes
  useEffect(() => {
    if (ownedBook) {
      const changed =
        readingStatus !== ownedBook.readingStatus ||
        bookshelfId !== ownedBook.bookshelfId ||
        note !== (ownedBook.note || "") ||
        marathonPosted !== ownedBook.marathonPosted;
      setHasChanges(changed);
    }
  }, [ownedBook, readingStatus, bookshelfId, note, marathonPosted]);

  const handleSave = async () => {
    if (!ownedBook || !hasChanges) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/owned-books/${ownedBook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readingStatus,
          bookshelfId,
          note,
          marathonPosted,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "更新に失敗しました");
      }

      success("更新しました");
      onUpdate?.();
      onOpenChange(false);
    } catch (err) {
      showError(
        "更新に失敗しました",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!ownedBook || !deleteType) return;

    const response = await fetch(
      `/api/owned-books/${ownedBook.id}?type=${deleteType}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "削除に失敗しました");
    }

    const messages = {
      remove: "本棚から削除しました",
      unshelve: "未確定の本に移動しました",
      delete_all: "完全に削除しました",
    };

    success(messages[deleteType], ownedBook.book.title);
    setDeleteType(null);
    onUpdate?.();
    onOpenChange(false);
  };

  if (!ownedBook) return null;

  const authors = parseAuthors(ownedBook.book.authors);

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay fixed inset-0 z-40" />
          <Dialog.Content className="modal-content fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 z-50">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <Dialog.Title className="text-xl font-bold">本の詳細</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="閉じる"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Book Info */}
            <div className="flex gap-4 mb-6">
              <div className="w-24 flex-shrink-0">
                <div className="aspect-[2/3] rounded-lg bg-bg-tertiary overflow-hidden">
                  {ownedBook.book.coverImageUrl ? (
                    <img
                      src={ownedBook.book.coverImageUrl}
                      alt={ownedBook.book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-text-muted" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg leading-tight mb-1">
                  {ownedBook.book.title}
                </h3>
                {ownedBook.book.subtitle && (
                  <p className="text-text-secondary text-sm mb-2">
                    {ownedBook.book.subtitle}
                  </p>
                )}
                {authors.length > 0 && (
                  <p className="text-text-muted text-sm mb-1">
                    {authors.join(", ")}
                  </p>
                )}
                {ownedBook.book.publisher && (
                  <p className="text-text-muted text-xs">
                    {ownedBook.book.publisher}
                  </p>
                )}
                {ownedBook.book.isbn && (
                  <p className="text-text-muted text-xs mt-1 font-mono">
                    ISBN: {ownedBook.book.isbn}
                  </p>
                )}
              </div>
            </div>

            {/* Edit Form */}
            <div className="space-y-4">
              {/* Reading Status */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  読書状況
                </label>
                <Select.Root
                  value={readingStatus}
                  onValueChange={(val) => setReadingStatus(val as ReadingStatus)}
                >
                  <Select.Trigger className="input-glass flex items-center justify-between w-full py-3 px-4">
                    <Select.Value>
                      <span
                        className={`status-badge ${
                          readingStatus === "COMPLETED"
                            ? "status-completed"
                            : readingStatus === "READING"
                            ? "status-reading"
                            : "status-not-read"
                        }`}
                      >
                        {READING_STATUS_LABELS[readingStatus]}
                      </span>
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
                        {(Object.keys(READING_STATUS_LABELS) as ReadingStatus[]).map(
                          (status) => (
                            <Select.Item
                              key={status}
                              value={status}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 outline-none data-[highlighted]:bg-white/10"
                            >
                              <Select.ItemIndicator className="w-4">
                                <Check className="w-4 h-4" />
                              </Select.ItemIndicator>
                              <span
                                className={`status-badge ${
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
                          )
                        )}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              {/* Bookshelf */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  本棚
                </label>
                <ShelfSelect
                  value={bookshelfId}
                  onChange={setBookshelfId}
                  disabled={isUpdating}
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  メモ
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="この本についてのメモ"
                  className="input-glass w-full min-h-[80px] resize-none"
                  disabled={isUpdating}
                />
              </div>

              {/* Marathon Posted */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marathonPosted}
                  onChange={(e) => setMarathonPosted(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-white/20 bg-transparent checked:bg-accent-cyan checked:border-accent-cyan"
                  disabled={isUpdating}
                />
                <span className="text-sm">読書マラソン投稿済み</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-6">
              {/* Save Button */}
              <button
                onClick={handleSave}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                disabled={!hasChanges || isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </button>

              {/* Delete Options */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setDeleteType("unshelve")}
                  className="btn-secondary py-2 px-3 text-xs flex flex-col items-center gap-1"
                  disabled={isUpdating}
                >
                  <FolderMinus className="w-4 h-4" />
                  未確定へ
                </button>
                <button
                  onClick={() => setDeleteType("remove")}
                  className="btn-secondary py-2 px-3 text-xs flex flex-col items-center gap-1 text-accent-orange"
                  disabled={isUpdating}
                >
                  <FolderPlus className="w-4 h-4" />
                  本棚から削除
                </button>
                <button
                  onClick={() => setDeleteType("delete_all")}
                  className="btn-secondary py-2 px-3 text-xs flex flex-col items-center gap-1 text-accent-pink"
                  disabled={isUpdating}
                >
                  <Trash2 className="w-4 h-4" />
                  完全削除
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={deleteType !== null}
        onOpenChange={(open) => !open && setDeleteType(null)}
        title={
          deleteType === "unshelve"
            ? "未確定に移動"
            : deleteType === "remove"
            ? "本棚から削除"
            : "完全に削除"
        }
        description={
          deleteType === "unshelve"
            ? `「${ownedBook.book.title}」を未確定の本に移動しますか？`
            : deleteType === "remove"
            ? `「${ownedBook.book.title}」を本棚から削除しますか？`
            : `「${ownedBook.book.title}」を完全に削除しますか？この操作は取り消せません。`
        }
        onConfirm={handleDelete}
      />
    </>
  );
}

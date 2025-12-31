"use client";

import { useState, useCallback } from "react";
import { BookOpen, Plus } from "lucide-react";
import { BookshelfCard } from "./BookshelfCard";
import { CreateShelfModal } from "./CreateShelfModal";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";

interface Bookshelf {
  id: string;
  name: string;
  memo: string | null;
  _count: {
    ownedBooks: number;
  };
}

interface BookshelfListProps {
  initialBookshelves: Bookshelf[];
}

export function BookshelfList({ initialBookshelves }: BookshelfListProps) {
  const [bookshelves, setBookshelves] = useState<Bookshelf[]>(initialBookshelves);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Bookshelf | null>(null);
  const [deletingShelfId, setDeletingShelfId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBookshelves = useCallback(async () => {
    try {
      const response = await fetch("/api/shelves");
      if (response.ok) {
        const data = await response.json();
        setBookshelves(data);
      }
    } catch {
      // Silent refresh failure
    }
  }, []);

  const handleEdit = (id: string) => {
    const shelf = bookshelves.find((s) => s.id === id);
    if (shelf) {
      setEditingShelf(shelf);
    }
  };

  const handleDelete = async () => {
    if (!deletingShelfId) return;

    const response = await fetch(`/api/shelves/${deletingShelfId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "削除に失敗しました");
      throw new Error(data.error);
    }

    setBookshelves((prev) => prev.filter((s) => s.id !== deletingShelfId));
    setDeletingShelfId(null);
    setError(null);
  };

  const deletingShelf = bookshelves.find((s) => s.id === deletingShelfId);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">本棚</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
        >
          <Plus className="w-4 h-4" />
          本棚を追加
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-accent-pink/10 border border-accent-pink/20 text-accent-pink text-sm">
          {error}
        </div>
      )}

      {bookshelves.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookshelves.map((shelf) => (
            <BookshelfCard
              key={shelf.id}
              id={shelf.id}
              name={shelf.name}
              memo={shelf.memo}
              bookCount={shelf._count.ownedBooks}
              onEdit={handleEdit}
              onDelete={setDeletingShelfId}
            />
          ))}
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-tertiary flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-text-muted" />
          </div>
          <h4 className="text-lg font-medium mb-2">本棚がありません</h4>
          <p className="text-text-secondary mb-4">
            最初の本棚を作成して、本の管理を始めましょう
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary py-2 px-6"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            本棚を作成
          </button>
        </div>
      )}

      {/* Create Modal */}
      <CreateShelfModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={fetchBookshelves}
      />

      {/* Edit Modal */}
      <CreateShelfModal
        open={!!editingShelf}
        onOpenChange={(open) => !open && setEditingShelf(null)}
        onSuccess={fetchBookshelves}
        editData={editingShelf}
      />

      {/* Delete Confirm Dialog */}
      <DeleteConfirmDialog
        open={!!deletingShelfId}
        onOpenChange={(open) => !open && setDeletingShelfId(null)}
        title="本棚を削除"
        description={
          deletingShelf
            ? `「${deletingShelf.name}」を削除しますか？この操作は取り消せません。`
            : ""
        }
        onConfirm={handleDelete}
      />
    </section>
  );
}

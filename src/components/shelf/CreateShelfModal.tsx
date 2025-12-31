"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";

interface CreateShelfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editData?: {
    id: string;
    name: string;
    memo?: string | null;
  } | null;
}

export function CreateShelfModal({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: CreateShelfModalProps) {
  const [name, setName] = useState(editData?.name || "");
  const [memo, setMemo] = useState(editData?.memo || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!editData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("本棚の名前を入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const url = isEditing ? `/api/shelves/${editData.id}` : "/api/shelves";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), memo: memo.trim() || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save bookshelf");
      }

      setName("");
      setMemo("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName(editData?.name || "");
      setMemo(editData?.memo || "");
      setError(null);
    }
    onOpenChange(newOpen);
  };

  // Update form when editData changes
  if (open && editData && name !== editData.name) {
    setName(editData.name);
    setMemo(editData.memo || "");
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay fixed inset-0 z-40" />
        <Dialog.Content className="modal-content fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 z-50">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold">
              {isEditing ? "本棚を編集" : "新しい本棚を作成"}
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

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="shelf-name"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  本棚の名前 <span className="text-accent-pink">*</span>
                </label>
                <input
                  id="shelf-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: リビングの本棚"
                  className="input-glass w-full"
                  autoFocus
                  maxLength={50}
                />
              </div>

              <div>
                <label
                  htmlFor="shelf-memo"
                  className="block text-sm font-medium text-text-secondary mb-2"
                >
                  メモ（任意）
                </label>
                <textarea
                  id="shelf-memo"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="本棚の説明やメモを入力"
                  className="input-glass w-full min-h-[100px] resize-none"
                  maxLength={200}
                />
              </div>

              {error && (
                <p className="text-accent-pink text-sm">{error}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="btn-secondary flex-1 py-3"
                  disabled={isLoading}
                >
                  キャンセル
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditing ? "保存中..." : "作成中..."}
                  </>
                ) : (
                  isEditing ? "保存" : "作成"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

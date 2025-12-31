"use client";

import { useState } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Loader2, AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Error handling is done in parent
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="modal-overlay fixed inset-0 z-40" />
        <AlertDialog.Content className="modal-content fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 z-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent-pink/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-accent-pink" />
            </div>
            <AlertDialog.Title className="text-xl font-bold">
              {title}
            </AlertDialog.Title>
          </div>

          <AlertDialog.Description className="text-text-secondary mb-6">
            {description}
          </AlertDialog.Description>

          <div className="flex gap-3">
            <AlertDialog.Cancel asChild>
              <button
                className="btn-secondary flex-1 py-3"
                disabled={isLoading}
              >
                キャンセル
              </button>
            </AlertDialog.Cancel>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-accent-pink hover:bg-accent-pink/80 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  削除中...
                </>
              ) : (
                "削除"
              )}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

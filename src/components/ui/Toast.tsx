"use client";

import { createContext, useContext, useState, useCallback } from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "success", title, description });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "error", title, description });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "info", title, description });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info }}
    >
      <ToastPrimitive.Provider swipeDirection="right">
        {children}

        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            className="glass-card-elevated p-4 flex items-start gap-3 data-[state=open]:animate-slideIn data-[state=closed]:animate-slideOut data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]"
            open={true}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
          >
            {/* Icon */}
            <div className="flex-shrink-0">
              {toast.type === "success" && (
                <CheckCircle className="w-5 h-5 text-accent-green" />
              )}
              {toast.type === "error" && (
                <AlertCircle className="w-5 h-5 text-accent-pink" />
              )}
              {toast.type === "info" && (
                <Info className="w-5 h-5 text-accent-cyan" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <ToastPrimitive.Title className="font-medium text-sm">
                {toast.title}
              </ToastPrimitive.Title>
              {toast.description && (
                <ToastPrimitive.Description className="text-text-secondary text-xs mt-1">
                  {toast.description}
                </ToastPrimitive.Description>
              )}
            </div>

            {/* Close button */}
            <ToastPrimitive.Close
              className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="閉じる"
            >
              <X className="w-4 h-4 text-text-muted" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}

        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-[380px] max-w-[calc(100vw-32px)] z-50 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

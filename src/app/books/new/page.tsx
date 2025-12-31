"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Keyboard,
  BookOpen,
  Loader2,
} from "lucide-react";
import { BarcodeScanner, ScanResult } from "@/components/scanner";
import { ShelfSelect, ManualBookForm } from "@/components/book";
import { useScanner } from "@/hooks/useScanner";
import { useToast } from "@/components/ui/Toast";
import type { BookSearchResult, CreateBookInput } from "@/types/book";

type InputMode = "scan" | "manual";

export default function NewBookPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [inputMode, setInputMode] = useState<InputMode>("scan");
  const [selectedShelfId, setSelectedShelfId] = useState<string>("");
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [showShelfSelect, setShowShelfSelect] = useState(false);
  const [pendingBook, setPendingBook] = useState<BookSearchResult | null>(null);

  const {
    handleScan,
    bookResult,
    isSearching,
    searchError,
    clearResult,
    pause,
    resume,
    isPaused,
  } = useScanner();

  // Handle adding to wanted list (欲しい本)
  const handleAddToWanted = useCallback(async () => {
    if (!bookResult) return;

    setIsAddingBook(true);
    try {
      // First, ensure the book is registered in the database
      let bookId = bookResult.existingBookId;

      if (!bookId) {
        const bookResponse = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isbn: bookResult.isbn,
            title: bookResult.title,
            subtitle: bookResult.subtitle,
            authors: bookResult.authors,
            publisher: bookResult.publisher,
            publishedDate: bookResult.publishedDate,
            description: bookResult.description,
            coverImageUrl: bookResult.coverImageUrl,
            categories: bookResult.categories,
            pageCount: bookResult.pageCount,
          }),
        });

        if (!bookResponse.ok) {
          const data = await bookResponse.json();
          throw new Error(data.error || "書籍の登録に失敗しました");
        }

        const book = await bookResponse.json();
        bookId = book.id;
      }

      // Add to wanted books
      const response = await fetch("/api/wanted-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "追加に失敗しました");
      }

      success("欲しい本に追加しました", bookResult.title);
      clearResult();
      resume();
    } catch (err) {
      showError(
        "追加に失敗しました",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setIsAddingBook(false);
    }
  }, [bookResult, success, showError, clearResult, resume]);

  // Handle adding to unshelved (未確定の本)
  const handleAddToUnshelved = useCallback(async () => {
    if (!bookResult) return;

    setIsAddingBook(true);
    try {
      // First, ensure the book is registered in the database
      let bookId = bookResult.existingBookId;

      if (!bookId) {
        const bookResponse = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isbn: bookResult.isbn,
            title: bookResult.title,
            subtitle: bookResult.subtitle,
            authors: bookResult.authors,
            publisher: bookResult.publisher,
            publishedDate: bookResult.publishedDate,
            description: bookResult.description,
            coverImageUrl: bookResult.coverImageUrl,
            categories: bookResult.categories,
            pageCount: bookResult.pageCount,
          }),
        });

        if (!bookResponse.ok) {
          const data = await bookResponse.json();
          throw new Error(data.error || "書籍の登録に失敗しました");
        }

        const book = await bookResponse.json();
        bookId = book.id;
      }

      // Add to unshelved books
      const response = await fetch("/api/unshelved-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "追加に失敗しました");
      }

      success("未確定の本に追加しました", bookResult.title);
      clearResult();
      resume();
    } catch (err) {
      showError(
        "追加に失敗しました",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setIsAddingBook(false);
    }
  }, [bookResult, success, showError, clearResult, resume]);

  // Handle opening shelf selection
  const handleAddToShelfClick = useCallback(() => {
    if (!bookResult) return;
    setPendingBook(bookResult);
    setShowShelfSelect(true);
    pause();
  }, [bookResult, pause]);

  // Handle confirming shelf selection
  const handleConfirmAddToShelf = useCallback(async () => {
    if (!pendingBook || !selectedShelfId) return;

    setIsAddingBook(true);
    try {
      // First, ensure the book is registered in the database
      let bookId = pendingBook.existingBookId;

      if (!bookId) {
        const bookResponse = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isbn: pendingBook.isbn,
            title: pendingBook.title,
            subtitle: pendingBook.subtitle,
            authors: pendingBook.authors,
            publisher: pendingBook.publisher,
            publishedDate: pendingBook.publishedDate,
            description: pendingBook.description,
            coverImageUrl: pendingBook.coverImageUrl,
            categories: pendingBook.categories,
            pageCount: pendingBook.pageCount,
          }),
        });

        if (!bookResponse.ok) {
          const data = await bookResponse.json();
          throw new Error(data.error || "書籍の登録に失敗しました");
        }

        const book = await bookResponse.json();
        bookId = book.id;
      }

      // Add to owned books
      const response = await fetch("/api/owned-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          bookshelfId: selectedShelfId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "追加に失敗しました");
      }

      success("本棚に追加しました", pendingBook.title);
      setShowShelfSelect(false);
      setPendingBook(null);
      setSelectedShelfId("");
      clearResult();
      resume();
    } catch (err) {
      showError(
        "追加に失敗しました",
        err instanceof Error ? err.message : undefined
      );
    } finally {
      setIsAddingBook(false);
    }
  }, [pendingBook, selectedShelfId, success, showError, clearResult, resume]);

  // Handle manual book submission
  const handleManualSubmit = useCallback(
    async (bookData: CreateBookInput) => {
      setIsAddingBook(true);
      try {
        // Register the book
        const bookResponse = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookData),
        });

        if (!bookResponse.ok) {
          const data = await bookResponse.json();
          throw new Error(data.error || "書籍の登録に失敗しました");
        }

        const book = await bookResponse.json();

        // Add to unshelved books
        const response = await fetch("/api/unshelved-books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: book.id }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "追加に失敗しました");
        }

        success("本を登録しました", bookData.title);
      } catch (err) {
        throw err;
      } finally {
        setIsAddingBook(false);
      }
    },
    [success]
  );

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
          <h1 className="text-xl font-bold">本を追加</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Input Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setInputMode("scan")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
              inputMode === "scan"
                ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                : "glass-card hover:bg-white/10"
            }`}
          >
            <Camera className="w-5 h-5" />
            <span>スキャン</span>
          </button>
          <button
            onClick={() => setInputMode("manual")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all ${
              inputMode === "manual"
                ? "bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30"
                : "glass-card hover:bg-white/10"
            }`}
          >
            <Keyboard className="w-5 h-5" />
            <span>手動入力</span>
          </button>
        </div>

        {/* Scan Mode */}
        {inputMode === "scan" && (
          <div className="space-y-4">
            {!showShelfSelect ? (
              <>
                <BarcodeScanner
                  onScan={handleScan}
                  continuous
                  paused={isPaused || !!bookResult}
                />

                <ScanResult
                  result={bookResult}
                  isLoading={isSearching}
                  error={searchError}
                  onAddToUnshelved={handleAddToUnshelved}
                  onAddToShelf={handleAddToShelfClick}
                  onAddToWanted={handleAddToWanted}
                  onScanAgain={clearResult}
                  isAdding={isAddingBook}
                />
              </>
            ) : (
              /* Shelf Selection */
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent-cyan/20 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-accent-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {pendingBook?.title}
                    </h3>
                    <p className="text-text-secondary text-sm">
                      本棚を選択してください
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    追加先の本棚
                  </label>
                  <ShelfSelect
                    value={selectedShelfId}
                    onChange={setSelectedShelfId}
                    disabled={isAddingBook}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowShelfSelect(false);
                      setPendingBook(null);
                      resume();
                    }}
                    className="btn-secondary flex-1 py-3"
                    disabled={isAddingBook}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleConfirmAddToShelf}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
                    disabled={!selectedShelfId || isAddingBook}
                  >
                    {isAddingBook ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        追加中...
                      </>
                    ) : (
                      "追加"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Mode */}
        {inputMode === "manual" && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">手動で本を登録</h2>
            <p className="text-text-secondary text-sm mb-6">
              ISBNがない本や、検索で見つからない本を手動で登録できます。
            </p>
            <ManualBookForm onSubmit={handleManualSubmit} isLoading={isAddingBook} />
          </div>
        )}
      </main>
    </div>
  );
}

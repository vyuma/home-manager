"use client";

import { useState, useCallback } from "react";
import type { BookSearchResult } from "@/types/book";

interface UseScannerOptions {
  onBookFound?: (book: BookSearchResult) => void;
  onError?: (error: string) => void;
}

interface UseScannerReturn {
  // State
  scannedISBN: string | null;
  bookResult: BookSearchResult | null;
  isSearching: boolean;
  searchError: string | null;
  scanHistory: BookSearchResult[];
  isPaused: boolean;

  // Actions
  handleScan: (isbn: string) => Promise<void>;
  clearResult: () => void;
  clearHistory: () => void;
  pause: () => void;
  resume: () => void;
}

export function useScanner(options: UseScannerOptions = {}): UseScannerReturn {
  const { onBookFound, onError } = options;

  const [scannedISBN, setScannedISBN] = useState<string | null>(null);
  const [bookResult, setBookResult] = useState<BookSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<BookSearchResult[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  const handleScan = useCallback(
    async (isbn: string) => {
      // Skip if already searching or same ISBN
      if (isSearching || scannedISBN === isbn) return;

      // Check if already in history
      const existsInHistory = scanHistory.some((item) => item.isbn === isbn);
      if (existsInHistory) {
        return;
      }

      setScannedISBN(isbn);
      setIsSearching(true);
      setSearchError(null);
      setBookResult(null);

      try {
        const response = await fetch(`/api/books/search?isbn=${isbn}`);
        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error || "書籍が見つかりませんでした";
          setSearchError(errorMessage);
          onError?.(errorMessage);
          return;
        }

        const result: BookSearchResult = data;
        setBookResult(result);
        setScanHistory((prev) => [result, ...prev]);
        onBookFound?.(result);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "検索中にエラーが発生しました";
        setSearchError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsSearching(false);
      }
    },
    [isSearching, scannedISBN, scanHistory, onBookFound, onError]
  );

  const clearResult = useCallback(() => {
    setScannedISBN(null);
    setBookResult(null);
    setSearchError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setScanHistory([]);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  return {
    scannedISBN,
    bookResult,
    isSearching,
    searchError,
    scanHistory,
    isPaused,
    handleScan,
    clearResult,
    clearHistory,
    pause,
    resume,
  };
}

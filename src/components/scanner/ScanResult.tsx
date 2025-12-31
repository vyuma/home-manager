"use client";

import { BookOpen, Check, Loader2, AlertCircle, Heart } from "lucide-react";
import type { BookSearchResult } from "@/types/book";

interface ScanResultProps {
  result: BookSearchResult | null;
  isLoading: boolean;
  error: string | null;
  onAddToShelf?: () => void;
  onAddToUnshelved?: () => void;
  onAddToWanted?: () => void;
  onScanAgain?: () => void;
  isAdding?: boolean;
}

export function ScanResult({
  result,
  isLoading,
  error,
  onAddToShelf,
  onAddToUnshelved,
  onAddToWanted,
  onScanAgain,
  isAdding = false,
}: ScanResultProps) {
  if (isLoading) {
    return (
      <div className="glass-card p-6 text-center">
        <Loader2 className="w-8 h-8 text-accent-cyan mx-auto animate-spin mb-3" />
        <p className="text-text-secondary">書籍情報を検索中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-pink/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-accent-pink" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">検索エラー</h3>
            <p className="text-text-secondary text-sm mb-4">{error}</p>
            {onScanAgain && (
              <button
                onClick={onScanAgain}
                className="btn-secondary py-2 px-4 text-sm"
              >
                もう一度スキャン
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="glass-card p-4">
      <div className="flex gap-4">
        {/* Book Cover */}
        <div className="w-24 flex-shrink-0">
          <div className="aspect-[2/3] rounded-lg bg-bg-tertiary overflow-hidden">
            {result.coverImageUrl ? (
              <img
                src={result.coverImageUrl}
                alt={result.title}
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
          <h3 className="font-semibold line-clamp-2 mb-1">{result.title}</h3>
          {result.subtitle && (
            <p className="text-text-secondary text-sm line-clamp-1 mb-1">
              {result.subtitle}
            </p>
          )}
          {result.authors && result.authors.length > 0 && (
            <p className="text-text-muted text-sm mb-1">
              {result.authors.join(", ")}
            </p>
          )}
          {result.publisher && (
            <p className="text-text-muted text-xs mb-2">{result.publisher}</p>
          )}

          {/* ISBN Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-bg-tertiary text-xs text-text-muted">
            <span>ISBN:</span>
            <span className="font-mono">{result.isbn}</span>
          </div>

          {/* Already exists badge */}
          {result.existsInDatabase && (
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent-cyan/20 text-xs text-accent-cyan">
              <Check className="w-3 h-3" />
              <span>データベースに登録済み</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 mt-4">
        <div className="flex gap-3">
          <button
            onClick={onAddToUnshelved}
            className="btn-secondary flex-1 py-3 text-sm"
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "未確定として追加"
            )}
          </button>
          <button
            onClick={onAddToShelf}
            className="btn-primary flex-1 py-3 text-sm"
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "本棚に追加"
            )}
          </button>
        </div>
        {onAddToWanted && (
          <button
            onClick={onAddToWanted}
            className="btn-secondary w-full py-2.5 text-sm flex items-center justify-center gap-2 border-accent-pink/30 hover:bg-accent-pink/10"
            disabled={isAdding}
          >
            <Heart className="w-4 h-4 text-accent-pink" />
            <span>欲しい本に追加</span>
          </button>
        )}
      </div>
    </div>
  );
}

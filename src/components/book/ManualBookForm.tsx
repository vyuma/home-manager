"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { CreateBookInput } from "@/types/book";

interface ManualBookFormProps {
  onSubmit: (book: CreateBookInput) => Promise<void>;
  isLoading?: boolean;
}

export function ManualBookForm({ onSubmit, isLoading = false }: ManualBookFormProps) {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }

    const bookData: CreateBookInput = {
      title: title.trim(),
      authors: authors
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      isbn: isbn.trim() || undefined,
      publisher: publisher.trim() || undefined,
      publishedDate: publishedDate || undefined,
      description: description.trim() || undefined,
    };

    try {
      await onSubmit(bookData);
      // Reset form on success
      setTitle("");
      setAuthors("");
      setIsbn("");
      setPublisher("");
      setPublishedDate("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="manual-title"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          タイトル <span className="text-accent-pink">*</span>
        </label>
        <input
          id="manual-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="本のタイトルを入力"
          className="input-glass w-full"
          disabled={isLoading}
        />
      </div>

      <div>
        <label
          htmlFor="manual-authors"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          著者（カンマ区切り）
        </label>
        <input
          id="manual-authors"
          type="text"
          value={authors}
          onChange={(e) => setAuthors(e.target.value)}
          placeholder="著者名（複数の場合はカンマで区切る）"
          className="input-glass w-full"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="manual-isbn"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            ISBN
          </label>
          <input
            id="manual-isbn"
            type="text"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="978..."
            className="input-glass w-full"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="manual-publisher"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            出版社
          </label>
          <input
            id="manual-publisher"
            type="text"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            placeholder="出版社名"
            className="input-glass w-full"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="manual-date"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          出版日
        </label>
        <input
          id="manual-date"
          type="text"
          value={publishedDate}
          onChange={(e) => setPublishedDate(e.target.value)}
          placeholder="2024-01-01"
          className="input-glass w-full"
          disabled={isLoading}
        />
      </div>

      <div>
        <label
          htmlFor="manual-description"
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          説明
        </label>
        <textarea
          id="manual-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="本の説明やメモ"
          className="input-glass w-full min-h-[100px] resize-none"
          disabled={isLoading}
        />
      </div>

      {error && <p className="text-accent-pink text-sm">{error}</p>}

      <button
        type="submit"
        className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            登録中...
          </>
        ) : (
          "本を登録"
        )}
      </button>
    </form>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { BookDetailModal } from "./BookDetailModal";
import { parseAuthors } from "@/types/book";
import type { ReadingStatus } from "@prisma/client";

interface OwnedBook {
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

interface BookGridProps {
  books: OwnedBook[];
}

export function BookGrid({ books: initialBooks }: BookGridProps) {
  const router = useRouter();
  const [books, setBooks] = useState(initialBooks);
  const [selectedBook, setSelectedBook] = useState<OwnedBook | null>(null);

  const handleUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {books.map((ownedBook, index) => (
          <button
            key={ownedBook.id}
            onClick={() => setSelectedBook(ownedBook)}
            className="book-card text-left"
            style={{ "--index": index } as React.CSSProperties}
          >
            {/* Book Cover */}
            <div className="aspect-[2/3] bg-bg-tertiary relative overflow-hidden">
              {ownedBook.book.coverImageUrl ? (
                <img
                  src={ownedBook.book.coverImageUrl}
                  alt={ownedBook.book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-text-muted" />
                </div>
              )}

              {/* Reading Status Badge */}
              <div className="absolute top-2 right-2">
                <span
                  className={`status-badge ${
                    ownedBook.readingStatus === "COMPLETED"
                      ? "status-completed"
                      : ownedBook.readingStatus === "READING"
                      ? "status-reading"
                      : "status-not-read"
                  }`}
                >
                  {ownedBook.readingStatus === "COMPLETED"
                    ? "読了"
                    : ownedBook.readingStatus === "READING"
                    ? "読書中"
                    : "未読"}
                </span>
              </div>

              {/* Marathon Posted Badge */}
              {ownedBook.marathonPosted && (
                <div className="absolute top-2 left-2">
                  <span className="status-badge bg-accent-purple/20 text-accent-purple">
                    M
                  </span>
                </div>
              )}
            </div>

            {/* Book Info */}
            <div className="p-3">
              <h3 className="font-medium text-sm line-clamp-2 mb-1">
                {ownedBook.book.title}
              </h3>
              {ownedBook.book.authors && (
                <p className="text-text-secondary text-xs truncate">
                  {parseAuthors(ownedBook.book.authors).join(", ")}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      <BookDetailModal
        ownedBook={selectedBook}
        open={!!selectedBook}
        onOpenChange={(open) => !open && setSelectedBook(null)}
        onUpdate={handleUpdate}
      />
    </>
  );
}

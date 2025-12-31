import type { ReadingStatus } from "@prisma/client";

// Book display info (with parsed arrays)
export interface BookInfo {
  id: string;
  isbn: string | null;
  title: string;
  subtitle: string | null;
  authors: string[];
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  coverImageUrl: string | null;
  categories: string[];
  pageCount: number | null;
}

// Book as stored in database (with JSON strings)
export interface BookRecord {
  id: string;
  isbn: string | null;
  title: string;
  subtitle: string | null;
  authors: string; // JSON stringified array
  publisher: string | null;
  publishedDate: string | null;
  description: string | null;
  coverImageUrl: string | null;
  categories: string | null; // JSON stringified array
  pageCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnedBookWithBook {
  id: string;
  bookId: string;
  bookshelfId: string;
  userId: string;
  readingStatus: ReadingStatus;
  note: string | null;
  marathonPosted: boolean;
  createdAt: Date;
  updatedAt: Date;
  book: BookInfo;
}

export interface BookshelfWithBooks {
  id: string;
  name: string;
  memo: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  ownedBooks: OwnedBookWithBook[];
  _count?: {
    ownedBooks: number;
  };
}

// Input for creating/registering a new book
export interface CreateBookInput {
  isbn?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  coverImageUrl?: string;
  categories?: string[];
  pageCount?: number;
}

// Search result from Google Books API
export interface BookSearchResult {
  isbn: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  coverImageUrl?: string;
  categories?: string[];
  pageCount?: number;
  // Whether this book already exists in database
  existsInDatabase?: boolean;
  existingBookId?: string;
}

// Helper functions
export function parseAuthors(authorsJson: string | null): string[] {
  if (!authorsJson) return [];
  try {
    return JSON.parse(authorsJson);
  } catch {
    return [];
  }
}

export function parseCategories(categoriesJson: string | null): string[] {
  if (!categoriesJson) return [];
  try {
    return JSON.parse(categoriesJson);
  } catch {
    return [];
  }
}

export function toBookInfo(record: BookRecord): BookInfo {
  return {
    id: record.id,
    isbn: record.isbn,
    title: record.title,
    subtitle: record.subtitle,
    authors: parseAuthors(record.authors),
    publisher: record.publisher,
    publishedDate: record.publishedDate,
    description: record.description,
    coverImageUrl: record.coverImageUrl,
    categories: parseCategories(record.categories),
    pageCount: record.pageCount,
  };
}

// Reading status labels
export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  NOT_READ: "未読",
  READING: "読書中",
  COMPLETED: "読了",
};

const GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes";

export interface GoogleBookInfo {
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

interface GoogleBooksResponse {
  items?: Array<{
    volumeInfo: {
      title: string;
      subtitle?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      description?: string;
      imageLinks?: {
        thumbnail?: string;
        smallThumbnail?: string;
      };
      categories?: string[];
      pageCount?: number;
    };
  }>;
}

export function normalizeISBN(isbn: string): string {
  return isbn.replace(/[-\s]/g, "");
}

export function validateISBN(isbn: string): boolean {
  const normalized = normalizeISBN(isbn);
  // ISBN-10 or ISBN-13
  return /^(\d{10}|\d{13})$/.test(normalized);
}

export async function searchByISBN(
  isbn: string
): Promise<GoogleBookInfo | null> {
  const normalizedISBN = normalizeISBN(isbn);

  if (!validateISBN(normalizedISBN)) {
    throw new Error("Invalid ISBN format");
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `${GOOGLE_BOOKS_API_URL}?q=isbn:${normalizedISBN}${apiKey ? `&key=${apiKey}` : ""}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const data: GoogleBooksResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    return null;
  }

  const volumeInfo = data.items[0].volumeInfo;

  return parseGoogleBooksResponse(volumeInfo);
}

export function parseGoogleBooksResponse(volumeInfo: {
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
  };
  categories?: string[];
  pageCount?: number;
}): GoogleBookInfo {
  return {
    title: volumeInfo.title,
    subtitle: volumeInfo.subtitle,
    authors: volumeInfo.authors || [],
    publisher: volumeInfo.publisher,
    publishedDate: volumeInfo.publishedDate,
    description: volumeInfo.description,
    coverImageUrl:
      volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:") ||
      volumeInfo.imageLinks?.smallThumbnail?.replace("http:", "https:"),
    categories: volumeInfo.categories,
    pageCount: volumeInfo.pageCount,
  };
}

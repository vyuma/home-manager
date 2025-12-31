import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchByISBN, normalizeISBN, validateISBN } from "@/lib/google-books";
import type { BookSearchResult } from "@/types/book";

// GET /api/books/search?isbn=XXXXXXXXXXXXX
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isbn = searchParams.get("isbn");

    if (!isbn) {
      return NextResponse.json(
        { error: "ISBN is required" },
        { status: 400 }
      );
    }

    const normalizedISBN = normalizeISBN(isbn);

    if (!validateISBN(normalizedISBN)) {
      return NextResponse.json(
        { error: "Invalid ISBN format" },
        { status: 400 }
      );
    }

    // First, check if this book already exists in our database
    const existingBook = await prisma.book.findUnique({
      where: { isbn: normalizedISBN },
    });

    if (existingBook) {
      // Return existing book info
      const result: BookSearchResult = {
        isbn: normalizedISBN,
        title: existingBook.title,
        subtitle: existingBook.subtitle || undefined,
        authors: existingBook.authors ? JSON.parse(existingBook.authors) : [],
        publisher: existingBook.publisher || undefined,
        publishedDate: existingBook.publishedDate || undefined,
        description: existingBook.description || undefined,
        coverImageUrl: existingBook.coverImageUrl || undefined,
        categories: existingBook.categories
          ? JSON.parse(existingBook.categories)
          : [],
        pageCount: existingBook.pageCount || undefined,
        existsInDatabase: true,
        existingBookId: existingBook.id,
      };

      return NextResponse.json(result);
    }

    // Search Google Books API
    const bookInfo = await searchByISBN(normalizedISBN);

    if (!bookInfo) {
      return NextResponse.json(
        { error: "Book not found", isbn: normalizedISBN },
        { status: 404 }
      );
    }

    const result: BookSearchResult = {
      isbn: normalizedISBN,
      title: bookInfo.title,
      subtitle: bookInfo.subtitle,
      authors: bookInfo.authors,
      publisher: bookInfo.publisher,
      publishedDate: bookInfo.publishedDate,
      description: bookInfo.description,
      coverImageUrl: bookInfo.coverImageUrl,
      categories: bookInfo.categories,
      pageCount: bookInfo.pageCount,
      existsInDatabase: false,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to search book:", error);

    if (error instanceof Error && error.message === "Invalid ISBN format") {
      return NextResponse.json(
        { error: "Invalid ISBN format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to search book" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeISBN } from "@/lib/google-books";
import type { CreateBookInput } from "@/types/book";

// POST /api/books - Register a new book to the database
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateBookInput = await request.json();
    const { isbn, title, subtitle, authors, publisher, publishedDate, description, coverImageUrl, categories, pageCount } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Normalize ISBN if provided
    const normalizedISBN = isbn ? normalizeISBN(isbn) : null;

    // Check if book with this ISBN already exists
    if (normalizedISBN) {
      const existingBook = await prisma.book.findUnique({
        where: { isbn: normalizedISBN },
      });

      if (existingBook) {
        return NextResponse.json(existingBook);
      }
    }

    // Create new book
    const book = await prisma.book.create({
      data: {
        isbn: normalizedISBN,
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        authors: JSON.stringify(authors || []),
        publisher: publisher?.trim() || null,
        publishedDate: publishedDate || null,
        description: description?.trim() || null,
        coverImageUrl: coverImageUrl || null,
        categories: categories ? JSON.stringify(categories) : null,
        pageCount: pageCount || null,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Failed to create book:", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}

// GET /api/books?id=XXX - Get a book by ID
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    const book = await prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error("Failed to fetch book:", error);
    return NextResponse.json(
      { error: "Failed to fetch book" },
      { status: 500 }
    );
  }
}

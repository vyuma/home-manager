import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/unshelved-books - Get all unshelved books for the user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unshelvedBooks = await prisma.unshelvedBook.findMany({
      where: { userId: session.user.id },
      include: {
        book: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(unshelvedBooks);
  } catch (error) {
    console.error("Failed to fetch unshelved books:", error);
    return NextResponse.json(
      { error: "Failed to fetch unshelved books" },
      { status: 500 }
    );
  }
}

// POST /api/unshelved-books - Add a book to unshelved (未確定の本)
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, readingStatus, note } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    // Verify the book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // Check if the book is already owned or unshelved by this user
    const existingOwnedBook = await prisma.ownedBook.findUnique({
      where: {
        bookId_userId: {
          bookId,
          userId: session.user.id,
        },
      },
    });

    if (existingOwnedBook) {
      return NextResponse.json(
        { error: "This book is already in your bookshelf" },
        { status: 409 }
      );
    }

    const existingUnshelvedBook = await prisma.unshelvedBook.findUnique({
      where: {
        bookId_userId: {
          bookId,
          userId: session.user.id,
        },
      },
    });

    if (existingUnshelvedBook) {
      return NextResponse.json(
        { error: "This book is already in your unshelved list" },
        { status: 409 }
      );
    }

    // Create unshelved book
    const unshelvedBook = await prisma.unshelvedBook.create({
      data: {
        bookId,
        userId: session.user.id,
        readingStatus: readingStatus || "NOT_READ",
        note: note?.trim() || null,
      },
      include: {
        book: true,
      },
    });

    return NextResponse.json(unshelvedBook, { status: 201 });
  } catch (error) {
    console.error("Failed to add unshelved book:", error);
    return NextResponse.json(
      { error: "Failed to add book" },
      { status: 500 }
    );
  }
}

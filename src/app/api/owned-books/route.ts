import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/owned-books - Get all owned books for the user
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookshelfId = searchParams.get("bookshelfId");

    const where: { userId: string; bookshelfId?: string } = {
      userId: session.user.id,
    };

    if (bookshelfId) {
      where.bookshelfId = bookshelfId;
    }

    const ownedBooks = await prisma.ownedBook.findMany({
      where,
      include: {
        book: true,
        bookshelf: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ownedBooks);
  } catch (error) {
    console.error("Failed to fetch owned books:", error);
    return NextResponse.json(
      { error: "Failed to fetch owned books" },
      { status: 500 }
    );
  }
}

// POST /api/owned-books - Add a book to a shelf
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, bookshelfId, readingStatus, note } = body;

    if (!bookId) {
      return NextResponse.json(
        { error: "Book ID is required" },
        { status: 400 }
      );
    }

    if (!bookshelfId) {
      return NextResponse.json(
        { error: "Bookshelf ID is required" },
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

    // Verify the bookshelf exists and belongs to the user
    const bookshelf = await prisma.bookshelf.findFirst({
      where: {
        id: bookshelfId,
        userId: session.user.id,
      },
    });

    if (!bookshelf) {
      return NextResponse.json(
        { error: "Bookshelf not found" },
        { status: 404 }
      );
    }

    // Check if the book is already owned by this user
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
        { error: "This book is already in your collection" },
        { status: 409 }
      );
    }

    // Remove from unshelved books if exists
    await prisma.unshelvedBook.deleteMany({
      where: {
        bookId,
        userId: session.user.id,
      },
    });

    // Create owned book
    const ownedBook = await prisma.ownedBook.create({
      data: {
        bookId,
        bookshelfId,
        userId: session.user.id,
        readingStatus: readingStatus || "NOT_READ",
        note: note?.trim() || null,
      },
      include: {
        book: true,
        bookshelf: true,
      },
    });

    return NextResponse.json(ownedBook, { status: 201 });
  } catch (error) {
    console.error("Failed to add owned book:", error);
    return NextResponse.json(
      { error: "Failed to add book to shelf" },
      { status: 500 }
    );
  }
}

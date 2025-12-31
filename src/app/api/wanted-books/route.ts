import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/wanted-books - Get all wanted books for the user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wantedBooks = await prisma.wantedBook.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      include: {
        book: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(wantedBooks);
  } catch (error) {
    console.error("Failed to fetch wanted books:", error);
    return NextResponse.json(
      { error: "Failed to fetch wanted books" },
      { status: 500 }
    );
  }
}

// POST /api/wanted-books - Add a book to wanted list
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookId } = body;

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

    // Check if the book is already owned
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

    // Check if already in wanted list
    const existingWantedBook = await prisma.wantedBook.findUnique({
      where: {
        bookId_userId: {
          bookId,
          userId: session.user.id,
        },
      },
    });

    if (existingWantedBook) {
      // Reactivate if inactive
      if (!existingWantedBook.isActive) {
        const updated = await prisma.wantedBook.update({
          where: { id: existingWantedBook.id },
          data: { isActive: true },
          include: { book: true },
        });
        return NextResponse.json(updated);
      }
      return NextResponse.json(
        { error: "This book is already in your wanted list" },
        { status: 409 }
      );
    }

    // Create wanted book
    const wantedBook = await prisma.wantedBook.create({
      data: {
        bookId,
        userId: session.user.id,
      },
      include: {
        book: true,
      },
    });

    return NextResponse.json(wantedBook, { status: 201 });
  } catch (error) {
    console.error("Failed to add wanted book:", error);
    return NextResponse.json(
      { error: "Failed to add book to wanted list" },
      { status: 500 }
    );
  }
}

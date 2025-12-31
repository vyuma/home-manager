import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/unshelved-books/[id]/shelve - Move unshelved book to a shelf
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookshelfId, readingStatus } = body;

    if (!bookshelfId) {
      return NextResponse.json(
        { error: "Bookshelf ID is required" },
        { status: 400 }
      );
    }

    // Verify the unshelved book exists and belongs to the user
    const unshelvedBook = await prisma.unshelvedBook.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        book: true,
      },
    });

    if (!unshelvedBook) {
      return NextResponse.json(
        { error: "Unshelved book not found" },
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

    // Check if this book is already in a shelf
    const existingOwnedBook = await prisma.ownedBook.findUnique({
      where: {
        bookId_userId: {
          bookId: unshelvedBook.bookId,
          userId: session.user.id,
        },
      },
    });

    if (existingOwnedBook) {
      return NextResponse.json(
        { error: "This book is already in a bookshelf" },
        { status: 409 }
      );
    }

    // Use transaction to move the book
    const result = await prisma.$transaction(async (tx) => {
      // Create owned book
      const ownedBook = await tx.ownedBook.create({
        data: {
          bookId: unshelvedBook.bookId,
          bookshelfId,
          userId: session.user.id,
          readingStatus: readingStatus || unshelvedBook.readingStatus,
          note: unshelvedBook.note,
        },
        include: {
          book: true,
          bookshelf: true,
        },
      });

      // Delete unshelved book
      await tx.unshelvedBook.delete({
        where: { id },
      });

      return ownedBook;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Failed to shelve book:", error);
    return NextResponse.json(
      { error: "Failed to move book to shelf" },
      { status: 500 }
    );
  }
}

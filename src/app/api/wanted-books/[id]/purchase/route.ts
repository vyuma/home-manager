import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/wanted-books/[id]/purchase - Move wanted book to owned/unshelved
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookshelfId } = body; // Optional - if provided, add to owned books

    // Find the wanted book
    const wantedBook = await prisma.wantedBook.findFirst({
      where: {
        id,
        userId: session.user.id,
        isActive: true,
      },
      include: {
        book: true,
      },
    });

    if (!wantedBook) {
      return NextResponse.json(
        { error: "Wanted book not found" },
        { status: 404 }
      );
    }

    // Check if already owned
    const existingOwnedBook = await prisma.ownedBook.findUnique({
      where: {
        bookId_userId: {
          bookId: wantedBook.bookId,
          userId: session.user.id,
        },
      },
    });

    if (existingOwnedBook) {
      // Deactivate wanted book and return success
      await prisma.wantedBook.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: "This book is already in your collection",
        alreadyOwned: true,
      });
    }

    // Check if already in unshelved
    const existingUnshelved = await prisma.unshelvedBook.findUnique({
      where: {
        bookId_userId: {
          bookId: wantedBook.bookId,
          userId: session.user.id,
        },
      },
    });

    if (existingUnshelved) {
      // Deactivate wanted book and return success
      await prisma.wantedBook.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        message: "This book is already in your unshelved collection",
        alreadyUnshelved: true,
      });
    }

    // If bookshelfId is provided, add directly to owned books
    if (bookshelfId) {
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

      // Create owned book and deactivate wanted book in transaction
      const result = await prisma.$transaction(async (tx) => {
        const ownedBook = await tx.ownedBook.create({
          data: {
            bookId: wantedBook.bookId,
            userId: session.user.id,
            bookshelfId,
            readingStatus: "NOT_READ",
          },
          include: {
            book: true,
            bookshelf: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        await tx.wantedBook.update({
          where: { id },
          data: { isActive: false },
        });

        return ownedBook;
      });

      return NextResponse.json({
        success: true,
        ownedBook: result,
        addedToShelf: true,
      });
    }

    // Otherwise, add to unshelved books
    const result = await prisma.$transaction(async (tx) => {
      const unshelvedBook = await tx.unshelvedBook.create({
        data: {
          bookId: wantedBook.bookId,
          userId: session.user.id,
        },
        include: {
          book: true,
        },
      });

      await tx.wantedBook.update({
        where: { id },
        data: { isActive: false },
      });

      return unshelvedBook;
    });

    return NextResponse.json({
      success: true,
      unshelvedBook: result,
      addedToUnshelved: true,
    });
  } catch (error) {
    console.error("Failed to purchase wanted book:", error);
    return NextResponse.json(
      { error: "Failed to purchase book" },
      { status: 500 }
    );
  }
}

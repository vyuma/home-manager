import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/owned-books/[id] - Get a specific owned book
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownedBook = await prisma.ownedBook.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        book: true,
        bookshelf: true,
      },
    });

    if (!ownedBook) {
      return NextResponse.json(
        { error: "Owned book not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(ownedBook);
  } catch (error) {
    console.error("Failed to fetch owned book:", error);
    return NextResponse.json(
      { error: "Failed to fetch owned book" },
      { status: 500 }
    );
  }
}

// PUT /api/owned-books/[id] - Update an owned book
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookshelfId, readingStatus, note, marathonPosted } = body;

    // Verify ownership
    const existingBook = await prisma.ownedBook.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: "Owned book not found" },
        { status: 404 }
      );
    }

    // If changing bookshelf, verify the new bookshelf exists and belongs to user
    if (bookshelfId && bookshelfId !== existingBook.bookshelfId) {
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
    }

    // Build update data
    const updateData: {
      bookshelfId?: string;
      readingStatus?: "NOT_READ" | "READING" | "COMPLETED";
      note?: string | null;
      marathonPosted?: boolean;
    } = {};

    if (bookshelfId !== undefined) {
      updateData.bookshelfId = bookshelfId;
    }
    if (readingStatus !== undefined) {
      updateData.readingStatus = readingStatus;
    }
    if (note !== undefined) {
      updateData.note = note?.trim() || null;
    }
    if (marathonPosted !== undefined) {
      updateData.marathonPosted = marathonPosted;
    }

    const ownedBook = await prisma.ownedBook.update({
      where: { id },
      data: updateData,
      include: {
        book: true,
        bookshelf: true,
      },
    });

    return NextResponse.json(ownedBook);
  } catch (error) {
    console.error("Failed to update owned book:", error);
    return NextResponse.json(
      { error: "Failed to update owned book" },
      { status: 500 }
    );
  }
}

// DELETE /api/owned-books/[id] - Remove an owned book
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deleteType = searchParams.get("type") || "remove"; // remove, unshelve, or delete_all

    // Verify ownership
    const existingBook = await prisma.ownedBook.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        book: true,
      },
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: "Owned book not found" },
        { status: 404 }
      );
    }

    if (deleteType === "unshelve") {
      // Move to unshelved books
      await prisma.$transaction(async (tx) => {
        // Create unshelved book
        await tx.unshelvedBook.create({
          data: {
            bookId: existingBook.bookId,
            userId: session.user.id,
            readingStatus: existingBook.readingStatus,
            note: existingBook.note,
          },
        });

        // Delete owned book
        await tx.ownedBook.delete({
          where: { id },
        });
      });

      return NextResponse.json({ success: true, action: "unshelved" });
    } else if (deleteType === "delete_all") {
      // Delete the book from all user's collections (owned, unshelved, wanted)
      await prisma.$transaction(async (tx) => {
        await tx.ownedBook.deleteMany({
          where: { bookId: existingBook.bookId, userId: session.user.id },
        });
        await tx.unshelvedBook.deleteMany({
          where: { bookId: existingBook.bookId, userId: session.user.id },
        });
        await tx.wantedBook.deleteMany({
          where: { bookId: existingBook.bookId, userId: session.user.id },
        });
      });

      return NextResponse.json({ success: true, action: "deleted_all" });
    } else {
      // Simple remove from shelf
      await prisma.ownedBook.delete({
        where: { id },
      });

      return NextResponse.json({ success: true, action: "removed" });
    }
  } catch (error) {
    console.error("Failed to delete owned book:", error);
    return NextResponse.json(
      { error: "Failed to delete owned book" },
      { status: 500 }
    );
  }
}

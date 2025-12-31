import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/wanted-books/[id] - Get a specific wanted book
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wantedBook = await prisma.wantedBook.findFirst({
      where: {
        id,
        userId: session.user.id,
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

    return NextResponse.json(wantedBook);
  } catch (error) {
    console.error("Failed to fetch wanted book:", error);
    return NextResponse.json(
      { error: "Failed to fetch wanted book" },
      { status: 500 }
    );
  }
}

// DELETE /api/wanted-books/[id] - Remove a book from wanted list
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existingBook = await prisma.wantedBook.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: "Wanted book not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.wantedBook.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete wanted book:", error);
    return NextResponse.json(
      { error: "Failed to delete wanted book" },
      { status: 500 }
    );
  }
}

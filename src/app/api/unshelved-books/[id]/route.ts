import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/unshelved-books/[id] - Get a specific unshelved book
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    return NextResponse.json(unshelvedBook);
  } catch (error) {
    console.error("Failed to fetch unshelved book:", error);
    return NextResponse.json(
      { error: "Failed to fetch unshelved book" },
      { status: 500 }
    );
  }
}

// DELETE /api/unshelved-books/[id] - Remove an unshelved book
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const existingBook = await prisma.unshelvedBook.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: "Unshelved book not found" },
        { status: 404 }
      );
    }

    await prisma.unshelvedBook.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete unshelved book:", error);
    return NextResponse.json(
      { error: "Failed to delete unshelved book" },
      { status: 500 }
    );
  }
}

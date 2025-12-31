import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/shelves/[id] - 本棚詳細取得
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookshelf = await prisma.bookshelf.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        ownedBooks: {
          include: {
            book: true,
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { ownedBooks: true },
        },
      },
    });

    if (!bookshelf) {
      return NextResponse.json(
        { error: "Bookshelf not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(bookshelf);
  } catch (error) {
    console.error("Failed to fetch bookshelf:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookshelf" },
      { status: 500 }
    );
  }
}

// PUT /api/shelves/[id] - 本棚更新
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, memo } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check ownership
    const existingShelf = await prisma.bookshelf.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingShelf) {
      return NextResponse.json(
        { error: "Bookshelf not found" },
        { status: 404 }
      );
    }

    const bookshelf = await prisma.bookshelf.update({
      where: { id },
      data: {
        name: name.trim(),
        memo: memo?.trim() || null,
      },
      include: {
        _count: {
          select: { ownedBooks: true },
        },
      },
    });

    return NextResponse.json(bookshelf);
  } catch (error) {
    console.error("Failed to update bookshelf:", error);
    return NextResponse.json(
      { error: "Failed to update bookshelf" },
      { status: 500 }
    );
  }
}

// DELETE /api/shelves/[id] - 本棚削除
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const existingShelf = await prisma.bookshelf.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { ownedBooks: true },
        },
      },
    });

    if (!existingShelf) {
      return NextResponse.json(
        { error: "Bookshelf not found" },
        { status: 404 }
      );
    }

    // Check if shelf has books
    if (existingShelf._count.ownedBooks > 0) {
      return NextResponse.json(
        { error: "Cannot delete bookshelf with books. Please remove or move books first." },
        { status: 400 }
      );
    }

    await prisma.bookshelf.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete bookshelf:", error);
    return NextResponse.json(
      { error: "Failed to delete bookshelf" },
      { status: 500 }
    );
  }
}

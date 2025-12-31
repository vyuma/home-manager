import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/shelves - 本棚一覧取得
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookshelves = await prisma.bookshelf.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { ownedBooks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(bookshelves);
  } catch (error) {
    console.error("Failed to fetch bookshelves:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookshelves" },
      { status: 500 }
    );
  }
}

// POST /api/shelves - 本棚作成
export async function POST(request: Request) {
  try {
    const session = await auth();

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

    const bookshelf = await prisma.bookshelf.create({
      data: {
        name: name.trim(),
        memo: memo?.trim() || null,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { ownedBooks: true },
        },
      },
    });

    return NextResponse.json(bookshelf, { status: 201 });
  } catch (error) {
    console.error("Failed to create bookshelf:", error);
    return NextResponse.json(
      { error: "Failed to create bookshelf" },
      { status: 500 }
    );
  }
}

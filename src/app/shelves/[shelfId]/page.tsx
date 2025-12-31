import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Plus } from "lucide-react";
import { BookGrid } from "@/components/book";

interface PageProps {
  params: Promise<{ shelfId: string }>;
}

export default async function BookshelfDetailPage({ params }: PageProps) {
  const session = await auth();
  const { shelfId } = await params;

  if (!session?.user) {
    redirect("/login");
  }

  const bookshelf = await prisma.bookshelf.findFirst({
    where: {
      id: shelfId,
      userId: session.user.id,
    },
    include: {
      ownedBooks: {
        include: {
          book: true,
          bookshelf: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { ownedBooks: true },
      },
    },
  });

  if (!bookshelf) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-0 border-b border-white/10 rounded-none">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="戻る"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{bookshelf.name}</h1>
              {bookshelf.memo && (
                <p className="text-text-secondary text-sm truncate">
                  {bookshelf.memo}
                </p>
              )}
            </div>
            <span className="text-text-muted text-sm flex-shrink-0">
              {bookshelf._count.ownedBooks}冊
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {bookshelf.ownedBooks.length > 0 ? (
          <BookGrid books={bookshelf.ownedBooks} />
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-bg-tertiary flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-text-muted" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              この本棚には本がありません
            </h2>
            <p className="text-text-secondary mb-6">
              バーコードをスキャンして本を追加しましょう
            </p>
            <Link
              href="/books/new"
              className="btn-primary inline-flex items-center gap-2 py-3 px-6"
            >
              <Plus className="w-5 h-5" />
              本を追加
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

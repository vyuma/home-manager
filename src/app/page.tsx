import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout";
import { BookshelfList } from "@/components/shelf";
import { UnshelvedBookList } from "@/components/book";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch bookshelves
  const bookshelves = await prisma.bookshelf.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { ownedBooks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch unshelved books
  const unshelvedBooks = await prisma.unshelvedBook.findMany({
    where: { userId: session.user.id },
    include: {
      book: {
        select: {
          id: true,
          title: true,
          authors: true,
          coverImageUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <DashboardHeader
        userName={session.user.name}
        userImage={session.user.image}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">
            ようこそ、{session.user.name || "ユーザー"}さん
          </h2>
          <p className="text-text-secondary">
            あなたの本棚を管理しましょう
          </p>
        </section>

        {/* Unshelved Books Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-accent-cyan">
              未確定の本
            </h3>
            <span className="text-text-muted text-sm">{unshelvedBooks.length}冊</span>
          </div>
          <UnshelvedBookList initialBooks={unshelvedBooks} />
        </section>

        {/* Bookshelves Section */}
        <BookshelfList initialBookshelves={bookshelves} />
      </main>
    </div>
  );
}

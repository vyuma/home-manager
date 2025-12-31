"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  AlertCircle,
  Loader2,
  RotateCcw,
  ChevronDown,
  Search,
  X,
  Keyboard,
} from "lucide-react";
import * as Select from "@radix-ui/react-select";
import * as Tabs from "@radix-ui/react-tabs";
import { BarcodeScanner } from "@/components/scanner";
import { useToast } from "@/components/ui/Toast";
import { parseAuthors, READING_STATUS_LABELS } from "@/types/book";
import type { ReadingStatus } from "@prisma/client";

interface Bookshelf {
  id: string;
  name: string;
  _count: {
    ownedBooks: number;
  };
}

interface ScannedBook {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  coverImageUrl: string | null;
  readingStatus: ReadingStatus;
  ownedBookId: string;
  found: boolean;
  isNew?: boolean;
}

interface SearchResult {
  id: string;
  ownedBookId: string;
  isbn: string | null;
  title: string;
  authors: string[];
  coverImageUrl: string | null;
  readingStatus: ReadingStatus;
}

export default function InventoryPage() {
  const { success, error: showError, info } = useToast();

  const [bookshelves, setBookshelves] = useState<Bookshelf[]>([]);
  const [selectedShelfId, setSelectedShelfId] = useState<string>("");
  const [isLoadingShelves, setIsLoadingShelves] = useState(true);
  const [scannedBooks, setScannedBooks] = useState<ScannedBook[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // ISBN入力用
  const [isbnInput, setIsbnInput] = useState("");
  const [isbnSearching, setIsbnSearching] = useState(false);

  // タイトル検索用
  const [titleQuery, setTitleQuery] = useState("");
  const [titleSearchResults, setTitleSearchResults] = useState<SearchResult[]>([]);
  const [isTitleSearching, setIsTitleSearching] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // 入力モード
  const [inputMode, setInputMode] = useState<"scan" | "isbn" | "title">("scan");

  // Fetch bookshelves on mount
  useEffect(() => {
    async function fetchBookshelves() {
      try {
        const response = await fetch("/api/shelves");
        if (response.ok) {
          const data = await response.json();
          setBookshelves(data);
          if (data.length > 0) {
            setSelectedShelfId(data[0].id);
          }
        }
      } catch {
        showError("本棚の取得に失敗しました");
      } finally {
        setIsLoadingShelves(false);
      }
    }
    fetchBookshelves();
  }, [showError]);

  const handleScan = useCallback(
    async (isbn: string) => {
      if (!selectedShelfId || isSearching) return;

      // Check if already scanned
      const alreadyScanned = scannedBooks.some((b) => b.isbn === isbn);
      if (alreadyScanned) {
        info("この本は既にスキャン済みです");
        return;
      }

      setIsSearching(true);

      try {
        // Search for the book in the selected bookshelf
        const response = await fetch(
          `/api/owned-books?bookshelfId=${selectedShelfId}`
        );

        if (!response.ok) {
          throw new Error("検索に失敗しました");
        }

        const ownedBooks = await response.json();

        // Find the book by ISBN
        const foundBook = ownedBooks.find(
          (ob: { book: { isbn: string | null } }) => ob.book.isbn === isbn
        );

        if (foundBook) {
          const newScannedBook: ScannedBook = {
            id: foundBook.book.id,
            isbn,
            title: foundBook.book.title,
            authors: parseAuthors(foundBook.book.authors),
            coverImageUrl: foundBook.book.coverImageUrl,
            readingStatus: foundBook.readingStatus,
            ownedBookId: foundBook.id,
            found: true,
            isNew: true,
          };

          setScannedBooks((prev) => [newScannedBook, ...prev]);
          success("本を確認しました", foundBook.book.title);

          // Remove isNew flag after animation
          setTimeout(() => {
            setScannedBooks((prev) =>
              prev.map((b) => (b.isbn === isbn ? { ...b, isNew: false } : b))
            );
          }, 1000);
        } else {
          // Book not found in this shelf, search in all user's books
          const allBooksResponse = await fetch("/api/owned-books");
          if (allBooksResponse.ok) {
            const allBooks = await allBooksResponse.json();
            const bookInOtherShelf = allBooks.find(
              (ob: { book: { isbn: string | null } }) => ob.book.isbn === isbn
            );

            if (bookInOtherShelf) {
              info(
                `この本は「${bookInOtherShelf.bookshelf.name}」にあります`,
                bookInOtherShelf.book.title
              );
            } else {
              // Check unshelved books
              const unshelvedResponse = await fetch("/api/unshelved-books");
              if (unshelvedResponse.ok) {
                const unshelvedBooks = await unshelvedResponse.json();
                const bookInUnshelved = unshelvedBooks.find(
                  (ub: { book: { isbn: string | null } }) =>
                    ub.book.isbn === isbn
                );

                if (bookInUnshelved) {
                  info(
                    "この本は「未確定の本」にあります",
                    bookInUnshelved.book.title
                  );
                } else {
                  showError("この本は登録されていません", `ISBN: ${isbn}`);
                }
              }
            }
          }
        }
      } catch (err) {
        showError(
          "検索に失敗しました",
          err instanceof Error ? err.message : undefined
        );
      } finally {
        setIsSearching(false);
      }
    },
    [selectedShelfId, scannedBooks, isSearching, success, info, showError]
  );

  const handleStatusChange = useCallback(
    async (ownedBookId: string, newStatus: ReadingStatus) => {
      try {
        const response = await fetch(`/api/owned-books/${ownedBookId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readingStatus: newStatus }),
        });

        if (!response.ok) {
          throw new Error("更新に失敗しました");
        }

        setScannedBooks((prev) =>
          prev.map((b) =>
            b.ownedBookId === ownedBookId
              ? { ...b, readingStatus: newStatus }
              : b
          )
        );

        success("読書状況を更新しました");
      } catch (err) {
        showError(
          "更新に失敗しました",
          err instanceof Error ? err.message : undefined
        );
      }
    },
    [success, showError]
  );

  const handleReset = useCallback(() => {
    setScannedBooks([]);
  }, []);

  // ISBN入力で点検
  const handleIsbnSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const isbn = isbnInput.replace(/[-\s]/g, "").trim();
      if (!isbn || !selectedShelfId) return;

      // ISBNの形式チェック（10桁または13桁）
      if (!/^\d{10}$|^\d{13}$/.test(isbn)) {
        showError("ISBNの形式が正しくありません", "10桁または13桁の数字を入力してください");
        return;
      }

      await handleScan(isbn);
      setIsbnInput("");
    },
    [isbnInput, selectedShelfId, handleScan, showError]
  );

  // タイトル検索
  const performTitleSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || !selectedShelfId) {
        setTitleSearchResults([]);
        return;
      }

      setIsTitleSearching(true);

      try {
        const response = await fetch(`/api/owned-books?bookshelfId=${selectedShelfId}`);
        if (!response.ok) throw new Error("検索に失敗しました");

        const ownedBooks = await response.json();
        const lowerQuery = query.toLowerCase();

        const results: SearchResult[] = ownedBooks
          .filter((ob: { book: { title: string; authors: string; isbn: string | null } }) => {
            const authors = parseAuthors(ob.book.authors);
            return (
              ob.book.title.toLowerCase().includes(lowerQuery) ||
              authors.some((a: string) => a.toLowerCase().includes(lowerQuery))
            );
          })
          .filter((ob: { book: { isbn: string | null } }) => {
            // 既にスキャン済みの本は除外
            return !scannedBooks.some((sb) => sb.isbn === ob.book.isbn);
          })
          .map((ob: { id: string; book: { id: string; isbn: string | null; title: string; authors: string; coverImageUrl: string | null }; readingStatus: ReadingStatus }) => ({
            id: ob.book.id,
            ownedBookId: ob.id,
            isbn: ob.book.isbn,
            title: ob.book.title,
            authors: parseAuthors(ob.book.authors),
            coverImageUrl: ob.book.coverImageUrl,
            readingStatus: ob.readingStatus,
          }));

        setTitleSearchResults(results);
      } catch {
        showError("検索に失敗しました");
      } finally {
        setIsTitleSearching(false);
      }
    },
    [selectedShelfId, scannedBooks, showError]
  );

  // タイトル検索のデバウンス
  const handleTitleQueryChange = useCallback(
    (value: string) => {
      setTitleQuery(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        performTitleSearch(value);
      }, 300);
    },
    [performTitleSearch]
  );

  // タイトル検索結果から本を選択
  const handleSelectFromSearch = useCallback(
    (result: SearchResult) => {
      // 既にスキャン済みかチェック
      const alreadyScanned = scannedBooks.some(
        (b) => b.isbn === result.isbn || b.id === result.id
      );
      if (alreadyScanned) {
        info("この本は既に点検済みです");
        return;
      }

      const newScannedBook: ScannedBook = {
        id: result.id,
        isbn: result.isbn || "",
        title: result.title,
        authors: result.authors,
        coverImageUrl: result.coverImageUrl,
        readingStatus: result.readingStatus,
        ownedBookId: result.ownedBookId,
        found: true,
        isNew: true,
      };

      setScannedBooks((prev) => [newScannedBook, ...prev]);
      success("本を確認しました", result.title);

      // 検索結果から削除
      setTitleSearchResults((prev) => prev.filter((r) => r.id !== result.id));

      // isNew フラグを解除
      setTimeout(() => {
        setScannedBooks((prev) =>
          prev.map((b) => (b.id === result.id ? { ...b, isNew: false } : b))
        );
      }, 1000);
    },
    [scannedBooks, success, info]
  );

  // デバウンスのクリーンアップ
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const selectedShelf = bookshelves.find((s) => s.id === selectedShelfId);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card border-0 border-b border-white/10 rounded-none">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="戻る"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">蔵書点検</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Bookshelf Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">
            点検する本棚
          </label>
          {isLoadingShelves ? (
            <div className="input-glass flex items-center justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : bookshelves.length === 0 ? (
            <div className="input-glass text-text-secondary text-sm py-3 px-4">
              本棚がありません。先に本棚を作成してください。
            </div>
          ) : (
            <Select.Root
              value={selectedShelfId}
              onValueChange={setSelectedShelfId}
            >
              <Select.Trigger className="input-glass flex items-center justify-between w-full py-3 px-4">
                <Select.Value>
                  {selectedShelf ? (
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-accent-cyan" />
                      {selectedShelf.name}
                      <span className="text-text-muted text-sm">
                        ({selectedShelf._count.ownedBooks}冊)
                      </span>
                    </span>
                  ) : (
                    <span className="text-text-muted">本棚を選択</span>
                  )}
                </Select.Value>
                <Select.Icon>
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content
                  className="glass-card-elevated overflow-hidden z-50"
                  position="popper"
                  sideOffset={4}
                >
                  <Select.Viewport className="p-1">
                    {bookshelves.map((shelf) => (
                      <Select.Item
                        key={shelf.id}
                        value={shelf.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 outline-none data-[highlighted]:bg-white/10"
                      >
                        <Select.ItemIndicator className="w-4">
                          <Check className="w-4 h-4" />
                        </Select.ItemIndicator>
                        <BookOpen className="w-4 h-4" />
                        <Select.ItemText>{shelf.name}</Select.ItemText>
                        <span className="ml-auto text-text-muted text-xs">
                          {shelf._count.ownedBooks}冊
                        </span>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          )}
        </div>

        {/* Input Mode Tabs */}
        {selectedShelfId && (
          <Tabs.Root
            value={inputMode}
            onValueChange={(v) => setInputMode(v as "scan" | "isbn" | "title")}
            className="mb-6"
          >
            <Tabs.List className="flex gap-1 p-1 bg-bg-tertiary rounded-xl mb-4">
              <Tabs.Trigger
                value="scan"
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-accent-cyan data-[state=active]:text-black data-[state=inactive]:text-text-secondary data-[state=inactive]:hover:text-text-primary"
              >
                スキャン
              </Tabs.Trigger>
              <Tabs.Trigger
                value="isbn"
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-accent-cyan data-[state=active]:text-black data-[state=inactive]:text-text-secondary data-[state=inactive]:hover:text-text-primary"
              >
                <span className="flex items-center justify-center gap-1">
                  <Keyboard className="w-4 h-4" />
                  ISBN入力
                </span>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="title"
                className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-accent-cyan data-[state=active]:text-black data-[state=inactive]:text-text-secondary data-[state=inactive]:hover:text-text-primary"
              >
                <span className="flex items-center justify-center gap-1">
                  <Search className="w-4 h-4" />
                  タイトル
                </span>
              </Tabs.Trigger>
            </Tabs.List>

            {/* バーコードスキャン */}
            <Tabs.Content value="scan">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-secondary">
                    バーコードスキャン
                  </span>
                  {isSearching && (
                    <span className="flex items-center gap-1 text-xs text-accent-cyan">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      検索中...
                    </span>
                  )}
                </div>
                <BarcodeScanner onScan={handleScan} continuous paused={isSearching} />
              </div>
            </Tabs.Content>

            {/* ISBN入力 */}
            <Tabs.Content value="isbn">
              <form onSubmit={handleIsbnSubmit} className="glass-card p-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  ISBNを入力
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={isbnInput}
                    onChange={(e) => setIsbnInput(e.target.value)}
                    placeholder="978-4-XXXX-XXXX-X"
                    className="input-glass flex-1"
                    autoComplete="off"
                    inputMode="numeric"
                  />
                  <button
                    type="submit"
                    className="btn-primary px-6 flex items-center gap-2"
                    disabled={!isbnInput.trim() || isbnSearching}
                  >
                    {isbnSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    確認
                  </button>
                </div>
                <p className="text-text-muted text-xs mt-2">
                  ハイフンありでもなしでも入力できます
                </p>
              </form>
            </Tabs.Content>

            {/* タイトル検索 */}
            <Tabs.Content value="title">
              <div className="glass-card p-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  タイトルまたは著者で検索
                </label>
                <div className="relative mb-3">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={titleQuery}
                    onChange={(e) => handleTitleQueryChange(e.target.value)}
                    placeholder="タイトルまたは著者名を入力..."
                    className="input-glass w-full pl-12 pr-12"
                  />
                  {titleQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setTitleQuery("");
                        setTitleSearchResults([]);
                        titleInputRef.current?.focus();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <X className="w-4 h-4 text-text-muted" />
                    </button>
                  )}
                </div>

                {/* 検索結果 */}
                {isTitleSearching ? (
                  <div className="py-6 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-accent-cyan mx-auto mb-2" />
                    <p className="text-text-secondary text-sm">検索中...</p>
                  </div>
                ) : titleQuery && titleSearchResults.length === 0 ? (
                  <div className="py-6 text-center text-text-secondary text-sm">
                    「{titleQuery}」に一致する本が見つかりませんでした
                  </div>
                ) : titleSearchResults.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {titleSearchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSelectFromSearch(result)}
                        className="w-full p-3 bg-bg-tertiary hover:bg-white/10 rounded-lg transition-colors text-left flex gap-3"
                      >
                        {/* Book Cover */}
                        <div className="w-10 flex-shrink-0">
                          <div className="aspect-[2/3] rounded bg-bg-secondary overflow-hidden">
                            {result.coverImageUrl ? (
                              <img
                                src={result.coverImageUrl}
                                alt={result.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-text-muted" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Book Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {result.title}
                          </h4>
                          {result.authors.length > 0 && (
                            <p className="text-text-muted text-xs truncate">
                              {result.authors.join(", ")}
                            </p>
                          )}
                        </div>

                        {/* Action Icon */}
                        <div className="flex-shrink-0 flex items-center">
                          <Check className="w-5 h-5 text-accent-green" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-text-muted text-sm">
                    この本棚の本を検索できます
                  </div>
                )}
              </div>
            </Tabs.Content>
          </Tabs.Root>
        )}

        {/* Scanned Books List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              点検済み ({scannedBooks.length}冊)
            </h2>
            {scannedBooks.length > 0 && (
              <button
                onClick={handleReset}
                className="btn-secondary py-1 px-3 text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                リセット
              </button>
            )}
          </div>

          {scannedBooks.length === 0 ? (
            <div className="glass-card p-6 text-center text-text-secondary">
              <p>本をスキャンして点検を開始してください</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scannedBooks.map((book) => (
                <div
                  key={book.isbn}
                  className={`glass-card p-3 flex gap-3 transition-all ${
                    book.isNew
                      ? "ring-2 ring-accent-green animate-pulse"
                      : ""
                  }`}
                >
                  {/* Book Cover */}
                  <div className="w-12 flex-shrink-0">
                    <div className="aspect-[2/3] rounded-lg bg-bg-tertiary overflow-hidden">
                      {book.coverImageUrl ? (
                        <img
                          src={book.coverImageUrl}
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-text-muted" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {book.found ? (
                        <Check className="w-4 h-4 text-accent-green flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-accent-pink flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {book.title}
                        </h4>
                        {book.authors.length > 0 && (
                          <p className="text-text-muted text-xs truncate">
                            {book.authors.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Status Change */}
                  <div className="flex-shrink-0">
                    <Select.Root
                      value={book.readingStatus}
                      onValueChange={(val) =>
                        handleStatusChange(book.ownedBookId, val as ReadingStatus)
                      }
                    >
                      <Select.Trigger className="py-1 px-2 rounded-lg bg-bg-tertiary hover:bg-white/10 transition-colors">
                        <span
                          className={`status-badge text-xs ${
                            book.readingStatus === "COMPLETED"
                              ? "status-completed"
                              : book.readingStatus === "READING"
                              ? "status-reading"
                              : "status-not-read"
                          }`}
                        >
                          {READING_STATUS_LABELS[book.readingStatus]}
                        </span>
                      </Select.Trigger>

                      <Select.Portal>
                        <Select.Content
                          className="glass-card-elevated overflow-hidden z-50"
                          position="popper"
                          sideOffset={4}
                          align="end"
                        >
                          <Select.Viewport className="p-1">
                            {(
                              Object.keys(
                                READING_STATUS_LABELS
                              ) as ReadingStatus[]
                            ).map((status) => (
                              <Select.Item
                                key={status}
                                value={status}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 outline-none text-sm"
                              >
                                <Select.ItemIndicator className="w-3">
                                  <Check className="w-3 h-3" />
                                </Select.ItemIndicator>
                                <span
                                  className={`status-badge text-xs ${
                                    status === "COMPLETED"
                                      ? "status-completed"
                                      : status === "READING"
                                      ? "status-reading"
                                      : "status-not-read"
                                  }`}
                                >
                                  {READING_STATUS_LABELS[status]}
                                </span>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

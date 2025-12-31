# 本の管理アプリケーション テスト計画書

## 1. テスト戦略

### 1.1 テストの種類

| 種類 | ツール | 対象 | カバレッジ目標 |
|------|--------|------|----------------|
| ユニットテスト | Vitest | ユーティリティ、フック、コンポーネント | 80% |
| 統合テスト | Vitest + Testing Library | Server Actions、API Routes | 70% |
| E2Eテスト | Playwright | ユーザーフロー | 主要フロー100% |

### 1.2 テスト環境

```bash
# 必要パッケージ
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @playwright/test
npm install -D msw  # API モック用
```

---

## 2. ユニットテスト

### 2.1 ユーティリティ関数

#### `src/lib/utils.ts`

| テストケース | 入力 | 期待結果 |
|-------------|------|----------|
| cn関数：クラス結合 | `cn("foo", "bar")` | `"foo bar"` |
| cn関数：条件付きクラス | `cn("foo", false && "bar")` | `"foo"` |
| cn関数：Tailwindマージ | `cn("p-2", "p-4")` | `"p-4"` |

```typescript
// tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (classname merge)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar')).toBe('foo');
  });

  it('should merge Tailwind classes correctly', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
```

#### `src/lib/google-books.ts`

| テストケース | 入力 | 期待結果 |
|-------------|------|----------|
| ISBN正規化：ハイフン除去 | `"978-4-00-000000-0"` | `"9784000000000"` |
| ISBN正規化：10桁 | `"4000000000"` | `"4000000000"` |
| ISBN検証：有効なISBN-13 | `"9784000000000"` | `true` |
| ISBN検証：無効なISBN | `"invalid"` | `false` |
| API応答パース：正常 | Google Books APIレスポンス | `Book`オブジェクト |
| API応答パース：著者なし | 著者なしレスポンス | `authors: []` |

```typescript
// tests/unit/google-books.test.ts
import { describe, it, expect, vi } from 'vitest';
import { normalizeISBN, validateISBN, parseGoogleBooksResponse } from '@/lib/google-books';

describe('normalizeISBN', () => {
  it('should remove hyphens', () => {
    expect(normalizeISBN('978-4-00-000000-0')).toBe('9784000000000');
  });

  it('should handle ISBN-10', () => {
    expect(normalizeISBN('4-00-000000-0')).toBe('4000000000');
  });
});

describe('validateISBN', () => {
  it('should validate correct ISBN-13', () => {
    expect(validateISBN('9784000000000')).toBe(true);
  });

  it('should reject invalid ISBN', () => {
    expect(validateISBN('invalid')).toBe(false);
  });
});

describe('parseGoogleBooksResponse', () => {
  it('should parse valid response', () => {
    const response = {
      items: [{
        volumeInfo: {
          title: 'Test Book',
          authors: ['Author 1'],
          publisher: 'Publisher',
        }
      }]
    };
    const result = parseGoogleBooksResponse(response);
    expect(result.title).toBe('Test Book');
    expect(result.authors).toEqual(['Author 1']);
  });

  it('should handle missing authors', () => {
    const response = {
      items: [{
        volumeInfo: {
          title: 'Test Book',
        }
      }]
    };
    const result = parseGoogleBooksResponse(response);
    expect(result.authors).toEqual([]);
  });
});
```

---

### 2.2 カスタムフック

#### `src/hooks/useBarcode.ts`

| テストケース | シナリオ | 期待結果 |
|-------------|----------|----------|
| 初期状態 | フック初期化 | `scanning: false, error: null` |
| スキャン開始 | `startScanning()` | `scanning: true` |
| スキャン停止 | `stopScanning()` | `scanning: false` |
| バーコード検出 | 有効なISBN検出 | `onDetect`コールバック呼び出し |
| カメラエラー | カメラアクセス拒否 | `error: 'カメラへのアクセスが拒否されました'` |

```typescript
// tests/unit/hooks/useBarcode.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useBarcode } from '@/hooks/useBarcode';

// html5-qrcodeのモック
vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
  })),
}));

describe('useBarcode', () => {
  it('should initialize with scanning false', () => {
    const { result } = renderHook(() => useBarcode({ onDetect: vi.fn() }));
    expect(result.current.scanning).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should start scanning', async () => {
    const { result } = renderHook(() => useBarcode({ onDetect: vi.fn() }));
    await act(async () => {
      await result.current.startScanning();
    });
    expect(result.current.scanning).toBe(true);
  });
});
```

#### `src/hooks/useBookSearch.ts`

| テストケース | シナリオ | 期待結果 |
|-------------|----------|----------|
| 初期状態 | フック初期化 | `loading: false, book: null, error: null` |
| ISBN検索成功 | 有効なISBN | `book`にデータ、`loading: false` |
| ISBN検索失敗 | 無効なISBN | `error`メッセージ、`book: null` |
| 本が見つからない | 存在しないISBN | `error: '本が見つかりませんでした'` |

```typescript
// tests/unit/hooks/useBookSearch.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useBookSearch } from '@/hooks/useBookSearch';

describe('useBookSearch', () => {
  it('should search book by ISBN', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        title: 'Test Book',
        authors: ['Author'],
      }),
    });

    const { result } = renderHook(() => useBookSearch());

    await act(async () => {
      await result.current.searchByISBN('9784000000000');
    });

    await waitFor(() => {
      expect(result.current.book).toBeTruthy();
      expect(result.current.book?.title).toBe('Test Book');
    });
  });
});
```

---

### 2.3 コンポーネント

#### `src/components/ui/Button.tsx`

| テストケース | Props | 期待結果 |
|-------------|-------|----------|
| デフォルトレンダリング | `children="Click"` | ボタン表示 |
| バリアント適用 | `variant="primary"` | primaryクラス適用 |
| disabled状態 | `disabled={true}` | クリック無効 |
| ローディング状態 | `loading={true}` | スピナー表示 |
| クリックイベント | `onClick` | ハンドラー呼び出し |

```typescript
// tests/unit/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should render with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply variant class', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show spinner when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should call onClick handler', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### `src/components/book/BookCard.tsx`

| テストケース | Props | 期待結果 |
|-------------|-------|----------|
| 本の情報表示 | `book`オブジェクト | タイトル、著者表示 |
| 表紙画像表示 | `coverImageUrl`あり | 画像表示 |
| デフォルト画像 | `coverImageUrl`なし | プレースホルダー表示 |
| ステータスバッジ | `readingStatus="READING"` | 「読書中」バッジ |
| クリックイベント | `onClick` | 詳細モーダル表示 |

```typescript
// tests/unit/components/BookCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookCard } from '@/components/book/BookCard';

const mockBook = {
  id: '1',
  title: 'Test Book',
  authors: ['Author 1', 'Author 2'],
  coverImageUrl: 'https://example.com/cover.jpg',
  readingStatus: 'READING' as const,
};

describe('BookCard', () => {
  it('should display book title', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByText('Test Book')).toBeInTheDocument();
  });

  it('should display authors', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByText('Author 1, Author 2')).toBeInTheDocument();
  });

  it('should display cover image', () => {
    render(<BookCard book={mockBook} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', expect.stringContaining('cover.jpg'));
  });

  it('should display reading status badge', () => {
    render(<BookCard book={mockBook} />);
    expect(screen.getByText('読書中')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<BookCard book={mockBook} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('article'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

#### `src/components/scanner/BarcodeScanner.tsx`

| テストケース | シナリオ | 期待結果 |
|-------------|----------|----------|
| 初期表示 | コンポーネントマウント | スキャンエリア表示 |
| スキャン開始ボタン | クリック | カメラ起動 |
| バーコード検出 | ISBNスキャン | `onScan`コールバック |
| エラー表示 | カメラエラー | エラーメッセージ表示 |

```typescript
// tests/unit/components/BarcodeScanner.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner';

vi.mock('html5-qrcode', () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
  })),
}));

describe('BarcodeScanner', () => {
  it('should render scan area', () => {
    render(<BarcodeScanner onScan={vi.fn()} />);
    expect(screen.getByTestId('scan-area')).toBeInTheDocument();
  });

  it('should start scanning on button click', async () => {
    render(<BarcodeScanner onScan={vi.fn()} />);
    fireEvent.click(screen.getByText('スキャン開始'));
    await waitFor(() => {
      expect(screen.getByText('スキャン中...')).toBeInTheDocument();
    });
  });
});
```

#### `src/components/shelf/ShelfCard.tsx`

| テストケース | Props | 期待結果 |
|-------------|-------|----------|
| 本棚名表示 | `name="リビング"` | 名前表示 |
| 本の数表示 | `bookCount=25` | 「25冊」表示 |
| メモ表示 | `memo="メモ"` | メモ表示 |
| 空の本棚 | `bookCount=0` | 「0冊」表示 |

```typescript
// tests/unit/components/ShelfCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ShelfCard } from '@/components/shelf/ShelfCard';

describe('ShelfCard', () => {
  it('should display shelf name', () => {
    render(<ShelfCard id="1" name="リビング" bookCount={10} />);
    expect(screen.getByText('リビング')).toBeInTheDocument();
  });

  it('should display book count', () => {
    render(<ShelfCard id="1" name="リビング" bookCount={25} />);
    expect(screen.getByText('25冊')).toBeInTheDocument();
  });

  it('should display memo if provided', () => {
    render(<ShelfCard id="1" name="リビング" bookCount={10} memo="小説多め" />);
    expect(screen.getByText('小説多め')).toBeInTheDocument();
  });
});
```

---

## 3. 統合テスト

### 3.1 Server Actions

#### `src/actions/bookshelf.ts`

| テストケース | アクション | 入力 | 期待結果 |
|-------------|-----------|------|----------|
| 本棚作成成功 | `createBookshelf` | 有効なデータ | 新規本棚ID返却 |
| 本棚作成失敗（名前なし） | `createBookshelf` | `name: ""` | バリデーションエラー |
| 本棚一覧取得 | `getBookshelves` | - | ユーザーの本棚リスト |
| 本棚更新 | `updateBookshelf` | 有効なデータ | 更新成功 |
| 本棚削除 | `deleteBookshelf` | 存在するID | 削除成功 |
| 本棚削除（本あり） | `deleteBookshelf` | 本が入っている本棚 | エラー or 確認 |

```typescript
// tests/integration/actions/bookshelf.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createBookshelf, getBookshelves, deleteBookshelf } from '@/actions/bookshelf';
import { prisma } from '@/lib/prisma';

// テスト用ユーザーID
const TEST_USER_ID = 'test-user-id';

describe('Bookshelf Actions', () => {
  beforeEach(async () => {
    // テストユーザー作成
    await prisma.user.create({
      data: { id: TEST_USER_ID, email: 'test@example.com' },
    });
  });

  afterEach(async () => {
    // クリーンアップ
    await prisma.bookshelf.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.user.delete({ where: { id: TEST_USER_ID } });
  });

  it('should create a bookshelf', async () => {
    const result = await createBookshelf({
      name: 'Test Shelf',
      memo: 'Test memo',
      userId: TEST_USER_ID,
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('Test Shelf');
  });

  it('should fail to create bookshelf without name', async () => {
    const result = await createBookshelf({
      name: '',
      userId: TEST_USER_ID,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should get user bookshelves', async () => {
    await prisma.bookshelf.create({
      data: { name: 'Shelf 1', userId: TEST_USER_ID },
    });

    const result = await getBookshelves(TEST_USER_ID);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Shelf 1');
  });
});
```

#### `src/actions/book.ts`

| テストケース | アクション | 入力 | 期待結果 |
|-------------|-----------|------|----------|
| 本登録成功 | `registerBook` | ISBNまたは手動入力 | 本ID返却 |
| 本棚への配置 | `addToShelf` | 本ID、本棚ID | 所有本レコード作成 |
| 未確定本から本棚へ | `shelveBook` | 未確定本ID、本棚ID | 移動成功 |
| 欲しい本購入 | `purchaseWantedBook` | 欲しい本ID | 未確定本へ移動 |
| ステータス更新 | `updateReadingStatus` | 所有本ID、ステータス | 更新成功 |

```typescript
// tests/integration/actions/book.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { registerBook, addToShelf, updateReadingStatus } from '@/actions/book';
import { prisma } from '@/lib/prisma';

describe('Book Actions', () => {
  const TEST_USER_ID = 'test-user-id';
  let bookshelfId: string;

  beforeEach(async () => {
    await prisma.user.create({
      data: { id: TEST_USER_ID, email: 'test@example.com' },
    });
    const shelf = await prisma.bookshelf.create({
      data: { name: 'Test Shelf', userId: TEST_USER_ID },
    });
    bookshelfId = shelf.id;
  });

  afterEach(async () => {
    await prisma.ownedBook.deleteMany({});
    await prisma.book.deleteMany({});
    await prisma.bookshelf.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it('should register and add book to shelf', async () => {
    const bookResult = await registerBook({
      isbn: '9784000000000',
      title: 'Test Book',
      authors: ['Author'],
    });

    const shelfResult = await addToShelf({
      bookId: bookResult.data!.id,
      bookshelfId,
      userId: TEST_USER_ID,
    });

    expect(shelfResult.success).toBe(true);
  });

  it('should update reading status', async () => {
    // 本を登録して本棚に追加
    const book = await prisma.book.create({
      data: { title: 'Test', authors: '["Author"]' },
    });
    const owned = await prisma.ownedBook.create({
      data: {
        bookId: book.id,
        bookshelfId,
        userId: TEST_USER_ID,
        readingStatus: 'NOT_READ',
      },
    });

    const result = await updateReadingStatus(owned.id, 'READING');

    expect(result.success).toBe(true);
    expect(result.data?.readingStatus).toBe('READING');
  });
});
```

---

### 3.2 API Routes

#### `GET /api/books/search`

| テストケース | クエリ | 期待結果 |
|-------------|--------|----------|
| ISBN検索成功 | `?isbn=9784000000000` | 書籍情報返却 |
| ISBN検索失敗 | `?isbn=invalid` | 400エラー |
| 本が見つからない | `?isbn=9789999999999` | 404エラー |

```typescript
// tests/integration/api/books-search.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GET } from '@/app/api/books/search/route';
import { NextRequest } from 'next/server';

// Google Books APIのモック
vi.mock('@/lib/google-books', () => ({
  searchByISBN: vi.fn().mockImplementation((isbn) => {
    if (isbn === '9784000000000') {
      return Promise.resolve({
        title: 'Test Book',
        authors: ['Author'],
      });
    }
    return Promise.resolve(null);
  }),
}));

describe('GET /api/books/search', () => {
  it('should return book data for valid ISBN', async () => {
    const req = new NextRequest('http://localhost/api/books/search?isbn=9784000000000');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe('Test Book');
  });

  it('should return 404 for unknown ISBN', async () => {
    const req = new NextRequest('http://localhost/api/books/search?isbn=9789999999999');
    const response = await GET(req);

    expect(response.status).toBe(404);
  });
});
```

#### `POST /api/shelves`

| テストケース | ボディ | 期待結果 |
|-------------|--------|----------|
| 本棚作成成功 | `{ name: "新しい本棚" }` | 201、新規本棚 |
| 認証なし | - | 401エラー |
| 名前なし | `{ name: "" }` | 400エラー |

#### `DELETE /api/owned-books/[id]`

| テストケース | パラメータ | 期待結果 |
|-------------|-----------|----------|
| 削除成功 | 存在するID | 200 |
| 存在しないID | 無効なID | 404 |
| 他ユーザーの本 | 別ユーザーの本ID | 403 |

---

## 4. E2Eテスト

### 4.1 Playwright設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 4.2 認証フロー

| テストケース | 手順 | 期待結果 |
|-------------|------|----------|
| ログインページ表示 | `/login`にアクセス | Googleログインボタン表示 |
| 未認証リダイレクト | `/`に直接アクセス | `/login`へリダイレクト |
| ログアウト | ログアウトボタンクリック | `/login`へリダイレクト |

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('should display Google login button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Google/i })).toBeVisible();
  });
});
```

### 4.3 本棚管理フロー

| テストケース | 手順 | 期待結果 |
|-------------|------|----------|
| 本棚一覧表示 | ダッシュボードアクセス | 本棚カード一覧表示 |
| 本棚作成 | 「本棚追加」→名前入力→保存 | 新しい本棚表示 |
| 本棚詳細表示 | 本棚カードクリック | 詳細ページ表示 |
| 本棚編集 | 編集ボタン→名前変更→保存 | 更新された名前表示 |
| 本棚削除 | 削除ボタン→確認 | 本棚消去 |

```typescript
// tests/e2e/bookshelf.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Bookshelf Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should create a new bookshelf', async ({ page }) => {
    await page.goto('/');

    // 本棚追加ボタンをクリック
    await page.getByRole('button', { name: '本棚追加' }).click();

    // モーダルで名前入力
    await page.getByLabel('本棚名').fill('テスト本棚');
    await page.getByRole('button', { name: '作成' }).click();

    // 新しい本棚が表示されることを確認
    await expect(page.getByText('テスト本棚')).toBeVisible();
  });

  test('should navigate to shelf detail', async ({ page }) => {
    await page.goto('/');
    await page.getByText('リビング本棚').click();
    await expect(page).toHaveURL(/\/shelves\/.+/);
  });
});
```

### 4.4 本の登録フロー

| テストケース | 手順 | 期待結果 |
|-------------|------|----------|
| バーコードスキャン | スキャン→ISBN検出→本棚選択→登録 | 本が本棚に追加 |
| 手動登録 | タイトル入力→本棚選択→登録 | 本が本棚に追加 |
| 検索結果なし | 存在しないISBNスキャン | 「見つかりませんでした」表示 |

```typescript
// tests/e2e/book-registration.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers/auth';

test.describe('Book Registration', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('should register book manually', async ({ page }) => {
    await page.goto('/books/new');

    // 手動入力タブをクリック
    await page.getByRole('tab', { name: '手動入力' }).click();

    // 本の情報入力
    await page.getByLabel('タイトル').fill('テスト本');
    await page.getByLabel('著者').fill('テスト著者');

    // 本棚選択
    await page.getByLabel('本棚').selectOption('リビング本棚');

    // 登録
    await page.getByRole('button', { name: '登録' }).click();

    // 成功メッセージ確認
    await expect(page.getByText('登録しました')).toBeVisible();
  });
});
```

### 4.5 未確定の本フロー

| テストケース | 手順 | 期待結果 |
|-------------|------|----------|
| 未確定の本表示 | ダッシュボード表示 | 未確定の本セクション表示 |
| 本棚に配置 | 未確定本クリック→本棚選択→確定 | 本棚に移動、未確定から消去 |
| 欲しい本から購入 | 欲しい本→購入ボタン | 未確定の本に追加 |

```typescript
// tests/e2e/unshelved-books.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser, createUnshelvedBook } from './helpers';

test.describe('Unshelved Books', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await createUnshelvedBook({ title: '未配置の本' });
  });

  test('should display unshelved books on dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('未確定の本')).toBeVisible();
    await expect(page.getByText('未配置の本')).toBeVisible();
  });

  test('should shelve an unshelved book', async ({ page }) => {
    await page.goto('/');

    // 未確定の本をクリック
    await page.getByText('未配置の本').click();

    // 本棚選択モーダル
    await page.getByLabel('本棚を選択').selectOption('リビング本棚');
    await page.getByRole('button', { name: '配置する' }).click();

    // 未確定の本から消えることを確認
    await expect(page.getByText('未配置の本')).not.toBeVisible();
  });
});
```

### 4.6 蔵書点検フロー

| テストケース | 手順 | 期待結果 |
|-------------|------|----------|
| 点検開始 | 本棚選択→点検開始 | スキャナー表示 |
| 連続スキャン | 複数ISBN連続スキャン | 各本にチェック |
| 点検完了 | 完了ボタン | 点検結果サマリー表示 |

```typescript
// tests/e2e/inventory.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser, mockBarcodeScan } from './helpers';

test.describe('Inventory Check', () => {
  test('should start inventory check', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/inventory');

    // 本棚選択
    await page.getByLabel('本棚').selectOption('リビング本棚');
    await page.getByRole('button', { name: '点検開始' }).click();

    // スキャナーが表示されることを確認
    await expect(page.getByTestId('scanner')).toBeVisible();
  });
});
```

---

## 5. テストカバレッジ目標

| カテゴリ | 目標カバレッジ | 優先度 |
|----------|---------------|--------|
| ユーティリティ関数 | 90% | 高 |
| カスタムフック | 80% | 高 |
| UIコンポーネント | 80% | 中 |
| Server Actions | 85% | 高 |
| API Routes | 80% | 高 |
| E2Eフロー | 主要フロー100% | 高 |

---

## 6. CI/CD設定

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 7. テスト実行コマンド

```bash
# ユニットテスト
npm run test:unit

# ユニットテスト（ウォッチモード）
npm run test:unit:watch

# ユニットテスト（カバレッジ）
npm run test:unit:coverage

# E2Eテスト
npm run test:e2e

# E2Eテスト（UIモード）
npm run test:e2e:ui

# 全テスト
npm run test
```

### package.json スクリプト

```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 8. モック戦略

### 8.1 外部APIモック

```typescript
// tests/mocks/google-books.ts
import { http, HttpResponse } from 'msw';

export const googleBooksHandlers = [
  http.get('https://www.googleapis.com/books/v1/volumes', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (query?.includes('isbn:9784000000000')) {
      return HttpResponse.json({
        items: [{
          volumeInfo: {
            title: 'Mock Book',
            authors: ['Mock Author'],
            publisher: 'Mock Publisher',
          }
        }]
      });
    }

    return HttpResponse.json({ items: [] });
  }),
];
```

### 8.2 認証モック

```typescript
// tests/helpers/auth.ts
import { Page } from '@playwright/test';

export async function loginAsTestUser(page: Page) {
  // テスト環境用の認証バイパス
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
    },
  ]);
}
```

### 8.3 Prismaモック

```typescript
// tests/mocks/prisma.ts
import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  bookshelf: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  book: {
    findUnique: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
  },
  ownedBook: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient;
```

---

## 9. テストデータ

### 9.1 フィクスチャ

```typescript
// tests/fixtures/books.ts
export const mockBooks = [
  {
    id: 'book-1',
    isbn: '9784000000000',
    title: 'テスト本1',
    authors: '["著者1"]',
    publisher: '出版社A',
    coverImageUrl: 'https://example.com/cover1.jpg',
  },
  {
    id: 'book-2',
    isbn: '9784000000001',
    title: 'テスト本2',
    authors: '["著者2", "著者3"]',
    publisher: '出版社B',
    coverImageUrl: null,
  },
];

export const mockBookshelves = [
  {
    id: 'shelf-1',
    name: 'リビング本棚',
    memo: '小説が多め',
    userId: 'test-user',
  },
  {
    id: 'shelf-2',
    name: '寝室本棚',
    memo: null,
    userId: 'test-user',
  },
];
```

---

## 10. チェックリスト

### ユニットテスト
- [ ] ユーティリティ関数（cn, normalizeISBN, validateISBN）
- [ ] Google Books APIパーサー
- [ ] useBarcode フック
- [ ] useBookSearch フック
- [ ] Button コンポーネント
- [ ] BookCard コンポーネント
- [ ] ShelfCard コンポーネント
- [ ] BarcodeScanner コンポーネント
- [ ] Modal コンポーネント

### 統合テスト
- [ ] createBookshelf アクション
- [ ] getBookshelves アクション
- [ ] registerBook アクション
- [ ] addToShelf アクション
- [ ] updateReadingStatus アクション
- [ ] GET /api/books/search
- [ ] POST /api/shelves
- [ ] DELETE /api/owned-books/[id]

### E2Eテスト
- [ ] 認証フロー
- [ ] 本棚作成フロー
- [ ] 本の登録フロー（バーコード）
- [ ] 本の登録フロー（手動）
- [ ] 未確定の本→本棚配置フロー
- [ ] 欲しい本→購入フロー
- [ ] 蔵書点検フロー
- [ ] 本の詳細表示・編集フロー
- [ ] 検索フロー

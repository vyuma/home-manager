# 本の管理アプリケーション 実装計画書

## 0. デザインシステム

### 0.1 デザインコンセプト
**「近未来の透明な本棚」** - Futuristic Glass Bookshelf

- **透明感（Glassmorphism）**: すりガラスのような半透明エフェクト
- **浮遊感**: シャドウとブラーで浮いているような印象
- **ネオン輝き**: アクセントにサイバーパンク風の発光
- **ダークベース**: 深い暗色を基調に、光が映える設計

### 0.2 カラーパレット

```css
:root {
  /* ベースカラー（ダーク） */
  --bg-primary: #0a0a0f;           /* 深い宇宙の黒 */
  --bg-secondary: #12121a;         /* やや明るい背景 */
  --bg-tertiary: #1a1a2e;          /* カード背景 */

  /* グラス効果用 */
  --glass-bg: rgba(255, 255, 255, 0.05);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: rgba(0, 0, 0, 0.3);

  /* アクセントカラー（ネオン） */
  --accent-cyan: #00f5ff;          /* メインアクセント：シアン */
  --accent-purple: #bf00ff;        /* サブアクセント：パープル */
  --accent-blue: #0066ff;          /* リンク：ブルー */
  --accent-green: #00ff88;         /* 成功：グリーン */
  --accent-orange: #ff6b00;        /* 警告：オレンジ */
  --accent-pink: #ff0080;          /* エラー：ピンク */

  /* テキスト */
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.4);

  /* グラデーション */
  --gradient-primary: linear-gradient(135deg, #00f5ff 0%, #bf00ff 100%);
  --gradient-glass: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
}
```

### 0.3 Glassmorphism（グラスモーフィズム）

```css
/* 基本グラスカード */
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

/* 強調グラスカード */
.glass-card-elevated {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  box-shadow:
    0 15px 40px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(0, 245, 255, 0.1);
}

/* ホバー時のグロー効果 */
.glass-card:hover {
  border-color: rgba(0, 245, 255, 0.3);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    0 0 20px rgba(0, 245, 255, 0.15);
}
```

### 0.4 コンポーネントスタイル

#### ボタン
```css
/* プライマリボタン（グラデーション＋グロー） */
.btn-primary {
  background: linear-gradient(135deg, #00f5ff 0%, #0066ff 100%);
  color: #000;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 0 20px rgba(0, 245, 255, 0.4);
  transition: all 0.3s ease;
}

.btn-primary:hover {
  box-shadow: 0 0 30px rgba(0, 245, 255, 0.6);
  transform: translateY(-2px);
}

/* セカンダリボタン（グラス） */
.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

/* ゴーストボタン */
.btn-ghost {
  background: transparent;
  color: #00f5ff;
  border: 1px solid #00f5ff;
  border-radius: 12px;
}
```

#### 本棚カード
```css
/* 本棚カード */
.shelf-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* 本棚のアクセントライン */
.shelf-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #00f5ff, #bf00ff);
}

/* 本棚アイコンのグロー */
.shelf-icon {
  color: #00f5ff;
  filter: drop-shadow(0 0 8px rgba(0, 245, 255, 0.5));
}
```

#### 本カード
```css
/* 本の表紙カード */
.book-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.book-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 30px rgba(0, 245, 255, 0.2);
}

/* 本の表紙画像 */
.book-cover {
  aspect-ratio: 2/3;
  object-fit: cover;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 読書ステータスバッジ */
.status-badge {
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-not-read {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.status-reading {
  background: rgba(0, 245, 255, 0.2);
  color: #00f5ff;
  box-shadow: 0 0 10px rgba(0, 245, 255, 0.3);
}

.status-completed {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
}
```

#### 入力フォーム
```css
/* テキスト入力 */
.input-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  color: #fff;
  transition: all 0.3s ease;
}

.input-glass:focus {
  outline: none;
  border-color: #00f5ff;
  box-shadow: 0 0 20px rgba(0, 245, 255, 0.2);
}

/* セレクトボックス */
.select-glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}
```

#### モーダル
```css
/* モーダルオーバーレイ */
.modal-overlay {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
}

/* モーダルコンテンツ */
.modal-content {
  background: rgba(18, 18, 26, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.5),
    0 0 50px rgba(0, 245, 255, 0.1);
}
```

#### バーコードスキャナー
```css
/* スキャナーフレーム */
.scanner-frame {
  border: 2px solid #00f5ff;
  border-radius: 16px;
  box-shadow:
    0 0 30px rgba(0, 245, 255, 0.3),
    inset 0 0 30px rgba(0, 245, 255, 0.1);
  animation: scanner-pulse 2s infinite;
}

@keyframes scanner-pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(0, 245, 255, 0.3); }
  50% { box-shadow: 0 0 50px rgba(0, 245, 255, 0.5); }
}

/* スキャンライン */
.scan-line {
  height: 2px;
  background: linear-gradient(90deg, transparent, #00f5ff, transparent);
  box-shadow: 0 0 10px #00f5ff;
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}
```

### 0.5 アニメーション

```css
/* フェードイン */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* グロー点滅 */
@keyframes glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* フローティング */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 本棚ロード時のスタガー */
.book-card {
  animation: fadeIn 0.5s ease forwards;
  animation-delay: calc(var(--index) * 0.1s);
}
```

### 0.6 Tailwind CSS 設定

```javascript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#12121a',
        'bg-tertiary': '#1a1a2e',
        'accent-cyan': '#00f5ff',
        'accent-purple': '#bf00ff',
        'accent-blue': '#0066ff',
        'accent-green': '#00ff88',
        'accent-orange': '#ff6b00',
        'accent-pink': '#ff0080',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 245, 255, 0.4)',
        'glow-purple': '0 0 20px rgba(191, 0, 255, 0.4)',
      },
      animation: {
        'pulse-glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
}
```

### 0.7 UIイメージ

```
┌─────────────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 背景：深い宇宙の黒 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │ ░░░░░░░░░░░░ ナビゲーション ░░░░░░░░░░░░░░░░░░░ │  │
│   │ ░ 透明グラス + シアンのアクセント ░░░░░░░░░░░░ │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│   ╔═══════════════════════════════════════════════╗    │
│   ║  ▒▒▒▒▒ 未確定の本（グローイング枠線）▒▒▒▒▒  ║    │
│   ║  ┌─────┐ ┌─────┐ ┌─────┐                     ║    │
│   ║  │ 📕  │ │ 📗  │ │ 📘  │  ← ホバーで浮遊    ║    │
│   ║  └─────┘ └─────┘ └─────┘                     ║    │
│   ╚═══════════════════════════════════════════════╝    │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │ ▓▓▓ 本棚カード（グラスモーフィズム）▓▓▓▓▓▓▓▓▓ │  │
│   │ ════ シアン→パープルのグラデーションライン ══ │  │
│   │                                                 │  │
│   │  📚 リビング本棚                    25冊       │  │
│   │  ──────────────────────────────────────────    │  │
│   │  透明感のある背景 + 微かなグロー               │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│   ┌──────────┐  ← ボタン：グラデーション背景        │
│   │ + 本棚追加 │     シアンのグロー効果              │
│   └──────────┘                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 1. プロジェクト概要

### 1.1 技術スタック
| カテゴリ | 技術 | バージョン |
|----------|------|-----------|
| フレームワーク | Next.js (App Router) | 16.x |
| 言語 | TypeScript | 5.x |
| UI | React | 19.x |
| スタイリング | Tailwind CSS | 4.x |
| 認証 | NextAuth.js (Auth.js) | 5.x |
| ORM | Prisma | 7.x |
| DB | PostgreSQL | 16.x |
| バーコード | html5-qrcode / quagga2 | - |
| 外部API | Google Books API | v1 |
| コンテナ | Docker / Docker Compose | - |

### 1.2 ディレクトリ構成（予定）
```
home-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # 認証関連ページ
│   │   │   └── login/
│   │   ├── (main)/             # メインアプリ（認証必須）
│   │   │   ├── page.tsx        # ダッシュボード
│   │   │   ├── wanted/         # 欲しい本
│   │   │   ├── shelves/        # 本棚
│   │   │   ├── inventory/      # 蔵書点検
│   │   │   ├── books/          # 本登録
│   │   │   ├── search/         # 検索
│   │   │   ├── read/           # 読んだ本
│   │   │   └── settings/       # 設定
│   │   ├── api/                # API Routes
│   │   │   ├── auth/
│   │   │   ├── books/
│   │   │   ├── shelves/
│   │   │   ├── owned-books/
│   │   │   ├── unshelved-books/
│   │   │   ├── wanted-books/
│   │   │   ├── read-books/
│   │   │   └── search/
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/             # コンポーネント
│   │   ├── ui/                 # 基本UIコンポーネント
│   │   ├── book/               # 本関連
│   │   ├── shelf/              # 本棚関連
│   │   ├── scanner/            # バーコードスキャナー
│   │   └── layout/             # レイアウト
│   ├── lib/                    # ユーティリティ
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── google-books.ts
│   │   └── utils.ts
│   ├── hooks/                  # カスタムフック
│   ├── types/                  # 型定義
│   └── actions/                # Server Actions
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 2. 実装フェーズ

### Phase 0: 環境構築
**目標**: 開発環境の整備

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 0-1 | 既存Next.jsプロジェクトの確認 | - |
| 0-2 | 必要パッケージのインストール | package.json |
| 0-3 | Prismaスキーマ作成 | schema.prisma |
| 0-4 | Docker環境の確認・調整 | docker-compose.yml |
| 0-5 | 環境変数の設定 | .env |

**必要パッケージ**:
```bash
# 認証
npm install next-auth@beta @auth/prisma-adapter

# DB
npm install @prisma/client
npm install -D prisma

# バーコード
npm install html5-qrcode

# UI
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select @radix-ui/react-toast
npm install lucide-react
npm install clsx tailwind-merge
```

---

### Phase 1: 認証基盤
**目標**: Googleログインの実装

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 1-1 | Prismaスキーマ（User, Account, Session） | schema.prisma |
| 1-2 | NextAuth設定 | auth.ts, route.ts |
| 1-3 | Google OAuth設定 | Google Cloud Console |
| 1-4 | ログインページUI | /login/page.tsx |
| 1-5 | 認証ミドルウェア | middleware.ts |
| 1-6 | セッションプロバイダー | providers.tsx |

**Google Cloud Console設定**:
1. プロジェクト作成
2. OAuth 2.0クライアントID作成
3. 認証済みリダイレクトURI: `http://localhost:3000/api/auth/callback/google`

---

### Phase 2: データベース基盤
**目標**: 全テーブルの作成とPrisma設定

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 2-1 | Bookモデル | schema.prisma |
| 2-2 | Bookshelfモデル | schema.prisma |
| 2-3 | OwnedBook, UnshelvedBook, WantedBookモデル | schema.prisma |
| 2-4 | Location, ReadBookモデル | schema.prisma |
| 2-5 | AutoReviewモデル | schema.prisma |
| 2-6 | ReadingStatus Enum | schema.prisma |
| 2-7 | マイグレーション実行 | migrations/ |

---

### Phase 3: 本棚管理機能
**目標**: 本棚のCRUD実装

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 3-1 | 本棚一覧API | /api/shelves |
| 3-2 | 本棚作成API | /api/shelves (POST) |
| 3-3 | 本棚更新・削除API | /api/shelves/[id] |
| 3-4 | ダッシュボードUI（本棚一覧） | /page.tsx |
| 3-5 | 本棚作成モーダル | CreateShelfModal.tsx |
| 3-6 | 本棚詳細ページ | /shelves/[shelfId]/page.tsx |

---

### Phase 4: Google Books API連携
**目標**: ISBN検索機能の実装

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 4-1 | Google Books APIクライアント | google-books.ts |
| 4-2 | ISBN検索API | /api/books/search |
| 4-3 | 書籍マスタ登録API | /api/books (POST) |
| 4-4 | 書籍情報の型定義 | types/book.ts |

**Google Books APIレスポンス例**:
```typescript
interface GoogleBooksResponse {
  items: [{
    volumeInfo: {
      title: string;
      subtitle?: string;
      authors?: string[];
      publisher?: string;
      publishedDate?: string;
      description?: string;
      imageLinks?: {
        thumbnail?: string;
      };
      categories?: string[];
      pageCount?: number;
    }
  }]
}
```

---

### Phase 5: バーコードスキャン機能
**目標**: カメラでのISBN読み取り

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 5-1 | バーコードスキャナーコンポーネント | BarcodeScanner.tsx |
| 5-2 | カメラ権限リクエスト処理 | - |
| 5-3 | ISBN検出時のコールバック | - |
| 5-4 | スキャン結果表示UI | ScanResult.tsx |
| 5-5 | 連続スキャンモード（蔵書点検用） | - |

**html5-qrcode使用例**:
```typescript
import { Html5QrcodeScanner } from 'html5-qrcode';

const scanner = new Html5QrcodeScanner("reader", {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13]
});
```

---

### Phase 6: 本の登録機能
**目標**: 本の登録フロー実装

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 6-1 | 本登録ページUI | /books/new/page.tsx |
| 6-2 | 所有本登録API | /api/owned-books (POST) |
| 6-3 | 本棚選択セレクトボックス | ShelfSelect.tsx |
| 6-4 | 手動入力フォーム（ISBNなし用） | ManualBookForm.tsx |
| 6-5 | 登録完了通知 | Toast |

---

### Phase 7: 蔵書点検機能
**目標**: 連続スキャンによる蔵書点検

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 7-1 | 蔵書点検ページUI | /inventory/page.tsx |
| 7-2 | 本棚選択 | - |
| 7-3 | 連続バーコードスキャン | - |
| 7-4 | 登録済み本リスト表示 | - |
| 7-5 | 読書状況クイック設定 | - |

---

### Phase 8: 未確定の本管理
**目標**: 購入済み・未配置の本の管理

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 8-1 | 未確定の本API | /api/unshelved-books |
| 8-2 | ダッシュボードに未確定の本表示 | - |
| 8-3 | 本棚配置機能 | /api/unshelved-books/[id]/shelve |
| 8-4 | ワンタッチ配置UI | - |

---

### Phase 9: 欲しい本管理
**目標**: 欲しい本リストの管理

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 9-1 | 欲しい本API | /api/wanted-books |
| 9-2 | 欲しい本一覧ページ | /wanted/page.tsx |
| 9-3 | ワンタッチ購入機能 | /api/wanted-books/[id]/purchase |
| 9-4 | 欲しい本登録UI | - |

---

### Phase 10: 本の詳細・編集機能
**目標**: 本の詳細表示と編集

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 10-1 | 本詳細モーダル | BookDetailModal.tsx |
| 10-2 | 本棚変更機能 | - |
| 10-3 | 読書状況変更機能 | - |
| 10-4 | メモ編集機能 | - |
| 10-5 | 削除機能（3種類） | DeleteConfirmDialog.tsx |

---

### Phase 11: 検索機能
**目標**: 全体検索の実装

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 11-1 | 統合検索API | /api/search |
| 11-2 | 検索バー（ヘッダー） | SearchBar.tsx |
| 11-3 | 検索結果ページ | /search/page.tsx |
| 11-4 | フィルタリング機能 | - |

---

### Phase 12: 読んだ本管理
**目標**: 家にない読んだ本の管理

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 12-1 | 読んだ本API | /api/read-books |
| 12-2 | 場所（Location）管理 | - |
| 12-3 | 読んだ本一覧ページ | /read/page.tsx |
| 12-4 | 本棚から削除→読んだ本への移動 | - |

---

### Phase 13: UI/UX改善
**目標**: ユーザビリティ向上

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 13-1 | レスポンシブ対応 | - |
| 13-2 | ローディング表示 | Loading.tsx |
| 13-3 | エラーハンドリング | Error.tsx |
| 13-4 | トースト通知 | - |
| 13-5 | ナビゲーション | Navigation.tsx |
| 13-6 | 空状態表示 | EmptyState.tsx |

---

### Phase 14: AI感想生成（アドバンスド）
**目標**: SLMによる自動感想生成

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 14-1 | SLM API連携 | slm.ts |
| 14-2 | 感想生成API | /api/books/[id]/generate-review |
| 14-3 | 感想表示UI | - |
| 14-4 | 再生成機能 | - |

---

### Phase 15: 情報コピー・読書マラソン機能
**目標**: 書籍情報のワンタッチコピーと読書マラソン投稿管理

| タスク | 詳細 | 成果物 |
|--------|------|--------|
| 15-1 | 著者名コピー機能 | CopyButton.tsx |
| 15-2 | 書名コピー機能 | - |
| 15-3 | 出版社コピー機能 | - |
| 15-4 | ISBNコピー機能 | - |
| 15-5 | 読書マラソン投稿チェック機能 | marathonPosted フィールド追加 |
| 15-6 | コピー時のトースト通知 | - |

**実装詳細**:

```typescript
// クリップボードコピー関数
async function copyToClipboard(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  toast.success(`${label}をコピーしました`);
}

// 使用例
<CopyButton
  value={book.authors.join(', ')}
  label="著者名"
  icon={<UserIcon />}
/>
```

**UIイメージ**:
```
┌─────────────────────────────────────────────┐
│ 📖 本の詳細                                  │
├─────────────────────────────────────────────┤
│ タイトル: テスト本           [📋 コピー]    │
│ 著者: 著者A, 著者B           [📋 コピー]    │
│ 出版社: 出版社X              [📋 コピー]    │
│ ISBN: 9784000000000          [📋 コピー]    │
├─────────────────────────────────────────────┤
│ ☑ 読書マラソン投稿済み                      │
└─────────────────────────────────────────────┘
```

---

## 3. 優先度別タスク一覧

### 高優先度（MVP）
1. Phase 0: 環境構築
2. Phase 1: 認証基盤
3. Phase 2: データベース基盤
4. Phase 3: 本棚管理機能
5. Phase 4: Google Books API連携
6. Phase 5: バーコードスキャン機能
7. Phase 6: 本の登録機能
8. Phase 8: 未確定の本管理
9. Phase 10: 本の詳細・編集機能

### 中優先度
10. Phase 7: 蔵書点検機能
11. Phase 9: 欲しい本管理
12. Phase 11: 検索機能
13. Phase 13: UI/UX改善

### 低優先度（後回し可）
14. Phase 12: 読んだ本管理
15. Phase 14: AI感想生成
16. Phase 15: 情報コピー・読書マラソン機能

---

## 4. 環境変数

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bookmanager?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Google Books API
GOOGLE_BOOKS_API_KEY="your-api-key"

# SLM API (アドバンスド)
SLM_API_URL="your-slm-api-url"
SLM_API_KEY="your-slm-api-key"
```

---

## 5. Prismaスキーマ（完全版）

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ===== NextAuth =====
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts       Account[]
  sessions       Session[]
  bookshelves    Bookshelf[]
  ownedBooks     OwnedBook[]
  unshelvedBooks UnshelvedBook[]
  wantedBooks    WantedBook[]
  locations      Location[]
  readBooks      ReadBook[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  sessionToken String   @unique
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ===== 書籍マスタ =====
model Book {
  id            String   @id @default(cuid())
  isbn          String?  @unique
  title         String
  subtitle      String?
  authors       String   // JSON array
  publisher     String?
  publishedDate String?
  description   String?
  coverImageUrl String?
  categories    String?  // JSON array
  pageCount     Int?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  ownedBooks     OwnedBook[]
  unshelvedBooks UnshelvedBook[]
  wantedBooks    WantedBook[]
  readBooks      ReadBook[]
  autoReview     AutoReview?
}

// ===== 本棚 =====
model Bookshelf {
  id        String   @id @default(cuid())
  name      String
  memo      String?
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  ownedBooks OwnedBook[]
}

// ===== 所有本 =====
model OwnedBook {
  id              String        @id @default(cuid())
  bookId          String
  bookshelfId     String
  userId          String
  readingStatus   ReadingStatus @default(NOT_READ)
  note            String?
  marathonPosted  Boolean       @default(false)  // 読書マラソン投稿済みフラグ
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  book      Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)
  bookshelf Bookshelf @relation(fields: [bookshelfId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([bookId, userId])
}

// ===== 未確定の本 =====
model UnshelvedBook {
  id            String        @id @default(cuid())
  bookId        String
  userId        String
  readingStatus ReadingStatus @default(NOT_READ)
  note          String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  book Book @relation(fields: [bookId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([bookId, userId])
}

// ===== 欲しい本 =====
model WantedBook {
  id        String   @id @default(cuid())
  bookId    String
  userId    String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  book Book @relation(fields: [bookId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([bookId, userId])
}

// ===== 場所 =====
model Location {
  id        String   @id @default(cuid())
  name      String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  readBooks ReadBook[]
}

// ===== 読んだ本 =====
model ReadBook {
  id            String        @id @default(cuid())
  bookId        String
  locationId    String
  userId        String
  readingStatus ReadingStatus @default(COMPLETED)
  note          String?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  book     Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  location Location @relation(fields: [locationId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([bookId, userId])
}

// ===== AI感想 =====
model AutoReview {
  id            String   @id @default(cuid())
  bookId        String   @unique
  generatedText String
  createdAt     DateTime @default(now())

  book Book @relation(fields: [bookId], references: [id], onDelete: Cascade)
}

// ===== Enum =====
enum ReadingStatus {
  NOT_READ
  READING
  COMPLETED
}
```

---

## 6. 実装チェックリスト

### Phase 0: 環境構築
- [ ] パッケージインストール
- [ ] Prismaスキーマ作成
- [ ] マイグレーション実行
- [ ] 環境変数設定

### Phase 1: 認証基盤
- [ ] NextAuth設定
- [ ] Google OAuth設定
- [ ] ログインページ
- [ ] ミドルウェア

### Phase 2-3: 本棚管理
- [ ] 本棚API
- [ ] ダッシュボード
- [ ] 本棚詳細ページ

### Phase 4-6: 本の登録
- [ ] Google Books API連携
- [ ] バーコードスキャナー
- [ ] 本登録フロー

### Phase 7-9: その他機能
- [ ] 蔵書点検
- [ ] 未確定の本
- [ ] 欲しい本

### Phase 10-13: UI/UX
- [ ] 本詳細モーダル
- [ ] 検索機能
- [ ] レスポンシブ対応
- [ ] エラーハンドリング

### Phase 14: AI機能
- [ ] 感想自動生成

### Phase 15: 情報コピー・読書マラソン
- [ ] 著者名コピー機能
- [ ] 書名コピー機能
- [ ] 出版社コピー機能
- [ ] ISBNコピー機能
- [ ] 読書マラソン投稿チェック機能（チェックボックス）

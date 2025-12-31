# Home Manager

家の管理を行うWebアプリケーション。部屋やアイテムを管理できます。

## 技術スタック

- **フレームワーク**: Next.js 16.1.1
- **言語**: TypeScript
- **UI**: React 19 + Tailwind CSS 4
- **ORM**: Prisma 7
- **データベース**: PostgreSQL 16
- **コンテナ**: Docker / Docker Compose

## データベース構造

```
User (ユーザー)
  └── Home (家)
        └── Room (部屋)
              └── Item (アイテム)
```

### モデル詳細

| モデル | フィールド | 説明 |
|--------|-----------|------|
| User | id, email, name, createdAt, updatedAt | ユーザー情報 |
| Home | id, name, address, userId, createdAt, updatedAt | 家の情報 |
| Room | id, name, homeId, createdAt, updatedAt | 部屋の情報 |
| Item | id, name, description, quantity, roomId, createdAt, updatedAt | アイテムの情報 |

## セットアップ

### 必要条件

- Node.js 20+
- Docker & Docker Compose

### 環境変数

`.env.example` をコピーして `.env` を作成:

```bash
cp .env.example .env
```

### 開発環境

```bash
# 依存関係をインストール
npm install

# データベースを起動
docker compose up -d db

# マイグレーションを実行
npx prisma migrate dev

# 開発サーバーを起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

### 本番環境 (Docker)

```bash
# ビルド & 起動
docker compose up --build

# マイグレーションを実行 (初回のみ)
docker compose exec app npx prisma migrate deploy
```

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番用にビルド |
| `npm run start` | 本番サーバーを起動 |
| `npm run lint` | Biomeでリント |
| `npm run format` | Biomeでフォーマット |

## ディレクトリ構成

```
home-manager/
├── src/
│   ├── app/           # Next.js App Router
│   └── lib/           # ユーティリティ
│       └── prisma.ts  # Prismaクライアント
├── prisma/
│   ├── schema.prisma  # DBスキーマ
│   └── migrations/    # マイグレーションファイル
├── Dockerfile
├── docker-compose.yml
└── package.json
```

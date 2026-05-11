# KoujiHub Cloud デプロイ手順

このドキュメントは、KoujiHub Cloud を **GitHub + Vercel + Neon Postgres** で公開するための手順です。

## 推奨構成

- アプリ: Vercel
- データベース: Neon Postgres
- ファイル保存: 次フェーズで Vercel Blob / S3 / Cloudflare R2 / Supabase Storage に置き換え

現在の MVP は `public/uploads/documents` にローカル保存します。Vercel 上のファイルシステムは永続ストレージとして使わない前提のため、本番運用では外部ストレージ化が必要です。

## 1. Neon Postgres を作成

1. Neon にログインします。
2. New Project を作成します。
3. Region は利用者に近いリージョンを選びます。
4. Connection string を取得します。
5. Vercel の Runtime 用には pooled connection string を使います。

例:

```text
postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&connect_timeout=10
```

## 2. Vercel に GitHub リポジトリを Import

1. Vercel にログインします。
2. Add New Project を選択します。
3. GitHub リポジトリ `pullead/koujihub-cloud` を選択します。
4. Framework Preset は Next.js を選びます。
5. Build Command は通常どおり `npm run build` で問題ありません。

## 3. Vercel に環境変数を設定

Vercel Project Settings の Environment Variables に以下を追加します。

```text
DATABASE_URL=Neon の connection string
```

Production / Preview / Development のすべてに入れておくと、Preview Deploy でも Prisma 読み書きを確認できます。

## 4. Neon DB に Prisma schema を反映

ローカル端末で Neon の `DATABASE_URL` を一時的に指定して実行します。

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&connect_timeout=10" npm run db:deploy
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&connect_timeout=10" npm run db:seed
```

すでに `.env` を Neon 用に書き換えた場合は、以下でも実行できます。

```bash
npm run db:deploy
npm run db:seed
```

## 5. Vercel Deploy

Vercel は GitHub の `main` ブランチへの push を検知して自動デプロイします。

手動で再デプロイする場合:

1. Vercel Project を開きます。
2. Deployments を開きます。
3. Redeploy を実行します。

## 6. 動作確認

デプロイ後、以下を確認します。

- `/dashboard`
- `/office/documents`
- `/office/orders`
- `/office/invoices`
- `/approvals`
- `/admin/system`

特に `/admin/system` で以下を確認します。

- PostgreSQL 接続状態が `接続済`
- Companies / Projects / Vendors などの件数が表示される
- AuditLog が取得できる

## 7. 注意点

### ファイルアップロード

現在の `src/lib/file-storage.ts` はローカル保存用です。

Vercel 本番環境では、アップロードした帳票ファイルを永続保存するために外部ストレージが必要です。

次のいずれかに置き換える想定です。

- Vercel Blob
- S3
- Cloudflare R2
- Supabase Storage

### データベース初期化

Vercel の build 中に `db:push` や `db:seed` を自動実行しないでください。

DB 初期化はローカル端末、CI、または手動運用で明示的に実行する方針にしています。

### 環境変数

`.env` は GitHub に push しません。

本番環境の `DATABASE_URL` は Vercel の Environment Variables に保存します。

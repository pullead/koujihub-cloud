# KoujiHub Cloud

KoujiHub Cloud は、日本の建設会社向けに設計した **工事管理 + 図面・写真・工程表 + 総務部帳票・業者・支払・注文管理** 一体型クラウドシステムの MVP です。

案件 / 工事を中心に、工程表、写真、図面、日報、帳票、業者、注文書、請求、支払、査定、承認、通知、履歴を一元管理し、現場監督、協力会社、職人、本社総務、経理、管理職の情報共有をリアルタイム化することを目的としています。

従来 Excel、紙資料、フォルダ、LINE、メール、共有ドライブに分散していた情報を「案件 / 工事」に紐付け、検索、承認、履歴確認、帳票出力ができる業務基盤として構築しています。

## 技術スタック

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- Server Components を基本とし、必要な箇所のみ Client Components を使用

## 主な機能

- ダッシュボード
- 案件管理
- 案件詳細
- 業者台帳
- 帳票・書類管理
- 注文書・注文請書管理
- 請求・支払管理
- 支払査定
- 支払状況表
- 承認ワークフロー
- 通知
- 監査ログ
- 現場モバイル画面
- 管理設定
- システム状態確認

## セットアップ

```bash
npm install
cp .env.example .env
```

Docker を使用する場合:

```bash
npm run db:up
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Docker を使用しない場合は、`.env.example` と同じ接続情報で PostgreSQL を起動してください。

- database: `koujihub`
- user: `koujihub`
- password: `koujihub`
- port: `5432`

起動後、以下で開発サーバーを開始します。

```bash
npm run dev
```

## クラウドデプロイ

GitHub へ push した後、Vercel で `pullead/koujihub-cloud` を Import してデプロイできます。

推奨構成:

- アプリ: Vercel
- データベース: Neon Postgres
- ファイル保存: Vercel Blob / S3 / R2 / Supabase Storage へ後続移行

Vercel には以下の環境変数を設定してください。

```text
DATABASE_URL=Neon の PostgreSQL connection string
```

詳しい手順は [DEPLOYMENT.md](./DEPLOYMENT.md) を参照してください。

## よく使うコマンド

```bash
npm run typecheck
npm run lint
npm run build
npm run db:generate
npm run db:push
npm run db:deploy
npm run db:seed
```

## データベース連携

UI は `src/lib/db-data.ts` を通じて、案件、業者、帳票、注文書、請求書、支払状況表などを Prisma から読み込みます。

ローカル開発中に PostgreSQL に接続できない場合、読み取り部分は型付きサンプルデータにフォールバックします。ただし、書き込み処理は mock data を使用せず、Server Actions から Prisma 経由で実データベースに保存します。

`/admin/system` では、以下を確認できます。

- PostgreSQL 接続状態
- 主要テーブルの件数
- 最近の `AuditLog`

## 実装済み Server Actions

- `src/app/projects/actions.ts`
  - 案件作成
  - AuditLog 作成

- `src/app/office/vendors/actions.ts`
  - 業者作成
  - デフォルト銀行口座作成
  - AuditLog 作成

- `src/app/office/documents/actions.ts`
  - 帳票メタデータ作成
  - 初回ファイルバージョン作成
  - 新版ファイルアップロード
  - 帳票状態更新
  - AuditLog 作成

- `src/app/office/orders/actions.ts`
  - 注文書作成
  - 注文書状態更新
  - AuditLog 作成

- `src/app/office/invoices/actions.ts`
  - 注文書に紐付く請求書作成
  - 請求書状態更新
  - AuditLog 作成

- `src/app/approvals/actions.ts`
  - 承認申請作成
  - 承認
  - 差戻し
  - 通知既読化
  - 対象レコード状態更新
  - AuditLog 作成

## 帳票アップロード

MVP では、アップロードされた帳票ファイルを `public/uploads/documents` にローカル保存します。

ファイルのメタデータは `DocumentVersion` に保存されます。

- `fileUrl`
- `fileName`
- `fileSize`
- `mimeType`
- `uploadedBy`
- `uploadedAt`

`public/uploads` は `.gitignore` に含まれているため、実ファイルは GitHub にアップロードされません。

本番運用では、Vercel Blob、S3、Cloudflare R2、Supabase Storage などの外部ストレージへの置き換えを想定しています。

## 業務フロー

### 帳票

- `/office/documents`
  - 帳票一覧
  - 新規アップロード

- `/office/documents/[id]`
  - 帳票詳細
  - 最新ファイルリンク
  - 版履歴
  - 新版アップロード
  - 状態更新
  - 承認申請
  - 承認・履歴パネル

### 注文書

- `/office/orders`
  - 注文書一覧
  - 注文書作成

- `/office/orders/[id]`
  - 注文書詳細
  - 関連請求書
  - 状態更新
  - 承認申請
  - 承認・履歴パネル

### 請求書

- `/office/invoices`
  - 請求書一覧
  - 請求書登録

- `/office/invoices/[id]`
  - 請求書詳細
  - 注文照合
  - 状態更新
  - 承認申請
  - 承認・履歴パネル

### 承認ワークフロー

- `/approvals`
  - 承認待ち一覧
  - 承認
  - 差戻し
  - 通知
  - 通知既読化
  - 監査ログ

注文書、請求書、帳票の詳細画面から承認申請を作成できます。

承認申請、承認、差戻しの各操作は、対象レコードの状態を更新し、`Notification` と `AuditLog` を作成します。

同じ対象に未処理の承認申請がある場合、重複申請はできないように制御しています。

## MVP スコープ

- 案件を中心にした情報一元管理
- 総務部による帳票・業者・支払管理
- 注文書と請求書の Prisma 書き込み
- 帳票ファイルアップロードとバージョン管理
- 承認申請、承認、差戻し、通知
- AuditLog による操作履歴の追跡
- `/admin/system` による DB 状態確認

## 今後の拡張候補

- Vercel / Neon などへのクラウドデプロイ
- Vercel Blob / S3 / R2 へのファイル保存
- 認証とロールベースアクセス制御
- 写真・図面アップロードの本実装
- 日報入力
- 支払査定の Prisma 書き込み
- Excel / PDF 帳票出力
- 会計ソフト連携
- 電子契約連携
- AI OCR による請求書・帳票読取

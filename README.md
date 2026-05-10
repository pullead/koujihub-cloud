# KoujiHub Cloud

Next.js + TypeScript + Prisma MVP scaffold for the construction and general-affairs cloud system described in the PRD.

## Stack

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- Server Components by default, client components only where interactivity is needed

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run db:up
npm run db:generate
npm run db:push
npm run db:seed
```

Create `.env` from `.env.example` before running Prisma commands.

## Database Flow

The UI now reads projects, vendors, documents, orders, invoices, and payment summaries through `src/lib/db-data.ts`.

If PostgreSQL is unavailable during local UI work, the read layer falls back to typed sample data so the app still opens. Writes do not use mock data: the create forms are Server Actions that write through Prisma and show an error if the database is not reachable.

For real writes:

```bash
cp .env.example .env
docker compose up -d postgres
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

If Docker is not installed, run a local PostgreSQL instance with the same credentials as `.env.example`:

- database: `koujihub`
- user: `koujihub`
- password: `koujihub`
- port: `5432`

Use `/admin/system` to verify database connectivity, table counts, and recent `AuditLog` entries.

Implemented Server Actions:

- `src/app/projects/actions.ts` creates a project and audit log.
- `src/app/office/vendors/actions.ts` creates a vendor, default bank account, and audit log.
- `src/app/office/documents/actions.ts` creates document metadata, first file version, and audit log.
- `src/app/office/orders/actions.ts` creates an order and audit log.
- `src/app/office/invoices/actions.ts` creates an invoice from an order and audit log.
- Uploaded document files are stored locally under `public/uploads/documents` for MVP development, with file metadata stored in `DocumentVersion`. The upload directory is git-ignored and can be replaced by Blob/S3/R2 later.

Workflow detail pages:

- `/office/documents/[id]` shows document metadata, file version history, latest-file link, and updates document status through Prisma.
- `/office/orders/[id]` shows order totals, linked invoices, and updates order status through Prisma.
- `/office/invoices/[id]` shows invoice payment checks and updates invoice status through Prisma.
- Each status transition writes an `AuditLog` before redirecting back to the detail page.
- Uploading a replacement document creates a new `DocumentVersion`, increments `Document.latestVersion`, and writes an `AuditLog`.
- `/approvals` reads `Approval`, `ApprovalStep`, `Notification`, and `AuditLog` through Prisma.
- Order, invoice, and document detail pages can submit approval requests; approval decisions update the target record, notify the requester, and write `AuditLog`.
- Order, invoice, and document detail pages show a shared approval/history panel for target-level approvals, steps, notifications, and audit logs.
- Approval requests are guarded against duplicate pending approvals for the same target.

## MVP Scope

- Dashboard
- Project management
- Vendor ledger
- Documents
- Orders and order confirmations
- Invoices and payments
- Payment assessments
- Payment summaries
- Approval and notification queues
- Mobile site supervisor view
- Admin settings and role matrix

The first implementation uses typed seed data in `src/lib/mock-data.ts` for UI pages and Prisma schema/seed files for the database foundation.

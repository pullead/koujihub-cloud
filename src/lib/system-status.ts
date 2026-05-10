import { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma";

export type SystemStatus = {
  database: {
    ok: boolean;
    url: string;
    latencyMs: number | null;
    error: string | null;
  };
  counts: Array<{
    label: string;
    value: number;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    target: string;
    user: string;
    createdAt: string;
  }>;
};

function maskDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "****";
    return parsed.toString();
  } catch {
    return url.replace(/:[^:@/]+@/, ":****@");
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.split("\n").find((line) => line.trim()) ?? error.message;
  }

  return String(error);
}

export async function getSystemStatus(): Promise<SystemStatus> {
  const startedAt = Date.now();
  const databaseUrl = process.env.DATABASE_URL ?? "postgresql://koujihub:koujihub@localhost:5432/koujihub?schema=public&connect_timeout=2";

  try {
    const prisma = getPrisma();

    await prisma.$queryRaw`SELECT 1`;

    const [companies, departments, users, projects, vendors, documents, documentVersions, orders, invoices, auditLogCount, auditLogs] = await Promise.all([
      prisma.company.count(),
      prisma.department.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.vendor.count(),
      prisma.document.count(),
      prisma.documentVersion.count(),
      prisma.order.count(),
      prisma.invoice.count(),
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      database: {
        ok: true,
        url: maskDatabaseUrl(databaseUrl),
        latencyMs: Date.now() - startedAt,
        error: null,
      },
      counts: [
        { label: "Companies", value: companies },
        { label: "Departments", value: departments },
        { label: "Users", value: users },
        { label: "Projects", value: projects },
        { label: "Vendors", value: vendors },
        { label: "Documents", value: documents },
        { label: "DocumentVersions", value: documentVersions },
        { label: "Orders", value: orders },
        { label: "Invoices", value: invoices },
        { label: "AuditLogs", value: auditLogCount },
      ],
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        target: `${log.targetType}:${log.targetId}`,
        user: log.user?.name ?? "system",
        createdAt: log.createdAt.toISOString().slice(0, 16).replace("T", " "),
      })),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError || error instanceof Prisma.PrismaClientInitializationError || error instanceof Error) {
      return {
        database: {
          ok: false,
          url: maskDatabaseUrl(databaseUrl),
          latencyMs: null,
          error: errorMessage(error),
        },
        counts: [],
        auditLogs: [],
      };
    }

    return {
      database: {
        ok: false,
        url: maskDatabaseUrl(databaseUrl),
        latencyMs: null,
        error: String(error),
      },
      counts: [],
      auditLogs: [],
    };
  }
}

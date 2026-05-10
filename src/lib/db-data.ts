import { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma";
import { documents as fallbackDocuments, invoices as fallbackInvoices, orders as fallbackOrders, projects as fallbackProjects, vendors as fallbackVendors } from "./mock-data";
import { documentStatusToLabel, invoiceStatusToLabel, orderStatusToLabel, projectStatusToLabel, vendorStatusToLabel } from "./status-maps";
import type { DocumentDetail, DocumentRecord, DocumentVersionRecord, Invoice, Order, Project, Vendor } from "./types";

type ProjectRow = Prisma.ProjectGetPayload<{
  include: {
    department: true;
    orders: true;
    invoices: true;
    documents: true;
    tasks: true;
  };
}>;

type VendorRow = Prisma.VendorGetPayload<{
  include: {
    bankAccounts: true;
    orders: true;
    invoices: true;
    vendorDocuments: true;
  };
}>;

type OrderRow = Prisma.OrderGetPayload<Record<string, never>>;
type InvoiceRow = Prisma.InvoiceGetPayload<Record<string, never>>;
type DocumentRow = Prisma.DocumentGetPayload<{
  include: {
    department: true;
    versions: {
      orderBy: {
        version: "desc";
      };
      take: 1;
    };
  };
}>;
type DocumentDetailRow = Prisma.DocumentGetPayload<{
  include: {
    department: true;
    versions: {
      orderBy: {
        version: "desc";
      };
    };
  };
}>;

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

function dateText(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : "-";
}

function progressFor(status: string) {
  if (status === "BEFORE_START") return 20;
  if (status === "IN_PROGRESS") return 62;
  if (status === "BILLING") return 96;
  if (status === "CLOSED") return 100;
  return 35;
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    code: row.projectCode,
    name: row.name,
    client: row.clientName,
    site: row.siteAddress,
    type: row.constructionType ?? "-",
    department: row.department.name,
    manager: row.managerUserId ?? "未設定",
    status: projectStatusToLabel[row.projectStatus],
    start: dateText(row.startDate),
    end: dateText(row.endDate),
    contract: toNumber(row.contractAmount),
    progress: progressFor(row.projectStatus),
    tasks: row.tasks.length,
    late: row.tasks.filter((task) => task.status !== "DONE" && task.dueDate && task.dueDate < new Date()).length,
    docsMissing: Math.max(0, 4 - row.documents.length),
    unreadDrawings: 0,
    dailyReport: "対象外",
    isJv: row.isJv,
  };
}

function mapVendor(row: VendorRow): Vendor {
  const defaultBank = row.bankAccounts.find((account) => account.isDefault) ?? row.bankAccounts[0];
  const expiringDocument = row.vendorDocuments.find((document) => document.status === "RETURNED");

  return {
    id: row.id,
    code: row.vendorCode,
    name: row.name,
    kana: row.nameKana ?? "",
    trade: row.licenseType ?? "-",
    status: vendorStatusToLabel[row.tradeStatus],
    invoice: row.invoiceRegistrationNumber ?? "-",
    license: row.constructionLicenseNumber ?? "未登録",
    contact: row.mainContactName ?? "未登録",
    phone: row.phone ?? "-",
    email: row.email ?? "-",
    bank: defaultBank ? `${defaultBank.bankName} ${defaultBank.branchName} ${defaultBank.accountType} ${defaultBank.accountNumber}` : "未登録",
    safety: expiringDocument ? "期限切れ" : "有効",
    rating: row.tradeStatus === "NEEDS_REVIEW" ? "C" : "A",
    projects: new Set(row.orders.map((order) => order.projectId)).size,
  };
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    number: row.orderNumber,
    projectId: row.projectId,
    vendorId: row.vendorId,
    department: row.departmentId,
    trade: row.tradeType,
    title: row.orderTitle,
    amount: toNumber(row.orderAmountExTax),
    tax: toNumber(row.taxAmount),
    date: dateText(row.orderDate),
    period: `${dateText(row.startDate)} - ${dateText(row.endDate)}`,
    status: orderStatusToLabel[row.status],
    approver: row.approvedBy ?? "未承認",
  };
}

function mapInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    number: row.invoiceNumber,
    projectId: row.projectId,
    vendorId: row.vendorId,
    orderId: row.orderId,
    date: dateText(row.invoiceDate),
    due: dateText(row.paymentDueDate),
    amount: toNumber(row.amountWithTax),
    deduction: toNumber(row.withholdingAmount) + toNumber(row.offsetAmount),
    status: invoiceStatusToLabel[row.status],
    checkedBy: row.status === "PAID" ? "経理" : "総務",
  };
}

function mapDocument(row: DocumentRow): DocumentRecord {
  const latestVersion = row.versions[0];

  return {
    id: row.id,
    type: row.documentType,
    title: row.title,
    projectId: row.projectId ?? "",
    vendorId: row.vendorId,
    department: row.department?.name ?? "-",
    status: documentStatusToLabel[row.status],
    version: `v${row.latestVersion}`,
    updated: row.updatedAt.toISOString().slice(0, 16).replace("T", " "),
    owner: latestVersion?.uploadedBy ?? "本社総務",
  };
}

function mapDocumentVersion(row: DocumentDetailRow["versions"][number]): DocumentVersionRecord {
  return {
    id: row.id,
    version: row.version,
    fileName: row.fileName,
    fileUrl: row.fileUrl,
    fileSize: row.fileSize,
    mimeType: row.mimeType ?? "application/octet-stream",
    uploadedBy: row.uploadedBy ?? "本社総務",
    uploadedAt: row.uploadedAt.toISOString().slice(0, 16).replace("T", " "),
  };
}

function mapDocumentDetail(row: DocumentDetailRow): DocumentDetail {
  return {
    ...mapDocument(row),
    versions: row.versions.map(mapDocumentVersion),
  };
}

function fallbackDocumentDetail(document: DocumentRecord): DocumentDetail {
  const version = Number(document.version.replace(/^v/, "")) || 1;

  return {
    ...document,
    versions: [
      {
        id: `${document.id}-version-${version}`,
        version,
        fileName: `${document.title}.pdf`,
        fileUrl: "#",
        fileSize: null,
        mimeType: "application/pdf",
        uploadedBy: document.owner,
        uploadedAt: document.updated,
      },
    ],
  };
}

function logFallback(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    const message = error instanceof Error ? (error.message.split("\n").find((line) => line.trim()) ?? "database query failed") : String(error);
    console.warn(`[koujihub] Prisma unavailable; using UI fallback data. ${message}`);
  }
}

export async function getProjectList(companyId: string): Promise<Project[]> {
  try {
    const rows = await getPrisma().project.findMany({
      where: { companyId },
      include: {
        department: true,
        orders: true,
        invoices: true,
        documents: true,
        tasks: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return rows.map(mapProject);
  } catch (error) {
    logFallback(error);
    return fallbackProjects;
  }
}

export async function getProjectById(companyId: string, id: string): Promise<Project | null> {
  try {
    const row = await getPrisma().project.findFirst({
      where: { companyId, id },
      include: {
        department: true,
        orders: true,
        invoices: true,
        documents: true,
        tasks: true,
      },
    });

    return row ? mapProject(row) : null;
  } catch (error) {
    logFallback(error);
    return fallbackProjects.find((project) => project.id === id) ?? null;
  }
}

export async function getVendorList(companyId: string): Promise<Vendor[]> {
  try {
    const rows = await getPrisma().vendor.findMany({
      where: { companyId },
      include: {
        bankAccounts: true,
        orders: true,
        invoices: true,
        vendorDocuments: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return rows.map(mapVendor);
  } catch (error) {
    logFallback(error);
    return fallbackVendors;
  }
}

export async function getOrderList(companyId: string): Promise<Order[]> {
  try {
    const rows = await getPrisma().order.findMany({
      where: { companyId },
      orderBy: { updatedAt: "desc" },
    });

    return rows.map(mapOrder);
  } catch (error) {
    logFallback(error);
    return fallbackOrders;
  }
}

export async function getOrderById(companyId: string, id: string): Promise<Order | null> {
  try {
    const row = await getPrisma().order.findFirst({
      where: { companyId, id },
    });

    return row ? mapOrder(row) : null;
  } catch (error) {
    logFallback(error);
    return fallbackOrders.find((order) => order.id === id) ?? null;
  }
}

export async function getInvoiceList(companyId: string): Promise<Invoice[]> {
  try {
    const rows = await getPrisma().invoice.findMany({
      where: { companyId },
      orderBy: { updatedAt: "desc" },
    });

    return rows.map(mapInvoice);
  } catch (error) {
    logFallback(error);
    return fallbackInvoices;
  }
}

export async function getInvoiceById(companyId: string, id: string): Promise<Invoice | null> {
  try {
    const row = await getPrisma().invoice.findFirst({
      where: { companyId, id },
    });

    return row ? mapInvoice(row) : null;
  } catch (error) {
    logFallback(error);
    return fallbackInvoices.find((invoice) => invoice.id === id) ?? null;
  }
}

export async function getDocumentList(companyId: string): Promise<DocumentRecord[]> {
  try {
    const rows = await getPrisma().document.findMany({
      where: { companyId },
      include: {
        department: true,
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return rows.map(mapDocument);
  } catch (error) {
    logFallback(error);
    return fallbackDocuments;
  }
}

export async function getDocumentById(companyId: string, id: string): Promise<DocumentDetail | null> {
  try {
    const row = await getPrisma().document.findFirst({
      where: { companyId, id },
      include: {
        department: true,
        versions: {
          orderBy: { version: "desc" },
        },
      },
    });

    return row ? mapDocumentDetail(row) : null;
  } catch (error) {
    logFallback(error);
    const document = fallbackDocuments.find((candidate) => candidate.id === id);
    return document ? fallbackDocumentDetail(document) : null;
  }
}

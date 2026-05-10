import type { DocumentStatus as PrismaDocumentStatus, InvoiceStatus as PrismaInvoiceStatus, OrderStatus as PrismaOrderStatus, ProjectStatus as PrismaProjectStatus, VendorTradeStatus } from "@prisma/client";
import type { DocumentStatus, InvoiceStatus, OrderStatus, ProjectStatus, VendorStatus } from "./types";

export const projectStatusToLabel: Record<PrismaProjectStatus, ProjectStatus> = {
  INQUIRY: "引合",
  ESTIMATING: "見積中",
  AWARDED: "受注",
  BEFORE_START: "着工前",
  IN_PROGRESS: "施工中",
  INSPECTION: "検査中",
  COMPLETED_CONSTRUCTION: "竣工",
  DELIVERED: "引渡済",
  BILLING: "請求中",
  CLOSED: "完了",
  ON_HOLD: "保留",
  CANCELED: "取消",
};

export const projectStatusFromForm: Record<string, PrismaProjectStatus> = {
  inquiry: "INQUIRY",
  estimating: "ESTIMATING",
  awarded: "AWARDED",
  before_start: "BEFORE_START",
  in_progress: "IN_PROGRESS",
  billing: "BILLING",
};

export const vendorStatusToLabel: Record<VendorTradeStatus, VendorStatus> = {
  ACTIVE: "取引中",
  APPLYING: "新規申請中",
  SUSPENDED: "休止中",
  STOPPED: "取引停止",
  NEEDS_REVIEW: "要確認",
};

export const vendorStatusFromForm: Record<string, VendorTradeStatus> = {
  active: "ACTIVE",
  applying: "APPLYING",
  suspended: "SUSPENDED",
  stopped: "STOPPED",
  needs_review: "NEEDS_REVIEW",
};

export const orderStatusToLabel: Record<PrismaOrderStatus, OrderStatus> = {
  NOT_CREATED: "未作成",
  DRAFT: "作成中",
  PENDING_APPROVAL: "承認待ち",
  APPROVED: "承認済",
  SENT: "送付済",
  WAITING_CONFIRMATION: "注文請書待ち",
  CONFIRMATION_RECEIVED: "注文請書回収済",
  CHANGED: "変更あり",
  CANCELED: "取消",
};

export const orderStatusFromForm: Record<string, PrismaOrderStatus> = {
  draft: "DRAFT",
  pending_approval: "PENDING_APPROVAL",
  approved: "APPROVED",
  sent: "SENT",
  waiting_confirmation: "WAITING_CONFIRMATION",
  confirmation_received: "CONFIRMATION_RECEIVED",
};

export const invoiceStatusToLabel: Record<PrismaInvoiceStatus, InvoiceStatus> = {
  UNCHECKED: "未確認",
  CHECKING: "確認中",
  RETURNED: "差戻し",
  PENDING_APPROVAL: "承認待ち",
  APPROVED: "承認済",
  SCHEDULED: "支払予定",
  PAID: "支払済",
  ON_HOLD: "保留",
};

export const invoiceStatusFromForm: Record<string, PrismaInvoiceStatus> = {
  unchecked: "UNCHECKED",
  checking: "CHECKING",
  pending_approval: "PENDING_APPROVAL",
  approved: "APPROVED",
  scheduled: "SCHEDULED",
  paid: "PAID",
  on_hold: "ON_HOLD",
};

export const documentStatusToLabel: Record<PrismaDocumentStatus, DocumentStatus> = {
  DRAFT: "下書き",
  CHECKING: "確認中",
  PENDING_APPROVAL: "承認待ち",
  APPROVED: "承認済",
  RETURNED: "差戻し",
  STORED: "保管済",
};

export const documentStatusFromForm: Record<string, PrismaDocumentStatus> = {
  draft: "DRAFT",
  checking: "CHECKING",
  pending_approval: "PENDING_APPROVAL",
  approved: "APPROVED",
  stored: "STORED",
};

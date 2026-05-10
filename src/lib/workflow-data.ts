import type { ApprovalStatus } from "@prisma/client";
import { approvals as fallbackApprovals, auditLogs as fallbackAuditLogs, notifications as fallbackNotifications } from "./mock-data";
import { getPrisma } from "./prisma";
import type { Approval, AuditLog, Notification, TargetWorkflowHistory } from "./types";

type WorkflowData = {
  approvals: Approval[];
  notifications: Notification[];
  auditLogs: AuditLog[];
};

const approvalStatusToLabel: Record<ApprovalStatus, Approval["status"]> = {
  DRAFT: "確認中",
  PENDING: "承認待ち",
  APPROVED: "承認済",
  RETURNED: "差戻し",
  CANCELED: "差戻し",
};

const targetTypeToLabel: Record<string, string> = {
  Order: "注文書",
  Invoice: "請求書",
  Document: "帳票",
  Assessment: "査定",
};

function routeText(steps: Array<{ role: string | null; status: string }>) {
  if (!steps.length) return "申請 -> 承認";

  return steps
    .map((step) => step.role ?? "承認者")
    .join(" -> ");
}

function logFallback(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    const message = error instanceof Error ? (error.message.split("\n").find((line) => line.trim()) ?? "workflow query failed") : String(error);
    console.warn(`[koujihub] Workflow Prisma unavailable; using UI fallback data. ${message}`);
  }
}

export async function getWorkflowData(companyId: string, userId: string): Promise<WorkflowData> {
  try {
    const prisma = getPrisma();
    const [approvalRows, notificationRows, auditRows] = await Promise.all([
      prisma.approval.findMany({
        where: { companyId },
        include: {
          requestedBy: true,
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.notification.findMany({
        where: {
          companyId,
          OR: [{ userId }, { userId: null }],
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.auditLog.findMany({
        where: { companyId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    return {
      approvals: approvalRows.map((approval) => ({
        id: approval.id,
        targetId: approval.targetId,
        targetType: approval.targetType,
        target: targetTypeToLabel[approval.targetType] ?? approval.targetType,
        title: approval.title,
        route: routeText(approval.steps),
        requester: approval.requestedBy?.name ?? "system",
        status: approvalStatusToLabel[approval.status],
        due: approval.createdAt.toISOString().slice(0, 10),
      })),
      notifications: notificationRows.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        unread: !notification.readAt,
        targetType: notification.targetType,
        targetId: notification.targetId,
      })),
      auditLogs: auditRows.map((log) => ({
        id: log.id,
        user: log.user?.name ?? "system",
        action: log.action,
        target: `${log.targetType}:${log.targetId}`,
        time: log.createdAt.toISOString().slice(0, 16).replace("T", " "),
      })),
    };
  } catch (error) {
    logFallback(error);

    return {
      approvals: fallbackApprovals,
      notifications: fallbackNotifications,
      auditLogs: fallbackAuditLogs,
    };
  }
}

export async function getTargetWorkflowHistory(companyId: string, targetType: string, targetId: string): Promise<TargetWorkflowHistory> {
  try {
    const prisma = getPrisma();
    const [approvalRows, auditRows, notificationRows] = await Promise.all([
      prisma.approval.findMany({
        where: { companyId, targetType, targetId },
        include: {
          requestedBy: true,
          steps: {
            orderBy: { stepOrder: "asc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: { companyId, targetType, targetId },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.findMany({
        where: { companyId, targetType, targetId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);
    const approvals = approvalRows.map((approval) => ({
      id: approval.id,
      targetId: approval.targetId,
      targetType: approval.targetType,
      target: targetTypeToLabel[approval.targetType] ?? approval.targetType,
      title: approval.title,
      route: routeText(approval.steps),
      requester: approval.requestedBy?.name ?? "system",
      status: approvalStatusToLabel[approval.status],
      due: approval.createdAt.toISOString().slice(0, 10),
      steps: approval.steps.map((step) => ({
        id: step.id,
        order: step.stepOrder,
        role: step.role ?? "承認者",
        status: step.status,
        comment: step.comment,
        actedAt: step.actedAt ? step.actedAt.toISOString().slice(0, 16).replace("T", " ") : null,
      })),
    }));
    const hasPendingApproval = approvals.some((approval) => approval.status === "承認待ち");
    const latestApproval = approvals[0];

    return {
      currentStatus: latestApproval?.status ?? "未申請",
      hasPendingApproval,
      approvals,
      auditLogs: auditRows.map((log) => ({
        id: log.id,
        user: log.user?.name ?? "system",
        action: log.action,
        target: `${log.targetType}:${log.targetId}`,
        time: log.createdAt.toISOString().slice(0, 16).replace("T", " "),
      })),
      notifications: notificationRows.map((notification) => ({
        id: notification.id,
        title: notification.title,
        body: notification.body,
        unread: !notification.readAt,
        targetType: notification.targetType,
        targetId: notification.targetId,
      })),
    };
  } catch (error) {
    logFallback(error);

    return {
      currentStatus: "未申請",
      hasPendingApproval: false,
      approvals: [],
      auditLogs: [],
      notifications: [],
    };
  }
}

export function targetHref(targetType?: string, targetId?: string) {
  if (!targetType || !targetId) return null;
  if (targetType === "Order") return `/office/orders/${targetId}`;
  if (targetType === "Invoice") return `/office/invoices/${targetId}`;
  if (targetType === "Document") return `/office/documents/${targetId}`;
  return null;
}

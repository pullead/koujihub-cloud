"use server";

import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDemoTenant } from "@/lib/bootstrap";
import { getPrisma } from "@/lib/prisma";

const targetTypes = ["Order", "Invoice", "Document"] as const;

const requestApprovalSchema = z.object({
  targetType: z.enum(targetTypes),
  targetId: z.string().min(1),
  title: z.string().min(1),
  sourcePath: z.string().min(1),
});

const approvalDecisionSchema = z.object({
  approvalId: z.string().min(1),
  comment: z.string().optional(),
});

const notificationSchema = z.object({
  notificationId: z.string().min(1),
});

function routeRoles(targetType: (typeof targetTypes)[number]): UserRole[] {
  if (targetType === "Invoice") return ["DEPARTMENT_MANAGER", "ACCOUNTING"];
  if (targetType === "Document") return ["GENERAL_AFFAIRS", "DEPARTMENT_MANAGER"];
  return ["DEPARTMENT_MANAGER", "GENERAL_AFFAIRS"];
}

async function assertTargetExists(companyId: string, targetType: (typeof targetTypes)[number], targetId: string) {
  const prisma = getPrisma();

  if (targetType === "Order") {
    return Boolean(await prisma.order.findFirst({ where: { companyId, id: targetId }, select: { id: true } }));
  }

  if (targetType === "Invoice") {
    return Boolean(await prisma.invoice.findFirst({ where: { companyId, id: targetId }, select: { id: true } }));
  }

  return Boolean(await prisma.document.findFirst({ where: { companyId, id: targetId }, select: { id: true } }));
}

async function updateTargetStatus(companyId: string, targetType: string, targetId: string, transition: "request" | "approve" | "return") {
  const prisma = getPrisma();

  if (targetType === "Order") {
    const status = transition === "approve" ? "APPROVED" : transition === "return" ? "CHANGED" : "PENDING_APPROVAL";
    return prisma.order.updateMany({ where: { companyId, id: targetId }, data: { status } });
  }

  if (targetType === "Invoice") {
    const status = transition === "approve" ? "APPROVED" : transition === "return" ? "RETURNED" : "PENDING_APPROVAL";
    return prisma.invoice.updateMany({ where: { companyId, id: targetId }, data: { status } });
  }

  if (targetType === "Document") {
    const status = transition === "approve" ? "APPROVED" : transition === "return" ? "RETURNED" : "PENDING_APPROVAL";
    return prisma.document.updateMany({ where: { companyId, id: targetId }, data: { status } });
  }
}

export async function requestApprovalAction(formData: FormData) {
  const parsed = requestApprovalSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/approvals?error=validation");
  }

  let redirectTo = `${parsed.data.sourcePath}?error=approval`;

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const targetExists = await assertTargetExists(company.id, parsed.data.targetType, parsed.data.targetId);

    if (!targetExists) {
      redirectTo = `${parsed.data.sourcePath}?error=missing`;
    } else {
      const pendingApproval = await prisma.approval.findFirst({
        where: {
          companyId: company.id,
          targetType: parsed.data.targetType,
          targetId: parsed.data.targetId,
          status: "PENDING",
        },
        select: { id: true },
      });

      if (pendingApproval) {
        redirectTo = `${parsed.data.sourcePath}?duplicate=1`;
        redirect(redirectTo);
      }

      const roles = routeRoles(parsed.data.targetType);
      const approval = await prisma.approval.create({
        data: {
          companyId: company.id,
          requestedById: user.id,
          targetType: parsed.data.targetType,
          targetId: parsed.data.targetId,
          title: parsed.data.title,
          status: "PENDING",
          steps: {
            create: roles.map((role, index) => ({
              companyId: company.id,
              stepOrder: index + 1,
              role,
              status: index === 0 ? "PENDING" : "WAITING",
            })),
          },
        },
      });

      await updateTargetStatus(company.id, parsed.data.targetType, parsed.data.targetId, "request");

      await Promise.all([
        prisma.notification.create({
          data: {
            companyId: company.id,
            title: "承認依頼が届いています",
            body: `${parsed.data.title} / ${roles.map((role) => role).join(" -> ")}`,
            targetType: "Approval",
            targetId: approval.id,
          },
        }),
        prisma.auditLog.create({
          data: {
            companyId: company.id,
            userId: user.id,
            action: "approval.request",
            targetType: parsed.data.targetType,
            targetId: parsed.data.targetId,
            afterJson: { approvalId: approval.id, title: approval.title },
          },
        }),
      ]);

      redirectTo = `${parsed.data.sourcePath}?approval=1`;
    }
  } catch (error) {
    console.error("[koujihub] requestApprovalAction failed", error);
  }

  redirect(redirectTo);
}

export async function approveApprovalAction(formData: FormData) {
  const parsed = approvalDecisionSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/approvals?error=validation");
  }

  let redirectTo = "/approvals?error=approval";

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const existing = await prisma.approval.findFirst({
      where: { companyId: company.id, id: parsed.data.approvalId },
      select: { id: true, title: true, targetType: true, targetId: true, requestedById: true, status: true },
    });

    if (!existing) {
      redirectTo = "/approvals?error=missing";
    } else {
      await prisma.$transaction([
        prisma.approval.update({
          where: { id: existing.id },
          data: { status: "APPROVED" },
        }),
        prisma.approvalStep.updateMany({
          where: { companyId: company.id, approvalId: existing.id },
          data: { status: "APPROVED", approverId: user.id, actedAt: new Date(), comment: parsed.data.comment },
        }),
        prisma.notification.create({
          data: {
            companyId: company.id,
            userId: existing.requestedById,
            title: "承認が完了しました",
            body: existing.title,
            targetType: existing.targetType,
            targetId: existing.targetId,
          },
        }),
        prisma.auditLog.create({
          data: {
            companyId: company.id,
            userId: user.id,
            action: "approval.approve",
            targetType: existing.targetType,
            targetId: existing.targetId,
            beforeJson: { status: existing.status },
            afterJson: { approvalId: existing.id, status: "APPROVED" },
          },
        }),
      ]);

      await updateTargetStatus(company.id, existing.targetType, existing.targetId, "approve");
      redirectTo = "/approvals?approved=1";
    }
  } catch (error) {
    console.error("[koujihub] approveApprovalAction failed", error);
  }

  redirect(redirectTo);
}

export async function returnApprovalAction(formData: FormData) {
  const parsed = approvalDecisionSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/approvals?error=validation");
  }

  let redirectTo = "/approvals?error=approval";

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const existing = await prisma.approval.findFirst({
      where: { companyId: company.id, id: parsed.data.approvalId },
      select: { id: true, title: true, targetType: true, targetId: true, requestedById: true, status: true },
    });

    if (!existing) {
      redirectTo = "/approvals?error=missing";
    } else {
      await prisma.$transaction([
        prisma.approval.update({
          where: { id: existing.id },
          data: { status: "RETURNED" },
        }),
        prisma.approvalStep.updateMany({
          where: { companyId: company.id, approvalId: existing.id },
          data: { status: "RETURNED", approverId: user.id, actedAt: new Date(), comment: parsed.data.comment ?? "差戻し" },
        }),
        prisma.notification.create({
          data: {
            companyId: company.id,
            userId: existing.requestedById,
            title: "承認が差戻されました",
            body: `${existing.title} / ${parsed.data.comment ?? "内容を確認してください"}`,
            targetType: existing.targetType,
            targetId: existing.targetId,
          },
        }),
        prisma.auditLog.create({
          data: {
            companyId: company.id,
            userId: user.id,
            action: "approval.return",
            targetType: existing.targetType,
            targetId: existing.targetId,
            beforeJson: { status: existing.status },
            afterJson: { approvalId: existing.id, status: "RETURNED", comment: parsed.data.comment },
          },
        }),
      ]);

      await updateTargetStatus(company.id, existing.targetType, existing.targetId, "return");
      redirectTo = "/approvals?returned=1";
    }
  } catch (error) {
    console.error("[koujihub] returnApprovalAction failed", error);
  }

  redirect(redirectTo);
}

export async function markNotificationReadAction(formData: FormData) {
  const parsed = notificationSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/approvals?error=validation");
  }

  try {
    const { company } = await ensureDemoTenant();
    await getPrisma().notification.updateMany({
      where: { companyId: company.id, id: parsed.data.notificationId },
      data: { readAt: new Date() },
    });
  } catch (error) {
    console.error("[koujihub] markNotificationReadAction failed", error);
    redirect("/approvals?error=notification");
  }

  redirect("/approvals?read=1");
}

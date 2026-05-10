"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDemoTenant } from "@/lib/bootstrap";
import { getPrisma } from "@/lib/prisma";
import { orderStatusFromForm } from "@/lib/status-maps";

const orderFormSchema = z.object({
  orderNumber: z.string().min(1),
  projectId: z.string().min(1),
  vendorId: z.string().min(1),
  tradeType: z.string().min(1),
  orderTitle: z.string().min(1),
  orderAmountExTax: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(100).default(10),
  orderDate: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  status: z.string().default("draft"),
});

const orderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.string().min(1),
});

function optionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function createOrderAction(formData: FormData) {
  const parsed = orderFormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/office/orders?error=validation");
  }

  let redirectTo = "/office/orders?error=database";

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const [project, vendor] = await Promise.all([
      prisma.project.findFirst({
        where: { companyId: company.id, id: parsed.data.projectId },
        select: { id: true, departmentId: true },
      }),
      prisma.vendor.findFirst({
        where: { companyId: company.id, id: parsed.data.vendorId },
        select: { id: true },
      }),
    ]);

    if (!project || !vendor) {
      redirectTo = "/office/orders?error=relation";
    } else {
      const taxAmount = Math.round((parsed.data.orderAmountExTax * parsed.data.taxRate) / 100);
      const order = await prisma.order.create({
        data: {
          companyId: company.id,
          projectId: project.id,
          vendorId: vendor.id,
          departmentId: project.departmentId,
          orderNumber: parsed.data.orderNumber,
          tradeType: parsed.data.tradeType,
          orderTitle: parsed.data.orderTitle,
          orderAmountExTax: parsed.data.orderAmountExTax,
          taxRate: parsed.data.taxRate,
          taxAmount,
          orderAmountWithTax: parsed.data.orderAmountExTax + taxAmount,
          orderDate: optionalDate(parsed.data.orderDate),
          startDate: optionalDate(parsed.data.startDate),
          endDate: optionalDate(parsed.data.endDate),
          paymentTerms: parsed.data.paymentTerms,
          status: orderStatusFromForm[parsed.data.status] ?? "DRAFT",
          createdBy: user.id,
        },
      });

      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          action: "order.create",
          targetType: "Order",
          targetId: order.id,
          afterJson: {
            orderNumber: order.orderNumber,
            orderTitle: order.orderTitle,
            amount: order.orderAmountWithTax.toString(),
          },
        },
      });

      redirectTo = "/office/orders?created=1";
    }
  } catch (error) {
    console.error("[koujihub] createOrderAction failed", error);
  }

  redirect(redirectTo);
}

export async function updateOrderStatusAction(formData: FormData) {
  const parsed = orderStatusSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/office/orders?error=validation");
  }

  const nextStatus = orderStatusFromForm[parsed.data.status];
  let redirectTo = `/office/orders/${parsed.data.orderId}?error=database`;

  if (!nextStatus) {
    redirect(`/office/orders/${parsed.data.orderId}?error=status`);
  }

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const existing = await prisma.order.findFirst({
      where: { companyId: company.id, id: parsed.data.orderId },
      select: { id: true, orderNumber: true, status: true },
    });

    if (!existing) {
      redirectTo = "/office/orders?error=missing";
    } else {
      const order = await prisma.order.update({
        where: { id: existing.id },
        data: {
          status: nextStatus,
          approvedBy: nextStatus === "APPROVED" ? user.name : undefined,
          approvedAt: nextStatus === "APPROVED" ? new Date() : undefined,
        },
      });

      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          action: "order.status.update",
          targetType: "Order",
          targetId: order.id,
          beforeJson: { status: existing.status },
          afterJson: { status: order.status, orderNumber: order.orderNumber },
        },
      });

      redirectTo = `/office/orders/${order.id}?updated=1`;
    }
  } catch (error) {
    console.error("[koujihub] updateOrderStatusAction failed", error);
  }

  redirect(redirectTo);
}

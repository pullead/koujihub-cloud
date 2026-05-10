"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDemoTenant } from "@/lib/bootstrap";
import { getPrisma } from "@/lib/prisma";
import { invoiceStatusFromForm } from "@/lib/status-maps";

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1),
  orderId: z.string().min(1),
  invoiceDate: z.string().optional(),
  receivedDate: z.string().optional(),
  paymentDueDate: z.string().optional(),
  amountExTax: z.coerce.number().nonnegative(),
  taxAmount: z.coerce.number().nonnegative(),
  withholdingAmount: z.coerce.number().nonnegative().default(0),
  offsetAmount: z.coerce.number().nonnegative().default(0),
  invoiceRegistrationNumber: z.string().optional(),
  status: z.string().default("checking"),
});

const invoiceStatusSchema = z.object({
  invoiceId: z.string().min(1),
  status: z.string().min(1),
});

function optionalDate(value?: string) {
  return value ? new Date(value) : undefined;
}

export async function createInvoiceAction(formData: FormData) {
  const parsed = invoiceFormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/office/invoices?error=validation");
  }

  let redirectTo = "/office/invoices?error=database";

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const order = await prisma.order.findFirst({
      where: { companyId: company.id, id: parsed.data.orderId },
      select: {
        id: true,
        projectId: true,
        vendorId: true,
        vendor: {
          select: {
            invoiceRegistrationNumber: true,
          },
        },
      },
    });

    if (!order) {
      redirectTo = "/office/invoices?error=order";
    } else {
      const amountWithTax = parsed.data.amountExTax + parsed.data.taxAmount;
      const payableAmount = amountWithTax - parsed.data.withholdingAmount - parsed.data.offsetAmount;
      const invoice = await prisma.invoice.create({
        data: {
          companyId: company.id,
          projectId: order.projectId,
          vendorId: order.vendorId,
          orderId: order.id,
          invoiceNumber: parsed.data.invoiceNumber,
          invoiceDate: optionalDate(parsed.data.invoiceDate),
          receivedDate: optionalDate(parsed.data.receivedDate),
          paymentDueDate: optionalDate(parsed.data.paymentDueDate),
          amountExTax: parsed.data.amountExTax,
          taxAmount: parsed.data.taxAmount,
          amountWithTax,
          withholdingAmount: parsed.data.withholdingAmount,
          offsetAmount: parsed.data.offsetAmount,
          payableAmount,
          invoiceRegistrationNumber: parsed.data.invoiceRegistrationNumber || order.vendor.invoiceRegistrationNumber,
          status: invoiceStatusFromForm[parsed.data.status] ?? "CHECKING",
        },
      });

      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          action: "invoice.create",
          targetType: "Invoice",
          targetId: invoice.id,
          afterJson: {
            invoiceNumber: invoice.invoiceNumber,
            amountWithTax: invoice.amountWithTax.toString(),
            payableAmount: invoice.payableAmount.toString(),
          },
        },
      });

      redirectTo = "/office/invoices?created=1";
    }
  } catch (error) {
    console.error("[koujihub] createInvoiceAction failed", error);
  }

  redirect(redirectTo);
}

export async function updateInvoiceStatusAction(formData: FormData) {
  const parsed = invoiceStatusSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/office/invoices?error=validation");
  }

  const nextStatus = invoiceStatusFromForm[parsed.data.status];
  let redirectTo = `/office/invoices/${parsed.data.invoiceId}?error=database`;

  if (!nextStatus) {
    redirect(`/office/invoices/${parsed.data.invoiceId}?error=status`);
  }

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const existing = await prisma.invoice.findFirst({
      where: { companyId: company.id, id: parsed.data.invoiceId },
      select: { id: true, invoiceNumber: true, status: true },
    });

    if (!existing) {
      redirectTo = "/office/invoices?error=missing";
    } else {
      const invoice = await prisma.invoice.update({
        where: { id: existing.id },
        data: { status: nextStatus },
      });

      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          action: "invoice.status.update",
          targetType: "Invoice",
          targetId: invoice.id,
          beforeJson: { status: existing.status },
          afterJson: { status: invoice.status, invoiceNumber: invoice.invoiceNumber },
        },
      });

      redirectTo = `/office/invoices/${invoice.id}?updated=1`;
    }
  } catch (error) {
    console.error("[koujihub] updateInvoiceStatusAction failed", error);
  }

  redirect(redirectTo);
}

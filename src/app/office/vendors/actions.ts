"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDemoTenant } from "@/lib/bootstrap";
import { getPrisma } from "@/lib/prisma";
import { vendorStatusFromForm } from "@/lib/status-maps";

const vendorFormSchema = z.object({
  vendorCode: z.string().min(2),
  name: z.string().min(1),
  nameKana: z.string().optional(),
  invoiceRegistrationNumber: z.string().optional(),
  constructionLicenseNumber: z.string().optional(),
  licenseType: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  mainContactName: z.string().optional(),
  tradeStatus: z.string().default("active"),
  bankName: z.string().optional(),
  branchName: z.string().optional(),
  accountType: z.string().default("普通"),
  accountNumber: z.string().optional(),
  accountHolder: z.string().optional(),
});

export async function createVendorAction(formData: FormData) {
  const parsed = vendorFormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/office/vendors?error=validation");
  }

  let redirectTo = "/office/vendors?error=database";

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const vendor = await prisma.vendor.create({
      data: {
        companyId: company.id,
        vendorCode: parsed.data.vendorCode,
        name: parsed.data.name,
        nameKana: parsed.data.nameKana,
        invoiceRegistrationNumber: parsed.data.invoiceRegistrationNumber,
        constructionLicenseNumber: parsed.data.constructionLicenseNumber,
        licenseType: parsed.data.licenseType,
        phone: parsed.data.phone,
        email: parsed.data.email || undefined,
        mainContactName: parsed.data.mainContactName,
        tradeStatus: vendorStatusFromForm[parsed.data.tradeStatus] ?? "ACTIVE",
        paymentTerms: "月末締め翌月末支払",
        bankAccounts:
          parsed.data.bankName && parsed.data.branchName && parsed.data.accountNumber
            ? {
                create: {
                  companyId: company.id,
                  bankName: parsed.data.bankName,
                  branchName: parsed.data.branchName,
                  accountType: parsed.data.accountType,
                  accountNumber: parsed.data.accountNumber,
                  accountHolder: parsed.data.accountHolder || parsed.data.name,
                  isDefault: true,
                },
              }
            : undefined,
      },
    });

    await prisma.auditLog.create({
      data: {
        companyId: company.id,
        userId: user.id,
        action: "vendor.create",
        targetType: "Vendor",
        targetId: vendor.id,
        afterJson: {
          vendorCode: vendor.vendorCode,
          name: vendor.name,
        },
      },
    });

    redirectTo = "/office/vendors?created=1";
  } catch (error) {
    console.error("[koujihub] createVendorAction failed", error);
  }

  redirect(redirectTo);
}

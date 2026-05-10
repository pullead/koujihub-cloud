"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDemoTenant } from "@/lib/bootstrap";
import { isUsableFile, saveDocumentUpload } from "@/lib/file-storage";
import { getPrisma } from "@/lib/prisma";
import { documentStatusFromForm } from "@/lib/status-maps";

const documentFormSchema = z.object({
  documentType: z.string().min(1),
  title: z.string().min(1),
  projectId: z.string().optional(),
  vendorId: z.string().optional(),
  departmentCode: z.string().optional(),
  status: z.string().default("checking"),
});

const documentStatusSchema = z.object({
  documentId: z.string().min(1),
  status: z.string().min(1),
});

const documentVersionSchema = z.object({
  documentId: z.string().min(1),
  status: z.string().optional(),
});

export async function createDocumentAction(formData: FormData) {
  const parsed = documentFormSchema.safeParse(Object.fromEntries(formData.entries()));
  const uploadedFile = formData.get("file");

  if (!parsed.success || !isUsableFile(uploadedFile)) {
    redirect("/office/documents?error=validation");
  }

  let redirectTo = "/office/documents?error=database";

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const [project, vendor, department] = await Promise.all([
      parsed.data.projectId ? prisma.project.findFirst({ where: { companyId: company.id, id: parsed.data.projectId } }) : null,
      parsed.data.vendorId ? prisma.vendor.findFirst({ where: { companyId: company.id, id: parsed.data.vendorId } }) : null,
      parsed.data.departmentCode ? prisma.department.findFirst({ where: { companyId: company.id, code: parsed.data.departmentCode } }) : null,
    ]);

    if (parsed.data.projectId && !project) {
      redirectTo = "/office/documents?error=project";
    } else if (parsed.data.vendorId && !vendor) {
      redirectTo = "/office/documents?error=vendor";
    } else {
      const storedFile = await saveDocumentUpload(uploadedFile);
      const document = await prisma.document.create({
        data: {
          companyId: company.id,
          projectId: project?.id,
          vendorId: vendor?.id,
          departmentId: department?.id,
          documentType: parsed.data.documentType,
          title: parsed.data.title,
          status: documentStatusFromForm[parsed.data.status] ?? "CHECKING",
          latestVersion: 1,
          versions: {
            create: {
              companyId: company.id,
              version: 1,
              fileUrl: storedFile.fileUrl,
              fileName: storedFile.fileName,
              fileSize: storedFile.fileSize,
              mimeType: storedFile.mimeType,
              uploadedBy: user.name,
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          action: "document.create",
          targetType: "Document",
          targetId: document.id,
          afterJson: {
            documentType: document.documentType,
            title: document.title,
            latestVersion: document.latestVersion,
          },
        },
      });

      redirectTo = "/office/documents?created=1";
    }
  } catch (error) {
    console.error("[koujihub] createDocumentAction failed", error);
  }

  redirect(redirectTo);
}

export async function uploadDocumentVersionAction(formData: FormData) {
  const parsed = documentVersionSchema.safeParse(Object.fromEntries(formData.entries()));
  const uploadedFile = formData.get("file");

  if (!parsed.success || !isUsableFile(uploadedFile)) {
    redirect("/office/documents?error=validation");
  }

  let redirectTo = `/office/documents/${parsed.data.documentId}?error=database`;

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const existing = await prisma.document.findFirst({
      where: { companyId: company.id, id: parsed.data.documentId },
      select: { id: true, title: true, latestVersion: true, status: true },
    });

    if (!existing) {
      redirectTo = "/office/documents?error=missing";
    } else {
      const storedFile = await saveDocumentUpload(uploadedFile);
      const nextVersion = existing.latestVersion + 1;
      const nextStatus = parsed.data.status ? documentStatusFromForm[parsed.data.status] : undefined;

      const document = await prisma.document.update({
        where: { id: existing.id },
        data: {
          latestVersion: nextVersion,
          status: nextStatus ?? existing.status,
          versions: {
            create: {
              companyId: company.id,
              version: nextVersion,
              fileUrl: storedFile.fileUrl,
              fileName: storedFile.fileName,
              fileSize: storedFile.fileSize,
              mimeType: storedFile.mimeType,
              uploadedBy: user.name,
            },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          action: "document.version.upload",
          targetType: "Document",
          targetId: document.id,
          beforeJson: { latestVersion: existing.latestVersion, status: existing.status },
          afterJson: {
            latestVersion: document.latestVersion,
            status: document.status,
            fileName: storedFile.fileName,
          },
        },
      });

      redirectTo = `/office/documents/${document.id}?uploaded=1`;
    }
  } catch (error) {
    console.error("[koujihub] uploadDocumentVersionAction failed", error);
  }

  redirect(redirectTo);
}

export async function updateDocumentStatusAction(formData: FormData) {
  const parsed = documentStatusSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/office/documents?error=validation");
  }

  const nextStatus = documentStatusFromForm[parsed.data.status];
  let redirectTo = `/office/documents/${parsed.data.documentId}?error=database`;

  if (!nextStatus) {
    redirect(`/office/documents/${parsed.data.documentId}?error=status`);
  }

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const existing = await prisma.document.findFirst({
      where: { companyId: company.id, id: parsed.data.documentId },
      select: { id: true, title: true, status: true },
    });

    if (!existing) {
      redirectTo = "/office/documents?error=missing";
    } else {
      const document = await prisma.document.update({
        where: { id: existing.id },
        data: { status: nextStatus },
      });

      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          action: "document.status.update",
          targetType: "Document",
          targetId: document.id,
          beforeJson: { status: existing.status },
          afterJson: { status: document.status, title: document.title },
        },
      });

      redirectTo = `/office/documents/${document.id}?updated=1`;
    }
  } catch (error) {
    console.error("[koujihub] updateDocumentStatusAction failed", error);
  }

  redirect(redirectTo);
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureDemoTenant } from "@/lib/bootstrap";
import { getPrisma } from "@/lib/prisma";
import { projectStatusFromForm } from "@/lib/status-maps";

const projectFormSchema = z.object({
  projectCode: z.string().min(2),
  name: z.string().min(1),
  clientName: z.string().min(1),
  siteAddress: z.string().min(1),
  constructionType: z.string().min(1),
  departmentCode: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  contractAmount: z.coerce.number().nonnegative(),
  status: z.string().default("in_progress"),
  memo: z.string().optional(),
});

export async function createProjectAction(formData: FormData) {
  const parsed = projectFormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    redirect("/projects?error=validation");
  }

  let redirectTo = "/projects?error=database";

  try {
    const { company, user } = await ensureDemoTenant();
    const prisma = getPrisma();
    const department = await prisma.department.findFirst({
      where: {
        companyId: company.id,
        code: parsed.data.departmentCode,
      },
    });

    if (!department) {
      redirectTo = "/projects?error=department";
    } else {
      const project = await prisma.project.create({
        data: {
          companyId: company.id,
          departmentId: department.id,
          projectCode: parsed.data.projectCode,
          name: parsed.data.name,
          clientName: parsed.data.clientName,
          siteAddress: parsed.data.siteAddress,
          constructionType: parsed.data.constructionType,
          projectStatus: projectStatusFromForm[parsed.data.status] ?? "IN_PROGRESS",
          startDate: new Date(parsed.data.startDate),
          endDate: new Date(parsed.data.endDate),
          contractAmount: parsed.data.contractAmount,
          managerUserId: user.id,
          memo: parsed.data.memo,
        },
      });

      await prisma.auditLog.create({
        data: {
          companyId: company.id,
          userId: user.id,
          action: "project.create",
          targetType: "Project",
          targetId: project.id,
          afterJson: {
            projectCode: project.projectCode,
            name: project.name,
          },
        },
      });

      redirectTo = `/projects/${project.id}?created=1`;
    }
  } catch (error) {
    console.error("[koujihub] createProjectAction failed", error);
  }

  redirect(redirectTo);
}

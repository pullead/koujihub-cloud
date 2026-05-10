import { getPrisma } from "./prisma";

export const demoCompanyId = "company-tokyo-kensetsu";
export const demoGeneralAffairsUserId = "user-general-affairs";

const seedDepartments = [
  ["department-architecture", "建築", "ARCH"],
  ["department-civil", "土木", "CIVIL"],
  ["department-materials", "資材", "MATERIALS"],
  ["department-recycle", "リサイクル", "RECYCLE"],
  ["department-general-affairs", "総務", "GA"],
  ["department-accounting", "経理", "ACC"],
] as const;

export async function ensureDemoTenant() {
  const prisma = getPrisma();

  const company = await prisma.company.upsert({
    where: { id: demoCompanyId },
    update: {},
    create: {
      id: demoCompanyId,
      name: "東京建設株式会社",
      nameKana: "トウキョウケンセツ",
      address: "東京都千代田区丸の内 1-1-1",
      phone: "03-1234-5678",
      invoiceRegistrationNumber: "T1010001111222",
    },
  });

  await Promise.all(
    seedDepartments.map(([id, name, code], sortOrder) =>
      prisma.department.upsert({
        where: { id },
        update: {},
        create: {
          id,
          companyId: company.id,
          name,
          code,
          sortOrder,
        },
      }),
    ),
  );

  const user = await prisma.user.upsert({
    where: { id: demoGeneralAffairsUserId },
    update: {},
    create: {
      id: demoGeneralAffairsUserId,
      companyId: company.id,
      departmentId: "department-general-affairs",
      name: "田中 美咲",
      email: "misaki.tanaka@tokyo-kensetsu.example",
      role: "GENERAL_AFFAIRS",
    },
  });

  return { company, user };
}

import { PrismaClient, type UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://koujihub:koujihub@localhost:5432/koujihub?schema=public&connect_timeout=2";
const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
});

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "company-tokyo-kensetsu" },
    update: {},
    create: {
      id: "company-tokyo-kensetsu",
      name: "東京建設株式会社",
      nameKana: "トウキョウケンセツ",
      address: "東京都千代田区丸の内 1-1-1",
      phone: "03-1234-5678",
      invoiceRegistrationNumber: "T1010001111222",
    },
  });

  const departments = await Promise.all(
    [
      ["department-architecture", "建築", "ARCH"],
      ["department-civil", "土木", "CIVIL"],
      ["department-materials", "資材", "MATERIALS"],
      ["department-recycle", "リサイクル", "RECYCLE"],
      ["department-general-affairs", "総務", "GA"],
      ["department-accounting", "経理", "ACC"],
    ].map(([id, name, code], sortOrder) =>
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

  const seedUsers: Array<[string, string, string, string, UserRole]> = [
      ["user-general-affairs", "department-general-affairs", "田中 美咲", "misaki.tanaka@tokyo-kensetsu.example", "GENERAL_AFFAIRS"],
      ["user-accounting", "department-accounting", "伊藤 翔", "sho.ito@tokyo-kensetsu.example", "ACCOUNTING"],
      ["user-site-manager", "department-architecture", "佐藤 健", "ken.sato@tokyo-kensetsu.example", "SITE_MANAGER"],
      ["user-department-manager", "department-architecture", "山口 誠", "makoto.yamaguchi@tokyo-kensetsu.example", "DEPARTMENT_MANAGER"],
    ];

  const users = await Promise.all(
    seedUsers.map(([id, departmentId, name, email, role]) =>
      prisma.user.upsert({
        where: { id },
        update: {},
        create: {
          id,
          companyId: company.id,
          departmentId,
          name,
          email,
          role,
        },
      }),
    ),
  );

  const [architecture, civil] = departments;
  const siteManager = users[2];

  const vendors = await Promise.all(
    [
      ["vendor-daiwa", "V-0018", "大和設備株式会社", "ダイワセツビ", "T7010001234567", "空調・衛生設備"],
      ["vendor-touto", "V-0031", "東都電工有限会社", "トウトデンコウ", "T3011007766554", "電気設備"],
      ["vendor-miura", "V-0044", "三浦内装株式会社", "ミウラナイソウ", "T5010409988776", "内装仕上"],
    ].map(([id, vendorCode, name, nameKana, invoiceRegistrationNumber, licenseType]) =>
      prisma.vendor.upsert({
        where: { id },
        update: {},
        create: {
          id,
          companyId: company.id,
          vendorCode,
          name,
          nameKana,
          invoiceRegistrationNumber,
          constructionLicenseNumber: "東京都知事許可 般-4 第12345号",
          licenseType,
          phone: "03-0000-0000",
          email: `${vendorCode.toLowerCase()}@vendor.example`,
          mainContactName: "担当者",
          tradeStatus: "ACTIVE",
          paymentTerms: "月末締め翌月末支払",
          bankAccounts: {
            create: {
              companyId: company.id,
              bankName: "みずほ銀行",
              branchName: "本店",
              accountType: "普通",
              accountNumber: "1234567",
              accountHolder: name,
              isDefault: true,
            },
          },
        },
      }),
    ),
  );

  const projectA = await prisma.project.upsert({
    where: { id: "project-shibuya-office" },
    update: {},
    create: {
      id: "project-shibuya-office",
      companyId: company.id,
      departmentId: architecture.id,
      projectCode: "KJ-2026-041",
      name: "渋谷区オフィス改修工事",
      clientName: "青山不動産株式会社",
      siteAddress: "東京都渋谷区神南 1-8-12",
      constructionType: "内装・設備",
      projectStatus: "IN_PROGRESS",
      startDate: new Date("2026-03-10"),
      endDate: new Date("2026-07-31"),
      contractAmount: 128000000,
      managerUserId: siteManager.id,
    },
  });

  const projectB = await prisma.project.upsert({
    where: { id: "project-yokohama-yard" },
    update: {},
    create: {
      id: "project-yokohama-yard",
      companyId: company.id,
      departmentId: civil.id,
      projectCode: "KJ-2026-038",
      name: "横浜物流倉庫 外構工事",
      clientName: "港北ロジスティクス合同会社",
      siteAddress: "神奈川県横浜市都筑区池辺町",
      constructionType: "土木・舗装",
      projectStatus: "IN_PROGRESS",
      startDate: new Date("2026-02-18"),
      endDate: new Date("2026-06-25"),
      contractAmount: 84200000,
      managerUserId: siteManager.id,
    },
  });

  await prisma.order.upsert({
    where: { id: "order-po-2026-118" },
    update: {},
    create: {
      id: "order-po-2026-118",
      companyId: company.id,
      projectId: projectA.id,
      vendorId: vendors[0].id,
      departmentId: architecture.id,
      orderNumber: "PO-2026-118",
      tradeType: "空調設備",
      orderTitle: "空調機更新・配管工事",
      orderAmountExTax: 24300000,
      taxRate: 10,
      taxAmount: 2430000,
      orderAmountWithTax: 26730000,
      orderDate: new Date("2026-03-24"),
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-06-10"),
      status: "WAITING_CONFIRMATION",
    },
  });

  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      userId: users[0].id,
      action: "seed",
      targetType: "Company",
      targetId: company.id,
      afterJson: { message: "Initial KoujiHub Cloud seed data" },
    },
  });

  console.log(`Seeded ${company.name}: ${projectA.name}, ${projectB.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

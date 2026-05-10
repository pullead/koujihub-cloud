import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma: PrismaClient | null = null;
const defaultDatabaseUrl = "postgresql://koujihub:koujihub@localhost:5432/koujihub?schema=public&connect_timeout=2";

export function getPrisma() {
  if (!prisma) {
    const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl;

    prisma = new PrismaClient({
      adapter: new PrismaPg(databaseUrl),
    });
  }

  return prisma;
}

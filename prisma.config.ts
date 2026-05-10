import "dotenv/config";
import { defineConfig } from "prisma/config";

const defaultDatabaseUrl = "postgresql://koujihub:koujihub@localhost:5432/koujihub?schema=public&connect_timeout=2";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});

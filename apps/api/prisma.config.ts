import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // For migrations, use DIRECT_URL because Prisma Migrate needs a direct DB connection.
    url: process.env.DIRECT_URL!,
  },
});
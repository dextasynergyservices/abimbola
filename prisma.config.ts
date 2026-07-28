import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "bun prisma/seed.ts",
	},
	datasource: {
		// Plain process.env access (not the strict `env()` helper) so config
		// loading — and therefore `prisma generate` — doesn't fail in
		// environments without DATABASE_URL (e.g. CI). Commands needing a
		// real DB connection (db push/migrate/seed) still fail normally if unset.
		url: process.env.DATABASE_URL ?? "",
	},
});

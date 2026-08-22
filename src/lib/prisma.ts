import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL?.replace(
	"sslmode=require",
	"sslmode=verify-full",
);
const pool = new Pool({
	connectionString,
	max: process.env.NODE_ENV === "production" ? 10 : 5,
	idleTimeoutMillis: 10000,
	connectionTimeoutMillis: 5000,
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		adapter,
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

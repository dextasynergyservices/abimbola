/**
 * One-off migration helper: the Book model no longer has a separate
 * `comingSoonDate` — the frontend shows `publicationDate` only.
 *
 * Run this BEFORE `bun run db:push` (which drops the column) so no dates are
 * lost:  bun run db:backfill-publication-date
 */
import { prisma } from "../src/lib/prisma";

async function main() {
	const columnExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.columns
			WHERE table_name = 'Book' AND column_name = 'comingSoonDate'
		) AS "exists"
	`;

	if (!columnExists[0]?.exists) {
		console.log('No "comingSoonDate" column found — nothing to backfill.');
		return;
	}

	const updated = await prisma.$executeRawUnsafe(`
		UPDATE "Book"
		SET "publicationDate" = "comingSoonDate"
		WHERE ("publicationDate" IS NULL OR "publicationDate" = '')
			AND "comingSoonDate" IS NOT NULL
			AND "comingSoonDate" <> ''
	`);

	console.log(`Backfilled publicationDate for ${updated} book(s).`);
	console.log('You can now run "bun run db:push" to drop the old column.');
}

main()
	.catch((error) => {
		console.error(error);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Server-only helpers for keeping book slugs unique and their history tidy.
 *
 * Every book has one current `slug` plus `previousSlugs` — the slugs it used
 * before an admin renamed it. Public requests for a previous slug 301 to the
 * current one (see resolvePublishedBookRoute in lib/books.ts).
 */

/**
 * Returns an error message if `slug` is already some other book's current
 * slug. Soft-deleted books are included because the DB unique constraint
 * still applies to them.
 */
export async function findBookSlugConflict(
	slug: string,
	excludeBookId?: string,
): Promise<string | null> {
	const owner = await prisma.book.findFirst({
		where: {
			slug,
			...(excludeBookId ? { id: { not: excludeBookId } } : {}),
		},
		select: { title: true, deletedAt: true },
	});
	if (!owner) return null;
	return owner.deletedAt
		? `The slug "${slug}" belongs to a deleted book ("${owner.title}"). Choose a different slug.`
		: `Another book ("${owner.title}") already uses the slug "${slug}".`;
}

/**
 * When a slug is (re)claimed as a current slug, remove it from any other
 * book's redirect history so one URL can never point at two books.
 */
export async function releaseSlugFromOtherBooksHistory(
	slug: string,
	exceptBookId?: string,
): Promise<void> {
	const holders = await prisma.book.findMany({
		where: {
			previousSlugs: { has: slug },
			...(exceptBookId ? { id: { not: exceptBookId } } : {}),
		},
		select: { id: true, previousSlugs: true },
	});
	for (const holder of holders) {
		await prisma.book.update({
			where: { id: holder.id },
			data: { previousSlugs: holder.previousSlugs.filter((s) => s !== slug) },
		});
	}
}

/**
 * Explicitly purge every public URL a book can be reached on. The site-wide
 * purge in lib/cache.ts already covers this, but being explicit guarantees a
 * stale page is never served for an old slug.
 */
export function revalidateBookUrls(bookId: string, slugs: string[]): void {
	try {
		revalidatePath(`/books/${bookId}`);
		for (const slug of new Set(slugs)) revalidatePath(`/books/${slug}`);
	} catch (error) {
		console.error("Book revalidation error:", error);
	}
}

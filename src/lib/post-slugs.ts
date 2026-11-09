import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Server-only helpers for keeping blog post slugs unique and their history tidy.
 *
 * Every post has one current `slug` plus `previousSlugs` — the slugs it used
 * before an admin renamed it. Public requests for a previous slug 301 to the
 * current one (see resolvePublishedPostRoute in lib/cms.ts).
 */

/**
 * Returns an error message if `slug` is already some other post's current
 * slug. Soft-deleted posts are included because the DB unique constraint
 * still applies to them.
 */
export async function findPostSlugConflict(
	slug: string,
	excludePostId?: string,
): Promise<string | null> {
	const owner = await prisma.post.findFirst({
		where: {
			slug,
			...(excludePostId ? { id: { not: excludePostId } } : {}),
		},
		select: { title: true, deletedAt: true },
	});
	if (!owner) return null;
	return owner.deletedAt
		? `The slug "${slug}" belongs to a deleted article ("${owner.title}"). Choose a different slug.`
		: `Another article ("${owner.title}") already uses the slug "${slug}".`;
}

/**
 * When a slug is (re)claimed as a current slug, remove it from any other
 * post's redirect history so one URL can never point at two articles.
 */
export async function releaseSlugFromOtherPostsHistory(
	slug: string,
	exceptPostId?: string,
): Promise<void> {
	const holders = await prisma.post.findMany({
		where: {
			previousSlugs: { has: slug },
			...(exceptPostId ? { id: { not: exceptPostId } } : {}),
		},
		select: { id: true, previousSlugs: true },
	});
	for (const holder of holders) {
		await prisma.post.update({
			where: { id: holder.id },
			data: { previousSlugs: holder.previousSlugs.filter((s) => s !== slug) },
		});
	}
}

/**
 * Explicitly purge every public URL a post can be reached on.
 */
export function revalidatePostUrls(postId: string, slugs: string[]): void {
	try {
		revalidatePath(`/blog/${postId}`);
		for (const slug of new Set(slugs)) revalidatePath(`/blog/${slug}`);
	} catch (error) {
		console.error("Post revalidation error:", error);
	}
}

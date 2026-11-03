import { revalidatePath } from "next/cache";

/**
 * Caching strategy
 * ────────────────
 * Public pages are statically generated and cached for a long time
 * (PUBLIC_REVALIDATE_SECONDS) so visitors are served from Vercel's CDN without
 * touching the database. This lets Neon scale to zero between content changes
 * instead of waking up every minute.
 *
 * Freshness comes from on-demand revalidation instead of time:
 *   • Admin content changes → revalidatePublicSite() purges every public page,
 *     so edits show on the very next request.
 *   • Reader reviews/comments → targeted revalidation of just the affected
 *     book/post (see lib/engagement), so one comment doesn't purge the site.
 *
 * The time-based window is only a safety net.
 */

/** 24 hours. Must be a literal in each page's `export const revalidate`. */
export const PUBLIC_REVALIDATE_SECONDS = 86400;

/**
 * Purge all cached public pages and public API responses. Cheap for a site of
 * this size: each page regenerates once, on its next visit.
 */
export function revalidatePublicSite(): void {
	try {
		revalidatePath("/", "layout");
		// Route handlers aren't covered by the layout purge.
		revalidatePath("/api/settings/public");
	} catch (error) {
		console.error("Revalidation error:", error);
	}
}

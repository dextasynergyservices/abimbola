/**
 * Slug helpers shared by the admin form (client) and the admin API (server).
 *
 * A slug is the human-readable part of a public URL, e.g. /books/dear-single.
 * Only lowercase letters, numbers and single hyphens are allowed so URLs stay
 * clean, predictable and safe to embed anywhere.
 */

export const SLUG_MAX_LENGTH = 120;

/** Matches `dear-single`, `book-2`; rejects `-a`, `a--b`, `A`, `a_b`. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Turn arbitrary text (e.g. a title) into a valid slug. */
export function slugify(input: string): string {
	return input
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "") // strip accents: é -> e
		.toLowerCase()
		.trim()
		.replace(/['’]/g, "") // "Author's" -> "authors", not "author-s"
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, SLUG_MAX_LENGTH)
		.replace(/-+$/g, "");
}

/** Returns an error message, or null when the slug is valid. */
export function validateSlug(slug: string): string | null {
	if (!slug) return "Slug is required";
	if (slug.length > SLUG_MAX_LENGTH) {
		return `Slug must be ${SLUG_MAX_LENGTH} characters or fewer`;
	}
	if (!SLUG_PATTERN.test(slug)) {
		return "Slug may only contain lowercase letters, numbers and single hyphens (e.g. dear-single)";
	}
	return null;
}

/**
 * Compute the new redirect history after a slug change: keep the old slug,
 * never include the new current slug, no duplicates.
 */
export function nextPreviousSlugs(
	history: string[],
	oldSlug: string,
	newSlug: string,
): string[] {
	const merged = oldSlug === newSlug ? history : [...history, oldSlug];
	return Array.from(new Set(merged)).filter((s) => s !== newSlug);
}

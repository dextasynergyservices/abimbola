/**
 * The "Written by" card shown under each blog post.
 *
 * Each article can set its own author in the article editor (for guest
 * writers); anything left blank falls back to the site-wide bio in
 * Admin → System Settings, and then to the defaults below.
 *
 * Kept free of server-only imports so client components can use it too.
 */
export interface AuthorProfile {
	name: string;
	initials: string;
	bio: string;
}

export interface AuthorProfileOverrides {
	name?: string | null;
	initials?: string | null;
	bio?: string | null;
}

export const DEFAULT_AUTHOR_PROFILE: AuthorProfile = {
	name: "Abimbola Lawuyi",
	initials: "AL",
	bio: "Abimbola Lawuyi is an author, educational leader, and parenting consultant dedicated to empowering minds and raising purposeful leaders.",
};

/** "Ada Nwosu-Okeke" -> "AN" */
export function initialsFromName(name: string): string {
	const letters = name
		.trim()
		.split(/[\s-]+/)
		.filter(Boolean)
		.map((word) => word[0])
		.join("");
	return letters.slice(0, 2).toUpperCase();
}

/**
 * Layers an article's own author fields over a fallback profile. A name given
 * without initials derives them, so a guest author never inherits someone
 * else's initials.
 */
export function resolveAuthorProfile(
	overrides: AuthorProfileOverrides,
	fallback: AuthorProfile = DEFAULT_AUTHOR_PROFILE,
): AuthorProfile {
	const name = overrides.name?.trim() || "";
	const initials = overrides.initials?.trim() || "";
	const bio = overrides.bio?.trim() || "";

	return {
		name: name || fallback.name,
		initials: (
			initials ||
			(name ? initialsFromName(name) : "") ||
			fallback.initials
		).toUpperCase(),
		bio: bio || fallback.bio,
	};
}

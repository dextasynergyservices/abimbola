import { type AuthorProfile, DEFAULT_AUTHOR_PROFILE } from "@/lib/author";
import { prisma } from "@/lib/prisma";

export interface PublishedMedia {
	id: string;
	cloudinaryPublicId: string;
	secureUrl: string;
	width?: number | null;
	height?: number | null;
	altText?: string | null;
	caption?: string | null;
}

export interface PublishedSection {
	id: string;
	pageId: string;
	type: string;
	title?: string | null;
	content: Record<string, unknown>;
	settings?: Record<string, unknown> | null;
	sortOrder: number;
	status: string;
}

export interface PublishedPage {
	id: string;
	title: string;
	slug: string;
	status: string;
	seoTitle?: string | null;
	seoDescription?: string | null;
	seoImageId?: string | null;
	publishedAt?: Date | string | null;
	sections: PublishedSection[];
	seoImage?: PublishedMedia | null;
}

export interface PublishedPost {
	id: string;
	title: string;
	slug: string;
	excerpt?: string | null;
	body: string;
	featuredImageId?: string | null;
	status: string;
	seoTitle?: string | null;
	seoDescription?: string | null;
	authorId: string;
	authorName?: string | null;
	authorInitials?: string | null;
	authorBio?: string | null;
	categoryId?: string | null;
	publishedAt?: Date | string | null;
	author?: {
		id: string;
		name: string;
		email: string;
	};
	category?: {
		id: string;
		name: string;
		slug: string;
	} | null;
	featuredImage?: PublishedMedia | null;
}

/**
 * Fetch published page by slug from Neon database.
 * Hides drafts, archived, and soft-deleted pages & sections.
 */
export async function getPublishedPageBySlug(
	rawSlug: string,
): Promise<PublishedPage | null> {
	try {
		const cleanSlug = rawSlug.trim().toLowerCase();
		const slugVariants = [
			cleanSlug,
			cleanSlug.startsWith("/") ? cleanSlug.slice(1) : `/${cleanSlug}`,
			cleanSlug === "" || cleanSlug === "home" ? "/" : cleanSlug,
		];

		const page = await prisma.page.findFirst({
			where: {
				slug: { in: slugVariants },
				status: "PUBLISHED",
				deletedAt: null,
			},
			include: {
				sections: {
					where: { status: "PUBLISHED" },
					orderBy: { sortOrder: "asc" },
				},
			},
		});

		if (!page) return null;

		let seoImage: PublishedMedia | null = null;
		if (page.seoImageId) {
			const mediaRecord = await prisma.media.findUnique({
				where: { id: page.seoImageId },
			});
			if (mediaRecord) {
				seoImage = mediaRecord;
			}
		}

		return {
			...page,
			sections: page.sections.map((s) => ({
				...s,
				content: (s.content as Record<string, unknown>) || {},
				settings: (s.settings as Record<string, unknown>) || null,
			})),
			seoImage,
		};
	} catch (error) {
		console.error(
			`Error fetching published page for slug "${rawSlug}":`,
			error,
		);
		return null;
	}
}

/**
 * Fetch all published posts from Neon database.
 */
export async function getPublishedPosts(
	limit?: number,
): Promise<PublishedPost[]> {
	try {
		const posts = await prisma.post.findMany({
			where: {
				status: "PUBLISHED",
				deletedAt: null,
			},
			orderBy: { publishedAt: "desc" },
			take: limit,
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				category: true,
			},
		});

		// Fetch featured images for posts
		const mediaIds = posts
			.map((p) => p.featuredImageId)
			.filter(Boolean) as string[];
		let mediaMap = new Map<string, PublishedMedia>();

		if (mediaIds.length > 0) {
			const mediaRecords = await prisma.media.findMany({
				where: { id: { in: mediaIds } },
			});
			mediaMap = new Map(mediaRecords.map((m) => [m.id, m]));
		}

		return posts.map((post) => ({
			...post,
			featuredImage: post.featuredImageId
				? mediaMap.get(post.featuredImageId) || null
				: null,
		}));
	} catch (error) {
		console.error("Error fetching published posts:", error);
		return [];
	}
}

/**
 * Fetch single published post by slug from Neon database.
 */
/**
 * The "Written by" card shown under each blog post. Editable from
 * Admin → System Settings → Blog Author Bio.
 */
export async function getAuthorProfile(): Promise<AuthorProfile> {
	try {
		const settings = await prisma.siteSettings.findUnique({
			where: { id: "singleton" },
			select: { authorName: true, authorInitials: true, authorBio: true },
		});

		return {
			name: settings?.authorName?.trim() || DEFAULT_AUTHOR_PROFILE.name,
			initials:
				settings?.authorInitials?.trim() || DEFAULT_AUTHOR_PROFILE.initials,
			bio: settings?.authorBio?.trim() || DEFAULT_AUTHOR_PROFILE.bio,
		};
	} catch (error) {
		console.error("Error fetching author profile:", error);
		return DEFAULT_AUTHOR_PROFILE;
	}
}

export async function getPublishedPostBySlug(
	slugOrId: string,
): Promise<PublishedPost | null> {
	try {
		const term = slugOrId.trim().toLowerCase();
		const post = await prisma.post.findFirst({
			where: {
				OR: [{ slug: term }, { id: slugOrId }],
				status: "PUBLISHED",
				deletedAt: null,
			},
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				category: true,
			},
		});

		if (!post) return null;

		let featuredImage: PublishedMedia | null = null;
		if (post.featuredImageId) {
			featuredImage = await prisma.media.findUnique({
				where: { id: post.featuredImageId },
			});
		}

		return {
			...post,
			featuredImage,
		};
	} catch (error) {
		console.error(
			`Error fetching published post for slug "${slugOrId}":`,
			error,
		);
		return null;
	}
}

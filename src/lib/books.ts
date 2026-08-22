import { cache } from "react";
import type { PublishedMedia } from "@/lib/cms";
import { prisma } from "@/lib/prisma";

export interface PublishedBookPrice {
	type: "HARD_COPY" | "SOFT_COPY" | "FREE" | "COMING_SOON";
	amount: number | null;
	currency: string | null;
	url: string | null;
	available: boolean;
}

export interface PublishedBookCategory {
	id: string;
	name: string;
	slug: string;
}

export interface PublishedBook {
	id: string;
	title: string;
	slug: string;
	author: string;
	description: string | null;
	rating: number | null;
	publisher: string | null;
	publicationDate: string | null;
	comingSoonDate?: string | null;
	preOrderUrl?: string | null;
	relatedBookIds?: string[];
	buyUrl: string | null;
	featuredOnHome: boolean;
	category: PublishedBookCategory | null;
	coverImage: PublishedMedia | null;
	prices: PublishedBookPrice[];
}

const bookSelect = {
	id: true,
	title: true,
	slug: true,
	author: true,
	description: true,
	rating: true,
	publisher: true,
	publicationDate: true,
	comingSoonDate: true,
	preOrderUrl: true,
	relatedBookIds: true,
	buyUrl: true,
	coverImageId: true,
	featuredOnHome: true,
	category: {
		select: {
			id: true,
			name: true,
			slug: true,
		},
	},
	prices: {
		select: {
			type: true,
			amount: true,
			currency: true,
			url: true,
			available: true,
		},
	},
};

const mediaSelect = {
	id: true,
	cloudinaryPublicId: true,
	secureUrl: true,
	width: true,
	height: true,
	altText: true,
	caption: true,
};

async function attachMediaToBooks<
	T extends { coverImageId: string | null; [key: string]: unknown },
>(rawBooks: T[]): Promise<PublishedBook[]> {
	const mediaIds = rawBooks
		.map((b) => b.coverImageId)
		.filter((id): id is string => Boolean(id));

	let mediaMap = new Map<string, PublishedMedia>();
	if (mediaIds.length > 0) {
		const mediaRecords = await prisma.media.findMany({
			where: { id: { in: mediaIds } },
			select: mediaSelect,
		});
		mediaMap = new Map(mediaRecords.map((m) => [m.id, m]));
	}

	return rawBooks.map((book) => ({
		...(book as unknown as PublishedBook),
		coverImage: book.coverImageId
			? mediaMap.get(book.coverImageId) || null
			: null,
	}));
}

/**
 * Fetch top featured books for homepage.
 * Queries directly with limit 3 instead of pulling all books.
 * Wrapped with React cache() to deduplicate requests during SSR.
 */
export const getFeaturedBooks = cache(async (): Promise<PublishedBook[]> => {
	try {
		let books = await prisma.book.findMany({
			where: { featuredOnHome: true, status: "PUBLISHED", deletedAt: null },
			orderBy: { createdAt: "asc" },
			take: 3,
			select: bookSelect,
		});

		if (books.length === 0) {
			books = await prisma.book.findMany({
				where: { status: "PUBLISHED", deletedAt: null },
				orderBy: { createdAt: "asc" },
				take: 3,
				select: bookSelect,
			});
		}

		return attachMediaToBooks(books);
	} catch (error) {
		console.error("Error fetching featured books:", error);
		return [];
	}
});

/**
 * Fetch all published books with optimized SELECT projections.
 * Wrapped with React cache() to deduplicate requests during SSR.
 */
export const getPublishedBooks = cache(async (): Promise<PublishedBook[]> => {
	try {
		const books = await prisma.book.findMany({
			where: { status: "PUBLISHED", deletedAt: null },
			orderBy: { createdAt: "asc" },
			select: bookSelect,
		});

		return attachMediaToBooks(books);
	} catch (error) {
		console.error("Error fetching published books:", error);
		return [];
	}
});

/**
 * Fetch book categories.
 * Wrapped with React cache() to deduplicate requests during SSR.
 */
export const getBookCategories = cache(
	async (): Promise<PublishedBookCategory[]> => {
		try {
			return await prisma.bookCategory.findMany({
				orderBy: { sortOrder: "asc" },
				select: { id: true, name: true, slug: true },
			});
		} catch (error) {
			console.error("Error fetching book categories:", error);
			return [];
		}
	},
);

/**
 * Fetch blog categories.
 * Wrapped with React cache() to deduplicate requests during SSR.
 */
export const getBlogCategories = cache(async () => {
	try {
		return await prisma.blogCategory.findMany({
			orderBy: { sortOrder: "asc" },
			select: { id: true, name: true, slug: true },
		});
	} catch (error) {
		console.error("Error fetching blog categories:", error);
		return [];
	}
});

/**
 * Fetch single published book by ID or slug.
 * Wrapped with React cache() to deduplicate requests during SSR.
 */
export const getPublishedBookById = cache(
	async (idOrSlug: string): Promise<PublishedBook | null> => {
		try {
			const book = await prisma.book.findFirst({
				where: {
					OR: [{ id: idOrSlug }, { slug: idOrSlug.toLowerCase() }],
					status: "PUBLISHED",
					deletedAt: null,
				},
				select: bookSelect,
			});

			if (!book) return null;

			let coverImage: PublishedMedia | null = null;
			if (book.coverImageId) {
				coverImage = await prisma.media.findUnique({
					where: { id: book.coverImageId },
					select: mediaSelect,
				});
			}

			return { ...book, coverImage };
		} catch (error) {
			console.error(`Error fetching published book "${idOrSlug}":`, error);
			return null;
		}
	},
);

/**
 * Fetch related books for a book.
 * Executes targeted SQL query for 4 items instead of loading all books into memory.
 * Wrapped with React cache() to deduplicate requests during SSR.
 */
export const getRelatedBooksForBook = cache(
	async (book: PublishedBook): Promise<PublishedBook[]> => {
		try {
			if (book.relatedBookIds && book.relatedBookIds.length > 0) {
				const selected = await prisma.book.findMany({
					where: {
						id: { in: book.relatedBookIds },
						status: "PUBLISHED",
						deletedAt: null,
					},
					take: 4,
					select: bookSelect,
				});

				if (selected.length > 0) {
					return attachMediaToBooks(selected);
				}
			}

			// Fallback: fetch other published books excluding the current one
			const fallback = await prisma.book.findMany({
				where: {
					id: { not: book.id },
					status: "PUBLISHED",
					deletedAt: null,
				},
				take: 4,
				orderBy: { createdAt: "desc" },
				select: bookSelect,
			});

			return attachMediaToBooks(fallback);
		} catch (error) {
			console.error("Error fetching related books:", error);
			return [];
		}
	},
);

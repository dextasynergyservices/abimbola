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
	buyUrl: string | null;
	featuredOnHome: boolean;
	category: PublishedBookCategory | null;
	coverImage: PublishedMedia | null;
	prices: PublishedBookPrice[];
}

export async function getFeaturedBooks(): Promise<PublishedBook[]> {
	try {
		const books = await getPublishedBooks();
		const featured = books.filter((b) => b.featuredOnHome).slice(0, 3);
		if (featured.length > 0) {
			return featured;
		}
		return books.slice(0, 3);
	} catch (error) {
		console.error("Error fetching featured books:", error);
		return [];
	}
}

export async function getPublishedBooks(): Promise<PublishedBook[]> {
	try {
		const books = await prisma.book.findMany({
			where: { status: "PUBLISHED", deletedAt: null },
			orderBy: { createdAt: "asc" },
			include: { category: true, prices: true },
		});

		const mediaIds = books
			.map((b) => b.coverImageId)
			.filter((id): id is string => Boolean(id));

		const mediaRecords =
			mediaIds.length > 0
				? await prisma.media.findMany({ where: { id: { in: mediaIds } } })
				: [];
		const mediaMap = new Map(mediaRecords.map((m) => [m.id, m]));

		return books.map((book) => ({
			...book,
			coverImage: book.coverImageId
				? mediaMap.get(book.coverImageId) || null
				: null,
		}));
	} catch (error) {
		console.error("Error fetching published books:", error);
		return [];
	}
}

export async function getBookCategories(): Promise<PublishedBookCategory[]> {
	try {
		return await prisma.bookCategory.findMany({
			orderBy: { sortOrder: "asc" },
			select: { id: true, name: true, slug: true },
		});
	} catch (error) {
		console.error("Error fetching book categories:", error);
		return [];
	}
}

export async function getBlogCategories() {
	try {
		return await prisma.blogCategory.findMany({
			orderBy: { sortOrder: "asc" },
			select: { id: true, name: true, slug: true },
		});
	} catch (error) {
		console.error("Error fetching blog categories:", error);
		return [];
	}
}

export async function getPublishedBookById(
	idOrSlug: string,
): Promise<PublishedBook | null> {
	try {
		const book = await prisma.book.findFirst({
			where: {
				OR: [{ id: idOrSlug }, { slug: idOrSlug.toLowerCase() }],
				status: "PUBLISHED",
				deletedAt: null,
			},
			include: { category: true, prices: true },
		});

		if (!book) return null;

		let coverImage: PublishedMedia | null = null;
		if (book.coverImageId) {
			coverImage = await prisma.media.findUnique({
				where: { id: book.coverImageId },
			});
		}

		return { ...book, coverImage };
	} catch (error) {
		console.error(`Error fetching published book "${idOrSlug}":`, error);
		return null;
	}
}

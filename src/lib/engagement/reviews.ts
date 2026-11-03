import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
	type PublicReview,
	REVIEW_PAGE_SIZE,
	type ReviewPage,
	type ReviewSort,
	type ReviewSummary,
} from "./types";

/** Server-only data access for book reviews. */

const publicVisible = { status: "VISIBLE" as const, deletedAt: null };

const publicReviewSelect = {
	id: true,
	name: true,
	rating: true,
	title: true,
	body: true,
	authorReply: true,
	authorReplyAt: true,
	createdAt: true,
	editedAt: true,
};

type RawReview = {
	id: string;
	name: string;
	rating: number;
	title: string | null;
	body: string;
	authorReply: string | null;
	authorReplyAt: Date | null;
	createdAt: Date;
	editedAt?: Date | null;
};

export function toPublicReview(r: RawReview): PublicReview {
	return {
		id: r.id,
		name: r.name,
		rating: r.rating,
		title: r.title,
		body: r.body,
		authorReply: r.authorReply,
		authorReplyAt: r.authorReplyAt ? r.authorReplyAt.toISOString() : null,
		createdAt: r.createdAt.toISOString(),
		editedAt: r.editedAt ? r.editedAt.toISOString() : null,
	};
}

function orderFor(sort: ReviewSort) {
	switch (sort) {
		case "highest":
			return [
				{ rating: "desc" as const },
				{ createdAt: "desc" as const },
				{ id: "desc" as const },
			];
		case "lowest":
			return [
				{ rating: "asc" as const },
				{ createdAt: "desc" as const },
				{ id: "desc" as const },
			];
		default:
			return [{ createdAt: "desc" as const }, { id: "desc" as const }];
	}
}

export async function getPublicReviews(
	bookId: string,
	opts: { sort?: ReviewSort; cursor?: string | null; take?: number } = {},
): Promise<ReviewPage> {
	const take = Math.min(opts.take ?? REVIEW_PAGE_SIZE, 50);
	try {
		const rows = await prisma.bookReview.findMany({
			where: { bookId, ...publicVisible },
			orderBy: orderFor(opts.sort ?? "newest"),
			take: take + 1,
			...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
			select: publicReviewSelect,
		});

		const hasMore = rows.length > take;
		const page = hasMore ? rows.slice(0, take) : rows;
		return {
			reviews: page.map(toPublicReview),
			nextCursor: hasMore ? page[page.length - 1].id : null,
		};
	} catch (error) {
		console.error(`Error fetching reviews for book ${bookId}:`, error);
		return { reviews: [], nextCursor: null };
	}
}

export async function getReviewSummary(bookId: string): Promise<ReviewSummary> {
	try {
		const groups = await prisma.bookReview.groupBy({
			by: ["rating"],
			where: { bookId, ...publicVisible },
			_count: { _all: true },
		});
		const distribution: ReviewSummary["distribution"] = [0, 0, 0, 0, 0];
		let total = 0;
		let sum = 0;
		for (const g of groups) {
			if (g.rating >= 1 && g.rating <= 5) {
				distribution[g.rating - 1] = g._count._all;
				total += g._count._all;
				sum += g.rating * g._count._all;
			}
		}
		return {
			count: total,
			average: total > 0 ? Math.round((sum / total) * 10) / 10 : null,
			distribution,
		};
	} catch (error) {
		console.error(`Error fetching review summary for book ${bookId}:`, error);
		return { count: 0, average: null, distribution: [0, 0, 0, 0, 0] };
	}
}

/**
 * Recompute the denormalised rating on Book. Call after any change that
 * affects visibility (create, hide, unhide, delete).
 */
export async function recalculateBookRating(bookId: string): Promise<void> {
	const agg = await prisma.bookReview.aggregate({
		where: { bookId, ...publicVisible },
		_avg: { rating: true },
		_count: { _all: true },
	});
	await prisma.book.update({
		where: { id: bookId },
		data: {
			reviewCount: agg._count._all,
			averageRating:
				agg._count._all > 0 && agg._avg.rating !== null
					? Math.round(agg._avg.rating * 100) / 100
					: null,
		},
	});
}

/** Refresh every cached page that shows this book's rating or reviews. */
export async function revalidateBookPages(bookId: string): Promise<void> {
	try {
		const book = await prisma.book.findUnique({
			where: { id: bookId },
			select: { id: true, slug: true },
		});
		revalidatePath("/");
		revalidatePath("/books");
		revalidatePath(`/books/${bookId}`);
		if (book?.slug) revalidatePath(`/books/${book.slug}`);
	} catch (error) {
		console.error("Revalidation error:", error);
	}
}

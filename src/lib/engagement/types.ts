/**
 * Public, client-safe shapes. These intentionally omit email, IP hash and
 * moderation internals — never send those to the browser.
 */

export type ReviewSort = "newest" | "highest" | "lowest";

export interface PublicReview {
	id: string;
	name: string;
	rating: number;
	title: string | null;
	body: string;
	authorReply: string | null;
	authorReplyAt: string | null;
	createdAt: string;
	editedAt: string | null;
}

export interface ReviewSummary {
	count: number;
	average: number | null;
	/** Index 0 = 1 star … index 4 = 5 stars */
	distribution: [number, number, number, number, number];
}

export interface ReviewPage {
	reviews: PublicReview[];
	nextCursor: string | null;
}

export interface PublicComment {
	id: string;
	parentId: string | null;
	name: string;
	body: string;
	isAuthor: boolean;
	createdAt: string;
	editedAt: string | null;
	replies: PublicComment[];
}

export interface CommentPage {
	comments: PublicComment[];
	total: number;
	nextCursor: string | null;
}

/** How long a guest can edit their own review/comment. Deleting is allowed any time. */
export const EDIT_WINDOW_HOURS = 24;

export const REVIEW_PAGE_SIZE = 10;
export const COMMENT_PAGE_SIZE = 20;

export const LIMITS = {
	name: 80,
	reviewTitle: 120,
	reviewBody: 3000,
	commentBody: 2000,
	minBody: 10,
} as const;

/** Display rating: real average when reviews exist, else the manual fallback. */
export function getDisplayRating(book: {
	rating?: number | null;
	averageRating?: number | null;
	reviewCount?: number | null;
}): { value: number; count: number } {
	const count = book.reviewCount ?? 0;
	if (count > 0 && typeof book.averageRating === "number") {
		return { value: Math.round(book.averageRating * 10) / 10, count };
	}
	return { value: book.rating ?? 5, count: 0 };
}

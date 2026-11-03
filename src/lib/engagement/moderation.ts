import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePostPages } from "./comments";
import { recalculateBookRating, revalidateBookPages } from "./reviews";

/** Server-only moderation logic shared by the admin API routes. */

export type EngagementKind = "reviews" | "comments";
export type StatusFilter = "all" | "visible" | "hidden" | "flagged";
export type ModerationAction = "hide" | "show" | "delete";

export const ADMIN_PAGE_SIZE = 20;

export function parseKind(value: string): EngagementKind | null {
	return value === "reviews" || value === "comments" ? value : null;
}

function statusWhere(status: StatusFilter) {
	switch (status) {
		case "visible":
			return { status: "VISIBLE" as const };
		case "hidden":
			return { status: "HIDDEN" as const };
		case "flagged":
			return { status: "HIDDEN" as const, flagged: true };
		default:
			return {};
	}
}

export async function listForAdmin(
	kind: EngagementKind,
	opts: { status: StatusFilter; q?: string; page: number },
) {
	const skip = (Math.max(1, opts.page) - 1) * ADMIN_PAGE_SIZE;
	const q = opts.q?.trim();

	if (kind === "reviews") {
		const where: Prisma.BookReviewWhereInput = {
			deletedAt: null,
			...statusWhere(opts.status),
			...(q
				? {
						OR: [
							{ name: { contains: q, mode: "insensitive" } },
							{ email: { contains: q, mode: "insensitive" } },
							{ body: { contains: q, mode: "insensitive" } },
							{ title: { contains: q, mode: "insensitive" } },
							{ book: { title: { contains: q, mode: "insensitive" } } },
						],
					}
				: {}),
		};
		const [items, total] = await Promise.all([
			prisma.bookReview.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip,
				take: ADMIN_PAGE_SIZE,
				select: {
					id: true,
					name: true,
					email: true,
					rating: true,
					title: true,
					body: true,
					status: true,
					flagged: true,
					flagReason: true,
					authorReply: true,
					authorReplyAt: true,
					createdAt: true,
					editedAt: true,
					book: { select: { id: true, title: true, slug: true } },
				},
			}),
			prisma.bookReview.count({ where }),
		]);
		return { items, total };
	}

	const where: Prisma.PostCommentWhereInput = {
		deletedAt: null,
		...statusWhere(opts.status),
		...(q
			? {
					OR: [
						{ name: { contains: q, mode: "insensitive" } },
						{ email: { contains: q, mode: "insensitive" } },
						{ body: { contains: q, mode: "insensitive" } },
						{ post: { title: { contains: q, mode: "insensitive" } } },
					],
				}
			: {}),
	};
	const [items, total] = await Promise.all([
		prisma.postComment.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip,
			take: ADMIN_PAGE_SIZE,
			select: {
				id: true,
				name: true,
				email: true,
				body: true,
				status: true,
				flagged: true,
				flagReason: true,
				isAuthor: true,
				parentId: true,
				createdAt: true,
				editedAt: true,
				post: { select: { id: true, title: true, slug: true } },
				parent: { select: { id: true, name: true, body: true } },
				_count: { select: { replies: { where: { deletedAt: null } } } },
			},
		}),
		prisma.postComment.count({ where }),
	]);
	return { items, total };
}

export async function countsForAdmin() {
	const base = { deletedAt: null };
	const [rAll, rVisible, rHidden, rFlagged, cAll, cVisible, cHidden, cFlagged] =
		await Promise.all([
			prisma.bookReview.count({ where: base }),
			prisma.bookReview.count({ where: { ...base, status: "VISIBLE" } }),
			prisma.bookReview.count({ where: { ...base, status: "HIDDEN" } }),
			prisma.bookReview.count({
				where: { ...base, status: "HIDDEN", flagged: true },
			}),
			prisma.postComment.count({ where: base }),
			prisma.postComment.count({ where: { ...base, status: "VISIBLE" } }),
			prisma.postComment.count({ where: { ...base, status: "HIDDEN" } }),
			prisma.postComment.count({
				where: { ...base, status: "HIDDEN", flagged: true },
			}),
		]);
	return {
		reviews: {
			all: rAll,
			visible: rVisible,
			hidden: rHidden,
			flagged: rFlagged,
		},
		comments: {
			all: cAll,
			visible: cVisible,
			hidden: cHidden,
			flagged: cFlagged,
		},
	};
}

/**
 * Apply a moderation action to one or more items, then recompute ratings
 * and refresh affected public pages.
 */
export async function moderate(
	kind: EngagementKind,
	ids: string[],
	action: ModerationAction,
	userId: string | undefined,
): Promise<number> {
	if (ids.length === 0) return 0;

	const data =
		action === "delete"
			? { deletedAt: new Date() }
			: action === "hide"
				? { status: "HIDDEN" as const }
				: { status: "VISIBLE" as const, flagged: false }; // "show" also approves flagged items

	let affectedParents: string[] = [];
	let count = 0;

	if (kind === "reviews") {
		const rows = await prisma.bookReview.findMany({
			where: { id: { in: ids }, deletedAt: null },
			select: { id: true, bookId: true },
		});
		const result = await prisma.bookReview.updateMany({
			where: { id: { in: rows.map((r) => r.id) } },
			data,
		});
		count = result.count;
		affectedParents = [...new Set(rows.map((r) => r.bookId))];
		for (const bookId of affectedParents) {
			await recalculateBookRating(bookId);
			await revalidateBookPages(bookId);
		}
	} else {
		const rows = await prisma.postComment.findMany({
			where: { id: { in: ids }, deletedAt: null },
			select: { id: true, postId: true },
		});
		const rowIds = rows.map((r) => r.id);
		const result = await prisma.postComment.updateMany({
			where: { id: { in: rowIds } },
			data,
		});
		count = result.count;
		// Deleting a top-level comment also removes its replies from view.
		if (action === "delete") {
			await prisma.postComment.updateMany({
				where: { parentId: { in: rowIds }, deletedAt: null },
				data: { deletedAt: new Date() },
			});
		}
		affectedParents = [...new Set(rows.map((r) => r.postId))];
		for (const postId of affectedParents) {
			await revalidatePostPages(postId);
		}
	}

	if (userId && count > 0) {
		await prisma.auditLog
			.create({
				data: {
					userId,
					action: `${action.toUpperCase()}_${kind === "reviews" ? "REVIEW" : "COMMENT"}`,
					entityType: kind === "reviews" ? "BookReview" : "PostComment",
					entityId: ids.length === 1 ? ids[0] : null,
					metadata: { ids, count },
				},
			})
			.catch((e) => console.error("Audit log failed:", e));
	}

	return count;
}

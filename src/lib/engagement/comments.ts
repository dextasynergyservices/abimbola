import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
	COMMENT_PAGE_SIZE,
	type CommentPage,
	type PublicComment,
} from "./types";

/** Server-only data access for blog comments. */

const publicVisible = { status: "VISIBLE" as const, deletedAt: null };

const baseSelect = {
	id: true,
	parentId: true,
	name: true,
	body: true,
	isAuthor: true,
	createdAt: true,
	editedAt: true,
};

type RawComment = {
	id: string;
	parentId: string | null;
	name: string;
	body: string;
	isAuthor: boolean;
	createdAt: Date;
	editedAt?: Date | null;
	replies?: RawComment[];
};

export function toPublicComment(c: RawComment): PublicComment {
	return {
		id: c.id,
		parentId: c.parentId,
		name: c.name,
		body: c.body,
		isAuthor: c.isAuthor,
		createdAt: c.createdAt.toISOString(),
		editedAt: c.editedAt ? c.editedAt.toISOString() : null,
		replies: (c.replies || []).map(toPublicComment),
	};
}

/**
 * Top-level comments, newest first, each with its visible replies
 * (oldest first, so conversations read naturally).
 */
export async function getPublicComments(
	postId: string,
	opts: { cursor?: string | null; take?: number } = {},
): Promise<CommentPage> {
	const take = Math.min(opts.take ?? COMMENT_PAGE_SIZE, 50);
	try {
		const where = { postId, parentId: null, ...publicVisible };
		const [rows, topLevel, replies] = await Promise.all([
			prisma.postComment.findMany({
				where,
				orderBy: [{ createdAt: "desc" }, { id: "desc" }],
				take: take + 1,
				...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
				select: {
					...baseSelect,
					replies: {
						where: publicVisible,
						orderBy: { createdAt: "asc" },
						select: baseSelect,
					},
				},
			}),
			prisma.postComment.count({ where }),
			prisma.postComment.count({
				where: {
					postId,
					parentId: { not: null },
					...publicVisible,
					parent: publicVisible,
				},
			}),
		]);

		const hasMore = rows.length > take;
		const page = hasMore ? rows.slice(0, take) : rows;
		return {
			comments: page.map(toPublicComment),
			total: topLevel + replies,
			nextCursor: hasMore ? page[page.length - 1].id : null,
		};
	} catch (error) {
		console.error(`Error fetching comments for post ${postId}:`, error);
		return { comments: [], total: 0, nextCursor: null };
	}
}

export async function revalidatePostPages(postId: string): Promise<void> {
	try {
		const post = await prisma.post.findUnique({
			where: { id: postId },
			select: { slug: true },
		});
		revalidatePath("/blog");
		if (post?.slug) revalidatePath(`/blog/${post.slug}`);
	} catch (error) {
		console.error("Revalidation error:", error);
	}
}

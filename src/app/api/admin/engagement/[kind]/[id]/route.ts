import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
	revalidatePostPages,
	toPublicComment,
} from "@/lib/engagement/comments";
import { moderate, parseKind } from "@/lib/engagement/moderation";
import { revalidateBookPages } from "@/lib/engagement/reviews";
import { cleanText } from "@/lib/engagement/spam";
import { LIMITS } from "@/lib/engagement/types";
import { prisma } from "@/lib/prisma";

const patchSchema = z.discriminatedUnion("action", [
	z.object({ action: z.literal("hide") }),
	z.object({ action: z.literal("show") }),
	z.object({
		action: z.literal("reply"),
		// Empty string removes an existing review reply.
		body: z.string().max(LIMITS.commentBody).transform(cleanText),
	}),
]);

/**
 * PATCH /api/admin/engagement/[kind]/[id]
 *   { action: "hide" | "show" }   – unlist / relist (show also approves flagged)
 *   { action: "reply", body }     – reviews: set/clear the author's public reply
 *                                   comments: post a reply as the author
 */
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ kind: string; id: string }> },
) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { kind: rawKind, id } = await params;
	const kind = parseKind(rawKind);
	if (!kind) return NextResponse.json({ error: "Not found" }, { status: 404 });

	try {
		const input = patchSchema.parse(await request.json());

		if (input.action === "hide" || input.action === "show") {
			const count = await moderate(kind, [id], input.action, session.user.id);
			if (count === 0) {
				return NextResponse.json({ error: "Item not found" }, { status: 404 });
			}
			return NextResponse.json({ ok: true });
		}

		// Reply
		if (kind === "reviews") {
			const review = await prisma.bookReview.findFirst({
				where: { id, deletedAt: null },
				select: { id: true, bookId: true },
			});
			if (!review)
				return NextResponse.json(
					{ error: "Review not found" },
					{ status: 404 },
				);

			const updated = await prisma.bookReview.update({
				where: { id },
				data: input.body
					? { authorReply: input.body, authorReplyAt: new Date() }
					: { authorReply: null, authorReplyAt: null },
				select: { id: true, authorReply: true, authorReplyAt: true },
			});
			await logAudit(session.user.id, "REPLY_REVIEW", "BookReview", id);
			await revalidateBookPages(review.bookId);
			return NextResponse.json({ review: updated });
		}

		if (!input.body || input.body.length < 2) {
			return NextResponse.json(
				{ error: "Please write a reply" },
				{ status: 400 },
			);
		}

		const parent = await prisma.postComment.findFirst({
			where: { id, deletedAt: null },
			select: { id: true, parentId: true, postId: true },
		});
		if (!parent)
			return NextResponse.json({ error: "Comment not found" }, { status: 404 });

		const [admin, settings] = await Promise.all([
			prisma.user.findUnique({
				where: { id: session.user.id },
				select: { name: true, email: true },
			}),
			prisma.siteSettings.findUnique({
				where: { id: "singleton" },
				select: { authorName: true },
			}),
		]);

		const reply = await prisma.postComment.create({
			data: {
				postId: parent.postId,
				parentId: parent.parentId ?? parent.id,
				name: settings?.authorName || admin?.name || "Author",
				email: admin?.email || session.user.email || "author@local",
				body: input.body,
				isAuthor: true,
				adminUserId: session.user.id,
				status: "VISIBLE",
			},
		});

		await logAudit(session.user.id, "REPLY_COMMENT", "PostComment", reply.id);
		await revalidatePostPages(parent.postId);
		return NextResponse.json(
			{ comment: toPublicComment(reply) },
			{ status: 201 },
		);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error(`Failed to update ${kind} ${id}:`, error);
		return NextResponse.json({ error: "Update failed" }, { status: 500 });
	}
}

/** DELETE /api/admin/engagement/[kind]/[id] — soft delete */
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ kind: string; id: string }> },
) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { kind: rawKind, id } = await params;
	const kind = parseKind(rawKind);
	if (!kind) return NextResponse.json({ error: "Not found" }, { status: 404 });

	try {
		const count = await moderate(kind, [id], "delete", session.user.id);
		if (count === 0) {
			return NextResponse.json({ error: "Item not found" }, { status: 404 });
		}
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error(`Failed to delete ${kind} ${id}:`, error);
		return NextResponse.json({ error: "Delete failed" }, { status: 500 });
	}
}

async function logAudit(
	userId: string | undefined,
	action: string,
	entityType: string,
	entityId: string,
) {
	if (!userId) return;
	await prisma.auditLog
		.create({ data: { userId, action, entityType, entityId } })
		.catch((e) => console.error("Audit log failed:", e));
}

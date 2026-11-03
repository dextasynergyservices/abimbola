import { NextResponse } from "next/server";
import { z } from "zod";
import {
	revalidatePostPages,
	toPublicComment,
} from "@/lib/engagement/comments";
import { tokenMatches, withinEditWindow } from "@/lib/engagement/ownership";
import { cleanText, detectSpam } from "@/lib/engagement/spam";
import { EDIT_WINDOW_HOURS, LIMITS } from "@/lib/engagement/types";
import { prisma } from "@/lib/prisma";

/**
 * Guest self-service for a comment, authorised by the private edit key the
 * author's browser received when posting (see lib/engagement/ownership).
 *   PATCH  – edit within EDIT_WINDOW_HOURS of posting
 *   DELETE – any time (a top-level comment takes its replies with it)
 */

const editSchema = z.object({
	token: z.string().min(10).max(100),
	body: z
		.string()
		.transform(cleanText)
		.pipe(
			z
				.string()
				.min(2, "Please write a comment")
				.max(LIMITS.commentBody, "Comment is too long"),
		),
});

const deleteSchema = z.object({ token: z.string().min(10).max(100) });

type Params = { params: Promise<{ postId: string; commentId: string }> };

async function findOwned(postId: string, commentId: string, token: string) {
	const comment = await prisma.postComment.findFirst({
		where: { id: commentId, postId, deletedAt: null, isAuthor: false },
	});
	if (!comment || !tokenMatches(token, comment.editTokenHash)) return null;
	return comment;
}

const notAllowed = () =>
	NextResponse.json(
		{ error: "You can only change comments posted from this device." },
		{ status: 403 },
	);

export async function PATCH(request: Request, { params }: Params) {
	try {
		const { postId, commentId } = await params;
		const parsed = editSchema.safeParse(await request.json().catch(() => null));
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.errors[0].message },
				{ status: 400 },
			);
		}

		const comment = await findOwned(postId, commentId, parsed.data.token);
		if (!comment) return notAllowed();
		if (!withinEditWindow(comment.createdAt)) {
			return NextResponse.json(
				{
					error: `Comments can be edited for ${EDIT_WINDOW_HOURS} hours after posting. You can still delete it.`,
				},
				{ status: 403 },
			);
		}

		const spam = detectSpam(comment.name, parsed.data.body);
		const updated = await prisma.postComment.update({
			where: { id: commentId },
			data: {
				body: parsed.data.body,
				editedAt: new Date(),
				status: spam.flagged ? "HIDDEN" : comment.status,
				...(spam.flagged
					? { flagged: true, flagReason: `Edited: ${spam.reason}` }
					: {}),
			},
		});

		await revalidatePostPages(postId);

		if (updated.status !== "VISIBLE") {
			return NextResponse.json({
				ok: true,
				status: "held",
				message:
					"Your changes were saved and will appear once they've been checked.",
			});
		}
		return NextResponse.json({
			ok: true,
			status: "published",
			comment: toPublicComment(updated),
		});
	} catch (error) {
		console.error("Failed to edit comment:", error);
		return NextResponse.json(
			{ error: "Something went wrong. Please try again." },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request, { params }: Params) {
	try {
		const { postId, commentId } = await params;
		const parsed = deleteSchema.safeParse(
			await request.json().catch(() => null),
		);
		if (!parsed.success) return notAllowed();

		const comment = await findOwned(postId, commentId, parsed.data.token);
		if (!comment) return notAllowed();

		const now = new Date();
		await prisma.postComment.updateMany({
			where: {
				OR: [{ id: commentId }, { parentId: commentId }],
				deletedAt: null,
			},
			data: { deletedAt: now },
		});
		await revalidatePostPages(postId);

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Failed to delete comment:", error);
		return NextResponse.json(
			{ error: "Something went wrong. Please try again." },
			{ status: 500 },
		);
	}
}

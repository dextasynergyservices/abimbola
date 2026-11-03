import { NextResponse } from "next/server";
import { z } from "zod";
import { tokenMatches, withinEditWindow } from "@/lib/engagement/ownership";
import {
	recalculateBookRating,
	revalidateBookPages,
	toPublicReview,
} from "@/lib/engagement/reviews";
import { cleanText, detectSpam } from "@/lib/engagement/spam";
import { EDIT_WINDOW_HOURS, LIMITS } from "@/lib/engagement/types";
import { prisma } from "@/lib/prisma";

/**
 * Guest self-service for a review, authorised by the private edit key the
 * author's browser received when posting (see lib/engagement/ownership).
 *   PATCH  – edit within EDIT_WINDOW_HOURS of posting
 *   DELETE – any time
 */

const editSchema = z.object({
	token: z.string().min(10).max(100),
	rating: z.coerce
		.number({ invalid_type_error: "Please choose a star rating" })
		.int()
		.min(1, "Please choose a star rating")
		.max(5, "Please choose a star rating"),
	title: z
		.string()
		.optional()
		.nullable()
		.transform((v) => (v ? cleanText(v) : null))
		.pipe(z.string().max(LIMITS.reviewTitle, "Title is too long").nullable()),
	body: z
		.string()
		.transform(cleanText)
		.pipe(
			z
				.string()
				.min(
					LIMITS.minBody,
					`Please write at least ${LIMITS.minBody} characters`,
				)
				.max(LIMITS.reviewBody, "Review is too long"),
		),
});

const deleteSchema = z.object({ token: z.string().min(10).max(100) });

type Params = { params: Promise<{ bookId: string; reviewId: string }> };

async function findOwned(bookId: string, reviewId: string, token: string) {
	const review = await prisma.bookReview.findFirst({
		where: { id: reviewId, bookId, deletedAt: null },
	});
	if (!review || !tokenMatches(token, review.editTokenHash)) return null;
	return review;
}

const notAllowed = () =>
	NextResponse.json(
		{ error: "You can only change reviews posted from this device." },
		{ status: 403 },
	);

export async function PATCH(request: Request, { params }: Params) {
	try {
		const { bookId, reviewId } = await params;
		const parsed = editSchema.safeParse(await request.json().catch(() => null));
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.errors[0].message },
				{ status: 400 },
			);
		}
		const data = parsed.data;

		const review = await findOwned(bookId, reviewId, data.token);
		if (!review) return notAllowed();
		if (!withinEditWindow(review.createdAt)) {
			return NextResponse.json(
				{
					error: `Reviews can be edited for ${EDIT_WINDOW_HOURS} hours after posting. You can still delete it and write a new one.`,
				},
				{ status: 403 },
			);
		}

		// Edits go through the same content filter. An edit can't un-hide a
		// review the admin unlisted.
		const spam = detectSpam(review.name, data.title, data.body);
		const status = spam.flagged ? "HIDDEN" : review.status;

		const updated = await prisma.bookReview.update({
			where: { id: reviewId },
			data: {
				rating: data.rating,
				title: data.title || null,
				body: data.body,
				editedAt: new Date(),
				status,
				...(spam.flagged
					? { flagged: true, flagReason: `Edited: ${spam.reason}` }
					: {}),
			},
		});

		await recalculateBookRating(bookId);
		await revalidateBookPages(bookId);

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
			review: toPublicReview(updated),
		});
	} catch (error) {
		console.error("Failed to edit review:", error);
		return NextResponse.json(
			{ error: "Something went wrong. Please try again." },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request, { params }: Params) {
	try {
		const { bookId, reviewId } = await params;
		const parsed = deleteSchema.safeParse(
			await request.json().catch(() => null),
		);
		if (!parsed.success) return notAllowed();

		const review = await findOwned(bookId, reviewId, parsed.data.token);
		if (!review) return notAllowed();

		await prisma.bookReview.update({
			where: { id: reviewId },
			data: { deletedAt: new Date() },
		});
		await recalculateBookRating(bookId);
		await revalidateBookPages(bookId);

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Failed to delete review:", error);
		return NextResponse.json(
			{ error: "Something went wrong. Please try again." },
			{ status: 500 },
		);
	}
}

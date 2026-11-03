import { after, NextResponse } from "next/server";
import { z } from "zod";
import { guardSubmission } from "@/lib/engagement/guard";
import { notifyNewSubmission } from "@/lib/engagement/notify";
import { createEditToken } from "@/lib/engagement/ownership";
import {
	getPublicReviews,
	recalculateBookRating,
	revalidateBookPages,
	toPublicReview,
} from "@/lib/engagement/reviews";
import { cleanText, detectSpam } from "@/lib/engagement/spam";
import { LIMITS } from "@/lib/engagement/types";
import { prisma } from "@/lib/prisma";

const reviewSchema = z.object({
	name: z
		.string()
		.transform(cleanText)
		.pipe(
			z
				.string()
				.min(2, "Please enter your name")
				.max(LIMITS.name, "Name is too long"),
		),
	email: z.preprocess(
		(v) => (typeof v === "string" && v.trim() === "" ? null : v),
		z
			.string()
			.trim()
			.toLowerCase()
			.email("Please enter a valid email address")
			.max(200)
			.nullable()
			.optional(),
	),
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
	website: z.string().optional(), // honeypot
	startedAt: z.number().optional(),
	recaptchaToken: z.string().optional().nullable(),
	recaptchaError: z.string().max(200).optional().nullable(),
});

const SORTS = ["newest", "highest", "lowest"] as const;

async function findPublishedBook(bookId: string) {
	return prisma.book.findFirst({
		where: { id: bookId, status: "PUBLISHED", deletedAt: null },
		select: { id: true, title: true },
	});
}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ bookId: string }> },
) {
	const { bookId } = await params;
	const url = new URL(request.url);
	const sortParam = url.searchParams.get("sort");
	const sort = SORTS.includes(sortParam as (typeof SORTS)[number])
		? (sortParam as (typeof SORTS)[number])
		: "newest";
	const cursor = url.searchParams.get("cursor");

	const page = await getPublicReviews(bookId, { sort, cursor });
	return NextResponse.json(page, {
		headers: {
			"Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
		},
	});
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ bookId: string }> },
) {
	try {
		const { bookId } = await params;
		const json = await request.json().catch(() => null);
		if (!json) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		const parsed = reviewSchema.safeParse(json);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.errors[0].message },
				{ status: 400 },
			);
		}
		const data = parsed.data;

		const guard = await guardSubmission(request, {
			honeypot: data.website,
			startedAt: data.startedAt,
			recaptchaToken: data.recaptchaToken,
			recaptchaError: data.recaptchaError,
			action: "submit_review",
		});
		if (guard.ok === false) return guard.response;

		const book = await findPublishedBook(bookId);
		if (!book) {
			return NextResponse.json({ error: "Book not found" }, { status: 404 });
		}

		// One review per email per book (only enforceable when an email is given).
		if (data.email) {
			const existing = await prisma.bookReview.findFirst({
				where: { bookId, email: data.email, deletedAt: null },
				select: { id: true },
			});
			if (existing) {
				return NextResponse.json(
					{ error: "You've already reviewed this book. Thank you!" },
					{ status: 409 },
				);
			}
		}

		// Failed verification is held for moderation rather than rejected, so
		// real readers behind ad-blockers aren't turned away.
		const spam = guard.captchaFlag
			? { flagged: true, reason: guard.captchaFlag }
			: detectSpam(data.name, data.title, data.body);

		const edit = createEditToken();
		const review = await prisma.bookReview.create({
			data: {
				editTokenHash: edit.hash,
				bookId,
				name: data.name,
				email: data.email ?? null,
				rating: data.rating,
				title: data.title || null,
				body: data.body,
				status: spam.flagged ? "HIDDEN" : "VISIBLE",
				flagged: spam.flagged,
				flagReason: spam.reason,
				ipHash: guard.ipHash,
				userAgent: guard.userAgent,
			},
		});

		if (!spam.flagged) {
			await recalculateBookRating(bookId);
			await revalidateBookPages(bookId);
		}

		after(() =>
			notifyNewSubmission({
				kind: "review",
				itemTitle: book.title,
				name: review.name,
				body: review.body,
				rating: review.rating,
				flagged: spam.flagged,
				flagReason: spam.reason,
			}),
		);

		if (spam.flagged) {
			return NextResponse.json(
				{
					ok: true,
					status: "held",
					message:
						"Thanks! Your review has been received and will appear once it's been checked.",
				},
				{ status: 202 },
			);
		}

		return NextResponse.json(
			{
				ok: true,
				status: "published",
				review: toPublicReview(review),
				editToken: edit.token,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Failed to submit review:", error);
		return NextResponse.json(
			{ error: "Something went wrong. Please try again." },
			{ status: 500 },
		);
	}
}

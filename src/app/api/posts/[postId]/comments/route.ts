import { after, NextResponse } from "next/server";
import { z } from "zod";
import {
	getPublicComments,
	revalidatePostPages,
	toPublicComment,
} from "@/lib/engagement/comments";
import { guardSubmission } from "@/lib/engagement/guard";
import { notifyNewSubmission } from "@/lib/engagement/notify";
import { createEditToken } from "@/lib/engagement/ownership";
import { cleanText, detectSpam } from "@/lib/engagement/spam";
import { LIMITS } from "@/lib/engagement/types";
import { prisma } from "@/lib/prisma";

const commentSchema = z.object({
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
	body: z
		.string()
		.transform(cleanText)
		.pipe(
			z
				.string()
				.min(2, "Please write a comment")
				.max(LIMITS.commentBody, "Comment is too long"),
		),
	parentId: z.string().max(40).optional().nullable(),
	website: z.string().optional(), // honeypot
	startedAt: z.number().optional(),
	recaptchaToken: z.string().optional().nullable(),
	recaptchaError: z.string().max(200).optional().nullable(),
});

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ postId: string }> },
) {
	const { postId } = await params;
	const cursor = new URL(request.url).searchParams.get("cursor");
	const page = await getPublicComments(postId, { cursor });
	return NextResponse.json(page, {
		headers: {
			"Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
		},
	});
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ postId: string }> },
) {
	try {
		const { postId } = await params;
		const json = await request.json().catch(() => null);
		if (!json) {
			return NextResponse.json({ error: "Invalid request" }, { status: 400 });
		}

		const parsed = commentSchema.safeParse(json);
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
			action: "submit_comment",
		});
		if (guard.ok === false) return guard.response;

		const post = await prisma.post.findFirst({
			where: { id: postId, status: "PUBLISHED", deletedAt: null },
			select: { id: true, title: true },
		});
		if (!post) {
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}

		// Replies attach to a visible top-level comment on the same post.
		// Replying to a reply re-parents to its top-level comment (one level deep).
		let parentId: string | null = null;
		if (data.parentId) {
			const parent = await prisma.postComment.findFirst({
				where: {
					id: data.parentId,
					postId,
					status: "VISIBLE",
					deletedAt: null,
				},
				select: { id: true, parentId: true },
			});
			if (!parent) {
				return NextResponse.json(
					{ error: "The comment you're replying to is no longer available." },
					{ status: 404 },
				);
			}
			parentId = parent.parentId ?? parent.id;
		}

		// Failed verification is held for moderation rather than rejected.
		const spam = guard.captchaFlag
			? { flagged: true, reason: guard.captchaFlag }
			: detectSpam(data.name, data.body);

		const edit = createEditToken();
		const comment = await prisma.postComment.create({
			data: {
				editTokenHash: edit.hash,
				postId,
				parentId,
				name: data.name,
				email: data.email ?? null,
				body: data.body,
				status: spam.flagged ? "HIDDEN" : "VISIBLE",
				flagged: spam.flagged,
				flagReason: spam.reason,
				ipHash: guard.ipHash,
				userAgent: guard.userAgent,
			},
		});

		if (!spam.flagged) {
			await revalidatePostPages(postId);
		}

		after(() =>
			notifyNewSubmission({
				kind: "comment",
				itemTitle: post.title,
				name: comment.name,
				body: comment.body,
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
						"Thanks! Your comment has been received and will appear once it's been checked.",
				},
				{ status: 202 },
			);
		}

		return NextResponse.json(
			{
				ok: true,
				status: "published",
				comment: toPublicComment(comment),
				editToken: edit.token,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Failed to submit comment:", error);
		return NextResponse.json(
			{ error: "Something went wrong. Please try again." },
			{ status: 500 },
		);
	}
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRecaptcha } from "./recaptcha";
import {
	getClientIp,
	hashIp,
	isHoneypotTripped,
	isTooFast,
	RATE_LIMIT,
} from "./spam";

/**
 * Runs every anti-abuse layer for a public submission, cheapest first:
 *   1. Honeypot           – silent fake success (don't teach bots)
 *   2. Time-to-submit     – silent fake success
 *   3. Rate limit per IP  – 429
 *   4. reCAPTCHA v3       – 400
 *
 * Returns either a Response to send immediately, or context for saving.
 */
export async function guardSubmission(
	request: Request,
	input: {
		honeypot?: unknown;
		startedAt?: unknown;
		recaptchaToken?: string | null;
		/** Client-side reason when no token could be produced. */
		recaptchaError?: string | null;
		action: "submit_review" | "submit_comment";
	},
): Promise<
	| { ok: false; response: Response }
	| {
			ok: true;
			ipHash: string;
			userAgent: string | null;
			/** Set when reCAPTCHA failed: save the submission as flagged, not public. */
			captchaFlag: string | null;
	  }
> {
	if (isHoneypotTripped(input.honeypot) || isTooFast(input.startedAt)) {
		return {
			ok: false,
			response: NextResponse.json(
				{
					ok: true,
					status: "held",
					message: "Thanks! Your submission was received.",
				},
				{ status: 202 },
			),
		};
	}

	const ip = getClientIp(request);
	const ipHash = hashIp(ip);
	const since = new Date(Date.now() - RATE_LIMIT.windowMs);

	const [recentReviews, recentComments] = await Promise.all([
		prisma.bookReview.count({ where: { ipHash, createdAt: { gte: since } } }),
		prisma.postComment.count({
			where: { ipHash, createdAt: { gte: since }, isAuthor: false },
		}),
	]);

	if (recentReviews + recentComments >= RATE_LIMIT.max) {
		return {
			ok: false,
			response: NextResponse.json(
				{
					error:
						"You're posting a little too quickly. Please wait a few minutes and try again.",
				},
				{ status: 429, headers: { "Retry-After": "600" } },
			),
		};
	}

	const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

	// reCAPTCHA failure (blocked script, low score, misconfigured key) holds
	// the submission for moderation instead of rejecting a possibly-real reader.
	const captcha = await verifyRecaptcha(input.recaptchaToken, input.action, ip);
	let captchaFlag: string | null = null;
	if (captcha.ok === false) {
		const browser = input.recaptchaError
			? ` — browser: ${input.recaptchaError.slice(0, 120)}`
			: "";
		captchaFlag = `reCAPTCHA: ${captcha.reason}${browser}`.slice(0, 250);
		console.warn(`[guard] ${input.action} held — ${captchaFlag}`);
	}

	return { ok: true, ipHash, userAgent, captchaFlag };
}

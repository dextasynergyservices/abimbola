/**
 * Google reCAPTCHA v3 server-side verification.
 * Server-only — requires RECAPTCHA_SECRET_KEY.
 *
 * v3 is invisible: every request gets a score from 0.0 (bot) to 1.0 (human).
 */

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export const RECAPTCHA_MIN_SCORE = Number(
	process.env.RECAPTCHA_MIN_SCORE ?? "0.5",
);

export type RecaptchaResult =
	| { ok: true; score: number | null; skipped?: boolean }
	| { ok: false; reason: string; score?: number };

export function isRecaptchaConfigured(): boolean {
	return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}

export async function verifyRecaptcha(
	token: string | null | undefined,
	expectedAction: string,
	remoteIp?: string,
): Promise<RecaptchaResult> {
	const secret = process.env.RECAPTCHA_SECRET_KEY;

	// Not configured: don't break the site. The honeypot, rate limit and
	// content filter still apply. A warning makes the gap visible in logs.
	if (!secret) {
		if (process.env.NODE_ENV === "production") {
			console.warn(
				"[recaptcha] RECAPTCHA_SECRET_KEY is not set — skipping verification.",
			);
		}
		return { ok: true, score: null, skipped: true };
	}

	if (!token) {
		return { ok: false, reason: "Missing verification token" };
	}

	try {
		const params = new URLSearchParams({ secret, response: token });
		if (remoteIp && remoteIp !== "unknown") params.set("remoteip", remoteIp);

		const res = await fetch(VERIFY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: params,
			cache: "no-store",
		});

		const data = (await res.json()) as {
			success: boolean;
			score?: number;
			action?: string;
			"error-codes"?: string[];
		};

		if (!data.success) {
			return {
				ok: false,
				reason: `Verification failed (${(data["error-codes"] || []).join(", ") || "unknown"})`,
			};
		}

		if (data.action && data.action !== expectedAction) {
			return { ok: false, reason: `Action mismatch (${data.action})` };
		}

		const score = typeof data.score === "number" ? data.score : 0;
		if (score < RECAPTCHA_MIN_SCORE) {
			return { ok: false, reason: `Low score (${score})`, score };
		}

		return { ok: true, score };
	} catch (error) {
		// Google unreachable: fail open rather than block real readers;
		// the other layers still protect the form.
		console.error("[recaptcha] verification request failed:", error);
		return { ok: true, score: null, skipped: true };
	}
}

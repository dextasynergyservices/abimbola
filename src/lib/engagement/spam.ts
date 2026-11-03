import { createHash } from "node:crypto";

/**
 * Shared anti-spam helpers for public reviews and comments.
 * Server-only — never import from a client component.
 */

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();
	return (
		request.headers.get("x-real-ip") ||
		request.headers.get("cf-connecting-ip") ||
		"unknown"
	);
}

/**
 * One-way, salted hash of the IP. Enough to rate-limit and spot abusers
 * without storing raw IP addresses.
 */
export function hashIp(ip: string): string {
	const salt = process.env.AUTH_SECRET || "engagement-salt";
	return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

/**
 * Normalise user-submitted text to plain text. Output is always rendered as
 * text by React (never as HTML), so this is about tidiness, not XSS.
 */
export function cleanText(input: string): string {
	const withoutTags = input.replace(/<[^>]*>/g, ""); // strip any tags
	// Drop control characters, keeping tab (9), newline (10) and carriage return (13).
	let printable = "";
	for (const ch of withoutTags) {
		const code = ch.charCodeAt(0);
		const isControl =
			(code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127;
		if (!isControl) printable += ch;
	}
	return printable
		.replace(/\r\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n") // collapse big gaps
		.trim();
}

const BANNED_PATTERNS: RegExp[] = [
	/\bviagra\b/i,
	/\bcialis\b/i,
	/\bcasino\b/i,
	/\bcrypto ?(?:signal|invest|profit)/i,
	/\bforex\b/i,
	/\bbitcoin (?:double|invest)/i,
	/\bloan offer\b/i,
	/\bseo services?\b/i,
	/\bbacklinks?\b/i,
	/\bescort/i,
	/\bporn/i,
	/\bxxx\b/i,
	/\bclick here\b/i,
	/\bwhats ?app me\b/i,
	/\bonlyfans\b/i,
];

const URL_PATTERN = /(https?:\/\/|www\.)\S+/gi;

export interface SpamVerdict {
	flagged: boolean;
	reason: string | null;
}

/**
 * Heuristic content check. Flagged submissions are saved as HIDDEN and
 * surface in the admin under "Flagged" so nothing legitimate is lost.
 */
export function detectSpam(
	...fields: Array<string | null | undefined>
): SpamVerdict {
	const text = fields.filter(Boolean).join("\n");

	const links = text.match(URL_PATTERN)?.length ?? 0;
	if (links > 1) {
		return { flagged: true, reason: `Contains ${links} links` };
	}

	for (const pattern of BANNED_PATTERNS) {
		if (pattern.test(text)) {
			return { flagged: true, reason: "Contains blocked keywords" };
		}
	}

	if (/(.)\1{9,}/.test(text)) {
		return { flagged: true, reason: "Repeated characters" };
	}

	const letters = text.replace(/[^a-zA-Z]/g, "");
	if (letters.length > 30 && letters === letters.toUpperCase()) {
		return { flagged: true, reason: "All caps" };
	}

	return { flagged: false, reason: null };
}

/** Honeypot: real visitors never see or fill this field. */
export function isHoneypotTripped(value: unknown): boolean {
	return typeof value === "string" && value.trim().length > 0;
}

/**
 * Submissions faster than this after the form rendered are almost always bots.
 * `startedAt` is a client timestamp (ms) captured when the form mounts.
 */
export function isTooFast(startedAt: unknown, minMs = 3000): boolean {
	if (typeof startedAt !== "number" || !Number.isFinite(startedAt))
		return false;
	return Date.now() - startedAt < minMs;
}

export const RATE_LIMIT = {
	windowMs: 10 * 60 * 1000, // 10 minutes
	max: 3,
};

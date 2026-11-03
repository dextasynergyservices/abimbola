import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { EDIT_WINDOW_HOURS } from "./types";

/**
 * Guest ownership of reviews/comments (server-only).
 *
 * On create, the author's browser receives a random edit key; only its
 * SHA-256 hash is stored. Presenting the key later proves authorship
 * without accounts. Losing the key (cleared storage, new device) simply
 * means the author has to ask the site owner instead.
 */

export const EDIT_WINDOW_MS = EDIT_WINDOW_HOURS * 3600_000;

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

export function createEditToken(): { token: string; hash: string } {
	const token = randomBytes(24).toString("base64url");
	return { token, hash: hashToken(token) };
}

export function tokenMatches(
	token: string | null | undefined,
	storedHash: string | null | undefined,
): boolean {
	if (!token || !storedHash || token.length > 100) return false;
	const a = Buffer.from(hashToken(token), "hex");
	const b = Buffer.from(storedHash, "hex");
	return a.length === b.length && timingSafeEqual(a, b);
}

export function withinEditWindow(createdAt: Date): boolean {
	return Date.now() - createdAt.getTime() <= EDIT_WINDOW_MS;
}

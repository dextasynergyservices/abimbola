import { createHash } from "node:crypto";
import { type NextRequest, userAgent } from "next/server";
import { z } from "zod";
import { getClientIp } from "@/lib/engagement/spam";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/collect — first-party analytics ingest.
 *
 * The browser tracker batches a whole visit and sends it once (on tab hide /
 * leave), so this runs ~once per visit, as a single INSERT. Page views
 * themselves are served from cache and never touch the database.
 *
 * Only records on the production deployment, so local dev and preview
 * deploys don't pollute data (set ANALYTICS_RECORD_ALL=true to override).
 */

const itemSchema = z.object({
	t: z.enum(["pageview", "event", "engagement"]),
	p: z.string().max(500),
	at: z.number(),
	r: z.string().max(500).optional(),
	n: z.string().max(80).optional(),
	d: z.number().min(0).max(3600).optional(),
	props: z
		.record(z.union([z.string().max(200), z.number(), z.boolean()]))
		.optional(),
});

const payloadSchema = z.object({
	sid: z.string().min(8).max(64),
	now: z.number(),
	items: z.array(itemSchema).min(1).max(60),
});

const noContent = () => new Response(null, { status: 204 });

function shouldRecord() {
	return (
		process.env.VERCEL_ENV === "production" ||
		process.env.ANALYTICS_RECORD_ALL === "true"
	);
}

function visitorHash(ip: string, ua: string) {
	const month = new Date().toISOString().slice(0, 7); // rotates monthly
	return createHash("sha256")
		.update(`${process.env.AUTH_SECRET || "analytics"}:${month}:${ip}:${ua}`)
		.digest("hex")
		.slice(0, 32);
}

function referrerLabel(raw?: string): string | null {
	if (!raw) return null;
	const value = raw.trim();
	if (!value) return null;
	try {
		const host = new URL(value).hostname.replace(/^www\./, "");
		return host || null;
	} catch {
		// utm_source or a bare domain
		return value
			.replace(/^www\./, "")
			.slice(0, 100)
			.toLowerCase();
	}
}

function cleanPath(p: string) {
	try {
		const u = new URL(p, "https://x.local");
		return (u.pathname.replace(/\/+$/, "") || "/").slice(0, 300);
	} catch {
		return "/";
	}
}

export async function POST(request: NextRequest) {
	try {
		if (!shouldRecord()) return noContent();

		// Same-site only: ignore beacons posted from other origins.
		const origin = request.headers.get("origin");
		if (origin) {
			try {
				if (new URL(origin).host !== request.headers.get("host"))
					return noContent();
			} catch {
				return noContent();
			}
		}

		const ua = userAgent(request);
		if (ua.isBot) return noContent();

		const text = await request.text();
		if (!text || text.length > 50_000) return noContent();
		const parsed = payloadSchema.safeParse(JSON.parse(text));
		if (!parsed.success) return noContent();
		const { sid, now: clientNow, items } = parsed.data;

		const ip = getClientIp(request);
		const uaString = request.headers.get("user-agent") || "";
		const visitorId = visitorHash(ip, uaString);
		const country = request.headers.get("x-vercel-ip-country") || null;
		const device =
			ua.device.type === "mobile" || ua.device.type === "tablet"
				? ua.device.type
				: "desktop";
		const browser = ua.browser.name || null;
		const os = ua.os.name || null;

		// Correct for client clock skew; clamp to the last 24h.
		const serverNow = Date.now();
		const skew = serverNow - clientNow;
		const minTime = serverNow - 86_400_000;

		const rows = items
			.filter((i) => !cleanPath(i.p).startsWith("/admin"))
			.map((i) => ({
				createdAt: new Date(
					Math.min(serverNow, Math.max(minTime, i.at + skew)),
				),
				visitorId,
				sessionId: sid,
				type: i.t,
				name: i.t === "event" ? (i.n ?? "event") : null,
				path: cleanPath(i.p),
				referrer: i.t === "pageview" ? referrerLabel(i.r) : null,
				country,
				device,
				browser,
				os,
				duration: typeof i.d === "number" ? Math.round(i.d) : null,
				props: i.props ?? undefined,
			}));

		if (rows.length > 0) {
			await prisma.analyticsEvent.createMany({ data: rows });
		}
		return noContent();
	} catch (error) {
		console.error("[collect] failed:", error);
		return noContent(); // never surface errors to visitors
	}
}

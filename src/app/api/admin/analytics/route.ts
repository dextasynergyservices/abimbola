import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
	isValidTimeZone,
	RANGE_PRESETS,
	type RangePreset,
	resolveRange,
} from "@/lib/analytics/range";
import { buildReport } from "@/lib/analytics/report";

/**
 * GET /api/admin/analytics?range=7d&tz=Africa/Lagos[&start=YYYY-MM-DD&end=YYYY-MM-DD][&fresh=1]
 *
 * Aggregates first-party events from the database, cached server-side so
 * opening the dashboard repeatedly doesn't re-query:
 *   • ranges that include "now": 5 minutes
 *   • ranges fully in the past: 12 hours (the numbers can't change)
 * `fresh=1` (the Refresh button) bypasses the cache.
 */
export async function GET(request: Request) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const url = new URL(request.url);
	const presetParam = url.searchParams.get("range") as RangePreset | null;
	const preset: RangePreset =
		presetParam && RANGE_PRESETS.includes(presetParam) ? presetParam : "7d";
	const tzParam = url.searchParams.get("tz") || "UTC";
	const tz = isValidTimeZone(tzParam) ? tzParam : "UTC";
	const fresh = url.searchParams.get("fresh") === "1";

	const range = resolveRange(preset, tz, {
		start: url.searchParams.get("start"),
		end: url.searchParams.get("end"),
	});

	try {
		const key = `${tz}:${range.startAt}:${range.endAt}`;
		const report = fresh
			? await buildReport(range)
			: await unstable_cache(
					() => buildReport(range),
					["analytics-report", key],
					{
						revalidate: range.isClosed ? 12 * 3600 : 300,
						tags: ["analytics"],
					},
				)();

		return NextResponse.json(report, {
			headers: { "Cache-Control": "private, no-store" },
		});
	} catch (error) {
		console.error("[analytics] report failed:", error);
		return NextResponse.json(
			{ error: "Couldn't load analytics. Please try again." },
			{ status: 500 },
		);
	}
}

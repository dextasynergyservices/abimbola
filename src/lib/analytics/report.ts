import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bucketsFor, type ResolvedRange, type TimeUnit } from "./range";
import type { AnalyticsReport, Kpis, MetricRow, SeriesPoint } from "./types";

/**
 * Builds the analytics report from first-party events (server-only).
 * Only runs when an admin opens the dashboard, and results are cached by the
 * API route, so this never adds load during normal site traffic.
 */

const RETENTION_MONTHS = 25;

const BUCKET_FORMAT: Record<TimeUnit, string> = {
	hour: "YYYY-MM-DD HH24",
	day: "YYYY-MM-DD",
	month: "YYYY-MM",
};

const n = (v: unknown) => Number(v ?? 0);

async function kpis(start: Date, end: Date): Promise<Kpis> {
	const [row] = await prisma.$queryRaw<
		Array<{
			pageviews: bigint;
			visitors: bigint;
			visits: bigint;
			bounces: bigint;
			totaltime: bigint | number | null;
		}>
	>`
		WITH ev AS (
			SELECT "type", "visitorId", "sessionId", "duration"
			FROM "AnalyticsEvent"
			WHERE "createdAt" BETWEEN ${start} AND ${end}
		),
		sess AS (
			SELECT "sessionId", count(*) FILTER (WHERE "type" = 'pageview') AS pv
			FROM ev GROUP BY "sessionId"
		)
		SELECT
			(SELECT count(*) FROM ev WHERE "type" = 'pageview') AS pageviews,
			(SELECT count(DISTINCT "visitorId") FROM ev WHERE "type" = 'pageview') AS visitors,
			(SELECT count(*) FROM sess WHERE pv > 0) AS visits,
			(SELECT count(*) FROM sess WHERE pv = 1) AS bounces,
			(SELECT coalesce(sum("duration"), 0) FROM ev) AS totaltime
	`;
	const pageviews = n(row?.pageviews);
	const visitors = n(row?.visitors);
	const visits = n(row?.visits);
	const bounces = n(row?.bounces);
	const totaltime = n(row?.totaltime);
	return {
		visitors,
		visits,
		pageviews,
		bounceRate: visits > 0 ? Math.min(1, bounces / visits) : 0,
		avgVisitSeconds: visits > 0 ? totaltime / visits : 0,
		viewsPerVisit: visits > 0 ? pageviews / visits : 0,
	};
}

async function series(
	range: ResolvedRange,
	unit: TimeUnit,
	start: Date,
	end: Date,
) {
	const rows = await prisma.$queryRaw<
		Array<{ k: string; pageviews: bigint; visitors: bigint }>
	>`
		SELECT
			to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${range.tz}, ${BUCKET_FORMAT[unit]}) AS k,
			count(*) AS pageviews,
			count(DISTINCT "visitorId") AS visitors
		FROM "AnalyticsEvent"
		WHERE "type" = 'pageview' AND "createdAt" BETWEEN ${start} AND ${end}
		GROUP BY 1
	`;
	const map = new Map(rows.map((r) => [r.k, r]));
	return bucketsFor(range, unit).map(
		(key): SeriesPoint => ({
			key,
			pageviews: n(map.get(key)?.pageviews),
			visitors: n(map.get(key)?.visitors),
		}),
	);
}

async function histogram(
	range: ResolvedRange,
	part: "hour" | "dow",
	bins: number,
	start: Date,
	end: Date,
) {
	const field = Prisma.raw(part === "hour" ? "hour" : "dow");
	const rows = await prisma.$queryRaw<
		Array<{ b: number; pageviews: bigint; visitors: bigint }>
	>`
		SELECT
			extract(${field} FROM ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${range.tz})::int AS b,
			count(*) AS pageviews,
			count(DISTINCT "visitorId") AS visitors
		FROM "AnalyticsEvent"
		WHERE "type" = 'pageview' AND "createdAt" BETWEEN ${start} AND ${end}
		GROUP BY 1
	`;
	const pageviews = new Array(bins).fill(0);
	const visitors = new Array(bins).fill(0);
	for (const r of rows) {
		const i = n(r.b);
		if (i >= 0 && i < bins) {
			pageviews[i] = n(r.pageviews);
			visitors[i] = n(r.visitors);
		}
	}
	return { pageviews, visitors };
}

/** Whitelisted breakdown columns (identifiers can't be query parameters). */
const COLUMNS = {
	path: { col: "path", measure: "views" },
	referrer: { col: "referrer", measure: "visitors" },
	country: { col: "country", measure: "visitors" },
	device: { col: "device", measure: "visitors" },
	browser: { col: "browser", measure: "visitors" },
	os: { col: "os", measure: "visitors" },
} as const;

async function breakdown(
	key: keyof typeof COLUMNS,
	start: Date,
	end: Date,
	limit = 10,
): Promise<MetricRow[]> {
	const { col, measure } = COLUMNS[key];
	const column = Prisma.raw(`"${col}"`);
	const agg = Prisma.raw(
		measure === "views" ? "count(*)" : 'count(DISTINCT "visitorId")',
	);
	const rows = await prisma.$queryRaw<Array<{ label: string; value: bigint }>>`
		SELECT ${column} AS label, ${agg} AS value
		FROM "AnalyticsEvent"
		WHERE "type" = 'pageview'
			AND "createdAt" BETWEEN ${start} AND ${end}
			AND ${column} IS NOT NULL
		GROUP BY 1
		ORDER BY 2 DESC
		LIMIT ${limit}
	`;
	return rows.map((r) => ({ label: r.label, value: n(r.value) }));
}

async function events(start: Date, end: Date): Promise<MetricRow[]> {
	const rows = await prisma.$queryRaw<Array<{ label: string; value: bigint }>>`
		SELECT "name" AS label, count(*) AS value
		FROM "AnalyticsEvent"
		WHERE "type" = 'event' AND "createdAt" BETWEEN ${start} AND ${end}
		GROUP BY 1 ORDER BY 2 DESC LIMIT 15
	`;
	return rows.map((r) => ({ label: r.label, value: n(r.value) }));
}

/** Visitors with activity in the last 30 minutes (data arrives per visit). */
async function recentVisitors(): Promise<number> {
	const since = new Date(Date.now() - 30 * 60_000);
	const [row] = await prisma.$queryRaw<Array<{ c: bigint }>>`
		SELECT count(DISTINCT "visitorId") AS c FROM "AnalyticsEvent" WHERE "createdAt" >= ${since}
	`;
	return n(row?.c);
}

let lastCleanup = 0;
async function cleanupOldEvents() {
	if (Date.now() - lastCleanup < 24 * 3600_000) return;
	lastCleanup = Date.now();
	const cutoff = new Date();
	cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
	await prisma.analyticsEvent
		.deleteMany({ where: { createdAt: { lt: cutoff } } })
		.catch((e) => console.error("[analytics] cleanup failed:", e));
}

const DAY = 86_400_000;

export async function buildReport(
	range: ResolvedRange,
): Promise<AnalyticsReport> {
	const start = new Date(range.startAt);
	const end = new Date(range.endAt);
	const prevStart = new Date(range.prevStartAt);
	const prevEnd = new Date(range.prevEndAt);
	const span = range.endAt - range.startAt;

	const [
		k,
		prev,
		main,
		hours,
		days,
		pages,
		referrers,
		countries,
		devices,
		browsers,
		os,
		evts,
		recent,
	] = await Promise.all([
		kpis(start, end),
		kpis(prevStart, prevEnd),
		series(range, range.unit, start, end),
		span <= 92 * DAY
			? histogram(range, "hour", 24, start, end)
			: Promise.resolve(null),
		histogram(range, "dow", 7, start, end),
		breakdown("path", start, end),
		breakdown("referrer", start, end),
		breakdown("country", start, end, 15),
		breakdown("device", start, end),
		breakdown("browser", start, end),
		breakdown("os", start, end),
		events(start, end),
		range.isClosed ? Promise.resolve(null) : recentVisitors(),
	]);

	void cleanupOldEvents();

	return {
		configured: true,
		range: {
			preset: range.preset,
			tz: range.tz,
			startAt: range.startAt,
			endAt: range.endAt,
			unit: range.unit,
			startDate: range.startDate,
			endDate: range.endDate,
		},
		kpis: k,
		previous: prev,
		series: main,
		hourOfDay: hours,
		dayOfWeek: days,
		pages,
		referrers,
		countries,
		devices,
		browsers,
		os,
		events: evts,
		activeNow: recent,
		generatedAt: Date.now(),
		dashboardUrl: null,
	};
}

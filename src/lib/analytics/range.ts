/**
 * Timezone-aware date range resolution for analytics. No dependencies —
 * uses Intl to convert between wall-clock time in a timezone and UTC.
 */

export const RANGE_PRESETS = [
	"today",
	"yesterday",
	"7d",
	"30d",
	"90d",
	"this_month",
	"last_month",
	"this_year",
	"12m",
	"custom",
] as const;

export type RangePreset = (typeof RANGE_PRESETS)[number];
export type TimeUnit = "hour" | "day" | "month";

export interface ResolvedRange {
	preset: RangePreset;
	tz: string;
	startAt: number; // UTC ms, inclusive
	endAt: number; // UTC ms, inclusive
	prevStartAt: number;
	prevEndAt: number;
	unit: TimeUnit;
	/** Local calendar dates (YYYY-MM-DD) covered, for bucket generation. */
	startDate: string;
	endDate: string;
	/** True when the range ends in the past (data won't change → cache longer). */
	isClosed: boolean;
}

const DAY = 86_400_000;
const CACHE_ROUND_MS = 5 * 60_000;

export function isValidTimeZone(tz: string): boolean {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

interface Parts {
	y: number;
	m: number;
	d: number;
	h: number;
	min: number;
	s: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string) {
	let f = formatterCache.get(tz);
	if (!f) {
		f = new Intl.DateTimeFormat("en-US", {
			timeZone: tz,
			hourCycle: "h23",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
		formatterCache.set(tz, f);
	}
	return f;
}

export function tzParts(ms: number, tz: string): Parts {
	const out: Record<string, number> = {};
	for (const p of formatter(tz).formatToParts(new Date(ms))) {
		if (p.type !== "literal") out[p.type] = Number(p.value);
	}
	return {
		y: out.year,
		m: out.month,
		d: out.day,
		h: out.hour === 24 ? 0 : out.hour,
		min: out.minute,
		s: out.second,
	};
}

function offsetMs(ms: number, tz: string): number {
	const p = tzParts(ms, tz);
	return (
		Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(ms / 1000) * 1000
	);
}

/** UTC ms for a wall-clock time in `tz`. */
export function zonedToUtc(
	y: number,
	m: number,
	d: number,
	tz: string,
	h = 0,
): number {
	const guess = Date.UTC(y, m - 1, d, h);
	const off = offsetMs(guess, tz);
	let t = guess - off;
	const off2 = offsetMs(t, tz);
	if (off2 !== off) t = guess - off2;
	return t;
}

function addDays(y: number, m: number, d: number, n: number) {
	const dt = new Date(Date.UTC(y, m - 1, d + n));
	return {
		y: dt.getUTCFullYear(),
		m: dt.getUTCMonth() + 1,
		d: dt.getUTCDate(),
	};
}

const pad = (n: number) => String(n).padStart(2, "0");
export const dateKey = (y: number, m: number, d: number) =>
	`${y}-${pad(m)}-${pad(d)}`;

function parseDateKey(s: string) {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
	if (!match) return null;
	return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/** Format a UTC instant as a bucket key in `tz` ("YYYY-MM-DD HH" / "YYYY-MM-DD" / "YYYY-MM"). */
export function bucketKey(ms: number, tz: string, unit: TimeUnit): string {
	const p = tzParts(ms, tz);
	if (unit === "month") return `${p.y}-${pad(p.m)}`;
	if (unit === "day") return dateKey(p.y, p.m, p.d);
	return `${dateKey(p.y, p.m, p.d)} ${pad(p.h)}`;
}

export function resolveRange(
	preset: RangePreset,
	tz: string,
	custom?: { start?: string | null; end?: string | null },
	now = Date.now(),
): ResolvedRange {
	const t = tzParts(now, tz);
	const today = { y: t.y, m: t.m, d: t.d };
	// Round "now" up so cache keys are stable for a few minutes.
	const roundedNow = Math.ceil(now / CACHE_ROUND_MS) * CACHE_ROUND_MS - 1;
	const midnight = (x: { y: number; m: number; d: number }) =>
		zonedToUtc(x.y, x.m, x.d, tz);

	let start: { y: number; m: number; d: number };
	let endAt = roundedNow;
	let endDay = today;

	switch (preset) {
		case "today":
			start = today;
			break;
		case "yesterday":
			start = addDays(today.y, today.m, today.d, -1);
			endDay = start;
			endAt = midnight(today) - 1;
			break;
		case "7d":
			start = addDays(today.y, today.m, today.d, -6);
			break;
		case "30d":
			start = addDays(today.y, today.m, today.d, -29);
			break;
		case "90d":
			start = addDays(today.y, today.m, today.d, -89);
			break;
		case "this_month":
			start = { y: today.y, m: today.m, d: 1 };
			break;
		case "last_month": {
			const firstThis = { y: today.y, m: today.m, d: 1 };
			start =
				today.m === 1
					? { y: today.y - 1, m: 12, d: 1 }
					: { y: today.y, m: today.m - 1, d: 1 };
			endDay = addDays(firstThis.y, firstThis.m, firstThis.d, -1);
			endAt = midnight(firstThis) - 1;
			break;
		}
		case "this_year":
			start = { y: today.y, m: 1, d: 1 };
			break;
		case "12m": {
			const m0 = today.m - 11;
			start =
				m0 > 0
					? { y: today.y, m: m0, d: 1 }
					: { y: today.y - 1, m: m0 + 12, d: 1 };
			break;
		}
		default: {
			const s = parseDateKey(custom?.start || "");
			const e = parseDateKey(custom?.end || "") || s;
			if (!s || !e) {
				return resolveRange("7d", tz, undefined, now);
			}
			let [a, b] = [s, e];
			if (dateKey(a.y, a.m, a.d) > dateKey(b.y, b.m, b.d)) [a, b] = [b, a];
			// Cap at ~2 years to keep API calls bounded.
			const maxStart = addDays(b.y, b.m, b.d, -730);
			if (dateKey(a.y, a.m, a.d) < dateKey(maxStart.y, maxStart.m, maxStart.d))
				a = maxStart;
			start = a;
			endDay = b;
			const next = addDays(b.y, b.m, b.d, 1);
			endAt = Math.min(midnight(next) - 1, roundedNow);
			if (dateKey(b.y, b.m, b.d) > dateKey(today.y, today.m, today.d))
				endDay = today;
		}
	}

	const startAt = midnight(start);
	const span = endAt - startAt + 1;
	const unit: TimeUnit =
		span <= 2 * DAY ? "hour" : span <= 92 * DAY ? "day" : "month";

	// Comparison period: the same stretch of calendar one period earlier
	// (today → same hours yesterday, this month → same days last month, …).
	const shiftMonths = (months: number) => {
		const total = start.y * 12 + (start.m - 1) - months;
		return { y: Math.floor(total / 12), m: (total % 12) + 1, d: start.d };
	};
	let prevStartDay: { y: number; m: number; d: number };
	if (preset === "this_month" || preset === "last_month") {
		prevStartDay = shiftMonths(1);
	} else if (preset === "this_year") {
		prevStartDay = { y: start.y - 1, m: 1, d: 1 };
	} else if (preset === "12m") {
		prevStartDay = shiftMonths(12);
	} else {
		const days =
			Math.round(
				(Date.UTC(endDay.y, endDay.m - 1, endDay.d) -
					Date.UTC(start.y, start.m - 1, start.d)) /
					DAY,
			) + 1;
		prevStartDay = addDays(start.y, start.m, start.d, -days);
	}
	const prevStartAt = midnight(prevStartDay);
	const prevEndAt = Math.min(prevStartAt + span - 1, startAt - 1);

	return {
		preset,
		tz,
		startAt,
		endAt,
		prevEndAt,
		prevStartAt,
		unit,
		startDate: dateKey(start.y, start.m, start.d),
		endDate: dateKey(endDay.y, endDay.m, endDay.d),
		isClosed: endAt < now,
	};
}

/** Every bucket key in the range, so gaps render as zero instead of disappearing. */
export function bucketsFor(
	range: ResolvedRange,
	unit: TimeUnit = range.unit,
): string[] {
	const keys: string[] = [];
	if (unit === "hour") {
		const seen = new Set<string>();
		for (let ms = range.startAt; ms <= range.endAt; ms += 3_600_000) {
			const k = bucketKey(ms, range.tz, "hour");
			if (!seen.has(k)) {
				seen.add(k);
				keys.push(k);
			}
		}
		return keys;
	}
	const s = parseDateKey(range.startDate);
	const e = parseDateKey(range.endDate);
	if (!s || !e) return keys;
	if (unit === "day") {
		let cur = s;
		const endKey = dateKey(e.y, e.m, e.d);
		for (let i = 0; i < 800; i++) {
			const k = dateKey(cur.y, cur.m, cur.d);
			if (k > endKey) break;
			keys.push(k);
			cur = addDays(cur.y, cur.m, cur.d, 1);
		}
		return keys;
	}
	let y = s.y;
	let m = s.m;
	for (let i = 0; i < 40; i++) {
		if (y > e.y || (y === e.y && m > e.m)) break;
		keys.push(`${y}-${pad(m)}`);
		m++;
		if (m > 12) {
			m = 1;
			y++;
		}
	}
	return keys;
}

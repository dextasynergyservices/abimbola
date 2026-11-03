/** Client-safe analytics report shape returned by /api/admin/analytics. */

export interface Kpis {
	visitors: number;
	visits: number;
	pageviews: number;
	bounceRate: number; // 0–1
	avgVisitSeconds: number;
	viewsPerVisit: number;
}

export interface MetricRow {
	label: string;
	value: number;
}

export interface SeriesPoint {
	key: string; // bucket key in the report timezone
	pageviews: number;
	visitors: number;
}

export interface AnalyticsReport {
	configured: true;
	range: {
		preset: string;
		tz: string;
		startAt: number;
		endAt: number;
		unit: "hour" | "day" | "month";
		startDate: string;
		endDate: string;
	};
	kpis: Kpis;
	previous: Kpis;
	series: SeriesPoint[];
	/** Pageviews/visitors per hour of day (0–23), or null for long ranges. */
	hourOfDay: { pageviews: number[]; visitors: number[] } | null;
	/** Index 0 = Sunday. */
	dayOfWeek: { pageviews: number[]; visitors: number[] } | null;
	pages: MetricRow[];
	referrers: MetricRow[];
	countries: MetricRow[];
	devices: MetricRow[];
	browsers: MetricRow[];
	os: MetricRow[];
	events: MetricRow[];
	activeNow: number | null;
	generatedAt: number;
	dashboardUrl: string | null;
}

export interface AnalyticsNotConfigured {
	configured: false;
}

"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BarChart3,
	CalendarDays,
	Eye,
	EyeOff,
	Loader2,
	RefreshCw,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
	BarList,
	bucketLabel,
	Donut,
	fmtDuration,
	fmtInt,
	fmtPct,
	Histogram,
	KpiCard,
	Panel,
	TrafficChart,
} from "@/components/admin/analytics/widgets";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { isSelfExcluded, setSelfExcluded } from "@/lib/analytics/track";
import type {
	AnalyticsNotConfigured,
	AnalyticsReport,
} from "@/lib/analytics/types";

const PRESETS: Array<{ value: string; label: string }> = [
	{ value: "today", label: "Today" },
	{ value: "yesterday", label: "Yesterday" },
	{ value: "7d", label: "Last 7 days" },
	{ value: "30d", label: "Last 30 days" },
	{ value: "90d", label: "Last 90 days" },
	{ value: "this_month", label: "This month" },
	{ value: "last_month", label: "Last month" },
	{ value: "this_year", label: "This year" },
	{ value: "12m", label: "Last 12 months" },
	{ value: "custom", label: "Custom range…" },
];

const HOURS = Array.from(
	{ length: 24 },
	(_, h) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`,
);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_LABELS: Record<string, string> = {
	"buy-click": "Buy button clicks",
	"book-download": "Free book downloads",
	"pre-order-click": "Pre-order clicks",
	"review-submitted": "Reviews submitted",
	"comment-posted": "Comments posted",
	"comment-reply": "Comment replies",
	"newsletter-signup": "Newsletter sign-ups",
	"contact-message": "Contact messages",
};

const regionNames =
	typeof Intl !== "undefined" && "DisplayNames" in Intl
		? new Intl.DisplayNames(["en"], { type: "region" })
		: null;

function countryName(code: string) {
	if (!code) return "Unknown";
	try {
		return regionNames?.of(code.toUpperCase()) || code;
	} catch {
		return code;
	}
}

function flag(code: string) {
	if (!/^[a-z]{2}$/i.test(code)) return "🌐";
	return String.fromCodePoint(
		...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)),
	);
}

const toKey = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fromKey = (s: string | null) => {
	if (!s) return undefined;
	const [y, m, d] = s.split("-").map(Number);
	return y && m && d ? new Date(y, m - 1, d) : undefined;
};

export default function AnalyticsPage() {
	return (
		<Suspense fallback={<Skeleton className="h-96 w-full" />}>
			<AnalyticsInner />
		</Suspense>
	);
}

function AnalyticsInner() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const preset = searchParams.get("range") || "30d";
	const start = searchParams.get("start");
	const end = searchParams.get("end");
	const [tz, setTz] = useState<string | null>(null);
	const [show, setShow] = useState<"visitors" | "pageviews" | "both">("both");
	const [calendarOpen, setCalendarOpen] = useState(false);
	const [draft, setDraft] = useState<DateRange | undefined>({
		from: fromKey(start),
		to: fromKey(end),
	});
	const [excluded, setExcluded] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const queryClient = useQueryClient();

	useEffect(() => {
		setTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
		setExcluded(isSelfExcluded());
	}, []);

	const setParams = (updates: Record<string, string | null>) => {
		const params = new URLSearchParams(searchParams.toString());
		for (const [k, v] of Object.entries(updates)) {
			if (v) params.set(k, v);
			else params.delete(k);
		}
		router.replace(`${pathname}?${params}`, { scroll: false });
	};

	const isCustom = preset === "custom" && start;
	const queryKey = [
		"analytics",
		preset,
		isCustom ? start : null,
		isCustom ? end : null,
		tz,
	];

	const fetchReport = async (fresh: boolean) => {
		const params = new URLSearchParams({ range: preset, tz: tz || "UTC" });
		if (isCustom) {
			params.set("start", start as string);
			if (end) params.set("end", end);
		}
		if (fresh) params.set("fresh", "1");
		const res = await fetch(`/api/admin/analytics?${params}`);
		const body = await res.json();
		if (!res.ok) throw new Error(body.error || "Failed to load analytics");
		return body as AnalyticsReport | AnalyticsNotConfigured;
	};

	// Fetches once per range; no polling. Server caches for 5 minutes.
	const { data, isLoading, isFetching, error } = useQuery<
		AnalyticsReport | AnalyticsNotConfigured
	>({
		queryKey,
		enabled: Boolean(tz),
		staleTime: 5 * 60_000,
		refetchOnWindowFocus: false,
		placeholderData: (prev) => prev,
		queryFn: () => fetchReport(false),
	});

	const refresh = async () => {
		setRefreshing(true);
		try {
			queryClient.setQueryData(queryKey, await fetchReport(true));
		} catch (e) {
			console.error(e);
		} finally {
			setRefreshing(false);
		}
	};
	const busy = isFetching || refreshing;

	const report = data?.configured ? data : null;

	const rangeLabel = useMemo(() => {
		if (preset === "custom" && report) {
			const a = bucketLabel(report.range.startDate, "day", true);
			const b = bucketLabel(report.range.endDate, "day", true);
			return a === b ? a : `${a} – ${b}`;
		}
		return PRESETS.find((p) => p.value === preset)?.label ?? "Last 30 days";
	}, [preset, report]);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						<BarChart3 className="h-6 w-6 text-amber-600" />
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
							Analytics
						</h1>
						{report?.activeNow !== null && report?.activeNow !== undefined && (
							<span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
								<span className="relative flex h-2 w-2">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
									<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
								</span>
								{report.activeNow} active in last 30 min
							</span>
						)}
					</div>
					<p className="text-sm text-slate-500 mt-1">
						{rangeLabel}
						{tz ? ` · times shown in ${tz.replace(/_/g, " ")}` : ""}
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Select
						value={preset}
						onValueChange={(v) => {
							if (v === "custom") {
								setCalendarOpen(true);
								return;
							}
							setParams({ range: v, start: null, end: null });
						}}
					>
						<SelectTrigger className="w-[180px] bg-white border-slate-200">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PRESETS.map((p) => (
								<SelectItem key={p.value} value={p.value}>
									{p.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								className="bg-white border-slate-200 gap-2"
							>
								<CalendarDays className="h-4 w-4" />
								<span className="hidden sm:inline">
									{isCustom ? rangeLabel : "Pick dates"}
								</span>
							</Button>
						</PopoverTrigger>
						<PopoverContent align="end" className="w-auto p-0 bg-white">
							<Calendar
								mode="range"
								numberOfMonths={2}
								selected={draft}
								onSelect={setDraft}
								disabled={{ after: new Date() }}
								defaultMonth={
									draft?.from ?? new Date(Date.now() - 30 * 86_400_000)
								}
							/>
							<div className="flex items-center justify-between gap-2 border-t border-slate-100 p-3">
								<span className="text-xs text-slate-500">
									{draft?.from
										? `${toKey(draft.from)}${draft.to ? ` → ${toKey(draft.to)}` : ""}`
										: "Select a start and end date"}
								</span>
								<Button
									size="sm"
									disabled={!draft?.from}
									className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
									onClick={() => {
										if (!draft?.from) return;
										setParams({
											range: "custom",
											start: toKey(draft.from),
											end: toKey(draft.to ?? draft.from),
										});
										setCalendarOpen(false);
									}}
								>
									Apply
								</Button>
							</div>
						</PopoverContent>
					</Popover>

					<Button
						variant="outline"
						className="bg-white border-slate-200"
						disabled={busy}
						onClick={refresh}
						title="Fetch the latest numbers (bypasses the 5-minute cache)"
					>
						<RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
						<span className="sr-only">Refresh</span>
					</Button>
				</div>
			</div>

			{error && (
				<Card className="p-4 border-rose-200 bg-rose-50 text-rose-800 text-sm">
					{(error as Error).message}
				</Card>
			)}

			{report && report.kpis.pageviews === 0 && (
				<Card className="p-4 border-amber-200 bg-amber-50/60 text-sm text-slate-700">
					<strong>No visits recorded for this period yet.</strong> Tracking runs
					on your live (production) site only. Each visit is saved when the
					visitor leaves or switches tabs, so new visits can take a few minutes
					to appear.
				</Card>
			)}

			{isLoading || !report ? (
				!error && <LoadingState />
			) : (
				<div
					className={`space-y-6 transition-opacity ${busy ? "opacity-60" : ""}`}
				>
					{/* KPIs */}
					<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
						<KpiCard
							label="Unique visitors"
							value={fmtInt(report.kpis.visitors)}
							current={report.kpis.visitors}
							previous={report.previous.visitors}
							hint="Distinct people (devices) who visited"
						/>
						<KpiCard
							label="Total visits"
							value={fmtInt(report.kpis.visits)}
							current={report.kpis.visits}
							previous={report.previous.visits}
							hint="Sessions — one person can visit several times"
						/>
						<KpiCard
							label="Pageviews"
							value={fmtInt(report.kpis.pageviews)}
							current={report.kpis.pageviews}
							previous={report.previous.pageviews}
						/>
						<KpiCard
							label="Views per visit"
							value={report.kpis.viewsPerVisit.toFixed(1)}
							current={report.kpis.viewsPerVisit}
							previous={report.previous.viewsPerVisit}
						/>
						<KpiCard
							label="Bounce rate"
							value={fmtPct(report.kpis.bounceRate)}
							current={report.kpis.bounceRate}
							previous={report.previous.bounceRate}
							invert
							hint="Visits that left after viewing a single page — lower is better"
						/>
						<KpiCard
							label="Avg. visit"
							value={fmtDuration(report.kpis.avgVisitSeconds)}
							current={report.kpis.avgVisitSeconds}
							previous={report.previous.avgVisitSeconds}
						/>
					</div>

					{/* Traffic over time */}
					<Panel
						title="Traffic over time"
						subtitle={`Per ${report.range.unit}`}
						action={
							<div className="flex rounded-lg border border-slate-200 p-0.5 text-xs font-medium">
								{(["visitors", "pageviews", "both"] as const).map((k) => (
									<button
										key={k}
										type="button"
										onClick={() => setShow(k)}
										className={`px-2.5 py-1 rounded-md capitalize cursor-pointer ${
											show === k
												? "bg-slate-900 text-white"
												: "text-slate-600 hover:text-slate-900"
										}`}
									>
										{k}
									</button>
								))}
							</div>
						}
					>
						<TrafficChart
							data={report.series}
							unit={report.range.unit}
							show={show}
						/>
					</Panel>

					{/* Histograms */}
					<div className="grid lg:grid-cols-2 gap-6">
						<Panel
							title="Busiest hours"
							subtitle="Visitors by hour of day (total for the period)"
						>
							{report.hourOfDay ? (
								<Histogram
									values={report.hourOfDay.visitors}
									labels={HOURS}
									metricLabel="Visitors"
								/>
							) : (
								<p className="text-sm text-slate-400 py-16 text-center">
									Choose a range of 31 days or less to see hourly patterns.
								</p>
							)}
						</Panel>
						<Panel
							title="Busiest days"
							subtitle="Visitors by day of week (total for the period)"
						>
							{report.dayOfWeek ? (
								<Histogram
									values={report.dayOfWeek.visitors}
									labels={WEEKDAYS}
									metricLabel="Visitors"
								/>
							) : (
								<p className="text-sm text-slate-400 py-16 text-center">
									Not enough data.
								</p>
							)}
						</Panel>
					</div>

					{/* Content & sources */}
					<div className="grid lg:grid-cols-2 gap-6">
						<Panel title="Top pages">
							<BarList rows={report.pages} valueLabel="Views" />
						</Panel>
						<Panel
							title="Top sources"
							subtitle="Where visitors came from (direct visits excluded)"
						>
							<BarList
								rows={report.referrers}
								emptyText="No referrals yet — visitors came directly."
								icon={(domain) => (
									<img
										src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
										alt=""
										className="h-4 w-4 rounded-sm shrink-0"
										loading="lazy"
										onError={(e) => {
											e.currentTarget.style.visibility = "hidden";
										}}
									/>
								)}
							/>
						</Panel>
					</div>

					{/* Audience */}
					<div className="grid lg:grid-cols-3 gap-6">
						<Panel title="Countries">
							<BarList
								rows={report.countries}
								format={countryName}
								icon={(c) => (
									<span className="text-base leading-none">{flag(c)}</span>
								)}
							/>
						</Panel>
						<Panel title="Devices">
							<Donut rows={report.devices} />
						</Panel>
						<Panel title="Browsers & systems">
							<TechTabs browsers={report.browsers} os={report.os} />
						</Panel>
					</div>

					{/* Events */}
					<Panel
						title="Actions taken"
						subtitle="Buy clicks, downloads, sign-ups, reviews and comments"
					>
						<BarList
							rows={report.events}
							format={(e) => EVENT_LABELS[e] || e}
							valueLabel="Count"
							emptyText="No tracked actions in this period yet."
						/>
					</Panel>

					{/* Footer */}
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 pb-4">
						<span>
							Updated {new Date(report.generatedAt).toLocaleTimeString()} ·
							cached up to 5 minutes to keep things fast · stored privately in
							your own database
						</span>
						<button
							type="button"
							onClick={() => {
								setSelfExcluded(!excluded);
								setExcluded(!excluded);
							}}
							className="inline-flex items-center gap-1.5 font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
						>
							{excluded ? (
								<EyeOff className="h-3.5 w-3.5" />
							) : (
								<Eye className="h-3.5 w-3.5" />
							)}
							{excluded
								? "Your visits on this browser are not counted"
								: "Your visits on this browser are counted — click to exclude"}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

function TechTabs({
	browsers,
	os,
}: {
	browsers: AnalyticsReport["browsers"];
	os: AnalyticsReport["os"];
}) {
	const [tab, setTab] = useState<"browsers" | "os">("browsers");
	return (
		<div>
			<div className="flex gap-1 mb-3 text-xs font-medium">
				{(
					[
						["browsers", "Browsers"],
						["os", "Operating systems"],
					] as const
				).map(([k, label]) => (
					<button
						key={k}
						type="button"
						onClick={() => setTab(k)}
						className={`px-2.5 py-1 rounded-md cursor-pointer ${
							tab === k
								? "bg-amber-100 text-amber-800"
								: "text-slate-500 hover:text-slate-800"
						}`}
					>
						{label}
					</button>
				))}
			</div>
			<BarList rows={tab === "browsers" ? browsers : os} />
		</div>
	);
}

function LoadingState() {
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton key={`kpi-${i}`} className="h-28" />
				))}
			</div>
			<Skeleton className="h-[360px]" />
			<div className="grid lg:grid-cols-2 gap-6">
				<Skeleton className="h-72" />
				<Skeleton className="h-72" />
			</div>
			<div className="flex justify-center text-slate-400 text-sm items-center gap-2">
				<Loader2 className="h-4 w-4 animate-spin" /> Loading analytics…
			</div>
		</div>
	);
}

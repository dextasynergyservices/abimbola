"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import type { MetricRow, SeriesPoint } from "@/lib/analytics/types";

/* ─── Formatting ─── */

export const fmtInt = (n: number) =>
	n >= 10_000
		? new Intl.NumberFormat("en-US", {
				notation: "compact",
				maximumFractionDigits: 1,
			}).format(n)
		: new Intl.NumberFormat("en-US").format(Math.round(n));

export const fmtPct = (n: number) => `${Math.round(n * 100)}%`;

export function fmtDuration(seconds: number): string {
	const s = Math.round(seconds);
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	const r = s % 60;
	if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
	return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

/** Bucket key → short axis label. */
export function bucketLabel(
	key: string,
	unit: "hour" | "day" | "month",
	long = false,
): string {
	const [datePart, hourPart] = key.split(" ");
	const [y, m, d] = datePart.split("-").map(Number);
	if (unit === "month")
		return long
			? `${MONTHS[m - 1]} ${y}`
			: `${MONTHS[m - 1]} ${String(y).slice(2)}`;
	if (unit === "day")
		return long ? `${MONTHS[m - 1]} ${d}, ${y}` : `${MONTHS[m - 1]} ${d}`;
	const h = Number(hourPart);
	const label = `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
	return long ? `${MONTHS[m - 1]} ${d}, ${label}` : label;
}

/* ─── KPI card ─── */

export function KpiCard({
	label,
	value,
	current,
	previous,
	invert = false,
	hint,
}: {
	label: string;
	value: string;
	current: number;
	previous: number;
	/** For metrics where lower is better (bounce rate). */
	invert?: boolean;
	hint?: string;
}) {
	let change: number | null = null;
	if (previous > 0) change = (current - previous) / previous;
	else if (current > 0) change = null;
	else change = 0;

	const good = change === null ? true : invert ? change < 0 : change > 0;
	const flat = change !== null && Math.abs(change) < 0.005;

	return (
		<Card
			className="p-4 sm:p-5 border-slate-200 bg-white shadow-xs"
			title={hint}
		>
			<p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
				{label}
			</p>
			<p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1.5 tabular-nums">
				{value}
			</p>
			<div className="mt-2 h-5 text-xs font-semibold">
				{change === null ? (
					<span className="text-emerald-600">New</span>
				) : flat ? (
					<span className="inline-flex items-center gap-1 text-slate-400">
						<Minus className="h-3.5 w-3.5" /> No change
					</span>
				) : (
					<span
						className={`inline-flex items-center gap-0.5 ${good ? "text-emerald-600" : "text-rose-600"}`}
					>
						{change > 0 ? (
							<ArrowUpRight className="h-3.5 w-3.5" />
						) : (
							<ArrowDownRight className="h-3.5 w-3.5" />
						)}
						{Math.abs(Math.round(change * 100))}%
						<span className="font-normal text-slate-400 ml-1">vs previous</span>
					</span>
				)}
			</div>
		</Card>
	);
}

/* ─── Traffic over time ─── */

const trafficConfig = {
	visitors: { label: "Visitors", color: "#f59e0b" },
	pageviews: { label: "Pageviews", color: "#334155" },
} satisfies ChartConfig;

export function TrafficChart({
	data,
	unit,
	show,
}: {
	data: SeriesPoint[];
	unit: "hour" | "day" | "month";
	show: "visitors" | "pageviews" | "both";
}) {
	const rows = data.map((p) => ({ ...p, label: bucketLabel(p.key, unit) }));
	return (
		<ChartContainer
			config={trafficConfig}
			className="h-[300px] w-full aspect-auto"
		>
			<AreaChart
				data={rows}
				margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
			>
				<defs>
					<linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="5%"
							stopColor="var(--color-visitors)"
							stopOpacity={0.35}
						/>
						<stop
							offset="95%"
							stopColor="var(--color-visitors)"
							stopOpacity={0.02}
						/>
					</linearGradient>
					<linearGradient id="fillPageviews" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="5%"
							stopColor="var(--color-pageviews)"
							stopOpacity={0.18}
						/>
						<stop
							offset="95%"
							stopColor="var(--color-pageviews)"
							stopOpacity={0.01}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid
					vertical={false}
					strokeDasharray="3 3"
					stroke="#e2e8f0"
				/>
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					minTickGap={24}
					fontSize={12}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					width={44}
					fontSize={12}
					allowDecimals={false}
				/>
				<ChartTooltip
					cursor={{ stroke: "#cbd5e1" }}
					content={
						<ChartTooltipContent
							labelFormatter={(_, payload) => {
								const key = (payload?.[0]?.payload as SeriesPoint | undefined)
									?.key;
								return key ? bucketLabel(key, unit, true) : "";
							}}
						/>
					}
				/>
				{(show === "pageviews" || show === "both") && (
					<Area
						dataKey="pageviews"
						type="monotone"
						stroke="var(--color-pageviews)"
						fill="url(#fillPageviews)"
						strokeWidth={2}
					/>
				)}
				{(show === "visitors" || show === "both") && (
					<Area
						dataKey="visitors"
						type="monotone"
						stroke="var(--color-visitors)"
						fill="url(#fillVisitors)"
						strokeWidth={2.5}
					/>
				)}
			</AreaChart>
		</ChartContainer>
	);
}

/* ─── Histogram ─── */

const histConfig = {
	value: { label: "Visitors", color: "#f59e0b" },
} satisfies ChartConfig;

export function Histogram({
	values,
	labels,
	metricLabel,
	highlightMax = true,
}: {
	values: number[];
	labels: string[];
	metricLabel: string;
	highlightMax?: boolean;
}) {
	const max = Math.max(...values);
	const rows = values.map((value, i) => ({ label: labels[i], value }));
	return (
		<ChartContainer
			config={{ value: { ...histConfig.value, label: metricLabel } }}
			className="h-[220px] w-full aspect-auto"
		>
			<BarChart data={rows} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
				<CartesianGrid
					vertical={false}
					strokeDasharray="3 3"
					stroke="#e2e8f0"
				/>
				<XAxis
					dataKey="label"
					tickLine={false}
					axisLine={false}
					fontSize={11}
					interval="preserveStartEnd"
					minTickGap={4}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					width={40}
					fontSize={11}
					allowDecimals={false}
				/>
				<ChartTooltip
					cursor={{ fill: "#f1f5f9" }}
					content={<ChartTooltipContent />}
				/>
				<Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
					{rows.map((r) => (
						<Cell
							key={r.label}
							fill={
								highlightMax && r.value === max && max > 0
									? "#d97706"
									: "#fcd34d"
							}
						/>
					))}
				</Bar>
			</BarChart>
		</ChartContainer>
	);
}

/* ─── Donut ─── */

const DONUT_COLORS = [
	"#f59e0b",
	"#334155",
	"#94a3b8",
	"#fcd34d",
	"#0f766e",
	"#e11d48",
];

export function Donut({
	rows,
	format,
}: {
	rows: MetricRow[];
	format?: (s: string) => string;
}) {
	const total = rows.reduce((a, r) => a + r.value, 0);
	const data = rows.map((r) => ({
		name: format ? format(r.label) : r.label,
		value: r.value,
	}));
	const config: ChartConfig = Object.fromEntries(
		data.map((d, i) => [
			d.name,
			{ label: d.name, color: DONUT_COLORS[i % DONUT_COLORS.length] },
		]),
	);
	if (total === 0) return <EmptyPanel />;
	return (
		<div className="flex flex-col sm:flex-row items-center gap-4">
			<ChartContainer
				config={config}
				className="h-[180px] w-[180px] aspect-square shrink-0"
			>
				<PieChart>
					<ChartTooltip
						content={<ChartTooltipContent nameKey="name" hideLabel />}
					/>
					<Pie
						data={data}
						dataKey="value"
						nameKey="name"
						innerRadius={52}
						outerRadius={80}
						strokeWidth={2}
					>
						{data.map((d, i) => (
							<Cell key={d.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
						))}
					</Pie>
				</PieChart>
			</ChartContainer>
			<ul className="space-y-2 w-full text-sm">
				{data.map((d, i) => (
					<li key={d.name} className="flex items-center gap-2">
						<span
							className="h-2.5 w-2.5 rounded-full shrink-0"
							style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
						/>
						<span className="text-slate-700 capitalize flex-1 truncate">
							{d.name}
						</span>
						<span className="text-slate-500 tabular-nums">
							{fmtPct(d.value / total)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

/* ─── Ranked bar list (Plausible-style) ─── */

export function BarList({
	rows,
	format,
	icon,
	valueLabel = "Visitors",
	emptyText,
}: {
	rows: MetricRow[];
	format?: (label: string) => string;
	icon?: (label: string) => React.ReactNode;
	valueLabel?: string;
	emptyText?: string;
}) {
	if (rows.length === 0) return <EmptyPanel text={emptyText} />;
	const max = Math.max(...rows.map((r) => r.value));
	return (
		<div>
			<div className="flex justify-end text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">
				{valueLabel}
			</div>
			<ul className="space-y-1.5">
				{rows.map((r) => (
					<li
						key={r.label}
						className="relative flex items-center justify-between gap-3 text-sm"
					>
						<div
							className="absolute inset-y-0 left-0 rounded-md bg-amber-100/70"
							style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
							aria-hidden="true"
						/>
						<span className="relative z-10 flex items-center gap-2 px-2 py-1.5 min-w-0 text-slate-800">
							{icon?.(r.label)}
							<span className="truncate" title={r.label}>
								{format ? format(r.label) : r.label || "(none)"}
							</span>
						</span>
						<span className="relative z-10 pr-1 font-semibold text-slate-700 tabular-nums">
							{fmtInt(r.value)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export function EmptyPanel({
	text = "No data for this period yet.",
}: {
	text?: string;
}) {
	return <p className="text-sm text-slate-400 py-8 text-center">{text}</p>;
}

export function Panel({
	title,
	subtitle,
	action,
	children,
	className = "",
}: {
	title: string;
	subtitle?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Card className={`p-5 border-slate-200 bg-white shadow-xs ${className}`}>
			<div className="flex items-start justify-between gap-3 mb-4">
				<div>
					<h2 className="text-sm font-semibold text-slate-900">{title}</h2>
					{subtitle && (
						<p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
					)}
				</div>
				{action}
			</div>
			{children}
		</Card>
	);
}

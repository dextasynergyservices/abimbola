"use client";

import { Pencil, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

/** Relative time ("3 days ago"), falling back to a date for older items. */
export function formatRelative(iso: string): string {
	const date = new Date(iso);
	const diff = Date.now() - date.getTime();
	const minute = 60_000;
	const hour = 60 * minute;
	const day = 24 * hour;
	if (diff < minute) return "just now";
	if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
	if (diff < day) {
		const h = Math.floor(diff / hour);
		return `${h} hour${h === 1 ? "" : "s"} ago`;
	}
	if (diff < 30 * day) {
		const d = Math.floor(diff / day);
		return `${d} day${d === 1 ? "" : "s"} ago`;
	}
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function initialsOf(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const AVATAR_COLORS = [
	"bg-amber-100 text-amber-800",
	"bg-emerald-100 text-emerald-800",
	"bg-sky-100 text-sky-800",
	"bg-rose-100 text-rose-800",
	"bg-violet-100 text-violet-800",
	"bg-teal-100 text-teal-800",
];

export function Avatar({
	name,
	highlight = false,
}: {
	name: string;
	highlight?: boolean;
}) {
	let hash = 0;
	for (let i = 0; i < name.length; i++)
		hash = (hash * 31 + name.charCodeAt(i)) | 0;
	const color = highlight
		? "bg-amber-500 text-slate-950"
		: AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
	return (
		<div
			className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${color}`}
			aria-hidden="true"
		>
			{initialsOf(name)}
		</div>
	);
}

/** Read-only stars with fractional fill support. */
export function StarDisplay({
	value,
	size = "h-4 w-4",
	className = "",
}: {
	value: number;
	size?: string;
	className?: string;
}) {
	return (
		<div
			className={`flex items-center gap-0.5 ${className}`}
			role="img"
			aria-label={`${value} out of 5 stars`}
		>
			{[0, 1, 2, 3, 4].map((i) => {
				const fill = Math.max(0, Math.min(1, value - i));
				return (
					<span key={i} className={`relative inline-block ${size}`}>
						<Star
							className={`absolute inset-0 ${size} text-neutral-200 fill-neutral-200`}
						/>
						{fill > 0 && (
							<span
								className="absolute inset-0 overflow-hidden"
								style={{ width: `${fill * 100}%` }}
							>
								<Star className={`${size} fill-amber-400 text-amber-400`} />
							</span>
						)}
					</span>
				);
			})}
		</div>
	);
}

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Accessible star picker (radio group semantics, keyboard friendly). */
export function StarInput({
	value,
	onChange,
	disabled,
}: {
	value: number;
	onChange: (v: number) => void;
	disabled?: boolean;
}) {
	const [hover, setHover] = useState(0);
	const shown = hover || value;

	return (
		<div className="flex items-center gap-3">
			<div
				role="radiogroup"
				aria-label="Your rating"
				className="flex items-center gap-1"
				onMouseLeave={() => setHover(0)}
			>
				{[1, 2, 3, 4, 5].map((n) => (
					<button
						key={n}
						type="button"
						role="radio"
						aria-checked={value === n}
						aria-label={`${n} star${n === 1 ? "" : "s"} — ${RATING_LABELS[n]}`}
						tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
						disabled={disabled}
						onClick={() => onChange(n)}
						onMouseEnter={() => setHover(n)}
						onKeyDown={(e) => {
							if (e.key === "ArrowRight" || e.key === "ArrowUp") {
								e.preventDefault();
								onChange(Math.min(5, (value || 0) + 1));
							} else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
								e.preventDefault();
								onChange(Math.max(1, (value || 2) - 1));
							}
						}}
						className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
					>
						<Star
							className={`h-7 w-7 transition-colors ${
								n <= shown
									? "fill-amber-400 text-amber-400"
									: "text-neutral-300"
							}`}
						/>
					</button>
				))}
			</div>
			<span className="text-sm font-medium text-neutral-600 min-w-[80px]">
				{RATING_LABELS[shown]}
			</span>
		</div>
	);
}

/** Required attribution when the reCAPTCHA badge is hidden. */
export function RecaptchaNotice() {
	if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) return null;
	return (
		<p className="text-[11px] text-neutral-400 leading-relaxed">
			Protected by reCAPTCHA. Google&apos;s{" "}
			<a
				href="https://policies.google.com/privacy"
				target="_blank"
				rel="noopener noreferrer"
				className="underline hover:text-neutral-600"
			>
				Privacy Policy
			</a>{" "}
			and{" "}
			<a
				href="https://policies.google.com/terms"
				target="_blank"
				rel="noopener noreferrer"
				className="underline hover:text-neutral-600"
			>
				Terms
			</a>{" "}
			apply.
		</p>
	);
}

/** Visually hidden honeypot input. Bots fill it, people never see it. */
export function Honeypot({
	value,
	onChange,
}: {
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<div
			aria-hidden="true"
			className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
		>
			<label>
				Website
				<input
					type="text"
					name="website"
					tabIndex={-1}
					autoComplete="off"
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
			</label>
		</div>
	);
}

/** Remember name/email across forms on this device (convenience only). */
const IDENTITY_KEY = "engagement:identity";
export function loadIdentity(): { name: string; email: string } {
	try {
		const raw = localStorage.getItem(IDENTITY_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			return { name: parsed.name || "", email: parsed.email || "" };
		}
	} catch {}
	return { name: "", email: "" };
}
export function saveIdentity(name: string, email: string) {
	try {
		localStorage.setItem(IDENTITY_KEY, JSON.stringify({ name, email }));
	} catch {}
}

/* ─── Guest ownership: private edit keys for this device's own posts ─── */

const OWN_KEY = "engagement:own";

type OwnRecord = { token: string; createdAt: string };

function readOwn(): Record<string, OwnRecord> {
	try {
		return JSON.parse(localStorage.getItem(OWN_KEY) || "{}");
	} catch {
		return {};
	}
}

export function saveOwnToken(id: string, token: string, createdAt: string) {
	try {
		const all = readOwn();
		all[id] = { token, createdAt };
		localStorage.setItem(OWN_KEY, JSON.stringify(all));
	} catch {}
}

export function removeOwnToken(id: string) {
	try {
		const all = readOwn();
		delete all[id];
		localStorage.setItem(OWN_KEY, JSON.stringify(all));
	} catch {}
}

/**
 * The edit key for an item, if this device posted it. Read after mount so
 * server-rendered HTML (cached for everyone) never differs from hydration.
 */
export function useOwnToken(id: string): string | null {
	const [token, setToken] = useState<string | null>(null);
	useEffect(() => {
		setToken(readOwn()[id]?.token ?? null);
	}, [id]);
	return token;
}

export function canStillEdit(createdAt: string, windowHours: number): boolean {
	return Date.now() - new Date(createdAt).getTime() < windowHours * 3600_000;
}

/** Small inline "Are you sure?" row — the viewer has no confirm() dialogs. */
export function ConfirmDelete({
	label,
	busy,
	onConfirm,
	onCancel,
}: {
	label: string;
	busy: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}) {
	return (
		<div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
			<span className="text-rose-800">{label}</span>
			<div className="ml-auto flex gap-1.5">
				<button
					type="button"
					onClick={onCancel}
					disabled={busy}
					className="px-2.5 py-1 rounded-md text-neutral-600 hover:bg-white cursor-pointer"
				>
					Keep it
				</button>
				<button
					type="button"
					onClick={onConfirm}
					disabled={busy}
					className="px-2.5 py-1 rounded-md bg-rose-600 text-white font-medium hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
				>
					{busy ? "Deleting…" : "Delete"}
				</button>
			</div>
		</div>
	);
}

/** Owner-only action links shown under a review/comment. */
export function OwnerActions({
	canEdit,
	onEdit,
	onDelete,
}: {
	canEdit: boolean;
	onEdit: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="mt-2 flex items-center gap-3 text-xs font-semibold">
			{canEdit && (
				<button
					type="button"
					onClick={onEdit}
					className="inline-flex items-center gap-1 text-neutral-500 hover:text-amber-700 cursor-pointer"
				>
					<Pencil className="h-3.5 w-3.5" />
					Edit
				</button>
			)}
			<button
				type="button"
				onClick={onDelete}
				className="inline-flex items-center gap-1 text-neutral-500 hover:text-rose-600 cursor-pointer"
			>
				<Trash2 className="h-3.5 w-3.5" />
				Delete
			</button>
		</div>
	);
}

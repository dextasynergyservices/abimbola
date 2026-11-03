"use client";

import {
	AlertTriangle,
	BookOpen,
	Check,
	ExternalLink,
	Eye,
	EyeOff,
	FileText,
	Loader2,
	MessageSquare,
	Reply,
	Search,
	Star,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type Kind = "reviews" | "comments";
type StatusFilter = "all" | "visible" | "hidden" | "flagged";

interface Counts {
	all: number;
	visible: number;
	hidden: number;
	flagged: number;
}

interface ReviewRow {
	id: string;
	name: string;
	email: string | null;
	rating: number;
	title: string | null;
	body: string;
	status: "VISIBLE" | "HIDDEN";
	flagged: boolean;
	flagReason: string | null;
	authorReply: string | null;
	authorReplyAt: string | null;
	createdAt: string;
	editedAt: string | null;
	book: { id: string; title: string; slug: string };
}

interface CommentRow {
	id: string;
	name: string;
	email: string | null;
	body: string;
	status: "VISIBLE" | "HIDDEN";
	flagged: boolean;
	flagReason: string | null;
	isAuthor: boolean;
	parentId: string | null;
	createdAt: string;
	editedAt: string | null;
	post: { id: string; title: string; slug: string };
	parent: { id: string; name: string; body: string } | null;
	_count: { replies: number };
}

type Row = ReviewRow | CommentRow;

const PAGE_SIZE = 20;

export default function EngagementPage() {
	return (
		<Suspense fallback={<Skeleton className="h-96 w-full" />}>
			<EngagementInner />
		</Suspense>
	);
}

function EngagementInner() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const kind: Kind =
		searchParams.get("tab") === "comments" ? "comments" : "reviews";
	const status = (
		["all", "visible", "hidden", "flagged"].includes(
			searchParams.get("status") || "",
		)
			? searchParams.get("status")
			: "all"
	) as StatusFilter;
	const page = Math.max(1, Number(searchParams.get("page")) || 1);

	const [query, setQuery] = useState(searchParams.get("q") || "");
	const [items, setItems] = useState<Row[]>([]);
	const [total, setTotal] = useState(0);
	const [counts, setCounts] = useState<{
		reviews: Counts;
		comments: Counts;
	} | null>(null);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<Set<string>>(new Set());
	const [busyId, setBusyId] = useState<string | null>(null);
	const [bulkBusy, setBulkBusy] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState<{
		ids: string[];
		label: string;
	} | null>(null);
	const [replyTarget, setReplyTarget] = useState<string | null>(null);

	const setParams = useCallback(
		(updates: Record<string, string | null>) => {
			const params = new URLSearchParams(searchParams.toString());
			for (const [k, v] of Object.entries(updates)) {
				if (v === null || v === "") params.delete(k);
				else params.set(k, v);
			}
			router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		},
		[pathname, router, searchParams],
	);

	const q = searchParams.get("q") || "";

	const fetchItems = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({ status, page: String(page) });
			if (q) params.set("q", q);
			const res = await fetch(`/api/admin/engagement/${kind}?${params}`);
			if (!res.ok) throw new Error(`Failed to load ${kind}`);
			const data = await res.json();
			setItems(data.items);
			setTotal(data.total);
			setCounts(data.counts);
			setSelected(new Set());
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			setLoading(false);
		}
	}, [kind, status, page, q]);

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	// Debounced search → URL
	useEffect(() => {
		const handle = setTimeout(() => {
			if (query !== q) setParams({ q: query || null, page: null });
		}, 350);
		return () => clearTimeout(handle);
	}, [query, q, setParams]);

	const runAction = async (id: string, action: "hide" | "show") => {
		setBusyId(id);
		try {
			const res = await fetch(`/api/admin/engagement/${kind}/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action }),
			});
			if (!res.ok) throw new Error((await res.json()).error || "Action failed");
			toast.success(
				action === "hide"
					? "Unlisted — no longer visible publicly"
					: "Now visible publicly",
			);
			await fetchItems();
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			setBusyId(null);
		}
	};

	const runDelete = async (ids: string[]) => {
		setBulkBusy(true);
		try {
			const res =
				ids.length === 1
					? await fetch(`/api/admin/engagement/${kind}/${ids[0]}`, {
							method: "DELETE",
						})
					: await fetch(`/api/admin/engagement/${kind}`, {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ ids, action: "delete" }),
						});
			if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
			toast.success(
				ids.length === 1 ? "Deleted" : `${ids.length} items deleted`,
			);
			setConfirmDelete(null);
			await fetchItems();
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			setBulkBusy(false);
		}
	};

	const runBulk = async (action: "hide" | "show") => {
		const ids = [...selected];
		if (ids.length === 0) return;
		setBulkBusy(true);
		try {
			const res = await fetch(`/api/admin/engagement/${kind}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ids, action }),
			});
			if (!res.ok)
				throw new Error((await res.json()).error || "Bulk action failed");
			const { count } = await res.json();
			toast.success(
				`${count} item${count === 1 ? "" : "s"} ${action === "hide" ? "unlisted" : "made visible"}`,
			);
			await fetchItems();
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			setBulkBusy(false);
		}
	};

	const kindCounts = counts?.[kind];
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const allSelected =
		items.length > 0 && items.every((i) => selected.has(i.id));

	const toggleAll = () => {
		setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
	};
	const toggleOne = (id: string) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<div className="flex items-center space-x-2">
					<MessageSquare className="h-6 w-6 text-amber-600" />
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
						Reviews &amp; Comments
					</h1>
				</div>
				<p className="text-sm text-slate-500 mt-1">
					New submissions appear on the site right away. Unlist anything you
					don&apos;t want shown, or delete it permanently. Items caught by the
					spam filter wait under <strong>Flagged</strong>.
				</p>
			</div>

			{/* Kind tabs */}
			<div className="flex gap-2 border-b border-slate-200">
				{(
					[
						{ key: "reviews", label: "Book Reviews", icon: BookOpen },
						{ key: "comments", label: "Blog Comments", icon: FileText },
					] as const
				).map((tab) => {
					const active = kind === tab.key;
					const Icon = tab.icon;
					const flagged = counts?.[tab.key].flagged ?? 0;
					return (
						<button
							key={tab.key}
							type="button"
							onClick={() => {
								setQuery("");
								setParams({ tab: tab.key, status: null, page: null, q: null });
							}}
							className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors cursor-pointer ${
								active
									? "border-amber-500 text-amber-700"
									: "border-transparent text-slate-500 hover:text-slate-800"
							}`}
						>
							<Icon className="h-4 w-4" />
							{tab.label}
							<span className="text-xs text-slate-400 tabular-nums">
								{counts?.[tab.key].all ?? ""}
							</span>
							{flagged > 0 && (
								<span className="ml-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5">
									{flagged}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* Filters */}
			<div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
				<div className="flex flex-wrap gap-2">
					{(
						[
							{ key: "all", label: "All" },
							{ key: "visible", label: "Visible" },
							{ key: "hidden", label: "Unlisted" },
							{ key: "flagged", label: "Flagged" },
						] as const
					).map((f) => {
						const active = status === f.key;
						return (
							<button
								key={f.key}
								type="button"
								onClick={() =>
									setParams({
										status: f.key === "all" ? null : f.key,
										page: null,
									})
								}
								className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
									active
										? f.key === "flagged"
											? "bg-amber-500 border-amber-500 text-slate-950"
											: "bg-slate-900 border-slate-900 text-white"
										: "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
								}`}
							>
								{f.label}
								{kindCounts && (
									<span className="ml-1.5 opacity-70 tabular-nums">
										{kindCounts[f.key]}
									</span>
								)}
							</button>
						);
					})}
				</div>
				<div className="relative md:w-72">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder={`Search ${kind}…`}
						className="pl-9 bg-white border-slate-200"
					/>
				</div>
			</div>

			{/* Bulk bar */}
			{items.length > 0 && (
				<div className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200">
					<div className="flex items-center gap-2 text-sm text-slate-600">
						<Checkbox
							id="select-all-engagement"
							checked={allSelected}
							onCheckedChange={toggleAll}
						/>
						<label htmlFor="select-all-engagement" className="cursor-pointer">
							{selected.size > 0
								? `${selected.size} selected`
								: "Select all on page"}
						</label>
					</div>
					{selected.size > 0 && (
						<div className="flex flex-wrap gap-2 ml-auto">
							<Button
								size="sm"
								variant="outline"
								disabled={bulkBusy}
								onClick={() => runBulk("show")}
								className="bg-white"
							>
								<Eye className="h-4 w-4 mr-1.5" /> Make visible
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={bulkBusy}
								onClick={() => runBulk("hide")}
								className="bg-white"
							>
								<EyeOff className="h-4 w-4 mr-1.5" /> Unlist
							</Button>
							<Button
								size="sm"
								variant="outline"
								disabled={bulkBusy}
								onClick={() =>
									setConfirmDelete({
										ids: [...selected],
										label: `${selected.size} items`,
									})
								}
								className="bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
							>
								<Trash2 className="h-4 w-4 mr-1.5" /> Delete
							</Button>
						</div>
					)}
				</div>
			)}

			{/* List */}
			{loading ? (
				<Card className="p-6 border-slate-200 bg-white space-y-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={`eng-skel-${i}`} className="h-24 w-full" />
					))}
				</Card>
			) : items.length === 0 ? (
				<Card className="p-12 text-center border-slate-200 bg-white shadow-xs">
					<MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
					<h3 className="text-lg font-semibold text-slate-900">
						{q
							? "No matches"
							: status === "flagged"
								? "Nothing flagged"
								: `No ${kind} yet`}
					</h3>
					<p className="text-sm text-slate-500 mt-1">
						{q
							? "Try a different search."
							: kind === "reviews"
								? "Reviews left on book pages will appear here."
								: "Comments left on blog posts will appear here."}
					</p>
				</Card>
			) : (
				<Card className="border-slate-200 bg-white overflow-hidden shadow-xs divide-y divide-slate-100">
					{items.map((item) => (
						<ItemRow
							key={item.id}
							kind={kind}
							item={item}
							selected={selected.has(item.id)}
							busy={busyId === item.id}
							replyOpen={replyTarget === item.id}
							onToggle={() => toggleOne(item.id)}
							onHide={() => runAction(item.id, "hide")}
							onShow={() => runAction(item.id, "show")}
							onDelete={() =>
								setConfirmDelete({
									ids: [item.id],
									label:
										kind === "reviews"
											? `the review by ${item.name}`
											: `the comment by ${item.name}`,
								})
							}
							onReplyToggle={() =>
								setReplyTarget((cur) => (cur === item.id ? null : item.id))
							}
							onReplied={async () => {
								setReplyTarget(null);
								await fetchItems();
							}}
						/>
					))}
				</Card>
			)}

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between text-sm text-slate-500">
					<span>
						Page {page} of {totalPages} · {total} total
					</span>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							disabled={page <= 1}
							onClick={() => setParams({ page: String(page - 1) })}
						>
							Previous
						</Button>
						<Button
							size="sm"
							variant="outline"
							disabled={page >= totalPages}
							onClick={() => setParams({ page: String(page + 1) })}
						>
							Next
						</Button>
					</div>
				</div>
			)}

			<AlertDialog
				open={!!confirmDelete}
				onOpenChange={(open) => !open && setConfirmDelete(null)}
			>
				<AlertDialogContent className="max-w-md w-[92vw] bg-white border-slate-200">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-slate-900 font-bold">
							Delete {confirmDelete?.label}?
						</AlertDialogTitle>
						<AlertDialogDescription className="text-slate-500 text-sm">
							{kind === "comments"
								? "It will be removed from the site along with any replies. "
								: "It will be removed from the site and the book's rating will update. "}
							If you might want it back later, use <strong>Unlist</strong>{" "}
							instead.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="mt-4">
						<AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								if (confirmDelete) runDelete(confirmDelete.ids);
							}}
							disabled={bulkBusy}
							className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
						>
							{bulkBusy && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function ItemRow({
	kind,
	item,
	selected,
	busy,
	replyOpen,
	onToggle,
	onHide,
	onShow,
	onDelete,
	onReplyToggle,
	onReplied,
}: {
	kind: Kind;
	item: Row;
	selected: boolean;
	busy: boolean;
	replyOpen: boolean;
	onToggle: () => void;
	onHide: () => void;
	onShow: () => void;
	onDelete: () => void;
	onReplyToggle: () => void;
	onReplied: () => void;
}) {
	const review = kind === "reviews" ? (item as ReviewRow) : null;
	const comment = kind === "comments" ? (item as CommentRow) : null;
	const visible = item.status === "VISIBLE";
	const target = review
		? { label: review.book.title, href: `/books/${review.book.slug}#reviews` }
		: {
				label: comment?.post.title ?? "",
				href: `/blog/${comment?.post.slug}#comments`,
			};

	return (
		<div className={`px-4 sm:px-6 py-5 ${selected ? "bg-amber-50/40" : ""}`}>
			<div className="flex gap-3 sm:gap-4">
				<div className="pt-1">
					<Checkbox
						checked={selected}
						onCheckedChange={onToggle}
						aria-label="Select"
					/>
				</div>
				<div className="min-w-0 flex-1 space-y-2">
					{/* Meta */}
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
						<span className="font-semibold text-slate-900">{item.name}</span>
						{comment?.isAuthor && (
							<span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
								You
							</span>
						)}
						<span className="text-xs text-slate-400">
							{item.email || "No email"}
						</span>
						<span className="text-xs text-slate-400">
							{new Date(item.createdAt).toLocaleString("en-US", {
								month: "short",
								day: "numeric",
								year: "numeric",
								hour: "numeric",
								minute: "2-digit",
							})}
							{item.editedAt && " · edited by visitor"}
						</span>
						{visible ? (
							<span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
								Visible
							</span>
						) : item.flagged ? (
							<span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
								<AlertTriangle className="h-3 w-3" />
								Flagged{item.flagReason ? ` · ${item.flagReason}` : ""}
							</span>
						) : (
							<span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
								Unlisted
							</span>
						)}
					</div>

					{/* Target */}
					<Link
						href={target.href}
						target="_blank"
						className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
					>
						{kind === "reviews" ? "On book:" : "On post:"} {target.label}
						<ExternalLink className="h-3 w-3" />
					</Link>

					{comment?.parent && (
						<p className="text-xs text-slate-500 border-l-2 border-slate-200 pl-2 line-clamp-1">
							Replying to <strong>{comment.parent.name}</strong>:{" "}
							{comment.parent.body}
						</p>
					)}

					{/* Content */}
					{review && (
						<div
							className="flex items-center gap-0.5"
							role="img"
							aria-label={`${review.rating} stars`}
						>
							{[1, 2, 3, 4, 5].map((n) => (
								<Star
									key={n}
									className={`h-4 w-4 ${n <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
								/>
							))}
						</div>
					)}
					{review?.title && (
						<p className="font-semibold text-slate-900">{review.title}</p>
					)}
					<p className="text-sm text-slate-700 whitespace-pre-line break-words">
						{item.body}
					</p>

					{review?.authorReply && !replyOpen && (
						<div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
							<p className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1">
								Your reply
							</p>
							<p className="text-slate-700 whitespace-pre-line">
								{review.authorReply}
							</p>
						</div>
					)}

					{replyOpen && (
						<ReplyBox
							kind={kind}
							id={item.id}
							initial={review?.authorReply ?? ""}
							onCancel={onReplyToggle}
							onDone={onReplied}
						/>
					)}

					{/* Actions */}
					<div className="flex flex-wrap items-center gap-1.5 pt-1">
						{visible ? (
							<Button
								size="sm"
								variant="ghost"
								disabled={busy}
								onClick={onHide}
								className="h-8 text-slate-600"
							>
								{busy ? (
									<Loader2 className="h-4 w-4 animate-spin mr-1.5" />
								) : (
									<EyeOff className="h-4 w-4 mr-1.5" />
								)}
								Unlist
							</Button>
						) : (
							<Button
								size="sm"
								variant="ghost"
								disabled={busy}
								onClick={onShow}
								className="h-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
							>
								{busy ? (
									<Loader2 className="h-4 w-4 animate-spin mr-1.5" />
								) : item.flagged ? (
									<Check className="h-4 w-4 mr-1.5" />
								) : (
									<Eye className="h-4 w-4 mr-1.5" />
								)}
								{item.flagged ? "Approve" : "Make visible"}
							</Button>
						)}
						{!comment?.isAuthor && (
							<Button
								size="sm"
								variant="ghost"
								onClick={onReplyToggle}
								className="h-8 text-slate-600"
							>
								<Reply className="h-4 w-4 mr-1.5" />
								{review?.authorReply ? "Edit reply" : "Reply"}
							</Button>
						)}
						<Button
							size="sm"
							variant="ghost"
							onClick={onDelete}
							className="h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
						>
							<Trash2 className="h-4 w-4 mr-1.5" />
							Delete
						</Button>
						{comment && comment._count.replies > 0 && (
							<span className="text-xs text-slate-400 ml-auto">
								{comment._count.replies} repl
								{comment._count.replies === 1 ? "y" : "ies"}
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function ReplyBox({
	kind,
	id,
	initial,
	onCancel,
	onDone,
}: {
	kind: Kind;
	id: string;
	initial: string;
	onCancel: () => void;
	onDone: () => void;
}) {
	const [body, setBody] = useState(initial);
	const [saving, setSaving] = useState(false);

	const save = async (value: string) => {
		setSaving(true);
		try {
			const res = await fetch(`/api/admin/engagement/${kind}/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "reply", body: value }),
			});
			if (!res.ok)
				throw new Error((await res.json()).error || "Failed to save reply");
			toast.success(value ? "Reply published" : "Reply removed");
			onDone();
		} catch (err) {
			toast.error((err as Error).message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
			<Textarea
				value={body}
				onChange={(e) => setBody(e.target.value)}
				rows={3}
				maxLength={2000}
				placeholder={
					kind === "reviews"
						? "Write a public reply shown under this review…"
						: "Write a reply — it will appear with an Author badge…"
				}
				className="bg-white"
				autoFocus
			/>
			<div className="flex flex-wrap gap-2 justify-end">
				{kind === "reviews" && initial && (
					<Button
						size="sm"
						variant="ghost"
						disabled={saving}
						onClick={() => save("")}
						className="mr-auto text-rose-600 hover:text-rose-700"
					>
						Remove reply
					</Button>
				)}
				<Button size="sm" variant="ghost" disabled={saving} onClick={onCancel}>
					Cancel
				</Button>
				<Button
					size="sm"
					disabled={saving || body.trim().length < 2}
					onClick={() => save(body)}
					className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
				>
					{saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
					Publish reply
				</Button>
			</div>
		</div>
	);
}

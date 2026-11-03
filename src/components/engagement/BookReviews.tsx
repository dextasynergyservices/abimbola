"use client";

import {
	CheckCircle2,
	Loader2,
	MessageSquareQuote,
	PenLine,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getRecaptchaError, useRecaptcha } from "@/hooks/use-recaptcha";
import { trackEvent } from "@/lib/analytics/track";
import {
	EDIT_WINDOW_HOURS,
	LIMITS,
	type PublicReview,
	type ReviewPage,
	type ReviewSort,
	type ReviewSummary,
} from "@/lib/engagement/types";
import {
	Avatar,
	ConfirmDelete,
	canStillEdit,
	formatRelative,
	Honeypot,
	loadIdentity,
	OwnerActions,
	RecaptchaNotice,
	removeOwnToken,
	StarDisplay,
	StarInput,
	saveIdentity,
	saveOwnToken,
	useOwnToken,
} from "./shared";

interface BookReviewsProps {
	bookId: string;
	bookTitle: string;
	initialPage: ReviewPage;
	summary: ReviewSummary;
}

export default function BookReviews({
	bookId,
	bookTitle,
	initialPage,
	summary: initialSummary,
}: BookReviewsProps) {
	const [reviews, setReviews] = useState<PublicReview[]>(initialPage.reviews);
	const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
	const [summary, setSummary] = useState(initialSummary);
	const [sort, setSort] = useState<ReviewSort>("newest");
	const [loadingMore, setLoadingMore] = useState(false);
	const [formOpen, setFormOpen] = useState(false);
	const [notice, setNotice] = useState<string | null>(null);
	const sortSelectId = useId();
	const isFirstSort = useRef(true);

	// Re-fetch from the API when the sort changes (skip the initial SSR render).
	useEffect(() => {
		if (isFirstSort.current) {
			isFirstSort.current = false;
			return;
		}
		let cancelled = false;
		setLoadingMore(true);
		fetch(`/api/books/${bookId}/reviews?sort=${sort}`)
			.then((r) => r.json())
			.then((data: ReviewPage) => {
				if (cancelled) return;
				setReviews(data.reviews);
				setNextCursor(data.nextCursor);
			})
			.catch(() => {})
			.finally(() => !cancelled && setLoadingMore(false));
		return () => {
			cancelled = true;
		};
	}, [bookId, sort]);

	const loadMore = async () => {
		if (!nextCursor) return;
		setLoadingMore(true);
		try {
			const res = await fetch(
				`/api/books/${bookId}/reviews?sort=${sort}&cursor=${nextCursor}`,
			);
			const data: ReviewPage = await res.json();
			setReviews((prev) => {
				const seen = new Set(prev.map((r) => r.id));
				return [...prev, ...data.reviews.filter((r) => !seen.has(r.id))];
			});
			setNextCursor(data.nextCursor);
		} finally {
			setLoadingMore(false);
		}
	};

	/** Move one rating out of / into the summary (null = none). */
	const adjustSummary = (remove: number | null, add: number | null) => {
		setSummary((s) => {
			const distribution = [...s.distribution] as ReviewSummary["distribution"];
			if (remove)
				distribution[remove - 1] = Math.max(0, distribution[remove - 1] - 1);
			if (add) distribution[add - 1] += 1;
			const count = distribution.reduce((a, b) => a + b, 0);
			const total = distribution.reduce((a, c, i) => a + c * (i + 1), 0);
			return {
				count,
				average: count > 0 ? Math.round((total / count) * 10) / 10 : null,
				distribution,
			};
		});
	};

	const handlePublished = (review: PublicReview) => {
		setReviews((prev) => [review, ...prev]);
		adjustSummary(null, review.rating);
		setFormOpen(false);
		setNotice(
			`Thank you! Your review is now live. You can edit it from this device for ${EDIT_WINDOW_HOURS} hours.`,
		);
	};

	const handleUpdated = (
		before: PublicReview,
		after: PublicReview | null,
		message?: string,
	) => {
		if (after) {
			setReviews((prev) => prev.map((r) => (r.id === after.id ? after : r)));
			if (before.rating !== after.rating)
				adjustSummary(before.rating, after.rating);
			setNotice("Your review has been updated.");
		} else {
			// Saved but held for moderation: remove from public view for now.
			setReviews((prev) => prev.filter((r) => r.id !== before.id));
			adjustSummary(before.rating, null);
			setNotice(message || "Your changes were saved.");
		}
	};

	const handleDeleted = (review: PublicReview) => {
		setReviews((prev) => prev.filter((r) => r.id !== review.id));
		adjustSummary(review.rating, null);
		setNotice("Your review has been deleted.");
	};

	const handleHeld = (message: string) => {
		setFormOpen(false);
		setNotice(message);
	};

	return (
		<section
			id="reviews"
			aria-labelledby="reviews-heading"
			className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-20 scroll-mt-24"
		>
			<div className="border-t border-neutral-200 pt-12">
				<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
					<div>
						<h2
							id="reviews-heading"
							className="text-3xl font-display font-bold text-black"
						>
							Reader Reviews
						</h2>
						<p className="text-neutral-500 mt-1 text-sm">
							What readers are saying about {bookTitle}
						</p>
					</div>
					{!formOpen && (
						<Button
							onClick={() => {
								setFormOpen(true);
								setNotice(null);
							}}
							className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold self-start sm:self-auto"
						>
							<PenLine className="mr-2 h-4 w-4" />
							Write a review
						</Button>
					)}
				</div>

				<div className="grid lg:grid-cols-[320px_1fr] gap-10">
					<ReviewSummaryPanel summary={summary} />

					<div className="space-y-6 min-w-0">
						{notice && (
							<div
								role="status"
								className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm"
							>
								<CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
								<span>{notice}</span>
							</div>
						)}

						{formOpen && (
							<ReviewForm
								bookId={bookId}
								onCancel={() => setFormOpen(false)}
								onPublished={handlePublished}
								onHeld={handleHeld}
							/>
						)}

						{summary.count > 1 && (
							<div className="flex items-center justify-end gap-2">
								<label
									htmlFor={sortSelectId}
									className="text-sm text-neutral-500"
								>
									Sort by
								</label>
								<select
									id={sortSelectId}
									value={sort}
									onChange={(e) => setSort(e.target.value as ReviewSort)}
									className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
								>
									<option value="newest">Newest</option>
									<option value="highest">Highest rated</option>
									<option value="lowest">Lowest rated</option>
								</select>
							</div>
						)}

						{reviews.length === 0 && !formOpen ? (
							<div className="text-center py-12 px-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50">
								<MessageSquareQuote className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
								<p className="font-semibold text-neutral-800">No reviews yet</p>
								<p className="text-sm text-neutral-500 mt-1">
									Be the first to share your thoughts on this book.
								</p>
							</div>
						) : (
							<ul className="divide-y divide-neutral-100">
								{reviews.map((review) => (
									<ReviewItem
										key={review.id}
										bookId={bookId}
										review={review}
										onUpdated={handleUpdated}
										onDeleted={handleDeleted}
									/>
								))}
							</ul>
						)}

						{nextCursor && (
							<div className="text-center">
								<Button
									variant="outline"
									onClick={loadMore}
									disabled={loadingMore}
									className="border-neutral-300"
								>
									{loadingMore && (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									)}
									Show more reviews
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}

function ReviewSummaryPanel({ summary }: { summary: ReviewSummary }) {
	const max = Math.max(1, ...summary.distribution);
	return (
		<div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 h-fit lg:sticky lg:top-28">
			{summary.count > 0 && summary.average !== null ? (
				<>
					<div className="flex items-end gap-3">
						<span className="text-5xl font-display font-bold text-black leading-none">
							{summary.average.toFixed(1)}
						</span>
						<span className="text-neutral-500 text-sm pb-1">out of 5</span>
					</div>
					<StarDisplay
						value={summary.average}
						size="h-5 w-5"
						className="mt-3"
					/>
					<p className="text-sm text-neutral-500 mt-2">
						Based on {summary.count} review{summary.count === 1 ? "" : "s"}
					</p>
				</>
			) : (
				<>
					<p className="font-semibold text-neutral-800">No ratings yet</p>
					<p className="text-sm text-neutral-500 mt-1">
						Your review helps other readers decide.
					</p>
				</>
			)}

			<div className="mt-6 space-y-2">
				{[5, 4, 3, 2, 1].map((stars) => {
					const count = summary.distribution[stars - 1];
					const pct =
						summary.count > 0 ? Math.round((count / summary.count) * 100) : 0;
					return (
						<div key={stars} className="flex items-center gap-3 text-sm">
							<span className="w-12 text-neutral-600 shrink-0">
								{stars} star
							</span>
							<div
								className="flex-1 h-2 rounded-full bg-neutral-200 overflow-hidden"
								role="img"
								aria-label={`${stars} stars: ${count} review${count === 1 ? "" : "s"}`}
							>
								<div
									className="h-full bg-amber-400 rounded-full transition-all"
									style={{ width: `${(count / max) * 100}%` }}
								/>
							</div>
							<span className="w-9 text-right text-neutral-500 tabular-nums shrink-0">
								{pct}%
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

function ReviewItem({
	bookId,
	review,
	onUpdated,
	onDeleted,
}: {
	bookId: string;
	review: PublicReview;
	onUpdated: (
		before: PublicReview,
		after: PublicReview | null,
		message?: string,
	) => void;
	onDeleted: (review: PublicReview) => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const ownToken = useOwnToken(review.id);
	const long = review.body.length > 480;
	const body =
		long && !expanded ? `${review.body.slice(0, 480).trimEnd()}…` : review.body;

	const remove = async () => {
		if (!ownToken) return;
		setBusy(true);
		setError(null);
		try {
			const res = await fetch(`/api/books/${bookId}/reviews/${review.id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: ownToken }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok)
				throw new Error(data.error || "Couldn't delete your review.");
			removeOwnToken(review.id);
			onDeleted(review);
		} catch (e) {
			setError((e as Error).message);
			setBusy(false);
		}
	};

	return (
		<li className="py-6 first:pt-0">
			<article className="flex gap-4">
				<Avatar name={review.name} />
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
						<span className="font-semibold text-neutral-900">
							{review.name}
						</span>
						{ownToken && (
							<span className="text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
								Your review
							</span>
						)}
						<time
							dateTime={review.createdAt}
							className="text-xs text-neutral-400"
						>
							{formatRelative(review.createdAt)}
							{review.editedAt && " · edited"}
						</time>
					</div>

					{mode === "edit" && ownToken ? (
						<EditReviewForm
							bookId={bookId}
							review={review}
							token={ownToken}
							onCancel={() => setMode("view")}
							onSaved={(after, message) => {
								setMode("view");
								onUpdated(review, after, message);
							}}
						/>
					) : (
						<>
							<StarDisplay value={review.rating} className="mt-1" />
							{review.title && (
								<h3 className="font-semibold text-neutral-900 mt-3">
									{review.title}
								</h3>
							)}
							<p className="text-neutral-700 leading-relaxed mt-2 whitespace-pre-line break-words">
								{body}
							</p>
							{long && (
								<button
									type="button"
									onClick={() => setExpanded((v) => !v)}
									className="text-sm font-medium text-amber-700 hover:text-amber-800 mt-1 cursor-pointer"
								>
									{expanded ? "Show less" : "Read more"}
								</button>
							)}
							{ownToken && mode === "view" && (
								<OwnerActions
									canEdit={canStillEdit(review.createdAt, EDIT_WINDOW_HOURS)}
									onEdit={() => setMode("edit")}
									onDelete={() => setMode("confirm-delete")}
								/>
							)}
							{mode === "confirm-delete" && (
								<ConfirmDelete
									label="Delete your review? This can't be undone."
									busy={busy}
									onConfirm={remove}
									onCancel={() => setMode("view")}
								/>
							)}
							{error && (
								<p role="alert" className="mt-2 text-sm text-rose-600">
									{error}
								</p>
							)}
						</>
					)}

					{review.authorReply && (
						<div className="mt-4 rounded-xl bg-amber-50/70 border border-amber-200/80 p-4">
							<div className="flex items-center gap-2 mb-1">
								<span className="text-xs font-bold uppercase tracking-wider text-amber-800">
									Reply from the author
								</span>
								{review.authorReplyAt && (
									<time
										dateTime={review.authorReplyAt}
										className="text-xs text-amber-700/70"
									>
										· {formatRelative(review.authorReplyAt)}
									</time>
								)}
							</div>
							<p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line break-words">
								{review.authorReply}
							</p>
						</div>
					)}
				</div>
			</article>
		</li>
	);
}

function EditReviewForm({
	bookId,
	review,
	token,
	onCancel,
	onSaved,
}: {
	bookId: string;
	review: PublicReview;
	token: string;
	onCancel: () => void;
	onSaved: (after: PublicReview | null, message?: string) => void;
}) {
	const [rating, setRating] = useState(review.rating);
	const [title, setTitle] = useState(review.title ?? "");
	const [body, setBody] = useState(review.body);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const ids = { title: useId(), body: useId() };

	const save = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (body.trim().length < LIMITS.minBody) {
			setError(`Please write at least ${LIMITS.minBody} characters.`);
			return;
		}
		setSaving(true);
		try {
			const res = await fetch(`/api/books/${bookId}/reviews/${review.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, rating, title: title || null, body }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setError(data.error || "Couldn't save your changes.");
				return;
			}
			onSaved(data.status === "published" ? data.review : null, data.message);
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<form onSubmit={save} className="mt-3 space-y-3" noValidate>
			<StarInput value={rating} onChange={setRating} disabled={saving} />
			<div className="space-y-1">
				<Label htmlFor={ids.title} className="text-xs text-neutral-600">
					Headline (optional)
				</Label>
				<Input
					id={ids.title}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					maxLength={LIMITS.reviewTitle}
					disabled={saving}
				/>
			</div>
			<div className="space-y-1">
				<Label htmlFor={ids.body} className="text-xs text-neutral-600">
					Your review
				</Label>
				<Textarea
					id={ids.body}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					maxLength={LIMITS.reviewBody}
					rows={5}
					disabled={saving}
				/>
			</div>
			{error && (
				<p role="alert" className="text-sm text-rose-600">
					{error}
				</p>
			)}
			<div className="flex gap-2 justify-end">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={onCancel}
					disabled={saving}
				>
					Cancel
				</Button>
				<Button
					type="submit"
					size="sm"
					disabled={saving}
					className="bg-black hover:bg-neutral-800 text-white"
				>
					{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					Save changes
				</Button>
			</div>
		</form>
	);
}

function ReviewForm({
	bookId,
	onCancel,
	onPublished,
	onHeld,
}: {
	bookId: string;
	onCancel: () => void;
	onPublished: (review: PublicReview) => void;
	onHeld: (message: string) => void;
}) {
	const [rating, setRating] = useState(0);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [website, setWebsite] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const startedAt = useRef(Date.now());
	const { preload, execute } = useRecaptcha();
	const ids = { name: useId(), email: useId(), title: useId(), body: useId() };

	useEffect(() => {
		const saved = loadIdentity();
		setName(saved.name);
		setEmail(saved.email);
		preload();
	}, [preload]);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		if (rating === 0) {
			setError("Please choose a star rating.");
			return;
		}
		if (body.trim().length < LIMITS.minBody) {
			setError(`Please write at least ${LIMITS.minBody} characters.`);
			return;
		}

		setSubmitting(true);
		try {
			const recaptchaToken = await execute("submit_review");
			const res = await fetch(`/api/books/${bookId}/reviews`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					rating,
					name,
					email,
					title: title || null,
					body,
					website,
					startedAt: startedAt.current,
					recaptchaToken,
					recaptchaError: recaptchaToken ? undefined : getRecaptchaError(),
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setError(data.error || "Something went wrong. Please try again.");
				return;
			}
			saveIdentity(name, email);
			trackEvent("review-submitted", { rating });
			if (data.status === "published" && data.review) {
				if (data.editToken) {
					saveOwnToken(data.review.id, data.editToken, data.review.createdAt);
				}
				onPublished(data.review);
			} else {
				onHeld(data.message || "Thanks! Your review has been received.");
			}
		} catch {
			setError("Network error. Please check your connection and try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form
			onSubmit={submit}
			className="relative rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm space-y-5"
			noValidate
		>
			<div>
				<h3 className="font-display font-bold text-lg text-black">
					Write a review
				</h3>
				<p className="text-sm text-neutral-500">
					Email is optional and never shown publicly.
				</p>
			</div>

			<div className="space-y-2">
				<span className="text-sm font-medium text-neutral-800">
					Your rating <span className="text-rose-500">*</span>
				</span>
				<StarInput value={rating} onChange={setRating} disabled={submitting} />
			</div>

			<div className="grid sm:grid-cols-2 gap-4">
				<div className="space-y-1.5">
					<Label htmlFor={ids.name}>
						Name <span className="text-rose-500">*</span>
					</Label>
					<Input
						id={ids.name}
						value={name}
						onChange={(e) => setName(e.target.value)}
						maxLength={LIMITS.name}
						required
						autoComplete="name"
						disabled={submitting}
					/>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor={ids.email}>
						Email{" "}
						<span className="font-normal text-neutral-400">(optional)</span>
					</Label>
					<Input
						id={ids.email}
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete="email"
						disabled={submitting}
					/>
				</div>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor={ids.title}>Headline (optional)</Label>
				<Input
					id={ids.title}
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					maxLength={LIMITS.reviewTitle}
					placeholder="Sum up your review in a few words"
					disabled={submitting}
				/>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor={ids.body}>
					Your review <span className="text-rose-500">*</span>
				</Label>
				<Textarea
					id={ids.body}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					maxLength={LIMITS.reviewBody}
					rows={5}
					required
					placeholder="What did you like or dislike? Who would you recommend it to?"
					disabled={submitting}
				/>
				<p className="text-xs text-neutral-400 text-right tabular-nums">
					{body.length}/{LIMITS.reviewBody}
				</p>
			</div>

			<Honeypot value={website} onChange={setWebsite} />

			{error && (
				<p role="alert" className="text-sm text-rose-600">
					{error}
				</p>
			)}

			<div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
				<RecaptchaNotice />
				<div className="flex gap-2 sm:ml-auto">
					<Button
						type="button"
						variant="ghost"
						onClick={onCancel}
						disabled={submitting}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={submitting}
						className="bg-black hover:bg-neutral-800 text-white"
					>
						{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Submit review
					</Button>
				</div>
			</div>
		</form>
	);
}

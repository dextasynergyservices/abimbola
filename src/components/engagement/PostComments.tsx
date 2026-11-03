"use client";

import {
	BadgeCheck,
	CheckCircle2,
	Loader2,
	MessageCircle,
	Reply,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getRecaptchaError, useRecaptcha } from "@/hooks/use-recaptcha";
import { trackEvent } from "@/lib/analytics/track";
import {
	type CommentPage,
	EDIT_WINDOW_HOURS,
	LIMITS,
	type PublicComment,
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
	saveIdentity,
	saveOwnToken,
	useOwnToken,
} from "./shared";

interface PostCommentsProps {
	postId: string;
	initialPage: CommentPage;
}

export default function PostComments({
	postId,
	initialPage,
}: PostCommentsProps) {
	const [comments, setComments] = useState<PublicComment[]>(
		initialPage.comments,
	);
	const [total, setTotal] = useState(initialPage.total);
	const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
	const [loadingMore, setLoadingMore] = useState(false);
	const [replyingTo, setReplyingTo] = useState<string | null>(null);
	const [notice, setNotice] = useState<{
		id: string | null;
		text: string;
	} | null>(null);

	const loadMore = async () => {
		if (!nextCursor) return;
		setLoadingMore(true);
		try {
			const res = await fetch(
				`/api/posts/${postId}/comments?cursor=${nextCursor}`,
			);
			const data: CommentPage = await res.json();
			setComments((prev) => {
				const seen = new Set(prev.map((c) => c.id));
				return [...prev, ...data.comments.filter((c) => !seen.has(c.id))];
			});
			setNextCursor(data.nextCursor);
		} finally {
			setLoadingMore(false);
		}
	};

	const handlePublished = (comment: PublicComment) => {
		setTotal((t) => t + 1);
		if (comment.parentId) {
			setComments((prev) =>
				prev.map((c) =>
					c.id === comment.parentId
						? { ...c, replies: [...c.replies, comment] }
						: c,
				),
			);
			setReplyingTo(null);
			setNotice({ id: comment.parentId, text: "Your reply is now live." });
		} else {
			setComments((prev) => [comment, ...prev]);
			setNotice({
				id: null,
				text: "Thanks for joining the conversation! Your comment is now live.",
			});
		}
	};

	const handleHeld = (message: string, parentId: string | null) => {
		setReplyingTo(null);
		setNotice({ id: parentId, text: message });
	};

	/** Replace (or remove, when `after` is null) one comment or reply in the tree. */
	const replaceInTree = (
		target: PublicComment,
		after: PublicComment | null,
	) => {
		setComments((prev) => {
			if (!target.parentId) {
				return after
					? prev.map((c) =>
							c.id === target.id ? { ...after, replies: c.replies } : c,
						)
					: prev.filter((c) => c.id !== target.id);
			}
			return prev.map((c) =>
				c.id === target.parentId
					? {
							...c,
							replies: after
								? c.replies.map((r) => (r.id === target.id ? after : r))
								: c.replies.filter((r) => r.id !== target.id),
						}
					: c,
			);
		});
	};

	const handleUpdated = (
		before: PublicComment,
		after: PublicComment | null,
		message?: string,
	) => {
		replaceInTree(before, after);
		if (!after) setTotal((t) => Math.max(0, t - 1 - before.replies.length));
		setNotice({
			id: before.parentId,
			text: after
				? "Your comment has been updated."
				: message || "Your changes were saved.",
		});
	};

	const handleDeleted = (comment: PublicComment) => {
		replaceInTree(comment, null);
		// Deleting a top-level comment also removes its replies.
		setTotal((t) => Math.max(0, t - 1 - comment.replies.length));
		setNotice({ id: comment.parentId, text: "Your comment has been deleted." });
	};

	return (
		<section
			id="comments"
			aria-labelledby="comments-heading"
			className="mt-16 pt-10 border-t border-slate-200 scroll-mt-24"
		>
			<h2
				id="comments-heading"
				className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2"
			>
				<MessageCircle className="h-6 w-6 text-amber-500" />
				{total > 0 ? `${total} Comment${total === 1 ? "" : "s"}` : "Comments"}
			</h2>

			<div className="mt-6">
				{notice && notice.id === null && <Notice text={notice.text} />}
				<CommentForm
					postId={postId}
					parentId={null}
					onPublished={handlePublished}
					onHeld={(m) => handleHeld(m, null)}
				/>
			</div>

			{comments.length === 0 ? (
				<p className="text-sm text-slate-500 mt-8 text-center">
					No comments yet. Start the conversation.
				</p>
			) : (
				<ul className="mt-10 space-y-8">
					{comments.map((comment) => (
						<li key={comment.id}>
							<CommentItem
								postId={postId}
								comment={comment}
								onUpdated={handleUpdated}
								onDeleted={handleDeleted}
								onReply={() => {
									setReplyingTo((cur) =>
										cur === comment.id ? null : comment.id,
									);
									setNotice(null);
								}}
							/>
							{(comment.replies.length > 0 ||
								replyingTo === comment.id ||
								notice?.id === comment.id) && (
								<div className="ml-6 sm:ml-14 mt-5 pl-4 sm:pl-6 border-l-2 border-slate-100 space-y-5">
									{comment.replies.map((reply) => (
										<CommentItem
											key={reply.id}
											postId={postId}
											comment={reply}
											onUpdated={handleUpdated}
											onDeleted={handleDeleted}
											isReply
										/>
									))}
									{notice?.id === comment.id && <Notice text={notice.text} />}
									{replyingTo === comment.id && (
										<CommentForm
											postId={postId}
											parentId={comment.id}
											replyToName={comment.name}
											onPublished={handlePublished}
											onHeld={(m) => handleHeld(m, comment.id)}
											onCancel={() => setReplyingTo(null)}
										/>
									)}
								</div>
							)}
						</li>
					))}
				</ul>
			)}

			{nextCursor && (
				<div className="text-center mt-10">
					<Button variant="outline" onClick={loadMore} disabled={loadingMore}>
						{loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Load more comments
					</Button>
				</div>
			)}
		</section>
	);
}

function Notice({ text }: { text: string }) {
	return (
		<div
			role="status"
			className="flex items-start gap-3 p-4 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm"
		>
			<CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
			<span>{text}</span>
		</div>
	);
}

function CommentItem({
	postId,
	comment,
	isReply = false,
	onReply,
	onUpdated,
	onDeleted,
}: {
	postId: string;
	comment: PublicComment;
	isReply?: boolean;
	onReply?: () => void;
	onUpdated: (
		before: PublicComment,
		after: PublicComment | null,
		message?: string,
	) => void;
	onDeleted: (comment: PublicComment) => void;
}) {
	const [mode, setMode] = useState<"view" | "edit" | "confirm-delete">("view");
	const [draft, setDraft] = useState(comment.body);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const ownToken = useOwnToken(comment.id);
	const editId = useId();

	const call = async (method: "PATCH" | "DELETE") => {
		if (!ownToken) return;
		setBusy(true);
		setError(null);
		try {
			const res = await fetch(`/api/posts/${postId}/comments/${comment.id}`, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(
					method === "PATCH"
						? { token: ownToken, body: draft }
						: { token: ownToken },
				),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || "Something went wrong.");
			if (method === "DELETE") {
				removeOwnToken(comment.id);
				onDeleted(comment);
				return;
			}
			setMode("view");
			onUpdated(
				comment,
				data.status === "published" ? data.comment : null,
				data.message,
			);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setBusy(false);
		}
	};

	const replyCount = comment.replies.length;

	return (
		<article className="flex gap-3 sm:gap-4">
			<Avatar name={comment.name} highlight={comment.isAuthor} />
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<span className="font-semibold text-slate-900">{comment.name}</span>
					{comment.isAuthor && (
						<span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
							<BadgeCheck className="h-3 w-3" />
							Author
						</span>
					)}
					{ownToken && (
						<span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
							You
						</span>
					)}
					<time dateTime={comment.createdAt} className="text-xs text-slate-400">
						{formatRelative(comment.createdAt)}
						{comment.editedAt && " · edited"}
					</time>
				</div>

				{mode === "edit" ? (
					<form
						className="mt-2 space-y-2"
						onSubmit={(e) => {
							e.preventDefault();
							call("PATCH");
						}}
					>
						<Label htmlFor={editId} className="sr-only">
							Edit your comment
						</Label>
						<Textarea
							id={editId}
							value={draft}
							onChange={(e) => setDraft(e.target.value)}
							maxLength={LIMITS.commentBody}
							rows={4}
							disabled={busy}
							className="bg-white"
						/>
						<div className="flex gap-2 justify-end">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={busy}
								onClick={() => {
									setDraft(comment.body);
									setMode("view");
								}}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								size="sm"
								disabled={busy || draft.trim().length < 2}
								className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
							>
								{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Save
							</Button>
						</div>
					</form>
				) : (
					<p className="text-slate-700 leading-relaxed mt-1.5 whitespace-pre-line break-words">
						{comment.body}
					</p>
				)}

				{mode === "view" && (
					<div className="flex items-center gap-4">
						{!isReply && onReply && (
							<button
								type="button"
								onClick={onReply}
								className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
							>
								<Reply className="h-3.5 w-3.5" />
								Reply
							</button>
						)}
						{ownToken && (
							<OwnerActions
								canEdit={canStillEdit(comment.createdAt, EDIT_WINDOW_HOURS)}
								onEdit={() => setMode("edit")}
								onDelete={() => setMode("confirm-delete")}
							/>
						)}
					</div>
				)}

				{mode === "confirm-delete" && (
					<ConfirmDelete
						label={
							replyCount > 0
								? `Delete your comment and its ${replyCount} repl${replyCount === 1 ? "y" : "ies"}?`
								: "Delete your comment? This can't be undone."
						}
						busy={busy}
						onConfirm={() => call("DELETE")}
						onCancel={() => setMode("view")}
					/>
				)}
				{error && (
					<p role="alert" className="mt-2 text-sm text-rose-600">
						{error}
					</p>
				)}
			</div>
		</article>
	);
}

function CommentForm({
	postId,
	parentId,
	replyToName,
	onPublished,
	onHeld,
	onCancel,
}: {
	postId: string;
	parentId: string | null;
	replyToName?: string;
	onPublished: (c: PublicComment) => void;
	onHeld: (message: string) => void;
	onCancel?: () => void;
}) {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [body, setBody] = useState("");
	const [website, setWebsite] = useState("");
	const [expanded, setExpanded] = useState(Boolean(parentId));
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const startedAt = useRef(Date.now());
	const { preload, execute } = useRecaptcha();
	const ids = { name: useId(), email: useId(), body: useId() };

	useEffect(() => {
		const saved = loadIdentity();
		setName(saved.name);
		setEmail(saved.email);
		if (parentId) preload();
	}, [parentId, preload]);

	const submit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			const recaptchaToken = await execute("submit_comment");
			const res = await fetch(`/api/posts/${postId}/comments`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					email,
					body,
					parentId,
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
			trackEvent(parentId ? "comment-reply" : "comment-posted");
			setBody("");
			startedAt.current = Date.now();
			if (data.status === "published" && data.comment) {
				if (data.editToken) {
					saveOwnToken(data.comment.id, data.editToken, data.comment.createdAt);
				}
				onPublished(data.comment);
				if (!parentId) setExpanded(false);
			} else {
				onHeld(data.message || "Thanks! Your comment has been received.");
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
			className={`relative space-y-3 ${parentId ? "" : "rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"}`}
			noValidate
		>
			<Label htmlFor={ids.body} className="sr-only">
				{parentId ? `Reply to ${replyToName}` : "Your comment"}
			</Label>
			<Textarea
				id={ids.body}
				value={body}
				onChange={(e) => setBody(e.target.value)}
				onFocus={() => {
					setExpanded(true);
					preload();
				}}
				maxLength={LIMITS.commentBody}
				rows={expanded ? 4 : 2}
				placeholder={
					parentId ? `Reply to ${replyToName}…` : "Share your thoughts…"
				}
				disabled={submitting}
				className="bg-white"
				required
			/>

			{expanded && (
				<>
					<div className="grid sm:grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label htmlFor={ids.name} className="text-xs text-slate-600">
								Name <span className="text-rose-500">*</span>
							</Label>
							<Input
								id={ids.name}
								value={name}
								onChange={(e) => setName(e.target.value)}
								maxLength={LIMITS.name}
								autoComplete="name"
								required
								disabled={submitting}
								className="bg-white"
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor={ids.email} className="text-xs text-slate-600">
								Email{" "}
								<span className="text-slate-400">(optional, never shown)</span>
							</Label>
							<Input
								id={ids.email}
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								autoComplete="email"
								disabled={submitting}
								className="bg-white"
							/>
						</div>
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
							{onCancel && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={onCancel}
									disabled={submitting}
								>
									Cancel
								</Button>
							)}
							<Button
								type="submit"
								size="sm"
								disabled={submitting || body.trim().length < 2}
								className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
							>
								{submitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								{parentId ? "Post reply" : "Post comment"}
							</Button>
						</div>
					</div>
				</>
			)}
		</form>
	);
}

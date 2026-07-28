"use client";

import {
	ChevronLeft,
	ChevronRight,
	Clock,
	Edit,
	FileText,
	Plus,
	Search,
	Tags,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CategoryManagerModal } from "@/components/admin/CategoryManagerModal";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface PostItem {
	id: string;
	title: string;
	slug: string;
	excerpt?: string | null;
	status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
	updatedAt: string;
	publishedAt?: string | null;
	author?: {
		name: string;
		email: string;
	};
	category?: {
		id: string;
		name: string;
	} | null;
}

export default function AdminPostsPage() {
	const [posts, setPosts] = useState<PostItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");

	// Pagination
	const [page, setPage] = useState(1);
	const itemsPerPage = 10;

	// Dialog states
	const [unpublishTarget, setUnpublishTarget] = useState<PostItem | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<PostItem | null>(null);
	const [actionLoading, setActionLoading] = useState(false);
	const [categoryModalOpen, setCategoryModalOpen] = useState(false);

	const fetchPosts = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (search) params.set("query", search);
			if (statusFilter !== "ALL") params.set("status", statusFilter);

			const res = await fetch(`/api/admin/posts?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch blog posts");

			const data = await res.json();
			setPosts(data.posts || []);
		} catch (err: unknown) {
			console.error(err);
			toast.error((err as Error).message || "Failed to load posts");
		} finally {
			setLoading(false);
		}
	}, [search, statusFilter]);

	useEffect(() => {
		fetchPosts();
	}, [fetchPosts]);

	const handlePublishToggle = async (
		post: PostItem,
		targetStatus: "DRAFT" | "PUBLISHED",
	) => {
		setActionLoading(true);
		try {
			const res = await fetch(`/api/admin/posts/${post.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: post.title,
					slug: post.slug,
					excerpt: post.excerpt,
					body: "Post content...",
					status: targetStatus,
				}),
			});

			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || "Failed to update post status");
			}

			toast.success(
				targetStatus === "PUBLISHED"
					? "Post published successfully"
					: "Post moved to drafts",
			);
			setUnpublishTarget(null);
			await fetchPosts();
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to update status");
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeletePost = async (post: PostItem) => {
		setActionLoading(true);
		try {
			const res = await fetch(`/api/admin/posts/${post.id}`, {
				method: "DELETE",
			});

			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || "Failed to delete post");
			}

			toast.success(`Post "${post.title}" deleted`);
			setDeleteTarget(null);
			await fetchPosts();
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to delete post");
		} finally {
			setActionLoading(false);
		}
	};

	// Calculate paginated slice
	const totalPages = Math.ceil(posts.length / itemsPerPage) || 1;
	const paginatedPosts = posts.slice(
		(page - 1) * itemsPerPage,
		page * itemsPerPage,
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center space-x-2">
						<FileText className="h-6 w-6 text-amber-600" />
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
							Blog & News Posts
						</h1>
					</div>
					<p className="text-sm text-slate-500 mt-1">
						Create, edit, publish, and manage blog posts and news articles.
					</p>
				</div>

				<div className="flex items-center gap-2 self-end sm:self-auto">
					<Button
						variant="outline"
						onClick={() => setCategoryModalOpen(true)}
						className="border-slate-200 text-slate-700 min-h-[44px] sm:min-h-[38px]"
					>
						<Tags className="mr-1.5 h-4 w-4 text-amber-600" />
						Manage Categories
					</Button>
					<Button
						asChild
						className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-sm min-h-[44px] sm:min-h-[38px]"
					>
						<Link href="/admin/posts/new">
							<Plus className="mr-1.5 h-4 w-4 text-slate-950" />
							New Article
						</Link>
					</Button>
				</div>
			</div>

			{/* Search & Filters */}
			<Card className="p-4 bg-white border-slate-200 shadow-xs space-y-3">
				<div className="flex flex-col sm:flex-row items-center gap-3">
					<div className="relative flex-1 w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							placeholder="Search posts by title, slug, or excerpt..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
							className="pl-9 min-h-[44px] sm:min-h-[38px]"
						/>
					</div>

					<div className="w-full sm:w-44">
						<Select
							value={statusFilter}
							onValueChange={(val) => {
								setStatusFilter(val);
								setPage(1);
							}}
						>
							<SelectTrigger className="min-h-[44px] sm:min-h-[38px] bg-slate-50 border-slate-200 text-xs">
								<SelectValue placeholder="All Statuses" />
							</SelectTrigger>
							<SelectContent className="bg-white border-slate-200">
								<SelectItem value="ALL">All Statuses</SelectItem>
								<SelectItem value="DRAFT">Draft</SelectItem>
								<SelectItem value="PUBLISHED">Published</SelectItem>
								<SelectItem value="ARCHIVED">Archived</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
			</Card>

			{/* Content List / Table */}
			{loading ? (
				<Card className="p-6 border-slate-200 bg-white space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={`post-skel-${i}`} className="h-12 w-full" />
					))}
				</Card>
			) : posts.length === 0 ? (
				<Card className="p-12 text-center border-slate-200 bg-white shadow-xs">
					<FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
					<h3 className="text-lg font-semibold text-slate-900">
						No posts found
					</h3>
					<p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
						{search
							? `No posts matching "${search}". Try a different keyword.`
							: "No posts found in the database. Click 'New Article' to publish your first post."}
					</p>
				</Card>
			) : (
				<>
					{/* Desktop Table View */}
					<Card className="hidden md:block border-slate-200 bg-white overflow-hidden shadow-xs">
						<Table>
							<TableHeader className="bg-slate-50 border-b border-slate-200">
								<TableRow>
									<TableHead className="text-xs font-semibold text-slate-700">
										Article Title & Slug
									</TableHead>
									<TableHead className="w-32 text-xs font-semibold text-slate-700">
										Status
									</TableHead>
									<TableHead className="w-36 text-xs font-semibold text-slate-700">
										Category
									</TableHead>
									<TableHead className="w-40 text-xs font-semibold text-slate-700">
										Author
									</TableHead>
									<TableHead className="w-36 text-xs font-semibold text-slate-700">
										Last Updated
									</TableHead>
									<TableHead className="w-36 text-xs font-semibold text-slate-700 text-right">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedPosts.map((post) => (
									<TableRow key={post.id} className="hover:bg-slate-50/80">
										<TableCell>
											<div>
												<Link
													href={`/admin/posts/${post.id}/edit`}
													className="font-bold text-slate-900 text-sm hover:text-amber-600 transition-colors"
												>
													{post.title}
												</Link>
												<p className="text-xs text-slate-400 font-mono mt-0.5">
													/blog/{post.slug}
												</p>
											</div>
										</TableCell>

										<TableCell>
											<Badge
												variant="outline"
												className={`text-xs font-semibold ${
													post.status === "PUBLISHED"
														? "bg-emerald-50 text-emerald-700 border-emerald-200"
														: post.status === "DRAFT"
															? "bg-amber-50 text-amber-700 border-amber-200"
															: "bg-slate-100 text-slate-600 border-slate-200"
												}`}
											>
												{post.status}
											</Badge>
										</TableCell>

										<TableCell>
											{post.category ? (
												<Badge
													variant="outline"
													className="bg-slate-100 text-slate-700 border-slate-200 text-[11px]"
												>
													{post.category.name}
												</Badge>
											) : (
												<span className="text-xs text-slate-400">
													Uncategorized
												</span>
											)}
										</TableCell>

										<TableCell className="text-xs text-slate-700 font-medium">
											{post.author?.name || "Abimbola Lawuyi"}
										</TableCell>

										<TableCell className="text-xs text-slate-500">
											<div className="flex items-center space-x-1">
												<Clock className="h-3 w-3 text-slate-400" />
												<span>
													{new Date(post.updatedAt).toLocaleDateString()}
												</span>
											</div>
										</TableCell>

										<TableCell className="text-right">
											<div className="flex items-center justify-end space-x-1">
												{post.status === "PUBLISHED" ? (
													<Button
														variant="outline"
														size="sm"
														className="text-xs text-slate-700 border-slate-200 hover:bg-slate-100"
														onClick={() => setUnpublishTarget(post)}
													>
														Unpublish
													</Button>
												) : (
													<Button
														variant="outline"
														size="sm"
														className="text-xs text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
														onClick={() =>
															handlePublishToggle(post, "PUBLISHED")
														}
													>
														Publish
													</Button>
												)}

												<Button
													asChild
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-slate-600 hover:text-slate-900"
												>
													<Link href={`/admin/posts/${post.id}/edit`}>
														<Edit className="h-4 w-4" />
														<span className="sr-only">Edit article</span>
													</Link>
												</Button>

												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-slate-400 hover:text-rose-600"
													onClick={() => setDeleteTarget(post)}
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Delete article</span>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>

					{/* Mobile Cards View */}
					<div className="md:hidden space-y-3">
						{paginatedPosts.map((post) => (
							<Card
								key={post.id}
								className="p-4 border-slate-200 bg-white space-y-3 shadow-xs"
							>
								<div className="flex items-start justify-between">
									<div>
										<Link
											href={`/admin/posts/${post.id}/edit`}
											className="font-bold text-slate-900 text-base hover:text-amber-600"
										>
											{post.title}
										</Link>
										<p className="text-xs font-mono text-slate-400 mt-0.5">
											/blog/{post.slug}
										</p>
									</div>
									<Badge
										variant="outline"
										className={`text-xs font-semibold ${
											post.status === "PUBLISHED"
												? "bg-emerald-50 text-emerald-700 border-emerald-200"
												: "bg-amber-50 text-amber-700 border-amber-200"
										}`}
									>
										{post.status}
									</Badge>
								</div>

								<div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
									<span>{post.author?.name || "Author"}</span>
									<span>{new Date(post.updatedAt).toLocaleDateString()}</span>
								</div>

								<div className="flex items-center justify-end space-x-2 pt-2">
									{post.status === "PUBLISHED" ? (
										<Button
											variant="outline"
											size="sm"
											onClick={() => setUnpublishTarget(post)}
											className="text-xs border-slate-200 text-slate-700 min-h-[40px]"
										>
											Unpublish
										</Button>
									) : (
										<Button
											variant="outline"
											size="sm"
											onClick={() => handlePublishToggle(post, "PUBLISHED")}
											className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50 min-h-[40px]"
										>
											Publish
										</Button>
									)}

									<Button
										asChild
										variant="outline"
										size="sm"
										className="text-xs border-slate-200 text-amber-700 min-h-[40px]"
									>
										<Link href={`/admin/posts/${post.id}/edit`}>
											<Edit className="mr-1 h-3.5 w-3.5" />
											Edit
										</Link>
									</Button>
								</div>
							</Card>
						))}
					</div>

					{/* Pagination Bar */}
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
						<p className="text-xs text-slate-500">
							Showing {paginatedPosts.length} of {posts.length} articles (Page{" "}
							{page} of {totalPages})
						</p>

						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="min-h-[44px] sm:min-h-[38px] px-3"
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Previous
							</Button>

							<span className="text-xs font-semibold text-slate-700 px-2">
								{page} / {totalPages}
							</span>

							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								className="min-h-[44px] sm:min-h-[38px] px-3"
							>
								Next
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					</div>
				</>
			)}

			{/* Unpublish Confirmation Modal */}
			{unpublishTarget && (
				<AlertDialog
					open={!!unpublishTarget}
					onOpenChange={(open) => !open && setUnpublishTarget(null)}
				>
					<AlertDialogContent className="max-w-md w-[92vw] bg-white border-slate-200">
						<AlertDialogHeader>
							<AlertDialogTitle className="text-slate-900 font-bold">
								Unpublish post &ldquo;{unpublishTarget.title}&rdquo;?
							</AlertDialogTitle>
							<AlertDialogDescription className="text-slate-500 text-sm">
								Moving this article to DRAFT status will hide it from visitors
								on the public website.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className="mt-4">
							<AlertDialogCancel disabled={actionLoading}>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => handlePublishToggle(unpublishTarget, "DRAFT")}
								disabled={actionLoading}
								className="bg-amber-600 hover:bg-amber-700 text-white font-medium"
							>
								{actionLoading ? "Updating..." : "Unpublish Article"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}

			{/* Delete Confirmation Modal */}
			{deleteTarget && (
				<AlertDialog
					open={!!deleteTarget}
					onOpenChange={(open) => !open && setDeleteTarget(null)}
				>
					<AlertDialogContent className="max-w-md w-[92vw] bg-white border-slate-200">
						<AlertDialogHeader>
							<AlertDialogTitle className="text-slate-900 font-bold">
								Delete post &ldquo;{deleteTarget.title}&rdquo;?
							</AlertDialogTitle>
							<AlertDialogDescription className="text-slate-500 text-sm">
								This action performs a soft delete. The post record can be
								recovered if needed.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className="mt-4">
							<AlertDialogCancel disabled={actionLoading}>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => handleDeletePost(deleteTarget)}
								disabled={actionLoading}
								className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
							>
								{actionLoading ? "Deleting..." : "Delete Post"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}

			<CategoryManagerModal
				open={categoryModalOpen}
				onOpenChange={setCategoryModalOpen}
				kind="blog"
				onChanged={fetchPosts}
			/>
		</div>
	);
}

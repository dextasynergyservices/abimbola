"use client";

import {
	ArrowLeft,
	Image as ImageIcon,
	Loader2,
	Save,
	Upload,
	X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { UploadedMedia } from "@/hooks/useCloudinaryUpload";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

const RichTextEditor = dynamic(
	() => import("@/components/admin/RichTextEditor"),
	{
		ssr: false,
		loading: () => (
			<div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 min-h-[320px] flex items-center justify-center">
				<Loader2 className="h-5 w-5 animate-spin text-slate-400" />
			</div>
		),
	},
);

export default function EditPostScreen() {
	const params = useParams();
	const postId = params.id as string;
	const router = useRouter();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	// Post Fields
	const [title, setTitle] = useState("");
	const [slug, setSlug] = useState("");
	const [excerpt, setExcerpt] = useState("");
	const [body, setBody] = useState("");
	const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
		"DRAFT",
	);
	const [seoTitle, setSeoTitle] = useState("");
	const [seoDescription, setSeoDescription] = useState("");
	const [featuredImage, setFeaturedImage] = useState<UploadedMedia | null>(
		null,
	);
	const [categoryId, setCategoryId] = useState<string>("NONE");
	const [categories, setCategories] = useState<{ id: string; name: string }[]>(
		[],
	);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { uploading, upload } = useCloudinaryUpload();

	const fetchCategories = useCallback(async () => {
		try {
			const res = await fetch("/api/admin/blog-categories");
			if (!res.ok) return;
			const data = await res.json();
			setCategories(data.categories || []);
		} catch (err) {
			console.error(err);
		}
	}, []);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	useEffect(() => {
		async function fetchPost() {
			try {
				const res = await fetch(`/api/admin/posts/${postId}`);
				if (!res.ok) throw new Error("Failed to load article");
				const data = await res.json();
				const post = data.post;

				setTitle(post.title || "");
				setSlug(post.slug || "");
				setExcerpt(post.excerpt || "");
				setBody(post.body || "");
				setStatus(post.status || "DRAFT");
				setSeoTitle(post.seoTitle || "");
				setSeoDescription(post.seoDescription || "");
				setCategoryId(post.categoryId || "NONE");

				if (post.featuredImageId) {
					fetch(`/api/admin/media/${post.featuredImageId}`)
						.then((r) => r.json())
						.then((m) => {
							if (m.media) setFeaturedImage(m.media);
						})
						.catch(() => {});
				}
			} catch (err: unknown) {
				toast.error((err as Error).message || "Failed to load article");
			} finally {
				setLoading(false);
			}
		}

		if (postId) fetchPost();
	}, [postId]);

	const handleTitleChange = (val: string) => {
		setTitle(val);
	};

	const handleFileUpload = async (files: FileList | null) => {
		const media = await upload(files);
		if (media) setFeaturedImage(media);
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleSave = async (overrideStatus?: "DRAFT" | "PUBLISHED") => {
		if (!title.trim()) {
			toast.error("Article title is required");
			return;
		}
		if (!slug.trim()) {
			toast.error("Article slug is required");
			return;
		}
		if (!body.trim()) {
			toast.error("Article content body is required");
			return;
		}

		setSaving(true);
		const targetStatus = overrideStatus || status;

		try {
			const res = await fetch(`/api/admin/posts/${postId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: title.trim(),
					slug: slug.trim().toLowerCase(),
					excerpt: excerpt.trim() || null,
					body: body.trim(),
					status: targetStatus,
					seoTitle: seoTitle.trim() || null,
					seoDescription: seoDescription.trim() || null,
					featuredImageId: featuredImage?.id || null,
					categoryId: categoryId === "NONE" ? null : categoryId,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to save post");
			}

			setStatus(targetStatus);
			toast.success(
				targetStatus === "PUBLISHED"
					? "Article published successfully!"
					: "Article saved successfully!",
			);
			router.refresh();
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to save article");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="space-y-6 max-w-5xl mx-auto">
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-6xl mx-auto">
			{/* Top Header Navigation */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center space-x-3">
					<Button
						asChild
						variant="outline"
						size="icon"
						className="h-9 w-9 border-slate-200 bg-white text-slate-700"
					>
						<Link href="/admin/posts">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<div className="flex items-center space-x-2">
							<h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 truncate max-w-md">
								Edit Article: {title || "Untitled"}
							</h1>
							<Badge
								variant="outline"
								className={`text-xs font-semibold ${
									status === "PUBLISHED"
										? "bg-emerald-50 text-emerald-700 border-emerald-200"
										: "bg-amber-50 text-amber-700 border-amber-200"
								}`}
							>
								{status}
							</Badge>
						</div>
						<p className="text-xs text-slate-500 font-mono mt-0.5">
							/blog/{slug}
						</p>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
					{status === "DRAFT" && (
						<Button
							type="button"
							variant="outline"
							onClick={() => handleSave("PUBLISHED")}
							disabled={saving}
							className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 min-h-[44px]"
						>
							Publish Article
						</Button>
					)}

					<Button
						type="button"
						onClick={() => handleSave()}
						disabled={saving}
						className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs min-h-[44px]"
					>
						<Save className="mr-1.5 h-4 w-4 text-slate-950" />
						{saving ? "Saving..." : "Save Changes"}
					</Button>
				</div>
			</div>

			{/* Main Grid Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Main Content Editor */}
				<div className="lg:col-span-2 space-y-6">
					<Card className="border-slate-200 bg-white p-6 space-y-4 shadow-sm">
						<h2 className="text-lg font-semibold text-slate-900">
							Article Details
						</h2>

						<div className="space-y-4">
							<div>
								<Label
									htmlFor="post-title"
									className="text-slate-700 font-medium"
								>
									Article Title <span className="text-rose-500">*</span>
								</Label>
								<Input
									id="post-title"
									value={title}
									onChange={(e) => handleTitleChange(e.target.value)}
									placeholder="e.g. The Art of Mindful Reading"
									className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 font-semibold min-h-[44px]"
								/>
							</div>

							<div>
								<Label
									htmlFor="post-excerpt"
									className="text-slate-700 font-medium"
								>
									Excerpt / Summary
								</Label>
								<Textarea
									id="post-excerpt"
									rows={3}
									value={excerpt}
									onChange={(e) => setExcerpt(e.target.value)}
									placeholder="Short summary displayed on blog list cards..."
									className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 text-sm"
								/>
							</div>

							<div>
								<Label
									htmlFor="post-body"
									className="text-slate-700 font-medium"
								>
									Article Body Content <span className="text-rose-500">*</span>
								</Label>
								<RichTextEditor
									value={body}
									onChange={setBody}
									placeholder="Write your article content here..."
								/>
							</div>
						</div>
					</Card>
				</div>

				{/* Right Sidebar Metadata */}
				<div className="space-y-6">
					{/* Status Control */}
					<Card className="border-slate-200 bg-white p-6 space-y-4 shadow-sm">
						<h2 className="text-lg font-semibold text-slate-900">
							Publish Status
						</h2>
						<div>
							<Label
								htmlFor="post-status"
								className="text-slate-700 font-medium"
							>
								Status
							</Label>
							<Select
								value={status}
								onValueChange={(val: "DRAFT" | "PUBLISHED" | "ARCHIVED") =>
									setStatus(val)
								}
							>
								<SelectTrigger
									id="post-status"
									className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px]"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="bg-white border-slate-200 text-slate-800">
									<SelectItem value="DRAFT">Draft</SelectItem>
									<SelectItem value="PUBLISHED">Published</SelectItem>
									<SelectItem value="ARCHIVED">Archived</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<Label
								htmlFor="post-category"
								className="text-slate-700 font-medium"
							>
								Category
							</Label>
							<Select value={categoryId} onValueChange={setCategoryId}>
								<SelectTrigger
									id="post-category"
									className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px]"
								>
									<SelectValue placeholder="Uncategorized" />
								</SelectTrigger>
								<SelectContent className="bg-white border-slate-200 text-slate-800">
									<SelectItem value="NONE">Uncategorized</SelectItem>
									{categories.map((cat) => (
										<SelectItem key={cat.id} value={cat.id}>
											{cat.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</Card>

					{/* Featured Image — Direct Upload */}
					<Card className="border-slate-200 bg-white p-6 space-y-4 shadow-sm">
						<h2 className="text-lg font-semibold text-slate-900">
							Featured Image
						</h2>
						{featuredImage ? (
							<div className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
								<Image
									src={featuredImage.secureUrl}
									alt={featuredImage.altText || title}
									fill
									className="object-cover"
								/>
								<button
									type="button"
									onClick={() => setFeaturedImage(null)}
									className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/70 text-white hover:bg-rose-600 transition-colors"
								>
									<X className="h-4 w-4" />
								</button>
								<label className="absolute bottom-2 left-2 cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-950/90 text-white text-xs font-medium px-3 py-1.5 transition-colors">
									<Upload className="h-3.5 w-3.5" />
									Change Image
									<input
										type="file"
										accept="image/*"
										disabled={uploading}
										className="hidden"
										onChange={(e) => handleFileUpload(e.target.files)}
									/>
								</label>
							</div>
						) : (
							<label
								className={`flex flex-col items-center justify-center w-full min-h-[120px] rounded-lg border-2 border-dashed transition-colors cursor-pointer ${uploading ? "border-amber-400 bg-amber-50/50" : "border-slate-300 hover:border-amber-500 hover:bg-amber-50/30"}`}
							>
								{uploading ? (
									<div className="flex flex-col items-center gap-2 text-amber-600">
										<Loader2 className="h-6 w-6 animate-spin" />
										<span className="text-sm font-medium">Uploading...</span>
									</div>
								) : (
									<div className="flex flex-col items-center gap-2 text-slate-500">
										<ImageIcon className="h-8 w-8 text-amber-500" />
										<span className="text-sm font-medium">
											Click to upload image
										</span>
										<span className="text-xs text-slate-400">
											JPG, PNG, WebP supported
										</span>
									</div>
								)}
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									disabled={uploading}
									className="hidden"
									onChange={(e) => handleFileUpload(e.target.files)}
								/>
							</label>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
}

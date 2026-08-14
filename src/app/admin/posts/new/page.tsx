"use client";

import {
	ArrowLeft,
	Image as ImageIcon,
	Loader2,
	PenLine,
	Plus,
	Upload,
	X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { UploadedMedia } from "@/hooks/useCloudinaryUpload";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { DEFAULT_AUTHOR_PROFILE } from "@/lib/author";

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

export default function CreatePostScreen() {
	const router = useRouter();
	const [saving, setSaving] = useState(false);

	// Post Fields
	const [title, setTitle] = useState("");
	const [slug, setSlug] = useState("");
	const [excerpt, setExcerpt] = useState("");
	const [body, setBody] = useState("");
	const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
		"DRAFT",
	);
	const [featuredImage, setFeaturedImage] = useState<UploadedMedia | null>(
		null,
	);
	const [categoryId, setCategoryId] = useState<string>("NONE");
	const [categories, setCategories] = useState<{ id: string; name: string }[]>(
		[],
	);

	// Author Bio Fields (Pre-filled with site defaults)
	const [showAuthorBio, setShowAuthorBio] = useState(true);
	const [authorName, setAuthorName] = useState(DEFAULT_AUTHOR_PROFILE.name);
	const [authorInitials, setAuthorInitials] = useState(
		DEFAULT_AUTHOR_PROFILE.initials,
	);
	const [authorBio, setAuthorBio] = useState(DEFAULT_AUTHOR_PROFILE.bio);

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

	// Auto-slug generator from Title
	const handleTitleChange = (val: string) => {
		setTitle(val);
		if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
			setSlug(
				val
					.toLowerCase()
					.trim()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/^-+|-+$/g, ""),
			);
		}
	};

	const handleFileUpload = async (files: FileList | null) => {
		const media = await upload(files);
		if (media) setFeaturedImage(media);
		// Reset file input so same file can be re-uploaded
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	const handleCreate = async () => {
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

		try {
			const res = await fetch("/api/admin/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: title.trim(),
					slug: slug.trim().toLowerCase(),
					excerpt: excerpt.trim() || null,
					body: body.trim(),
					status,
					featuredImageId: featuredImage?.id || null,
					categoryId: categoryId === "NONE" ? null : categoryId,
					authorName: showAuthorBio ? authorName.trim() || null : null,
					authorInitials: showAuthorBio
						? authorInitials.trim().toUpperCase() || null
						: null,
					authorBio: showAuthorBio ? authorBio.trim() || null : "",
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to create post");
			}

			toast.success("Article created successfully!");
			router.push("/admin/posts");
			router.refresh();
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to create article");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-6 max-w-6xl mx-auto">
			{/* Header Navigation */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center space-x-3">
					<button
						type="button"
						onClick={() => {
							if (typeof window !== "undefined") {
								const startUrl = window.location.href;
								if (document.referrer?.includes(window.location.host)) {
									window.history.back();
									setTimeout(() => {
										if (window.location.href === startUrl) {
											router.push("/admin/posts");
										}
									}, 150);
								} else {
									router.push("/admin/posts");
								}
							}
						}}
						className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-900 text-xs font-semibold rounded-full border border-slate-200 hover:border-amber-300 transition-all duration-200 shadow-xs cursor-pointer"
					>
						<ArrowLeft className="h-4 w-4" />
						<span>Back</span>
					</button>
					<div>
						<h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
							Create New Article
						</h1>
						<p className="text-xs text-slate-500 mt-0.5">
							Write and publish blog posts, reflections, and news updates.
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 self-end sm:self-auto">
					<Button
						type="button"
						onClick={handleCreate}
						disabled={saving}
						className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs min-h-[44px]"
					>
						<Plus className="mr-1.5 h-4 w-4 text-slate-950" />
						{saving ? "Creating..." : "Save & Create Article"}
					</Button>
				</div>
			</div>

			{/* Main Form Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Main Content Editor */}
				<div className="lg:col-span-2 space-y-6">
					<Card className="border-slate-200 bg-white p-6 space-y-4 shadow-sm">
						<h2 className="text-lg font-semibold text-slate-900">
							Article Information
						</h2>

						<div className="space-y-4">
							<div>
								<Label
									htmlFor="create-post-title"
									className="text-slate-700 font-medium"
								>
									Article Title <span className="text-rose-500">*</span>
								</Label>
								<Input
									id="create-post-title"
									value={title}
									onChange={(e) => handleTitleChange(e.target.value)}
									placeholder="e.g. The Art of Mindful Reading"
									className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 font-semibold min-h-[44px]"
								/>
							</div>

							<div>
								<Label
									htmlFor="create-post-excerpt"
									className="text-slate-700 font-medium"
								>
									Excerpt / Summary
								</Label>
								<Textarea
									id="create-post-excerpt"
									rows={3}
									value={excerpt}
									onChange={(e) => setExcerpt(e.target.value)}
									placeholder="Short summary displayed on blog list cards..."
									className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 text-sm"
								/>
							</div>

							<div>
								<Label
									htmlFor="create-post-body"
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
								htmlFor="create-post-status"
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
									id="create-post-status"
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
								htmlFor="create-post-category"
								className="text-slate-700 font-medium"
							>
								Category
							</Label>
							<Select value={categoryId} onValueChange={setCategoryId}>
								<SelectTrigger
									id="create-post-category"
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
								{/* Change image button */}
								<label className="absolute bottom-2 left-2 cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-950/90 text-white text-xs font-medium px-3 py-1.5 transition-colors">
									<Upload className="h-3.5 w-3.5" />
									Change
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

					{/* Blog Author Bio Card */}
					<Card className="border-slate-200 bg-white p-6 space-y-4 shadow-sm">
						<div className="flex items-center justify-between">
							<h2 className="text-lg font-semibold text-slate-900 flex items-center">
								<PenLine className="h-5 w-5 mr-2 text-amber-600" />
								Author Bio Card
							</h2>
							<div className="flex items-center space-x-2">
								<Switch
									id="create-post-toggle-author-bio"
									checked={showAuthorBio}
									onCheckedChange={setShowAuthorBio}
								/>
								<Label
									htmlFor="create-post-toggle-author-bio"
									className="text-xs text-slate-600 font-medium cursor-pointer"
								>
									{showAuthorBio ? "Include Card" : "Hide Card"}
								</Label>
							</div>
						</div>

						{showAuthorBio ? (
							<div className="space-y-4 pt-2">
								<div className="grid grid-cols-1 sm:grid-cols-[1fr_90px] gap-3">
									<div>
										<Label
											htmlFor="create-post-author-name"
											className="text-xs font-medium text-slate-700"
										>
											Author Name
										</Label>
										<Input
											id="create-post-author-name"
											value={authorName}
											onChange={(e) => setAuthorName(e.target.value)}
											placeholder={DEFAULT_AUTHOR_PROFILE.name}
											className="mt-1 bg-slate-50 border-slate-200 text-slate-900 text-sm"
										/>
									</div>
									<div>
										<Label
											htmlFor="create-post-author-initials"
											className="text-xs font-medium text-slate-700"
										>
											Initials
										</Label>
										<Input
											id="create-post-author-initials"
											maxLength={3}
											value={authorInitials}
											onChange={(e) => setAuthorInitials(e.target.value)}
											placeholder={DEFAULT_AUTHOR_PROFILE.initials}
											className="mt-1 bg-slate-50 border-slate-200 text-slate-900 text-sm uppercase"
										/>
									</div>
								</div>

								<div>
									<Label
										htmlFor="create-post-author-bio"
										className="text-xs font-medium text-slate-700"
									>
										Author Bio
									</Label>
									<Textarea
										id="create-post-author-bio"
										rows={3}
										value={authorBio}
										onChange={(e) => setAuthorBio(e.target.value)}
										placeholder="Write bio for this article..."
										className="mt-1 bg-slate-50 border-slate-200 text-slate-900 text-xs leading-relaxed"
									/>
									<p className="mt-1 text-[11px] text-slate-500">
										If cleared or disabled, the bio layout will be hidden for
										this post.
									</p>
								</div>

								{/* Live Preview */}
								<div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-start space-x-3 text-xs">
									<div className="h-9 w-9 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-sm shrink-0">
										{(authorInitials || "AL").trim().toUpperCase()}
									</div>
									<div className="space-y-0.5 min-w-0">
										<h4 className="font-display font-bold text-slate-900 truncate">
											Written by {authorName || "Abimbola Lawuyi"}
										</h4>
										<p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3">
											{authorBio || "(Bio text here...)"}
										</p>
									</div>
								</div>
							</div>
						) : (
							<p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
								The &quot;Written by&quot; author bio card will be completely
								hidden for this article.
							</p>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
}

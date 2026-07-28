"use client";

import { ArrowLeft, Image as ImageIcon, Loader2, Save, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
	BookPriceEditor,
	type BookPriceType,
	createDefaultPriceRows,
	type PriceFormRow,
} from "@/components/admin/BookPriceEditor";
import {
	type MediaItem,
	MediaPickerModal,
} from "@/components/admin/MediaPickerModal";
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
import { Textarea } from "@/components/ui/textarea";

interface BookCategory {
	id: string;
	name: string;
}

interface BookFormProps {
	bookId?: string;
}

export function BookForm({ bookId }: BookFormProps) {
	const router = useRouter();
	const isEdit = Boolean(bookId);
	const [loadingInitial, setLoadingInitial] = useState(isEdit);
	const [saving, setSaving] = useState(false);

	const [title, setTitle] = useState("");
	const [slug, setSlug] = useState("");
	const [author, setAuthor] = useState("Abimbola Lawuyi");
	const [description, setDescription] = useState("");
	const [rating, setRating] = useState("5");
	const [publisher, setPublisher] = useState("");
	const [publicationDate, setPublicationDate] = useState("");
	const [categoryId, setCategoryId] = useState<string>("NONE");
	const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
		"DRAFT",
	);
	const [coverImage, setCoverImage] = useState<MediaItem | null>(null);
	const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
	const [categories, setCategories] = useState<BookCategory[]>([]);
	const [priceRows, setPriceRows] = useState(createDefaultPriceRows());

	const fetchCategories = useCallback(async () => {
		try {
			const res = await fetch("/api/admin/book-categories");
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
		if (!bookId) return;
		(async () => {
			try {
				const res = await fetch(`/api/admin/books/${bookId}`);
				if (!res.ok) throw new Error("Failed to load book");
				const data = await res.json();
				const book = data.book;

				setTitle(book.title);
				setSlug(book.slug);
				setAuthor(book.author || "Abimbola Lawuyi");
				setDescription(book.description || "");
				setRating(String(book.rating ?? 5));
				setPublisher(book.publisher || "");
				setPublicationDate(book.publicationDate || "");
				setCategoryId(book.categoryId || "NONE");
				setStatus(book.status);

				if (book.coverImageId) {
					const mediaRes = await fetch(
						`/api/admin/media/${book.coverImageId}`,
					).catch(() => null);
					if (mediaRes?.ok) {
						const mediaData = await mediaRes.json();
						setCoverImage(mediaData.media);
					}
				}

				const rows = createDefaultPriceRows();
				for (const p of book.prices || []) {
					rows[p.type as BookPriceType] = {
						type: p.type,
						enabled: true,
						amount: p.amount != null ? String(p.amount) : "",
					};
				}
				setPriceRows(rows);
			} catch (err) {
				console.error(err);
				toast.error("Failed to load book details");
			} finally {
				setLoadingInitial(false);
			}
		})();
	}, [bookId]);

	const handleTitleChange = (val: string) => {
		setTitle(val);
		if (isEdit) return;
		setSlug(
			val
				.toLowerCase()
				.trim()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-+|-+$/g, ""),
		);
	};

	const handlePriceChange = (
		type: BookPriceType,
		patch: Partial<PriceFormRow>,
	) => {
		setPriceRows((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
	};

	const handleSave = async () => {
		if (!title.trim()) {
			toast.error("Book title is required");
			return;
		}
		if (!slug.trim()) {
			toast.error("Book slug is required");
			return;
		}

		const enabledPrices = Object.values(priceRows).filter((r) => r.enabled);
		for (const row of enabledPrices) {
			if (
				(row.type === "HARD_COPY" || row.type === "SOFT_COPY") &&
				(!row.amount || Number(row.amount) <= 0)
			) {
				toast.error(`Enter a valid amount for ${row.type.replace("_", " ")}`);
				return;
			}
		}

		setSaving(true);
		try {
			const payload = {
				title: title.trim(),
				slug: slug.trim().toLowerCase(),
				author: author.trim() || "Abimbola Lawuyi",
				description: description.trim() || null,
				rating: rating ? Number(rating) : null,
				publisher: publisher.trim() || null,
				publicationDate: publicationDate.trim() || null,
				coverImageId: coverImage?.id || null,
				categoryId: categoryId === "NONE" ? null : categoryId,
				status,
				prices: enabledPrices.map((row) => ({
					type: row.type,
					amount:
						row.type === "HARD_COPY" || row.type === "SOFT_COPY"
							? Number(row.amount)
							: null,
					available: true,
				})),
			};

			const res = await fetch(
				isEdit ? `/api/admin/books/${bookId}` : "/api/admin/books",
				{
					method: isEdit ? "PATCH" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);

			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to save book");
			}

			toast.success(
				isEdit ? "Book updated successfully!" : "Book created successfully!",
			);
			router.push("/admin/books");
			router.refresh();
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to save book");
		} finally {
			setSaving(false);
		}
	};

	if (loadingInitial) {
		return (
			<div className="flex items-center justify-center py-24 text-slate-400">
				<Loader2 className="h-6 w-6 animate-spin mr-2" />
				Loading book...
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-6xl mx-auto">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center space-x-3">
					<Button
						asChild
						variant="outline"
						size="icon"
						className="h-9 w-9 border-slate-200 bg-white text-slate-700"
					>
						<Link href="/admin/books">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
							{isEdit ? "Edit Book" : "Add New Book"}
						</h1>
						<p className="text-xs text-slate-500 mt-0.5">
							Manage book details, category, cover image, and pricing.
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2 self-end sm:self-auto">
					<Button
						type="button"
						onClick={handleSave}
						disabled={saving}
						className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs min-h-[44px]"
					>
						<Save className="mr-1.5 h-4 w-4 text-slate-950" />
						{saving ? "Saving..." : isEdit ? "Save Changes" : "Create Book"}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 space-y-6">
					<Card className="border-slate-200 bg-white p-6 space-y-4 shadow-sm">
						<h2 className="text-lg font-semibold text-slate-900">
							Book Information
						</h2>

						<div className="space-y-4">
							<div>
								<Label
									htmlFor="book-title"
									className="text-slate-700 font-medium"
								>
									Title <span className="text-rose-500">*</span>
								</Label>
								<Input
									id="book-title"
									value={title}
									onChange={(e) => handleTitleChange(e.target.value)}
									placeholder="e.g. Dear Single"
									className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 font-semibold min-h-[44px]"
								/>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<Label
										htmlFor="book-author"
										className="text-slate-700 font-medium"
									>
										Author
									</Label>
									<Input
										id="book-author"
										value={author}
										onChange={(e) => setAuthor(e.target.value)}
										className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px]"
									/>
								</div>
								<div>
									<Label
										htmlFor="book-rating"
										className="text-slate-700 font-medium"
									>
										Rating (0-5)
									</Label>
									<Input
										id="book-rating"
										type="number"
										min={0}
										max={5}
										step={0.1}
										value={rating}
										onChange={(e) => setRating(e.target.value)}
										className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px]"
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div>
									<Label
										htmlFor="book-publisher"
										className="text-slate-700 font-medium"
									>
										Publisher
									</Label>
									<Input
										id="book-publisher"
										value={publisher}
										onChange={(e) => setPublisher(e.target.value)}
										placeholder="Abimbola Lawuyi Publishing"
										className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px]"
									/>
								</div>
								<div>
									<Label
										htmlFor="book-pubdate"
										className="text-slate-700 font-medium"
									>
										Publication Date
									</Label>
									<Input
										id="book-pubdate"
										value={publicationDate}
										onChange={(e) => setPublicationDate(e.target.value)}
										placeholder="2026"
										className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 min-h-[44px]"
									/>
								</div>
							</div>

							<div>
								<Label
									htmlFor="book-description"
									className="text-slate-700 font-medium"
								>
									Description
								</Label>
								<Textarea
									id="book-description"
									rows={6}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Book synopsis shown on the detail page..."
									className="mt-1.5 bg-slate-50 border-slate-200 text-slate-900 text-sm leading-relaxed"
								/>
							</div>
						</div>
					</Card>

					<Card className="border-slate-200 bg-white p-6 space-y-4 shadow-sm">
						<h2 className="text-lg font-semibold text-slate-900">Pricing</h2>
						<p className="text-xs text-slate-500 -mt-2">
							Enable one or more formats. Toggled-off formats won&apos;t be
							shown to visitors.
						</p>
						<BookPriceEditor rows={priceRows} onChange={handlePriceChange} />
					</Card>
				</div>

				<div className="space-y-6">
					<Card className="border-slate-200 bg-white p-6 space-y-4 shadow-sm">
						<h2 className="text-lg font-semibold text-slate-900">
							Publish Status
						</h2>
						<div>
							<Label
								htmlFor="book-status"
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
									id="book-status"
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
								htmlFor="book-category"
								className="text-slate-700 font-medium"
							>
								Category
							</Label>
							<Select value={categoryId} onValueChange={setCategoryId}>
								<SelectTrigger
									id="book-category"
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

					<Card className="border-slate-200 bg-white p-6 space-y-4 shadow-sm">
						<h2 className="text-lg font-semibold text-slate-900">
							Cover Image
						</h2>
						{coverImage ? (
							<div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
								<Image
									src={coverImage.secureUrl}
									alt={coverImage.altText || title}
									fill
									className="object-cover"
								/>
								<button
									type="button"
									onClick={() => setCoverImage(null)}
									className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/70 text-white hover:bg-rose-600 transition-colors"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						) : (
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsImagePickerOpen(true)}
								className="w-full min-h-[44px] border-dashed border-slate-300 text-slate-600 hover:text-amber-700 hover:bg-amber-50/50"
							>
								<ImageIcon className="h-4 w-4 mr-2 text-amber-600" />
								Select Cover Image
							</Button>
						)}
					</Card>
				</div>
			</div>

			<MediaPickerModal
				open={isImagePickerOpen}
				onOpenChange={setIsImagePickerOpen}
				onSelectImage={(media) => setCoverImage(media)}
				selectedImageId={coverImage?.id}
				title="Select Book Cover Image"
			/>
		</div>
	);
}

"use client";

import {
	BookOpen,
	ChevronLeft,
	ChevronRight,
	Clock,
	Edit,
	Plus,
	Search,
	Tags,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PRICE_TYPE_LABELS } from "@/components/admin/BookPriceEditor";
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

interface BookCategory {
	id: string;
	name: string;
}

interface BookPrice {
	type: "HARD_COPY" | "SOFT_COPY" | "FREE" | "COMING_SOON";
	amount: number | null;
	available: boolean;
}

interface BookItem {
	id: string;
	title: string;
	slug: string;
	status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
	updatedAt: string;
	category?: BookCategory | null;
	prices: BookPrice[];
}

export default function AdminBooksPage() {
	const [books, setBooks] = useState<BookItem[]>([]);
	const [categories, setCategories] = useState<BookCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("ALL");
	const [categoryFilter, setCategoryFilter] = useState("ALL");
	const [categoryModalOpen, setCategoryModalOpen] = useState(false);

	const [page, setPage] = useState(1);
	const itemsPerPage = 10;

	const [deleteTarget, setDeleteTarget] = useState<BookItem | null>(null);
	const [actionLoading, setActionLoading] = useState(false);

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

	const fetchBooks = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (search) params.set("query", search);
			if (statusFilter !== "ALL") params.set("status", statusFilter);
			if (categoryFilter !== "ALL") params.set("categoryId", categoryFilter);

			const res = await fetch(`/api/admin/books?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch books");

			const data = await res.json();
			setBooks(data.books || []);
		} catch (err: unknown) {
			console.error(err);
			toast.error((err as Error).message || "Failed to load books");
		} finally {
			setLoading(false);
		}
	}, [search, statusFilter, categoryFilter]);

	useEffect(() => {
		fetchCategories();
	}, [fetchCategories]);

	useEffect(() => {
		fetchBooks();
	}, [fetchBooks]);

	const handleDeleteBook = async (book: BookItem) => {
		setActionLoading(true);
		try {
			const res = await fetch(`/api/admin/books/${book.id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const errJson = await res.json().catch(() => ({}));
				throw new Error(errJson.error || "Failed to delete book");
			}
			toast.success(`"${book.title}" deleted`);
			setDeleteTarget(null);
			await fetchBooks();
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to delete book");
		} finally {
			setActionLoading(false);
		}
	};

	const priceSummary = (prices: BookPrice[]) => {
		if (prices.length === 0) return "No pricing set";
		return prices
			.map((p) =>
				p.type === "HARD_COPY" || p.type === "SOFT_COPY"
					? `${PRICE_TYPE_LABELS[p.type]}: ₦${(p.amount || 0).toLocaleString()}`
					: PRICE_TYPE_LABELS[p.type],
			)
			.join(" · ");
	};

	const totalPages = Math.ceil(books.length / itemsPerPage) || 1;
	const paginatedBooks = books.slice(
		(page - 1) * itemsPerPage,
		page * itemsPerPage,
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<div className="flex items-center space-x-2">
						<BookOpen className="h-6 w-6 text-amber-600" />
						<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
							Books
						</h1>
					</div>
					<p className="text-sm text-slate-500 mt-1">
						Manage your book catalog, categories, and pricing.
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
						<Link href="/admin/books/new">
							<Plus className="mr-1.5 h-4 w-4 text-slate-950" />
							New Book
						</Link>
					</Button>
				</div>
			</div>

			<Card className="p-4 bg-white border-slate-200 shadow-xs space-y-3">
				<div className="flex flex-col sm:flex-row items-center gap-3">
					<div className="relative flex-1 w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							placeholder="Search books by title, slug, or author..."
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

				<div className="flex gap-2 flex-wrap">
					<Button
						key="all"
						variant={categoryFilter === "ALL" ? "default" : "outline"}
						size="sm"
						onClick={() => {
							setCategoryFilter("ALL");
							setPage(1);
						}}
						className={
							categoryFilter === "ALL"
								? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
								: "border-slate-200 text-slate-700"
						}
					>
						All Categories
					</Button>
					{categories.map((cat) => (
						<Button
							key={cat.id}
							variant={categoryFilter === cat.id ? "default" : "outline"}
							size="sm"
							onClick={() => {
								setCategoryFilter(cat.id);
								setPage(1);
							}}
							className={
								categoryFilter === cat.id
									? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
									: "border-slate-200 text-slate-700"
							}
						>
							{cat.name}
						</Button>
					))}
				</div>
			</Card>

			{loading ? (
				<Card className="p-6 border-slate-200 bg-white space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={`book-skel-${i}`} className="h-12 w-full" />
					))}
				</Card>
			) : books.length === 0 ? (
				<Card className="p-12 text-center border-slate-200 bg-white shadow-xs">
					<BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
					<h3 className="text-lg font-semibold text-slate-900">
						No books found
					</h3>
					<p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
						{search
							? `No books matching "${search}".`
							: "Click 'New Book' to add your first title."}
					</p>
				</Card>
			) : (
				<>
					<Card className="hidden md:block border-slate-200 bg-white overflow-hidden shadow-xs">
						<Table>
							<TableHeader className="bg-slate-50 border-b border-slate-200">
								<TableRow>
									<TableHead className="text-xs font-semibold text-slate-700">
										Title
									</TableHead>
									<TableHead className="w-40 text-xs font-semibold text-slate-700">
										Category
									</TableHead>
									<TableHead className="text-xs font-semibold text-slate-700">
										Pricing
									</TableHead>
									<TableHead className="w-28 text-xs font-semibold text-slate-700">
										Status
									</TableHead>
									<TableHead className="w-36 text-xs font-semibold text-slate-700 text-right">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paginatedBooks.map((book) => (
									<TableRow key={book.id} className="hover:bg-slate-50/80">
										<TableCell>
											<Link
												href={`/admin/books/${book.id}/edit`}
												className="font-bold text-slate-900 text-sm hover:text-amber-600 transition-colors"
											>
												{book.title}
											</Link>
											<p className="text-xs text-slate-400 mt-0.5 flex items-center">
												<Clock className="h-3 w-3 mr-1" />
												{new Date(book.updatedAt).toLocaleDateString()}
											</p>
										</TableCell>
										<TableCell>
											{book.category ? (
												<Badge
													variant="outline"
													className="bg-slate-100 text-slate-700 border-slate-200 text-[11px]"
												>
													{book.category.name}
												</Badge>
											) : (
												<span className="text-xs text-slate-400">
													Uncategorized
												</span>
											)}
										</TableCell>
										<TableCell className="text-xs text-slate-600">
											{priceSummary(book.prices)}
										</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={`text-xs font-semibold ${
													book.status === "PUBLISHED"
														? "bg-emerald-50 text-emerald-700 border-emerald-200"
														: book.status === "DRAFT"
															? "bg-amber-50 text-amber-700 border-amber-200"
															: "bg-slate-100 text-slate-600 border-slate-200"
												}`}
											>
												{book.status}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end space-x-1">
												<Button
													asChild
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-slate-600 hover:text-slate-900"
												>
													<Link href={`/admin/books/${book.id}/edit`}>
														<Edit className="h-4 w-4" />
														<span className="sr-only">Edit book</span>
													</Link>
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-slate-400 hover:text-rose-600"
													onClick={() => setDeleteTarget(book)}
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Delete book</span>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</Card>

					<div className="md:hidden space-y-3">
						{paginatedBooks.map((book) => (
							<Card
								key={book.id}
								className="p-4 border-slate-200 bg-white space-y-3 shadow-xs"
							>
								<div className="flex items-start justify-between">
									<div>
										<Link
											href={`/admin/books/${book.id}/edit`}
											className="font-bold text-slate-900 text-base hover:text-amber-600"
										>
											{book.title}
										</Link>
										{book.category && (
											<p className="text-xs text-slate-500 mt-0.5">
												{book.category.name}
											</p>
										)}
									</div>
									<Badge
										variant="outline"
										className={`text-xs font-semibold ${
											book.status === "PUBLISHED"
												? "bg-emerald-50 text-emerald-700 border-emerald-200"
												: "bg-amber-50 text-amber-700 border-amber-200"
										}`}
									>
										{book.status}
									</Badge>
								</div>
								<p className="text-xs text-slate-600">
									{priceSummary(book.prices)}
								</p>
								<div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
									<Button
										asChild
										variant="outline"
										size="sm"
										className="text-xs border-slate-200 text-amber-700 min-h-[40px]"
									>
										<Link href={`/admin/books/${book.id}/edit`}>
											<Edit className="mr-1 h-3.5 w-3.5" />
											Edit
										</Link>
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => setDeleteTarget(book)}
										className="text-xs border-rose-200 text-rose-700 min-h-[40px]"
									>
										<Trash2 className="mr-1 h-3.5 w-3.5" />
										Delete
									</Button>
								</div>
							</Card>
						))}
					</div>

					<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
						<p className="text-xs text-slate-500">
							Showing {paginatedBooks.length} of {books.length} books (Page{" "}
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

			{deleteTarget && (
				<AlertDialog
					open={!!deleteTarget}
					onOpenChange={(open) => !open && setDeleteTarget(null)}
				>
					<AlertDialogContent className="max-w-md w-[92vw] bg-white border-slate-200">
						<AlertDialogHeader>
							<AlertDialogTitle className="text-slate-900 font-bold">
								Delete &ldquo;{deleteTarget.title}&rdquo;?
							</AlertDialogTitle>
							<AlertDialogDescription className="text-slate-500 text-sm">
								This action performs a soft delete. The book record can be
								recovered if needed.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className="mt-4">
							<AlertDialogCancel disabled={actionLoading}>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => handleDeleteBook(deleteTarget)}
								disabled={actionLoading}
								className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
							>
								{actionLoading ? "Deleting..." : "Delete Book"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}

			<CategoryManagerModal
				open={categoryModalOpen}
				onOpenChange={setCategoryModalOpen}
				kind="book"
				onChanged={fetchCategories}
			/>
		</div>
	);
}

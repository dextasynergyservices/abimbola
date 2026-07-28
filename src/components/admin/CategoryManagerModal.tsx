"use client";

import { Loader2, Plus, Tag, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface CategoryItem {
	id: string;
	name: string;
	slug: string;
	_count?: { books?: number; posts?: number };
}

interface CategoryManagerModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	kind: "book" | "blog";
	onChanged?: () => void;
}

export function CategoryManagerModal({
	open,
	onOpenChange,
	kind,
	onChanged,
}: CategoryManagerModalProps) {
	const basePath =
		kind === "book"
			? "/api/admin/book-categories"
			: "/api/admin/blog-categories";
	const label = kind === "book" ? "Book Category" : "Blog Category";

	const [categories, setCategories] = useState<CategoryItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [newName, setNewName] = useState("");
	const [creating, setCreating] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);

	const fetchCategories = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(basePath);
			if (!res.ok) throw new Error("Failed to load categories");
			const data = await res.json();
			setCategories(data.categories || []);
		} catch (err) {
			console.error(err);
			toast.error("Failed to load categories");
		} finally {
			setLoading(false);
		}
	}, [basePath]);

	useEffect(() => {
		if (open) fetchCategories();
	}, [open, fetchCategories]);

	const handleCreate = async () => {
		if (!newName.trim()) return;
		setCreating(true);
		try {
			const res = await fetch(basePath, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: newName.trim() }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to create category");

			toast.success(`${label} created`);
			setNewName("");
			await fetchCategories();
			onChanged?.();
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to create category");
		} finally {
			setCreating(false);
		}
	};

	const handleDelete = async (category: CategoryItem) => {
		setDeletingId(category.id);
		try {
			const res = await fetch(`${basePath}/${category.id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || "Failed to delete category");
			}
			toast.success(`${label} deleted`);
			await fetchCategories();
			onChanged?.();
		} catch (err: unknown) {
			toast.error((err as Error).message || "Failed to delete category");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md w-[92vw] bg-white border-slate-200">
				<DialogHeader>
					<DialogTitle className="text-slate-900 font-bold">
						Manage {kind === "book" ? "Book" : "Blog"} Categories
					</DialogTitle>
					<DialogDescription className="text-slate-500 text-sm">
						Create or delete category tabs used to organize your{" "}
						{kind === "book" ? "books" : "blog posts"}.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center gap-2">
					<Input
						value={newName}
						onChange={(e) => setNewName(e.target.value)}
						placeholder="New category name..."
						className="min-h-[40px]"
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleCreate();
							}
						}}
					/>
					<Button
						type="button"
						onClick={handleCreate}
						disabled={creating || !newName.trim()}
						className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold min-h-[40px] shrink-0"
					>
						{creating ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Plus className="h-4 w-4" />
						)}
					</Button>
				</div>

				<div className="max-h-72 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
					{loading ? (
						<div className="flex items-center justify-center py-8 text-slate-400">
							<Loader2 className="h-5 w-5 animate-spin mr-2" />
							Loading...
						</div>
					) : categories.length === 0 ? (
						<div className="text-center py-8 text-slate-400 text-sm">
							<Tag className="h-6 w-6 mx-auto mb-2 opacity-50" />
							No categories yet
						</div>
					) : (
						categories.map((category) => (
							<div
								key={category.id}
								className="flex items-center justify-between px-3 py-2.5"
							>
								<div>
									<p className="text-sm font-medium text-slate-900">
										{category.name}
									</p>
									<p className="text-xs text-slate-400">
										{category._count?.books ?? category._count?.posts ?? 0}{" "}
										{kind === "book" ? "book(s)" : "post(s)"}
									</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									disabled={deletingId === category.id}
									onClick={() => handleDelete(category)}
									className="h-8 w-8 text-slate-400 hover:text-rose-600"
								>
									{deletingId === category.id ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Trash2 className="h-4 w-4" />
									)}
								</Button>
							</div>
						))
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}

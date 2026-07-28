"use client";

import { useQuery } from "@tanstack/react-query";
import {
	ArrowRight,
	BookOpen,
	Clock,
	FileEdit,
	FileText,
	Plus,
	RefreshCw,
	Users,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
	stats: {
		totalBooks: number;
		publishedPosts: number;
		draftPosts: number;
		totalSubscribers: number;
	};
	recentBooks: Array<{
		id: string;
		title: string;
		status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
		updatedAt: string;
	}>;
	recentPosts: Array<{
		id: string;
		title: string;
		slug: string;
		status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
		updatedAt: string;
	}>;
}

export default function AdminDashboardHome() {
	const { data, isLoading, isError, refetch, isRefetching } =
		useQuery<DashboardStats>({
			queryKey: ["admin-stats"],
			queryFn: async () => {
				const res = await fetch("/api/admin/stats");
				if (!res.ok) throw new Error("Failed to fetch dashboard stats");
				return res.json();
			},
		});

	const statCards = [
		{
			title: "Total Books",
			value: data?.stats.totalBooks ?? 0,
			description: "Books in the catalog",
			icon: BookOpen,
			color: "text-amber-700 bg-amber-50 ring-amber-200",
			href: "/admin/books",
		},
		{
			title: "Published Posts",
			value: data?.stats.publishedPosts ?? 0,
			description: "Live blog articles",
			icon: FileText,
			color: "text-emerald-700 bg-emerald-50 ring-emerald-200",
			href: "/admin/posts",
		},
		{
			title: "Draft Posts",
			value: data?.stats.draftPosts ?? 0,
			description: "Unpublished post drafts",
			icon: FileEdit,
			color: "text-blue-700 bg-blue-50 ring-blue-200",
			href: "/admin/posts",
		},
		{
			title: "Newsletter Subscribers",
			value: data?.stats.totalSubscribers ?? 0,
			description: "Signups from the homepage",
			icon: Users,
			color: "text-purple-700 bg-purple-50 ring-purple-200",
			href: "/admin/newsletter",
		},
	];

	return (
		<div className="space-y-8">
			{/* Page Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
						Dashboard Overview
					</h1>
					<p className="text-sm text-slate-500 mt-1">
						Welcome to your content management overview.
					</p>
				</div>
				<div className="flex items-center space-x-3">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refetch()}
						disabled={isRefetching}
						className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-xs"
					>
						<RefreshCw
							className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
						/>
						Refresh
					</Button>
					<Button
						asChild
						size="sm"
						className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold shadow-xs"
					>
						<Link href="/admin/books/new">
							<Plus className="mr-1.5 h-4 w-4" />
							Add Book
						</Link>
					</Button>
				</div>
			</div>

			{/* Summary Stat Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
				{statCards.map((card) => {
					const Icon = card.icon;
					return (
						<Card
							key={card.title}
							className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-all duration-200"
						>
							<CardHeader className="flex flex-row items-center justify-between pb-2">
								<CardTitle className="text-sm font-medium text-slate-600">
									{card.title}
								</CardTitle>
								<div className={`p-2 rounded-lg ring-1 ${card.color}`}>
									<Icon className="h-4 w-4" />
								</div>
							</CardHeader>
							<CardContent>
								{isLoading ? (
									<Skeleton className="h-8 w-16 bg-slate-100" />
								) : (
									<div className="text-2xl font-bold text-slate-900">
										{card.value}
									</div>
								)}
								<p className="text-xs text-slate-500 mt-1">
									{card.description}
								</p>
							</CardContent>
						</Card>
					);
				})}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Recent Books */}
				<Card className="border-slate-200 bg-white shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-4">
						<div>
							<CardTitle className="text-lg font-semibold text-slate-900">
								Recent Books
							</CardTitle>
							<CardDescription className="text-xs text-slate-500 mt-1">
								Recently created or updated books
							</CardDescription>
						</div>
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 text-xs"
						>
							<Link href="/admin/books">
								View All
								<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-14 w-full bg-slate-100" />
								))}
							</div>
						) : isError ? (
							<div className="py-8 text-center text-sm text-red-600">
								Failed to load recent books.
							</div>
						) : !data?.recentBooks || data.recentBooks.length === 0 ? (
							<div className="py-12 text-center text-slate-500">
								<BookOpen className="mx-auto h-10 w-10 text-slate-400 mb-3" />
								<p className="font-medium text-slate-700">No books found</p>
								<Button
									asChild
									size="sm"
									className="mt-4 bg-amber-500 text-slate-950 hover:bg-amber-400"
								>
									<Link href="/admin/books/new">Add Book</Link>
								</Button>
							</div>
						) : (
							<div className="divide-y divide-slate-100">
								{data.recentBooks.map((book) => (
									<div
										key={book.id}
										className="flex items-center justify-between py-3 px-1 hover:bg-slate-50 rounded-lg transition-colors gap-2"
									>
										<Link
											href={`/admin/books/${book.id}/edit`}
											className="font-medium text-sm text-slate-900 hover:text-amber-600 transition-colors truncate"
										>
											{book.title}
										</Link>
										<div className="flex items-center space-x-3 shrink-0">
											<Badge
												variant="outline"
												className={
													book.status === "PUBLISHED"
														? "bg-emerald-50 text-emerald-700 border-emerald-200"
														: "bg-slate-100 text-slate-600 border-slate-200"
												}
											>
												{book.status}
											</Badge>
											<span className="text-xs text-slate-500 flex items-center">
												<Clock className="mr-1 h-3 w-3" />
												{new Date(book.updatedAt).toLocaleDateString()}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Recent Posts */}
				<Card className="border-slate-200 bg-white shadow-sm">
					<CardHeader className="flex flex-row items-center justify-between pb-4">
						<div>
							<CardTitle className="text-lg font-semibold text-slate-900">
								Recent Blog Posts
							</CardTitle>
							<CardDescription className="text-xs text-slate-500 mt-1">
								Recently created or updated articles
							</CardDescription>
						</div>
						<Button
							asChild
							variant="ghost"
							size="sm"
							className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 text-xs"
						>
							<Link href="/admin/posts">
								View All
								<ArrowRight className="ml-1.5 h-3.5 w-3.5" />
							</Link>
						</Button>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<div className="space-y-3">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-14 w-full bg-slate-100" />
								))}
							</div>
						) : isError ? (
							<div className="py-8 text-center text-sm text-red-600">
								Failed to load recent posts.
							</div>
						) : !data?.recentPosts || data.recentPosts.length === 0 ? (
							<div className="py-12 text-center text-slate-500">
								<FileText className="mx-auto h-10 w-10 text-slate-400 mb-3" />
								<p className="font-medium text-slate-700">No posts found</p>
								<Button
									asChild
									size="sm"
									className="mt-4 bg-amber-500 text-slate-950 hover:bg-amber-400"
								>
									<Link href="/admin/posts/new">Create Article</Link>
								</Button>
							</div>
						) : (
							<div className="divide-y divide-slate-100">
								{data.recentPosts.map((post) => (
									<div
										key={post.id}
										className="flex items-center justify-between py-3 px-1 hover:bg-slate-50 rounded-lg transition-colors gap-2"
									>
										<Link
											href={`/admin/posts/${post.id}/edit`}
											className="font-medium text-sm text-slate-900 hover:text-amber-600 transition-colors truncate"
										>
											{post.title}
										</Link>
										<div className="flex items-center space-x-3 shrink-0">
											<Badge
												variant="outline"
												className={
													post.status === "PUBLISHED"
														? "bg-emerald-50 text-emerald-700 border-emerald-200"
														: "bg-slate-100 text-slate-600 border-slate-200"
												}
											>
												{post.status}
											</Badge>
											<span className="text-xs text-slate-500 flex items-center">
												<Clock className="mr-1 h-3 w-3" />
												{new Date(post.updatedAt).toLocaleDateString()}
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

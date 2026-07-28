"use client";

import {
	ArrowRight,
	Calendar,
	ChevronLeft,
	ChevronRight,
	Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const blogFeatured1 = "/assets/blog-featured-1.jpg";
const blogFeatured2 = "/assets/blog-featured-2.jpg";

import type { PublishedPage, PublishedPost } from "@/lib/cms";

interface BlogCategoryItem {
	id: string;
	name: string;
	slug: string;
}

interface BlogProps {
	publishedPage?: PublishedPage | null;
	publishedPosts?: PublishedPost[];
	categories?: BlogCategoryItem[];
}

export default function Blog({
	publishedPage,
	publishedPosts = [],
	categories: dbCategories = [],
}: BlogProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");
	const [page, setPage] = useState(1);
	const itemsPerPage = 6;

	// Use database posts if available, fallback to static mock posts
	const displayPosts =
		publishedPosts.length > 0
			? publishedPosts.map((p) => ({
					id: p.id,
					slug: p.slug,
					title: p.title,
					excerpt: p.excerpt || "Read full article insights and reflections.",
					image: p.featuredImage?.secureUrl || blogFeatured1,
					date: p.publishedAt
						? new Date(p.publishedAt).toLocaleDateString()
						: "Recent",
					author: p.author?.name || "Abimbola Lawuyi",
					category: p.category?.name || "Uncategorized",
				}))
			: [
					{
						id: "1",
						slug: "the-art-of-mindful-reading",
						title: "The Art of Mindful Reading",
						excerpt:
							"Discover how to transform your reading experience into a meditative practice that enriches both mind and soul.",
						image: blogFeatured1,
						date: "Nov 1, 2025",
						author: "Abimbola Lawuyi",
						category: "Reflections",
					},
					{
						id: "2",
						slug: "whispers-in-the-garden",
						title: "Whispers in the Garden",
						excerpt:
							"A collection of poetry exploring growth, change, and the quiet moments between the seasons.",
						image: blogFeatured2,
						date: "Oct 28, 2025",
						author: "Abimbola Lawuyi",
						category: "Poems",
					},
					{
						id: "3",
						slug: "the-last-letter-from-the-village",
						title: "The Last Letter from the Village",
						excerpt:
							"An evocative story about uncovering ancestral letters filled with courage, faith, and enduring hope.",
						image: blogFeatured1,
						date: "Oct 25, 2025",
						author: "Abimbola Lawuyi",
						category: "Stories",
					},
				];

	const categories =
		publishedPosts.length > 0 && dbCategories.length > 0
			? ["All", ...dbCategories.map((c) => c.name)]
			: ["All", "Articles", "Reflections", "Poems", "Stories"];

	const filteredPosts = displayPosts.filter((post) => {
		const matchesCategory =
			selectedCategory === "All" || post.category === selectedCategory;
		const matchesSearch =
			post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
			post.category.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	const totalPages = Math.ceil(filteredPosts.length / itemsPerPage) || 1;
	const paginatedPosts = filteredPosts.slice(
		(page - 1) * itemsPerPage,
		page * itemsPerPage,
	);

	const heroSection = publishedPage?.sections?.find((s) => s.type === "hero");
	const heroTitle =
		publishedPage?.title || heroSection?.title || "Blog & Insights";

	return (
		<div className="min-h-screen flex flex-col bg-white">
			<Navigation />

			{/* Hero Section */}
			<section className="bg-gradient-to-br from-amber-500/10 via-amber-100/20 to-slate-900/5 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto space-y-4">
					<h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-slate-900">
						{heroTitle}
					</h1>
					<p className="text-lg sm:text-xl text-slate-600 max-w-2xl">
						Insights, stories, and musings on educational leadership, parenting,
						literature, and life.
					</p>
				</div>
			</section>

			{/* Search and Filter Bar */}
			<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
				<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
					<div className="relative flex-1 w-full max-w-md">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							type="search"
							placeholder="Search articles by keyword or category..."
							className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 text-slate-900"
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(1);
							}}
						/>
					</div>

					<div className="flex gap-2 flex-wrap w-full md:w-auto">
						{categories.map((category) => (
							<Button
								key={category}
								variant={selectedCategory === category ? "default" : "outline"}
								size="sm"
								onClick={() => {
									setSelectedCategory(category);
									setPage(1);
								}}
								className={
									selectedCategory === category
										? "bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
										: "border-slate-200 text-slate-700 hover:bg-slate-100"
								}
							>
								{category}
							</Button>
						))}
					</div>
				</div>

				{/* Grid List */}
				{paginatedPosts.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
						{paginatedPosts.map((post) => (
							<Card
								key={post.id}
								className="border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group"
							>
								<div className="relative aspect-16/9 overflow-hidden bg-slate-100">
									<Image
										src={post.image}
										alt={post.title}
										fill
										sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
										className="object-cover group-hover:scale-105 transition-transform duration-300"
									/>
								</div>
								<CardContent className="pt-6 flex-1 space-y-3">
									<div className="flex items-center gap-3 text-xs text-slate-500">
										<span className="bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
											{post.category}
										</span>
										<div className="flex items-center">
											<Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
											{post.date}
										</div>
									</div>
									<h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
										{post.title}
									</h3>
									<p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
										{post.excerpt}
									</p>
									<p className="text-xs text-slate-400 pt-1">
										By {post.author}
									</p>
								</CardContent>

								<CardFooter className="pt-0">
									<Link
										href={`/blog/${post.slug || post.id}`}
										className="w-full"
									>
										<Button
											variant="ghost"
											className="w-full justify-between text-slate-900 hover:text-amber-600"
										>
											Read Article
											<ArrowRight className="ml-2 h-4 w-4" />
										</Button>
									</Link>
								</CardFooter>
							</Card>
						))}
					</div>
				) : (
					<div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
						<p className="text-slate-500 text-base">
							No articles found matching your criteria.
						</p>
					</div>
				)}

				{/* Public Pagination */}
				{filteredPosts.length > 0 && (
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-slate-100">
						<p className="text-xs text-slate-500">
							Showing {paginatedPosts.length} of {filteredPosts.length} articles
							(Page {page} of {totalPages})
						</p>

						<div className="flex items-center space-x-2">
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1}
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								className="min-h-[40px] px-4 border-slate-200"
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Previous
							</Button>

							<span className="text-xs font-semibold text-slate-700 px-3">
								{page} / {totalPages}
							</span>

							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								className="min-h-[40px] px-4 border-slate-200"
							>
								Next
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					</div>
				)}
			</section>

			<Footer />
		</div>
	);
}

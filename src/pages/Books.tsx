"use client";

import { Search, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { books as staticBooks } from "@/data/books";
import type { PublishedBook, PublishedBookCategory } from "@/lib/books";
import type { PublishedPage } from "@/lib/cms";

interface BooksProps {
	publishedPage?: PublishedPage | null;
	books?: PublishedBook[];
	categories?: PublishedBookCategory[];
}

function BookPriceDisplay({ book }: { book: PublishedBook }) {
	const prices = book.prices || [];
	if (prices.length === 0) {
		return (
			<div>
				<span className="inline-flex items-center text-xs font-semibold bg-amber-500/20 text-amber-800 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
					Coming Soon
				</span>
			</div>
		);
	}

	const free = prices.find((p) => p.type === "FREE");
	const softCopy = prices.find((p) => p.type === "SOFT_COPY");
	const hardCopy = prices.find((p) => p.type === "HARD_COPY");

	if (softCopy && hardCopy) {
		return (
			<div className="space-y-1.5 pt-2 border-t border-slate-100">
				<div className="flex items-center justify-between text-xs sm:text-sm">
					<span className="text-slate-500 font-medium">Soft Copy:</span>
					<span className="font-bold text-slate-900">
						₦{(softCopy.amount || 0).toLocaleString()}
					</span>
				</div>
				<div className="flex items-center justify-between text-xs sm:text-sm">
					<span className="text-slate-500 font-medium">Hard Copy:</span>
					<span className="font-bold text-slate-900">
						₦{(hardCopy.amount || 0).toLocaleString()}
					</span>
				</div>
			</div>
		);
	}

	if (softCopy) {
		return (
			<div className="flex items-center justify-between text-sm pt-1">
				<span className="text-xs text-slate-500 font-medium uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
					Soft Copy
				</span>
				<span className="text-lg font-bold text-slate-900">
					₦{(softCopy.amount || 0).toLocaleString()}
				</span>
			</div>
		);
	}

	if (hardCopy) {
		return (
			<div className="flex items-center justify-between text-sm pt-1">
				<span className="text-xs text-slate-500 font-medium uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
					Hard Copy
				</span>
				<span className="text-lg font-bold text-slate-900">
					₦{(hardCopy.amount || 0).toLocaleString()}
				</span>
			</div>
		);
	}

	if (free) {
		return (
			<div className="pt-1">
				<span className="inline-flex items-center text-xs font-semibold bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
					Free
				</span>
			</div>
		);
	}

	return (
		<div className="pt-1">
			<span className="inline-flex items-center text-xs font-semibold bg-amber-500/20 text-amber-800 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
				Coming Soon
			</span>
		</div>
	);
}

export default function Books({
	publishedPage,
	books: dbBooks = [],
	categories: dbCategories = [],
}: BooksProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");

	const usingDbBooks = dbBooks.length > 0;

	const categories = usingDbBooks
		? ["All", ...dbCategories.map((c) => c.name)]
		: ["All", "RELATIONSHIP & LOVE", "FAMILY & PARENTING", "LIFE & WISDOM"];

	const filteredBooks = usingDbBooks
		? dbBooks.filter((book) => {
				const categoryStr = book.category?.name || "";
				const matchesCategory =
					selectedCategory === "All" || categoryStr === selectedCategory;
				const matchesSearch =
					book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
					categoryStr.toLowerCase().includes(searchQuery.toLowerCase());
				return matchesCategory && matchesSearch;
			})
		: staticBooks.filter((book) => {
				const categoryStr = book.category || "";
				const matchesCategory =
					selectedCategory === "All" || categoryStr === selectedCategory;
				const matchesSearch =
					book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
					categoryStr.toLowerCase().includes(searchQuery.toLowerCase());
				return matchesCategory && matchesSearch;
			});

	const heroTitle = publishedPage?.title || "Our Bookstore";

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
						Books that nourish your mind and inspire your journey.
					</p>
				</div>
			</section>

			{/* Search and Filter */}
			<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
					<div className="relative flex-1 w-full max-w-md">
						<Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							type="search"
							placeholder="Search books by title, category, or author..."
							className="pl-10 min-h-[44px] bg-slate-50 border-slate-200 text-slate-900"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<div className="flex gap-2 flex-wrap w-full md:w-auto">
						{categories.map((category) => (
							<Button
								key={category}
								variant={selectedCategory === category ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedCategory(category)}
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
			</section>

			{/* Books Grid */}
			<section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
				{filteredBooks.length > 0 ? (
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
						{usingDbBooks
							? (filteredBooks as PublishedBook[]).map((book) => {
									const imageUrl = book.coverImage?.secureUrl;
									return (
										<Card
											key={book.id}
											className="border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full group"
										>
											<div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
												{imageUrl ? (
													<Image
														src={imageUrl}
														alt={book.title}
														fill
														sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
														className="object-cover group-hover:scale-105 transition-transform duration-300"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 font-display text-sm">
														No Cover Image
													</div>
												)}
											</div>
											<CardContent className="pt-6 flex-1 space-y-3">
												{book.category && (
													<span className="inline-block px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px] uppercase tracking-wider">
														{book.category.name}
													</span>
												)}
												<h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
													{book.title}
												</h3>
												<p className="text-xs text-slate-500 font-medium">
													by {book.author}
												</p>
												<div className="flex items-center space-x-1 text-amber-400">
													{[...Array(5)].map((_, i) => (
														<Star
															key={`bstar-${book.id}-${i}`}
															className={`h-3.5 w-3.5 ${
																i < Math.floor(book.rating || 5)
																	? "fill-amber-400 text-amber-400"
																	: "text-slate-300"
															}`}
														/>
													))}
													<span className="text-xs font-semibold text-slate-700 ml-1">
														({book.rating || 5.0})
													</span>
												</div>
												<BookPriceDisplay book={book} />
											</CardContent>

											<CardFooter className="pt-0 gap-2">
												<Link href={`/books/${book.slug}`} className="w-full">
													<Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs">
														View Details
													</Button>
												</Link>
											</CardFooter>
										</Card>
									);
								})
							: (filteredBooks as typeof staticBooks).map((book) => (
									<Card
										key={book.id}
										className="border-slate-200 bg-white overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full group"
									>
										<div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
											{book.image ? (
												<Image
													src={book.image}
													alt={book.title}
													fill
													sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
													className="object-cover group-hover:scale-105 transition-transform duration-300"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 font-display text-sm">
													No Cover Image
												</div>
											)}
										</div>
										<CardContent className="pt-6 flex-1 space-y-3">
											{book.category && (
												<span className="inline-block px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px] uppercase tracking-wider">
													{book.category}
												</span>
											)}
											<h3 className="text-xl font-display font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
												{book.title}
											</h3>
											<p className="text-xs text-slate-500 font-medium">
												by {book.author || "Abimbola Lawuyi"}
											</p>
											<div className="flex items-center space-x-1 text-amber-400">
												{[...Array(5)].map((_, i) => (
													<Star
														key={`bstar-${i}`}
														className={`h-3.5 w-3.5 ${
															i < Math.floor(book.rating || 5)
																? "fill-amber-400 text-amber-400"
																: "text-slate-300"
														}`}
													/>
												))}
												<span className="text-xs font-semibold text-slate-700 ml-1">
													({book.rating || 5.0})
												</span>
											</div>
											{book.price === "Coming Soon" ? (
												<div>
													<span className="inline-flex items-center text-xs font-semibold bg-amber-500/20 text-amber-800 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
														Coming Soon
													</span>
												</div>
											) : (
												<p className="text-xl font-bold text-slate-900">
													{book.price}
												</p>
											)}
										</CardContent>

										<CardFooter className="pt-0 gap-2">
											<Link href={`/books/${book.id}`} className="w-full">
												<Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-xs">
													View Details
												</Button>
											</Link>
										</CardFooter>
									</Card>
								))}
					</div>
				) : (
					<div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
						<p className="text-slate-500 text-base">
							No books found matching your criteria.
						</p>
					</div>
				)}
			</section>

			<Footer />
		</div>
	);
}

"use client";

import { ArrowLeft, Download, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { books } from "@/data/books";
import type { PublishedBook } from "@/lib/books";

const PRICE_TYPE_LABELS: Record<string, string> = {
	HARD_COPY: "Hard Copy",
	SOFT_COPY: "Soft Copy",
	FREE: "Free",
	COMING_SOON: "Coming Soon",
};

interface BookDetailProps {
	book?: PublishedBook;
	bookId?: string;
	dbRelatedBooks?: PublishedBook[];
}

const BookDetail = ({ book, bookId, dbRelatedBooks = [] }: BookDetailProps) => {
	const router = useRouter();

	const handleBack = () => {
		if (typeof window !== "undefined") {
			const startUrl = window.location.href;
			if (document.referrer?.includes(window.location.host)) {
				window.history.back();
				setTimeout(() => {
					if (window.location.href === startUrl) {
						router.push("/books");
					}
				}, 150);
			} else {
				router.push("/books");
			}
		}
	};

	if (book) {
		const prices = book.prices || [];
		const hasComingSoon =
			prices.some((p) => p.type === "COMING_SOON") || prices.length === 0;
		const comingSoonPrice = prices.find((p) => p.type === "COMING_SOON");
		const preOrderUrl =
			(book as { preOrderUrl?: string | null }).preOrderUrl ||
			comingSoonPrice?.url ||
			null;
		const comingSoonDateStr =
			(book as { comingSoonDate?: string | null }).comingSoonDate ||
			book.publicationDate ||
			"";

		const hasPricing = prices.length > 0 && !hasComingSoon;

		return (
			<div className="min-h-screen flex flex-col bg-white">
				<Navigation />

				<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 pt-24">
					<button
						type="button"
						onClick={handleBack}
						className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-amber-500 text-slate-800 hover:text-slate-950 text-xs sm:text-sm font-semibold rounded-full border border-slate-200 hover:border-amber-600 transition-all duration-200 shadow-xs mb-8 cursor-pointer"
					>
						<ArrowLeft className="h-4 w-4" />
						Back
					</button>

					<div className="grid md:grid-cols-2 gap-12">
						<div className="flex justify-center md:justify-start lg:sticky lg:top-32 h-fit">
							<div className="w-full max-w-[480px]">
								{book.coverImage?.secureUrl ? (
									<img
										src={book.coverImage.secureUrl}
										alt={book.title}
										className="w-full h-auto object-contain rounded-xl drop-shadow-2xl hover:scale-[1.03] transition-transform duration-500"
									/>
								) : (
									<div className="w-full aspect-[3/4] rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400">
										No Cover Image
									</div>
								)}
							</div>
						</div>

						<div className="space-y-6">
							<div>
								{book.category && (
									<span className="text-sm bg-amber-500/10 text-amber-800 px-3 py-1 rounded font-medium">
										{book.category.name}
									</span>
								)}
								<h1 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-2 text-black">
									{book.title}
								</h1>
								<p className="text-xl text-neutral-500">by {book.author}</p>
							</div>

							<div className="flex items-center gap-2">
								{[...Array(5)].map((_, i) => (
									<Star
										key={`star-rating-${i}`}
										className={`h-5 w-5 ${
											i < Math.floor(book.rating || 5)
												? "fill-amber-400 text-amber-400"
												: "text-neutral-200"
										}`}
									/>
								))}
								<span className="text-neutral-500 text-sm">
									({book.rating || 5.0} out of 5)
								</span>
							</div>

							{hasPricing ? (
								<div className="space-y-3">
									{book.prices.map((price) => {
										const targetUrl = price.url;
										return (
											<div
												key={price.type}
												className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 bg-neutral-50"
											>
												<div>
													<p className="font-semibold text-black">
														{PRICE_TYPE_LABELS[price.type]}
													</p>
													{price.type === "FREE" ? (
														<p className="text-sm text-emerald-600 font-semibold">
															Free
														</p>
													) : (
														<p className="text-lg font-bold text-amber-600">
															₦{(price.amount || 0).toLocaleString()}
														</p>
													)}
												</div>
												{targetUrl ? (
													<Button
														size="lg"
														asChild
														className="bg-black hover:bg-neutral-800 text-white font-medium"
													>
														<a
															href={targetUrl}
															target="_blank"
															rel="noopener noreferrer"
														>
															{price.type === "FREE" ? (
																<>
																	<Download className="mr-2 h-5 w-5" />
																	Download
																</>
															) : (
																<>
																	<ShoppingCart className="mr-2 h-5 w-5" />
																	Buy Now
																</>
															)}
														</a>
													</Button>
												) : (
													<Button size="lg" className="bg-black text-white">
														{price.type === "FREE" ? (
															<>
																<Download className="mr-2 h-5 w-5" />
																Download
															</>
														) : (
															<>
																<ShoppingCart className="mr-2 h-5 w-5" />
																Buy Now
															</>
														)}
													</Button>
												)}
											</div>
										);
									})}
								</div>
							) : (
								<div className="space-y-4">
									<div className="inline-flex items-center text-xs font-semibold bg-amber-500/20 text-amber-900 border border-amber-500/30 px-4 py-2 rounded-full uppercase tracking-wider">
										Coming Soon{" "}
										{comingSoonDateStr ? `— ${comingSoonDateStr}` : ""}
									</div>
									{preOrderUrl && preOrderUrl.trim() !== "" && (
										<div>
											<Button
												size="lg"
												asChild
												className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
											>
												<a
													href={preOrderUrl}
													target="_blank"
													rel="noopener noreferrer"
												>
													<ShoppingCart className="mr-2 h-5 w-5 text-slate-950" />
													Pre-Order Now
												</a>
											</Button>
										</div>
									)}
								</div>
							)}

							<div className="pt-6 border-t border-neutral-200">
								<h2 className="text-2xl font-display font-bold mb-4 text-black">
									About This Book
								</h2>
								<p className="text-neutral-600 leading-relaxed mb-4">
									{book.description || "Description coming soon."}
								</p>
							</div>

							<div className="pt-6 border-t border-neutral-200">
								<h3 className="font-display font-semibold text-lg mb-2 text-black">
									Book Details
								</h3>
								<dl className="space-y-2 text-sm">
									<div className="flex justify-between">
										<dt className="text-neutral-500">Publisher:</dt>
										<dd className="font-medium text-black">
											{book.publisher || "Abimbola Lawuyi Publishing"}
										</dd>
									</div>
									<div className="flex justify-between">
										<dt className="text-neutral-500">Publication Date:</dt>
										<dd className="font-medium text-black">
											{book.publicationDate || comingSoonDateStr || "TBA"}
										</dd>
									</div>
								</dl>
							</div>
						</div>
					</div>
				</section>

				<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
					<h2 className="text-3xl font-display font-bold mb-8 text-black">
						You May Also Like
					</h2>
					<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
						{(dbRelatedBooks && dbRelatedBooks.length > 0
							? dbRelatedBooks
							: []
						).map((relBook) => {
							const relPrices = relBook.prices || [];
							const relFree = relPrices.find((p) => p.type === "FREE");
							const relComingSoon =
								relPrices.some((p) => p.type === "COMING_SOON") ||
								relPrices.length === 0;
							const relSoft = relPrices.find((p) => p.type === "SOFT_COPY");
							const relHard = relPrices.find((p) => p.type === "HARD_COPY");

							let priceLabel = "Free";
							if (relComingSoon && !relSoft && !relHard && !relFree) {
								priceLabel = "Coming Soon";
							} else if (relFree && !relSoft && !relHard) {
								priceLabel = "Free";
							} else if (relSoft || relHard) {
								const amounts = [relSoft?.amount, relHard?.amount].filter(
									Boolean,
								) as number[];
								if (amounts.length > 0) {
									priceLabel = `₦${Math.min(...amounts).toLocaleString()}`;
								}
							}

							return (
								<Link key={relBook.id} href={`/books/${relBook.slug}`}>
									<Card className="card-lift overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow border-neutral-200 bg-white">
										<div className="aspect-[3/4] overflow-hidden bg-neutral-100">
											<img
												src={
													relBook.coverImage?.secureUrl ||
													"/assets/For%20BOOKS%20(3).png"
												}
												alt={relBook.title}
												className="w-full h-full object-cover"
											/>
										</div>
										<CardContent className="pt-4 flex flex-col flex-1 justify-between">
											<div>
												<h3 className="font-display font-semibold mb-1 text-black">
													{relBook.title}
												</h3>
												<p className="text-sm font-bold text-amber-600">
													{priceLabel}
												</p>
											</div>
										</CardContent>
									</Card>
								</Link>
							);
						})}
					</div>
				</section>

				<Footer />
			</div>
		);
	}

	// Static fallback path (legacy static books data)
	const staticBook = books.find((b) => b.id === Number(bookId));
	if (!staticBook) return null;

	const relatedBooks = books.filter((b) => b.id !== staticBook.id).slice(0, 2);

	return (
		<div className="min-h-screen flex flex-col bg-white">
			<Navigation />

			<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 pt-24">
				<button
					type="button"
					onClick={handleBack}
					className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-black mb-8 transition-colors cursor-pointer"
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					back
				</button>

				<div className="grid md:grid-cols-2 gap-12">
					<div className="flex justify-center md:justify-start lg:sticky lg:top-32 h-fit">
						<div className="w-full max-w-[480px]">
							<img
								src={staticBook.image}
								alt={staticBook.title}
								className="w-full h-auto object-contain rounded-xl drop-shadow-2xl hover:scale-[1.03] transition-transform duration-500"
							/>
						</div>
					</div>

					<div className="space-y-6">
						<div>
							<span className="text-sm bg-amber-500/10 text-amber-800 px-3 py-1 rounded font-medium">
								{staticBook.category}
							</span>
							<h1 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-2 text-black">
								{staticBook.title}
							</h1>
							<p className="text-xl text-neutral-500">by {staticBook.author}</p>
						</div>

						<div className="flex items-center gap-2">
							{[...Array(5)].map((_, i) => (
								<Star
									key={`static-star-rating-${i}`}
									className={`h-5 w-5 ${
										i < Math.floor(staticBook.rating)
											? "fill-amber-400 text-amber-400"
											: "text-neutral-200"
									}`}
								/>
							))}
							<span className="text-neutral-500 text-sm">
								({staticBook.rating} out of 5)
							</span>
						</div>

						{staticBook.price === "Coming Soon" ? (
							<div className="inline-flex items-center text-xs font-semibold bg-amber-500/20 text-amber-900 border border-amber-500/30 px-4 py-2 rounded-full uppercase tracking-wider">
								Coming Soon
							</div>
						) : (
							<div className="text-3xl font-bold text-amber-600">
								{staticBook.price}
							</div>
						)}

						{staticBook.price !== "Coming Soon" && (
							<div className="flex gap-4">
								<Button
									size="lg"
									className="bg-black hover:bg-neutral-800 text-white font-medium"
								>
									<ShoppingCart className="mr-2 h-5 w-5" />
									{staticBook.price === "Free" ? "Download" : "Buy Now"}
								</Button>
							</div>
						)}

						<div className="pt-6 border-t border-neutral-200">
							<h2 className="text-2xl font-display font-bold mb-4 text-black">
								About This Book
							</h2>
							<p className="text-neutral-600 leading-relaxed mb-4">
								{staticBook.description || "Description coming soon."}
							</p>
						</div>
					</div>
				</div>
			</section>

			<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
				<h2 className="text-3xl font-display font-bold mb-8 text-black">
					You May Also Like
				</h2>
				<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
					{relatedBooks.map((relBook) => (
						<Card
							key={relBook.id}
							className="card-lift overflow-hidden border-neutral-200 bg-white"
						>
							<div className="aspect-[3/4] overflow-hidden bg-neutral-100">
								<img
									src={relBook.image}
									alt={relBook.title}
									className="w-full h-full object-cover"
								/>
							</div>
							<CardContent className="pt-4">
								<h3 className="font-display font-semibold mb-1 text-black">
									{relBook.title}
								</h3>
								<p className="text-sm font-bold text-amber-600">
									{relBook.price}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<Footer />
		</div>
	);
};

export default BookDetail;

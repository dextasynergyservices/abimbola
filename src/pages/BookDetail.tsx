import { Download, ShoppingCart, Star } from "lucide-react";
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
}

const BookDetail = ({ book, bookId }: BookDetailProps) => {
	if (book) {
		const relatedBooks = books.slice(0, 2);
		const prices = book.prices || [];
		const hasComingSoon = prices.some((p) => p.type === "COMING_SOON");
		const hasPricing = prices.length > 0 && !hasComingSoon;

		return (
			<div className="min-h-screen flex flex-col">
				<Navigation />

				<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
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
									<div className="w-full aspect-[3/4] rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
										No Cover Image
									</div>
								)}
							</div>
						</div>

						<div className="space-y-6">
							<div>
								{book.category && (
									<span className="text-sm bg-accent/10 text-accent px-3 py-1 rounded">
										{book.category.name}
									</span>
								)}
								<h1 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-2">
									{book.title}
								</h1>
								<p className="text-xl text-muted-foreground">
									by {book.author}
								</p>
							</div>

							<div className="flex items-center gap-2">
								{[...Array(5)].map((_, i) => (
									<Star
										key={`star-rating-${i}`}
										className={`h-5 w-5 ${
											i < Math.floor(book.rating || 5)
												? "fill-secondary text-secondary"
												: "text-muted"
										}`}
									/>
								))}
								<span className="text-muted-foreground">
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
												className="flex items-center justify-between p-4 rounded-xl border border-border bg-card"
											>
												<div>
													<p className="font-semibold">
														{PRICE_TYPE_LABELS[price.type]}
													</p>
													{price.type === "FREE" ? (
														<p className="text-sm text-muted-foreground">
															Free
														</p>
													) : (
														<p className="text-lg font-bold text-primary">
															₦{(price.amount || 0).toLocaleString()}
														</p>
													)}
												</div>
												{targetUrl ? (
													<Button size="lg" asChild>
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
																	Buy
																</>
															)}
														</a>
													</Button>
												) : (
													<Button size="lg">
														{price.type === "FREE" ? (
															<>
																<Download className="mr-2 h-5 w-5" />
																Download
															</>
														) : (
															<>
																<ShoppingCart className="mr-2 h-5 w-5" />
																Buy
															</>
														)}
													</Button>
												)}
											</div>
										);
									})}
								</div>
							) : (
								<div className="inline-flex items-center text-sm font-semibold bg-primary/10 text-primary px-4 py-1.5 rounded-full uppercase tracking-wider">
									Coming Soon
								</div>
							)}

							<div className="pt-6 border-t border-border">
								<h2 className="text-2xl font-display font-bold mb-4">
									About This Book
								</h2>
								<p className="text-muted-foreground leading-relaxed mb-4">
									{book.description || "Description coming soon."}
								</p>
							</div>

							<div className="pt-6 border-t border-border">
								<h3 className="font-display font-semibold text-lg mb-2">
									Book Details
								</h3>
								<dl className="space-y-2 text-sm">
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Publisher:</dt>
										<dd className="font-medium">
											{book.publisher || "Abimbola Lawuyi Publishing"}
										</dd>
									</div>
									<div className="flex justify-between">
										<dt className="text-muted-foreground">Publication Date:</dt>
										<dd className="font-medium">
											{book.publicationDate || "TBA"}
										</dd>
									</div>
								</dl>
							</div>
						</div>
					</div>
				</section>

				<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
					<h2 className="text-3xl font-display font-bold mb-8">
						Customer Reviews
					</h2>
					<div className="space-y-6">
						{[1, 2].map((review) => (
							<Card key={review}>
								<CardContent className="pt-6">
									<div className="flex items-center justify-between mb-4">
										<div>
											<p className="font-semibold">Reviewer {review}</p>
											<p className="text-sm text-muted-foreground">
												Verified Purchase
											</p>
										</div>
										<div className="flex items-center gap-1">
											{[...Array(5)].map((_, i) => (
												<Star
													key={`star-review-${i}`}
													className="h-4 w-4 fill-secondary text-secondary"
												/>
											))}
										</div>
									</div>
									<p className="text-muted-foreground">
										&ldquo;This book completely changed my perspective. Highly
										recommended.&rdquo;
									</p>
								</CardContent>
							</Card>
						))}
					</div>
				</section>

				<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
					<h2 className="text-3xl font-display font-bold mb-8">
						You May Also Like
					</h2>
					<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
						{relatedBooks.map((relBook) => (
							<Card key={relBook.id} className="card-lift overflow-hidden">
								<div className="aspect-[2/3] overflow-hidden">
									<img
										src={relBook.image}
										alt={relBook.title}
										className="w-full h-full object-cover"
									/>
								</div>
								<CardContent className="pt-4">
									<h3 className="font-display font-semibold mb-1">
										{relBook.title}
									</h3>
									<p className="text-lg font-bold text-primary">
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
	}

	// Static fallback path (legacy static books data)
	const staticBook = books.find((b) => b.id === Number(bookId));
	if (!staticBook) return null;

	const relatedBooks = books.filter((b) => b.id !== staticBook.id).slice(0, 2);

	return (
		<div className="min-h-screen flex flex-col">
			<Navigation />

			<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
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
							<span className="text-sm bg-accent/10 text-accent px-3 py-1 rounded">
								{staticBook.category}
							</span>
							<h1 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-2">
								{staticBook.title}
							</h1>
							<p className="text-xl text-muted-foreground">
								by {staticBook.author}
							</p>
						</div>

						<div className="flex items-center gap-2">
							{[...Array(5)].map((_, i) => (
								<Star
									key={`static-star-rating-${i}`}
									className={`h-5 w-5 ${
										i < Math.floor(staticBook.rating)
											? "fill-secondary text-secondary"
											: "text-muted"
									}`}
								/>
							))}
							<span className="text-muted-foreground">
								({staticBook.rating} out of 5)
							</span>
						</div>

						{staticBook.price === "Coming Soon" ? (
							<div className="inline-flex items-center text-sm font-semibold bg-primary/10 text-primary px-4 py-1.5 rounded-full uppercase tracking-wider">
								Coming Soon
							</div>
						) : (
							<div className="text-4xl font-bold text-primary">
								{staticBook.price}
							</div>
						)}

						{staticBook.price !== "Coming Soon" && (
							<div className="flex gap-4">
								<Button size="lg" className="flex-1">
									<ShoppingCart className="mr-2 h-5 w-5" />
									{staticBook.price === "Free" ? "Download" : "Buy"}
								</Button>
							</div>
						)}

						<div className="pt-6 border-t border-border">
							<h2 className="text-2xl font-display font-bold mb-4">
								About This Book
							</h2>
							<p className="text-muted-foreground leading-relaxed mb-4">
								{staticBook.description || "Description coming soon."}
							</p>
						</div>

						<div className="pt-6 border-t border-border">
							<h3 className="font-display font-semibold text-lg mb-2">
								Book Details
							</h3>
							<dl className="space-y-2 text-sm">
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Publisher:</dt>
									<dd className="font-medium">
										{staticBook.publisher || "Abimbola Lawuyi Publishing"}
									</dd>
								</div>
								<div className="flex justify-between">
									<dt className="text-muted-foreground">Publication Date:</dt>
									<dd className="font-medium">
										{staticBook.publicationDate || "TBA"}
									</dd>
								</div>
							</dl>
						</div>
					</div>
				</div>
			</section>

			<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
				<h2 className="text-3xl font-display font-bold mb-8">
					Customer Reviews
				</h2>
				<div className="space-y-6">
					{[1, 2].map((review) => (
						<Card key={review}>
							<CardContent className="pt-6">
								<div className="flex items-center justify-between mb-4">
									<div>
										<p className="font-semibold">Reviewer {review}</p>
										<p className="text-sm text-muted-foreground">
											Verified Purchase
										</p>
									</div>
									<div className="flex items-center gap-1">
										{[...Array(5)].map((_, i) => (
											<Star
												key={`static-star-review-${i}`}
												className="h-4 w-4 fill-secondary text-secondary"
											/>
										))}
									</div>
								</div>
								<p className="text-muted-foreground">
									&ldquo;This book completely changed my perspective. Highly
									recommended.&rdquo;
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

			<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
				<h2 className="text-3xl font-display font-bold mb-8">
					You May Also Like
				</h2>
				<div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
					{relatedBooks.map((relBook) => (
						<Card key={relBook.id} className="card-lift overflow-hidden">
							<div className="aspect-[2/3] overflow-hidden">
								<img
									src={relBook.image}
									alt={relBook.title}
									className="w-full h-full object-cover"
								/>
							</div>
							<CardContent className="pt-4">
								<h3 className="font-display font-semibold mb-1">
									{relBook.title}
								</h3>
								<p className="text-lg font-bold text-primary">
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

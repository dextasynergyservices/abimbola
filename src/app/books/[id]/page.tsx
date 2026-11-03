import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookReviews from "@/components/engagement/BookReviews";
import { books } from "@/data/books";
import {
	getPublishedBookById,
	getPublishedBooks,
	getRelatedBooksForBook,
} from "@/lib/books";
import { getPublicReviews, getReviewSummary } from "@/lib/engagement/reviews";
import type { PublicReview, ReviewSummary } from "@/lib/engagement/types";
import BookDetail from "@/views/BookDetail";

// Cached for 24h; admin changes purge it instantly (see lib/cache.ts).
export const revalidate = 86400;

interface BookDetailPageProps {
	params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
	try {
		const dbBooks = await getPublishedBooks();
		const dbParams = dbBooks.map((b) => ({ id: b.id }));
		const staticParams = books.map((b) => ({ id: String(b.id) }));
		return [...dbParams, ...staticParams];
	} catch {
		return books.map((b) => ({ id: String(b.id) }));
	}
}

export async function generateMetadata({
	params,
}: BookDetailPageProps): Promise<Metadata> {
	const { id } = await params;
	const dbBook = await getPublishedBookById(id);

	if (dbBook) {
		const seoTitle = `${dbBook.title} - Abimbola Lawuyi`;
		const seoDescription =
			dbBook.description || `Discover "${dbBook.title}" by Abimbola Lawuyi.`;
		const imageUrl = dbBook.coverImage?.secureUrl;

		return {
			title: seoTitle,
			description: seoDescription,
			openGraph: {
				title: seoTitle,
				description: seoDescription,
				images: imageUrl
					? [
							{
								url: imageUrl,
								alt: dbBook.coverImage?.altText || dbBook.title,
							},
						]
					: [],
			},
		};
	}

	const staticBook = books.find((b) => b.id === Number(id));
	if (staticBook) {
		return {
			title: `${staticBook.title} - Abimbola Lawuyi`,
			description: staticBook.description,
		};
	}

	return {
		title: "Book Details - Abimbola Lawuyi",
	};
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
	const { id } = await params;

	const dbBook = await getPublishedBookById(id);

	if (dbBook) {
		const [relatedBooks, reviewPage, summary] = await Promise.all([
			getRelatedBooksForBook(dbBook),
			getPublicReviews(dbBook.id),
			getReviewSummary(dbBook.id),
		]);

		const jsonLd = buildBookJsonLd(dbBook, summary, reviewPage.reviews);

		return (
			<>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: jsonLd }}
				/>
				<BookDetail
					book={dbBook}
					dbRelatedBooks={relatedBooks}
					reviewsSection={
						<BookReviews
							key={dbBook.id}
							bookId={dbBook.id}
							bookTitle={dbBook.title}
							initialPage={reviewPage}
							summary={summary}
						/>
					}
				/>
			</>
		);
	}

	if (!books.some((book) => book.id === Number(id))) {
		notFound();
	}

	return <BookDetail bookId={id} />;
}

/**
 * schema.org Book + AggregateRating + Review structured data so search
 * engines can show star ratings. `<` is escaped so user text can never
 * close the script tag.
 */
function buildBookJsonLd(
	book: NonNullable<Awaited<ReturnType<typeof getPublishedBookById>>>,
	summary: ReviewSummary,
	reviews: PublicReview[],
): string {
	const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
	const data: Record<string, unknown> = {
		"@context": "https://schema.org",
		"@type": "Book",
		name: book.title,
		author: { "@type": "Person", name: book.author },
		url: `${appUrl}/books/${book.slug}`,
		...(book.description ? { description: book.description } : {}),
		...(book.coverImage?.secureUrl ? { image: book.coverImage.secureUrl } : {}),
		...(book.publisher
			? { publisher: { "@type": "Organization", name: book.publisher } }
			: {}),
	};

	if (summary.count > 0 && summary.average !== null) {
		data.aggregateRating = {
			"@type": "AggregateRating",
			ratingValue: summary.average,
			reviewCount: summary.count,
			bestRating: 5,
			worstRating: 1,
		};
		data.review = reviews.slice(0, 5).map((r) => ({
			"@type": "Review",
			author: { "@type": "Person", name: r.name },
			datePublished: r.createdAt.slice(0, 10),
			reviewRating: {
				"@type": "Rating",
				ratingValue: r.rating,
				bestRating: 5,
				worstRating: 1,
			},
			...(r.title ? { name: r.title } : {}),
			reviewBody: r.body,
		}));
	}

	return JSON.stringify(data).replace(/</g, "\\u003c");
}

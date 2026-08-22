import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { books } from "@/data/books";
import { getPublishedBookById, getRelatedBooksForBook } from "@/lib/books";
import BookDetail from "@/pages/BookDetail";

export const revalidate = 60;

interface BookDetailPageProps {
	params: Promise<{ id: string }>;
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
		const relatedBooks = await getRelatedBooksForBook(dbBook);
		return <BookDetail book={dbBook} dbRelatedBooks={relatedBooks} />;
	}

	if (!books.some((book) => book.id === Number(id))) {
		notFound();
	}

	return <BookDetail bookId={id} />;
}

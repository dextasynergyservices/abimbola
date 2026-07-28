import type { Metadata } from "next";
import { getBookCategories, getPublishedBooks } from "@/lib/books";
import { getPublishedPageBySlug } from "@/lib/cms";
import Books from "@/pages/Books";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
	const page = await getPublishedPageBySlug("books");

	const seoTitle = page?.seoTitle || "Books & Literature - Abimbola Lawuyi";
	const seoDescription =
		page?.seoDescription ||
		"Explore transformative books and literature written by Abimbola Lawuyi.";
	const imageUrl = page?.seoImage?.secureUrl;

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
							alt: page?.seoImage?.altText || "Books by Abimbola Lawuyi",
						},
					]
				: [],
		},
	};
}

export default async function BooksPage() {
	const publishedPage = await getPublishedPageBySlug("books");
	const [books, categories] = await Promise.all([
		getPublishedBooks(),
		getBookCategories(),
	]);
	return (
		<Books
			publishedPage={publishedPage}
			books={books}
			categories={categories}
		/>
	);
}

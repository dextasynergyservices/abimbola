import type { Metadata } from "next";
import { getFeaturedBooks } from "@/lib/books";
import Index from "@/pages/Index";

export const revalidate = 60;

export const metadata: Metadata = {
	title: "Abimbola Lawuyi | Author, Coach & Educational Leader",
	description:
		"Official website of Abimbola Lawuyi - Inspiring growth, educational leadership, literature, and family transformation.",
};

export default async function HomePage() {
	const featuredBooks = await getFeaturedBooks();
	return <Index featuredBooks={featuredBooks} />;
}

import type { Metadata } from "next";
import { getFeaturedBooks } from "@/lib/books";
import { getPublishedPosts } from "@/lib/cms";
import Index from "@/views/Index";

export const revalidate = 60;

export const metadata: Metadata = {
	title: "Abimbola Lawuyi | Author, Coach & Educational Leader",
	description:
		"Official website of Abimbola Lawuyi - Inspiring growth, educational leadership, literature, and family transformation.",
};

export default async function HomePage() {
	const [featuredBooks, latestPosts] = await Promise.all([
		getFeaturedBooks(),
		getPublishedPosts(3),
	]);
	return <Index featuredBooks={featuredBooks} latestPosts={latestPosts} />;
}

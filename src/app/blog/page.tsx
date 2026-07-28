import type { Metadata } from "next";
import { getBlogCategories } from "@/lib/books";
import { getPublishedPageBySlug, getPublishedPosts } from "@/lib/cms";
import Blog from "@/pages/Blog";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
	const page = await getPublishedPageBySlug("blog");

	const seoTitle = page?.seoTitle || "Blog & Insights - Abimbola Lawuyi";
	const seoDescription =
		page?.seoDescription ||
		"Read articles and insights on leadership, parenting, education, and spiritual growth.";
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
							alt: page?.seoImage?.altText || "Abimbola Lawuyi Blog",
						},
					]
				: [],
		},
	};
}

export default async function BlogPage() {
	const publishedPage = await getPublishedPageBySlug("blog");
	const [publishedPosts, categories] = await Promise.all([
		getPublishedPosts(),
		getBlogCategories(),
	]);

	return (
		<Blog
			publishedPage={publishedPage}
			publishedPosts={publishedPosts}
			categories={categories}
		/>
	);
}

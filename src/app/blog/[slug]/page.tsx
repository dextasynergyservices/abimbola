import BlogPostClient from "@/app/blog/[slug]/BlogPostClient";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { getAuthorProfile, getPublishedPostBySlug } from "@/lib/cms";

export const revalidate = 60; // 1 minute revalidation

export default async function BlogPostBySlugPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const [post, authorProfile] = await Promise.all([
		getPublishedPostBySlug(slug),
		getAuthorProfile(),
	]);

	if (!post) {
		// Fallback mock post if database record not found
		const fallbackPost = {
			id: slug,
			title: slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
			excerpt:
				"Discover insightful perspectives on reading, literature, and leadership.",
			body: "In our fast-paced digital world, taking time for deep reading and thoughtful reflection is essential. Reading mindfully enriches your perspective, broadens your understanding, and cultivates inner quiet.\n\nWhether reading fiction, poetry, or leadership guidebooks, immerse yourself fully into each page.",
			publishedAt: new Date().toISOString(),
			author: { name: "Abimbola Lawuyi" },
			featuredImage: {
				secureUrl: "/assets/blog-featured-1.jpg",
				altText: "Blog Featured Image",
			},
		};

		return (
			<div className="min-h-screen flex flex-col bg-white">
				<Navigation />
				<BlogPostClient post={fallbackPost} authorProfile={authorProfile} />
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col bg-white">
			<Navigation />
			<BlogPostClient post={post} authorProfile={authorProfile} />
			<Footer />
		</div>
	);
}

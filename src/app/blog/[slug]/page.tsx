import type { Metadata } from "next";
import BlogPostClient from "@/app/blog/[slug]/BlogPostClient";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import {
	getAuthorProfile,
	getPublishedPostBySlug,
	getPublishedPosts,
} from "@/lib/cms";

export const revalidate = 60; // 1 minute revalidation

interface BlogPostPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
	try {
		const posts = await getPublishedPosts();
		const slugs = posts.map((p) => ({ slug: p.slug }));
		if (slugs.length > 0) return slugs;
	} catch {}

	return [
		{ slug: "the-art-of-mindful-reading" },
		{ slug: "whispers-in-the-garden" },
		{ slug: "the-last-letter-from-the-village" },
	];
}

export async function generateMetadata({
	params,
}: BlogPostPageProps): Promise<Metadata> {
	const { slug } = await params;
	const post = await getPublishedPostBySlug(slug);

	if (post) {
		const seoTitle = post.seoTitle || `${post.title} - Abimbola Lawuyi`;
		const seoDescription =
			post.seoDescription || post.excerpt || "Article by Abimbola Lawuyi";
		const imageUrl = post.featuredImage?.secureUrl;

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
								alt: post.featuredImage?.altText || post.title,
							},
						]
					: [],
			},
		};
	}

	return {
		title: `${slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} - Abimbola Lawuyi`,
	};
}

export default async function BlogPostBySlugPage({
	params,
}: BlogPostPageProps) {
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

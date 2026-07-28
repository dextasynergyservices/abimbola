import type { Metadata } from "next";
import { getPublishedPageBySlug } from "@/lib/cms";
import About from "@/pages/About";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
	const page = await getPublishedPageBySlug("about");

	const seoTitle = page?.seoTitle || "About - Abimbola Lawuyi";
	const seoDescription =
		page?.seoDescription ||
		"Learn more about Abimbola Lawuyi's journey, mission, and impact in education and writing.";
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
							alt: page?.seoImage?.altText || "About Abimbola Lawuyi",
						},
					]
				: [],
		},
	};
}

export default async function AboutPage() {
	const publishedPage = await getPublishedPageBySlug("about");
	return <About publishedPage={publishedPage} />;
}

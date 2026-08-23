import type { Metadata } from "next";
import { getPublishedPageBySlug } from "@/lib/cms";
import Contact from "@/views/Contact";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
	const page = await getPublishedPageBySlug("contact");

	const seoTitle = page?.seoTitle || "Contact - Abimbola Lawuyi";
	const seoDescription =
		page?.seoDescription ||
		"Get in touch with Abimbola Lawuyi for speaking engagements, coaching, or inquiries.";
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
							alt: page?.seoImage?.altText || "Contact Abimbola Lawuyi",
						},
					]
				: [],
		},
	};
}

export default async function ContactPage() {
	const publishedPage = await getPublishedPageBySlug("contact");
	return <Contact publishedPage={publishedPage} />;
}

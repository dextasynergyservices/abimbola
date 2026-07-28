import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DynamicSectionRenderer from "@/components/DynamicSectionRenderer";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";
import { getPublishedPageBySlug } from "@/lib/cms";

export const revalidate = 60;

interface DynamicPageProps {
	params: Promise<{ slug: string }>;
}

export async function generateMetadata({
	params,
}: DynamicPageProps): Promise<Metadata> {
	const { slug } = await params;
	const page = await getPublishedPageBySlug(slug);

	if (!page) {
		return {
			title: "Page Not Found",
		};
	}

	const seoTitle = page.seoTitle || `${page.title} - Abimbola Lawuyi`;
	const seoDescription =
		page.seoDescription ||
		"Official website of Abimbola Lawuyi - Author, Coach & Educational Leader.";
	const imageUrl = page.seoImage?.secureUrl;

	return {
		title: seoTitle,
		description: seoDescription,
		openGraph: {
			title: seoTitle,
			description: seoDescription,
			images: imageUrl
				? [{ url: imageUrl, alt: page.seoImage?.altText || page.title }]
				: [],
		},
	};
}

export default async function DynamicSlugPage({ params }: DynamicPageProps) {
	const { slug } = await params;

	// Prevent matching system routes if matched by accident
	if (["admin", "api", "login"].includes(slug)) {
		notFound();
	}

	const page = await getPublishedPageBySlug(slug);

	if (!page) {
		notFound();
	}

	return (
		<div className="min-h-screen flex flex-col bg-white">
			<Navigation />

			<main className="flex-1 pt-24 pb-16">
				{/* Header Title Banner if no hero section is present */}
				{!page.sections?.some((s) => s.type === "hero") && (
					<div className="max-w-7xl mx-auto px-6 lg:px-12 py-8 border-b border-slate-100">
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-slate-900">
							{page.title}
						</h1>
					</div>
				)}

				<DynamicSectionRenderer sections={page.sections} />
			</main>

			<Footer />
		</div>
	);
}

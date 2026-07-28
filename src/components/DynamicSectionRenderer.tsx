"use client";

import { ArrowRight, Feather, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { PublishedSection } from "@/lib/cms";

interface DynamicSectionRendererProps {
	sections: PublishedSection[];
}

export default function DynamicSectionRenderer({
	sections,
}: DynamicSectionRendererProps) {
	if (!sections || sections.length === 0) return null;

	return (
		<div className="space-y-16 lg:space-y-24 py-8">
			{sections.map((section) => {
				const content = section.content || {};

				switch (section.type) {
					case "hero":
						return (
							<HeroSection
								key={section.id}
								section={section}
								content={content}
							/>
						);

					case "about_summary":
					case "bio":
					case "text_block":
						return (
							<TextBlockSection
								key={section.id}
								section={section}
								content={content}
							/>
						);

					case "services":
					case "services_list":
						return (
							<ServicesSection
								key={section.id}
								section={section}
								content={content}
							/>
						);

					case "testimonials":
						return (
							<TestimonialsSection
								key={section.id}
								section={section}
								content={content}
							/>
						);

					case "gallery":
					case "gallery_grid":
						return (
							<GallerySection
								key={section.id}
								section={section}
								content={content}
							/>
						);

					case "books":
					case "books_grid":
						return (
							<BooksSection
								key={section.id}
								section={section}
								content={content}
							/>
						);

					case "cta":
						return (
							<CTASection
								key={section.id}
								section={section}
								content={content}
							/>
						);

					default:
						return (
							<DefaultSection
								key={section.id}
								section={section}
								content={content}
							/>
						);
				}
			})}
		</div>
	);
}

function str(val: unknown, fallback = ""): string {
	return typeof val === "string" && val.trim() !== "" ? val : fallback;
}

/* ─── Hero Section Component ─── */
function HeroSection({
	section,
	content,
}: {
	section: PublishedSection;
	content: Record<string, unknown>;
}) {
	const imageUrl = str(content.imageUrl || content.image);
	const imageAlt = str(content.imageAlt, section.title || "Hero banner image");
	const subtitle = str(content.subtitle);
	const headline = str(
		content.headline,
		section.title || "Empowering Growth & Leadership",
	);
	const description = str(
		content.description || content.body,
		"Inspiring minds, developing leaders, and transforming educational spaces.",
	);
	const ctaText = str(content.ctaText);
	const ctaLink = str(content.ctaLink, "/books");

	return (
		<section className="relative overflow-hidden bg-slate-900 text-white rounded-3xl mx-4 sm:mx-8 lg:mx-12 shadow-2xl">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center p-8 sm:p-12 lg:p-16">
				<div className="space-y-6 z-10">
					{subtitle && (
						<span className="inline-block px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold text-xs tracking-wider uppercase border border-amber-500/30">
							{subtitle}
						</span>
					)}

					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display leading-tight text-white">
						{headline}
					</h1>

					<p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
						{description}
					</p>

					{ctaText && (
						<div className="pt-2">
							<ButtonLink href={ctaLink} text={ctaText} primary />
						</div>
					)}
				</div>

				{imageUrl ? (
					<div className="relative aspect-4/3 sm:aspect-16/9 lg:aspect-square w-full rounded-2xl overflow-hidden shadow-lg border border-slate-800">
						<Image
							src={imageUrl}
							alt={imageAlt}
							fill
							sizes="(max-width: 1024px) 100vw, 50vw"
							className="object-cover"
						/>
					</div>
				) : (
					<div className="relative aspect-4/3 w-full rounded-2xl bg-gradient-to-tr from-amber-600/30 to-slate-800 flex items-center justify-center p-8 border border-slate-800 text-center">
						<div className="space-y-3">
							<Feather className="h-12 w-12 text-amber-400 mx-auto" />
							<p className="text-slate-300 font-display italic text-lg">
								&ldquo;Writing with purpose, leading with passion.&rdquo;
							</p>
						</div>
					</div>
				)}
			</div>
		</section>
	);
}

/* ─── Text Block / Bio Section ─── */
function TextBlockSection({
	section,
	content,
}: {
	section: PublishedSection;
	content: Record<string, unknown>;
}) {
	const imageUrl = str(content.imageUrl || content.image);
	const heading = str(content.heading, section.title || "");
	const body = str(content.body || content.description || content.raw);
	const imageAlt = str(content.imageAlt, section.title || "Section image");

	return (
		<section className="max-w-7xl mx-auto px-6 lg:px-12">
			<div
				className={`grid grid-cols-1 ${imageUrl ? "lg:grid-cols-2" : ""} gap-12 items-center`}
			>
				<div className="space-y-4">
					<h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 font-display">
						{heading}
					</h2>
					<div className="w-16 h-1 bg-amber-500 rounded-full" />
					<p className="text-slate-600 text-base sm:text-lg leading-relaxed whitespace-pre-line">
						{body}
					</p>
				</div>

				{imageUrl && (
					<div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden shadow-md border border-slate-200">
						<Image
							src={imageUrl}
							alt={imageAlt}
							fill
							sizes="(max-width: 1024px) 100vw, 50vw"
							className="object-cover"
						/>
					</div>
				)}
			</div>
		</section>
	);
}

/* ─── Services Section ─── */
function ServicesSection({
	section,
	content,
}: {
	section: PublishedSection;
	content: Record<string, unknown>;
}) {
	const items = (Array.isArray(content.items) ? content.items : []) as Array<{
		title: string;
		description: string;
		icon?: string;
	}>;
	const serviceItems =
		items.length > 0
			? items
			: [
					{
						title: "Educational Leadership",
						description: "Coaching school leaders and teachers for impact.",
					},
					{
						title: "Author & Publishing",
						description: "Inspiring literature and spiritual books.",
					},
					{
						title: "Keynote Speaking",
						description: "Engaging talks on leadership, mindset, and purpose.",
					},
				];

	const sectionTitle =
		section.title || str(content.title, "Our Programs & Services");
	const sectionDescription = str(
		content.description,
		"Discover guidance tailored for leaders, educators, and seekers of truth.",
	);

	return (
		<section className="bg-slate-50 py-16 px-6 lg:px-12 rounded-3xl mx-4 sm:mx-8">
			<div className="max-w-7xl mx-auto space-y-12">
				<div className="text-center space-y-3 max-w-2xl mx-auto">
					<h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900">
						{sectionTitle}
					</h2>
					<p className="text-slate-600 text-sm sm:text-base">
						{sectionDescription}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{serviceItems.map((item, idx) => (
						<div
							key={`svc-${idx}`}
							className="bg-white p-8 rounded-2xl border border-slate-200 hover:shadow-xl transition-all duration-300 space-y-4"
						>
							<div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-lg">
								0{idx + 1}
							</div>
							<h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
							<p className="text-slate-600 text-sm leading-relaxed">
								{item.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ─── Testimonials Section ─── */
function TestimonialsSection({
	section,
	content,
}: {
	section: PublishedSection;
	content: Record<string, unknown>;
}) {
	const items = (Array.isArray(content.items) ? content.items : []) as Array<{
		quote: string;
		author: string;
		role?: string;
		avatar?: string;
	}>;
	const testimonialItems =
		items.length > 0
			? items
			: [
					{
						quote:
							"Abimbola's guidance completely transformed how we approach educational leadership.",
						author: "Dr. Sarah Jenkins",
						role: "School Administrator",
					},
					{
						quote:
							"Her book provided the exact clarity and peace I needed during a tough transition.",
						author: "Michael Lawson",
						role: "Reader & Educator",
					},
				];

	return (
		<section className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-10">
			<div className="text-center space-y-3">
				<h2 className="text-3xl font-bold font-display text-slate-900">
					{section.title || "Words of Appreciation"}
				</h2>
				<div className="w-12 h-1 bg-amber-500 mx-auto rounded-full" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{testimonialItems.map((t, idx) => (
					<div
						key={`testi-${idx}`}
						className="p-8 rounded-2xl bg-amber-50/50 border border-amber-200/60 shadow-xs space-y-4"
					>
						<div className="flex text-amber-400 gap-1">
							{Array.from({ length: 5 }).map((_, i) => (
								<Star key={`star-${i}`} className="h-4 w-4 fill-amber-400" />
							))}
						</div>
						<p className="text-slate-800 text-base italic leading-relaxed">
							&ldquo;{t.quote}&rdquo;
						</p>
						<div className="pt-2 border-t border-amber-200/50">
							<p className="font-bold text-slate-900 text-sm">{t.author}</p>
							{t.role && <p className="text-xs text-slate-500">{t.role}</p>}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

/* ─── Gallery Section ─── */
function GallerySection({
	section,
	content,
}: {
	section: PublishedSection;
	content: Record<string, unknown>;
}) {
	const images = (
		Array.isArray(content.images) ? content.images : []
	) as Array<{
		url: string;
		alt?: string;
		caption?: string;
	}>;

	return (
		<section className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-8">
			<div className="text-center space-y-2">
				<h2 className="text-3xl font-bold font-display text-slate-900">
					{section.title || "Photo Gallery"}
				</h2>
			</div>

			{images.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
					{images.map((img, idx) => (
						<div
							key={`gal-${idx}`}
							className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-xs border border-slate-200"
						>
							<Image
								src={img.url}
								alt={img.alt || `Gallery image ${idx + 1}`}
								fill
								sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
								className="object-cover group-hover:scale-105 transition-transform duration-300"
							/>
							{img.caption && (
								<div className="absolute inset-x-0 bottom-0 bg-slate-950/70 p-2 text-white text-xs truncate">
									{img.caption}
								</div>
							)}
						</div>
					))}
				</div>
			) : (
				<p className="text-center text-sm text-slate-400 italic">
					No gallery images available.
				</p>
			)}
		</section>
	);
}

/* ─── CTA Section ─── */
function CTASection({
	section,
	content,
}: {
	section: PublishedSection;
	content: Record<string, unknown>;
}) {
	const title =
		section.title || str(content.title, "Ready to Transform Your Journey?");
	const description = str(
		content.description,
		"Get in touch today to explore leadership programs, books, and coaching sessions.",
	);
	const link = str(content.link, "/contact");
	const buttonText = str(content.buttonText, "Get in Touch");

	return (
		<section className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl mx-4 sm:mx-8 lg:mx-12 p-8 sm:p-12 text-slate-950 shadow-xl text-center space-y-6">
			<h2 className="text-3xl sm:text-4xl font-bold font-display">{title}</h2>
			<p className="text-slate-900/80 text-base sm:text-lg max-w-2xl mx-auto">
				{description}
			</p>
			<div>
				<Link
					href={link}
					className="inline-flex items-center px-8 py-3.5 rounded-full bg-slate-950 text-white font-semibold text-sm hover:bg-slate-900 shadow-md transition-colors"
				>
					{buttonText}
					<ArrowRight className="ml-2 h-4 w-4" />
				</Link>
			</div>
		</section>
	);
}

/* ─── Books Section ─── */
function BooksSection({
	section,
	content,
}: {
	section: PublishedSection;
	content: Record<string, unknown>;
}) {
	const rawBooks = (
		Array.isArray(content.books) ? content.books : []
	) as Array<{
		id?: number | string;
		title: string;
		author?: string;
		price?: string;
		rating?: number;
		category?: string;
		image?: string;
		description?: string;
	}>;

	const booksList =
		rawBooks.length > 0
			? rawBooks
			: [
					{
						id: 1,
						title: "The Hardest Part of Loving Your Child",
						author: "Abimbola Lawuyi",
						price: "₦15,000",
						rating: 4.8,
						category: "FAMILY & PARENTING",
						image: "/assets/For%20BOOKS%20(1).png",
						description:
							"A profound exploration into the emotional complexities of parenthood. Delves into the unspoken challenges and sacrifices that come with loving your children unconditionally.",
					},
					{
						id: 2,
						title: "50 Life Lessons for Modern Leaders",
						author: "Abimbola Lawuyi",
						price: "Coming Soon",
						rating: 5.0,
						category: "LIFE & WISDOM",
						image:
							"https://res.cloudinary.com/dxoorukfj/image/upload/v1784550650/50_50_Abimbola_tuaugi.png",
						description:
							"A curated collection of invaluable wisdom and reflections. Offers 50 powerful life lessons designed to guide, inspire, and transform everyday perspective.",
					},
					{
						id: 3,
						title: "Dear Single: A Journey of Purpose",
						author: "Abimbola Lawuyi",
						price: "Coming Soon",
						rating: 4.9,
						category: "RELATIONSHIP & LOVE",
						image:
							"https://res.cloudinary.com/dxoorukfj/image/upload/v1782469054/DS_NEW_niyokf.png",
						description:
							"An empowering manifesto for the unattached. Navigate the journey of singleness with grace, purpose, and self-discovery as you prepare for the future.",
					},
				];

	return (
		<section className="max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-10">
			<div className="text-center space-y-3 max-w-2xl mx-auto">
				<h2 className="text-3xl sm:text-4xl font-bold font-display text-slate-900">
					{section.title || "Published Works & Books"}
				</h2>
				<p className="text-slate-600 text-sm sm:text-base">
					{str(
						content.description,
						"Explore literature written to guide parents, leaders, and individuals toward purposeful living.",
					)}
				</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
				{booksList.map((book, idx) => (
					<div
						key={book.id || `book-${idx}`}
						className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col h-full"
					>
						<div className="relative aspect-3/4 w-full bg-slate-100 overflow-hidden">
							{book.image ? (
								<Image
									src={book.image}
									alt={book.title}
									fill
									sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
									className="object-cover group-hover:scale-105 transition-transform duration-300"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 font-display text-sm">
									No Cover Image
								</div>
							)}
						</div>

						<div className="p-6 flex-1 flex flex-col justify-between space-y-4">
							<div className="space-y-2">
								{book.category && (
									<span className="inline-block px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold text-[11px] uppercase tracking-wider">
										{book.category}
									</span>
								)}
								<h3 className="text-xl font-bold text-slate-900 font-display group-hover:text-amber-600 transition-colors">
									{book.title}
								</h3>
								<p className="text-xs text-slate-500 font-medium">
									by {book.author || "Abimbola Lawuyi"}
								</p>
								<div className="flex items-center space-x-1 text-amber-400">
									{Array.from({ length: 5 }).map((_, i) => (
										<Star
											key={`bstar-${i}`}
											className="h-3.5 w-3.5 fill-amber-400"
										/>
									))}
									<span className="text-xs font-semibold text-slate-700 ml-1">
										({book.rating || 5.0})
									</span>
								</div>
								{book.description && (
									<p className="text-slate-600 text-xs leading-relaxed line-clamp-3 pt-1">
										{book.description}
									</p>
								)}
							</div>

							<div className="pt-4 border-t border-slate-100 flex items-center justify-between">
								<span className="text-base font-bold text-slate-900">
									{book.price || "Contact for pricing"}
								</span>
								<Link
									href="/contact"
									className="inline-flex items-center px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition-colors"
								>
									Order Book
								</Link>
							</div>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

/* ─── Default Section ─── */
function DefaultSection({
	section,
	content,
}: {
	section: PublishedSection;
	content: Record<string, unknown>;
}) {
	const bodyText = str(
		content.description || content.body,
		JSON.stringify(content),
	);

	return (
		<section className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
			<div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
				{section.title && (
					<h3 className="text-xl font-bold text-slate-900 font-display">
						{section.title}
					</h3>
				)}
				<div className="text-slate-700 text-sm leading-relaxed">{bodyText}</div>
			</div>
		</section>
	);
}

/* ─── Helper Link Button ─── */
function ButtonLink({
	href,
	text,
	primary,
}: {
	href: string;
	text: string;
	primary?: boolean;
}) {
	return (
		<Link
			href={href}
			className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold transition-colors ${
				primary
					? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
					: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
			}`}
		>
			{text}
			<ArrowRight className="ml-2 h-4 w-4" />
		</Link>
	);
}

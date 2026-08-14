"use client";

import { ArrowLeft, Calendar, User } from "lucide-react";
import { useRouter } from "next/navigation";
import {
	type AuthorProfile,
	DEFAULT_AUTHOR_PROFILE,
	resolveAuthorProfile,
} from "@/lib/author";

interface BlogPostClientProps {
	post: {
		id: string;
		title: string;
		excerpt?: string | null;
		body: string;
		publishedAt?: Date | string | null;
		author?: { name: string } | null;
		authorName?: string | null;
		authorInitials?: string | null;
		authorBio?: string | null;
		featuredImage?: { secureUrl: string; altText?: string | null } | null;
	};
	authorProfile?: AuthorProfile;
}

export default function BlogPostClient({
	post,
	authorProfile = DEFAULT_AUTHOR_PROFILE,
}: BlogPostClientProps) {
	const _router = useRouter();

	const handleBack = () => {
		if (typeof window !== "undefined") {
			if (document.referrer?.includes(window.location.host)) {
				window.history.back();
			} else {
				window.location.href = "/blog";
			}
		}
	};

	const publishedDate = post.publishedAt
		? new Date(post.publishedAt).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "Recent";

	// Show author bio card unless explicitly disabled (empty string)
	const hasAuthorBio = post.authorBio !== "";

	const resolvedAuthorProfile = resolveAuthorProfile(
		{
			name: post.authorName,
			initials: post.authorInitials,
			bio: post.authorBio,
		},
		authorProfile,
	);

	const authorName =
		post.authorName?.trim() || post.author?.name || resolvedAuthorProfile.name;
	const imageUrl =
		post.featuredImage?.secureUrl || "/assets/blog-featured-1.jpg";

	// Detect if content is HTML (from rich text editor) or plain text
	const isHtml = /<[a-z][\s\S]*>/i.test(post.body);

	return (
		<main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 pt-28">
			{/* Back Button */}
			<div className="mb-8">
				<button
					type="button"
					onClick={handleBack}
					className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-amber-500 text-slate-800 hover:text-slate-950 text-xs sm:text-sm font-semibold rounded-full border border-slate-200 hover:border-amber-600 transition-all duration-200 shadow-xs cursor-pointer"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</button>
			</div>

			<article className="space-y-8">
				{/* Header */}
				<header className="space-y-4">
					<div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
						<span className="bg-amber-100 text-amber-800 font-semibold px-3 py-1 rounded-full uppercase tracking-wider text-[11px]">
							Article
						</span>
						<div className="flex items-center">
							<User className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
							<span>{authorName}</span>
						</div>
						<div className="flex items-center">
							<Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
							<span>{publishedDate}</span>
						</div>
					</div>

					<h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-slate-900 leading-tight">
						{post.title}
					</h1>

					{post.excerpt && (
						<p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-light">
							{post.excerpt}
						</p>
					)}
				</header>

				{/* Featured Image */}
				<div className="w-full h-64 sm:h-80 md:h-[420px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
					<img
						src={imageUrl}
						alt={post.featuredImage?.altText || post.title}
						onError={(e) => {
							const target = e.currentTarget;
							target.onerror = null;
							target.src = "/assets/blog-featured-1.jpg";
						}}
						className="w-full h-full object-cover"
					/>
				</div>

				{/* Body Content */}
				{isHtml ? (
					<div
						className="prose prose-slate max-w-none pt-4
							prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900
							[&_p]:text-slate-700 [&_p]:my-2.5 [&_p]:leading-snug
							[&_p:empty]:h-4 [&_p:empty]:block
							prose-a:text-amber-600 prose-a:underline hover:prose-a:text-amber-700
							prose-strong:text-slate-900 prose-strong:font-semibold
							prose-blockquote:border-l-amber-400 prose-blockquote:text-slate-600 prose-blockquote:italic
							prose-code:text-amber-700 prose-code:bg-amber-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
							prose-ul:text-slate-700 prose-ol:text-slate-700
							prose-hr:border-slate-200
							prose-img:rounded-xl prose-img:shadow-sm"
						dangerouslySetInnerHTML={{ __html: post.body }}
					/>
				) : (
					<div className="prose prose-slate max-w-none pt-4 text-slate-800 space-y-4">
						{post.body.split(/\n\s*\n/).map((block, i) => {
							const lines = block.split("\n");
							return (
								<p key={i} className="text-slate-700 leading-snug m-0">
									{lines.map((line, j) => (
										<span key={j}>
											{line}
											{j < lines.length - 1 && <br />}
										</span>
									))}
								</p>
							);
						})}
					</div>
				)}

				{/* Author Bio Footer */}
				{hasAuthorBio && (
					<div className="mt-12 p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start space-x-4">
						<div className="h-12 w-12 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-lg shrink-0">
							{resolvedAuthorProfile.initials}
						</div>
						<div className="space-y-1">
							<h3 className="font-display font-bold text-slate-900 text-base">
								Written by {resolvedAuthorProfile.name}
							</h3>
							<p
								className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line"
								suppressHydrationWarning
							>
								{resolvedAuthorProfile.bio}
							</p>
						</div>
					</div>
				)}
			</article>
		</main>
	);
}

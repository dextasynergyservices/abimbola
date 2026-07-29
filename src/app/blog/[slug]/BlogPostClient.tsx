"use client";

import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BlogPostClientProps {
	post: {
		id: string;
		title: string;
		excerpt?: string | null;
		body: string;
		publishedAt?: Date | string | null;
		author?: { name: string } | null;
		featuredImage?: { secureUrl: string; altText?: string | null } | null;
	};
}

export default function BlogPostClient({ post }: BlogPostClientProps) {
	const publishedDate = post.publishedAt
		? new Date(post.publishedAt).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
			})
		: "Recent";

	const authorName = post.author?.name || "Abimbola Lawuyi";
	const imageUrl =
		post.featuredImage?.secureUrl || "/assets/blog-featured-1.jpg";

	return (
		<main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
			{/* Back Button */}
			<div className="mb-8">
				<Button
					asChild
					variant="ghost"
					size="sm"
					className="text-slate-600 hover:text-amber-600 -ml-2"
				>
					<Link href="/blog">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to All Articles
					</Link>
				</Button>
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
				<div className="prose prose-slate max-w-none space-y-6 pt-4 text-slate-800 leading-relaxed text-base sm:text-lg">
					{post.body.split("\n\n").map((paragraph, idx) => (
						<p key={`p-${idx}`} className="text-slate-700 leading-relaxed">
							{paragraph}
						</p>
					))}
				</div>

				{/* Author Bio Footer */}
				<div className="mt-12 p-6 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-start space-x-4">
					<div className="h-12 w-12 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-lg shrink-0">
						AL
					</div>
					<div className="space-y-1">
						<h3 className="font-display font-bold text-slate-900 text-base">
							Written by {authorName}
						</h3>
						<p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
							Abimbola Lawuyi is an author, educational leader, and parenting
							consultant dedicated to empowering minds and raising purposeful
							leaders.
						</p>
					</div>
				</div>
			</article>
		</main>
	);
}

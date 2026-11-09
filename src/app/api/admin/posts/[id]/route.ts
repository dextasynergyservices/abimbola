import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { revalidatePublicSite } from "@/lib/cache";
import {
	findPostSlugConflict,
	releaseSlugFromOtherPostsHistory,
	revalidatePostUrls,
} from "@/lib/post-slugs";
import { prisma } from "@/lib/prisma";
import { nextPreviousSlugs, validateSlug } from "@/lib/slug";

const updatePostSchema = z.object({
	title: z.string().min(1, "Title is required"),
	slug: z.string().min(1, "Slug is required"),
	excerpt: z.string().optional().nullable(),
	body: z.string().min(1, "Body content is required"),
	featuredImageId: z.string().optional().nullable(),
	categoryId: z.string().optional().nullable(),
	status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
	seoTitle: z.string().optional().nullable(),
	seoDescription: z.string().optional().nullable(),
	authorName: z.string().optional().nullable(),
	authorInitials: z.string().max(3).optional().nullable(),
	authorBio: z.string().optional().nullable(),
});

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const post = await prisma.post.findUnique({
			where: { id },
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				category: true,
			},
		});

		if (!post || post.deletedAt) {
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}

		return NextResponse.json({ post });
	} catch (error) {
		console.error("Failed to fetch post:", error);
		return NextResponse.json(
			{ error: "Failed to fetch post" },
			{ status: 500 },
		);
	}
}

async function handleUpdate(request: Request, id: string) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const validated = updatePostSchema.parse(body);

		const existing = await prisma.post.findUnique({ where: { id } });
		if (!existing || existing.deletedAt) {
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}

		const formattedSlug = validated.slug.trim().toLowerCase();
		const slugError = validateSlug(formattedSlug);
		if (slugError) {
			return NextResponse.json({ error: slugError }, { status: 400 });
		}
		const conflict = await findPostSlugConflict(formattedSlug, id);
		if (conflict) {
			return NextResponse.json({ error: conflict }, { status: 400 });
		}

		const slugChanged = existing.slug !== formattedSlug;
		const previousSlugs = nextPreviousSlugs(
			existing.previousSlugs,
			existing.slug,
			formattedSlug,
		);
		if (slugChanged) {
			await releaseSlugFromOtherPostsHistory(formattedSlug, id);
		}

		const post = await prisma.post.update({
			where: { id },
			data: {
				title: validated.title,
				slug: formattedSlug,
				previousSlugs,
				excerpt: validated.excerpt ?? null,
				body: validated.body,
				featuredImageId: validated.featuredImageId ?? null,
				categoryId: validated.categoryId ?? null,
				status: validated.status,
				seoTitle: validated.seoTitle ?? null,
				seoDescription: validated.seoDescription ?? null,
				authorName: validated.authorName?.trim() || null,
				authorInitials: validated.authorInitials?.trim().toUpperCase() || null,
				authorBio: validated.authorBio?.trim() || null,
				publishedAt:
					validated.status === "PUBLISHED"
						? existing.publishedAt || new Date()
						: existing.publishedAt,
			},
			include: {
				author: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				category: true,
			},
		});

		const userId = session.user.id as string;
		let action = "UPDATE_POST";
		if (existing.status !== "PUBLISHED" && post.status === "PUBLISHED") {
			action = "PUBLISH_POST";
		} else if (existing.status === "PUBLISHED" && post.status !== "PUBLISHED") {
			action = "UNPUBLISH_POST";
		}

		revalidatePublicSite();
		revalidatePostUrls(post.id, [post.slug, ...post.previousSlugs]);

		await prisma.auditLog.create({
			data: {
				userId,
				action,
				entityType: "Post",
				entityId: post.id,
				metadata: {
					title: post.title,
					slug: post.slug,
					status: post.status,
					...(slugChanged ? { previousSlug: existing.slug } : {}),
					...(existing.title !== post.title
						? { previousTitle: existing.title }
						: {}),
				},
			},
		});

		return NextResponse.json({ post });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to update post:", error);
		return NextResponse.json(
			{ error: "Failed to update post" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	return handleUpdate(request, id);
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	return handleUpdate(request, id);
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const existing = await prisma.post.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}

		const post = await prisma.post.delete({
			where: { id },
		});

		revalidatePublicSite();
		revalidatePostUrls(post.id, [post.slug, ...post.previousSlugs]);

		const userId = session.user.id as string;
		await prisma.auditLog.create({
			data: {
				userId,
				action: "DELETE_POST",
				entityType: "Post",
				entityId: id,
				metadata: {
					title: existing.title,
					slug: existing.slug,
					previousSlugs: existing.previousSlugs,
					permanent: true,
				},
			},
		});

		return NextResponse.json({
			message: "Post permanently deleted",
			post: { id: post.id, title: post.title },
		});
	} catch (error) {
		console.error("Failed to delete post:", error);
		return NextResponse.json(
			{ error: "Failed to delete post" },
			{ status: 500 },
		);
	}
}

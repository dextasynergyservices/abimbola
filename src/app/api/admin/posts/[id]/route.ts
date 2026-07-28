import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

		// Check for duplicate slug
		const duplicate = await prisma.post.findFirst({
			where: {
				slug: formattedSlug,
				id: { not: id },
				deletedAt: null,
			},
		});

		if (duplicate) {
			return NextResponse.json(
				{ error: "Another post with this slug already exists" },
				{ status: 400 },
			);
		}

		const post = await prisma.post.update({
			where: { id },
			data: {
				title: validated.title,
				slug: formattedSlug,
				excerpt: validated.excerpt ?? null,
				body: validated.body,
				featuredImageId: validated.featuredImageId ?? null,
				categoryId: validated.categoryId ?? null,
				status: validated.status,
				seoTitle: validated.seoTitle ?? null,
				seoDescription: validated.seoDescription ?? null,
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

		await prisma.auditLog.create({
			data: {
				userId,
				action,
				entityType: "Post",
				entityId: post.id,
				metadata: { title: post.title, status: post.status },
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
		if (!existing || existing.deletedAt) {
			return NextResponse.json({ error: "Post not found" }, { status: 404 });
		}

		const post = await prisma.post.update({
			where: { id },
			data: { deletedAt: new Date() },
		});

		const userId = session.user.id as string;
		await prisma.auditLog.create({
			data: {
				userId,
				action: "SOFT_DELETE_POST",
				entityType: "Post",
				entityId: id,
				metadata: { title: existing.title },
			},
		});

		return NextResponse.json({ message: "Post deleted successfully", post });
	} catch (error) {
		console.error("Failed to delete post:", error);
		return NextResponse.json(
			{ error: "Failed to delete post" },
			{ status: 500 },
		);
	}
}

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createPostSchema = z.object({
	title: z.string().min(1, "Title is required"),
	slug: z.string().min(1, "Slug is required"),
	excerpt: z.string().optional().nullable(),
	body: z.string().min(1, "Body content is required"),
	featuredImageId: z.string().optional().nullable(),
	categoryId: z.string().optional().nullable(),
	status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
	seoTitle: z.string().optional().nullable(),
	seoDescription: z.string().optional().nullable(),
	authorName: z.string().optional().nullable(),
	authorInitials: z.string().max(3).optional().nullable(),
	authorBio: z.string().optional().nullable(),
});

export async function GET(request: Request) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const search = searchParams.get("query")?.trim() || "";
		const statusFilter = searchParams.get("status")?.trim() || "ALL";

		const whereConditions: Array<Record<string, unknown>> = [
			{ deletedAt: null },
		];

		if (statusFilter && statusFilter !== "ALL") {
			whereConditions.push({ status: statusFilter });
		}

		if (search) {
			whereConditions.push({
				OR: [
					{ title: { contains: search, mode: "insensitive" as const } },
					{ slug: { contains: search, mode: "insensitive" as const } },
					{ excerpt: { contains: search, mode: "insensitive" as const } },
				],
			});
		}

		const posts = await prisma.post.findMany({
			where: { AND: whereConditions },
			orderBy: { updatedAt: "desc" },
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

		return NextResponse.json({ posts });
	} catch (error) {
		console.error("Failed to fetch posts:", error);
		return NextResponse.json(
			{ error: (error as Error).message || "Failed to fetch posts" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const validated = createPostSchema.parse(body);

		const formattedSlug = validated.slug.trim().toLowerCase();

		// Check for duplicate slug
		const existing = await prisma.post.findFirst({
			where: { slug: formattedSlug, deletedAt: null },
		});

		if (existing) {
			return NextResponse.json(
				{ error: "A post with this slug already exists" },
				{ status: 400 },
			);
		}

		const userId = session.user.id as string;

		const post = await prisma.post.create({
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
				authorId: userId,
				authorName: validated.authorName?.trim() || null,
				authorInitials: validated.authorInitials?.trim().toUpperCase() || null,
				authorBio: validated.authorBio?.trim() || null,
				publishedAt: validated.status === "PUBLISHED" ? new Date() : null,
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

		// Record audit log
		await prisma.auditLog.create({
			data: {
				userId,
				action: "CREATE_POST",
				entityType: "Post",
				entityId: post.id,
				metadata: { title: post.title, slug: post.slug, status: post.status },
			},
		});

		try {
			revalidatePath("/");
			revalidatePath("/blog");
			revalidatePath(`/blog/${post.slug}`);
		} catch (e) {
			console.error("Revalidation error:", e);
		}

		return NextResponse.json({ post }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to create post:", error);
		return NextResponse.json(
			{ error: "Failed to create post" },
			{ status: 500 },
		);
	}
}

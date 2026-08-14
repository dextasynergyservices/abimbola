import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const priceSchema = z.object({
	type: z.enum(["HARD_COPY", "SOFT_COPY", "FREE", "COMING_SOON"]),
	amount: z.number().positive().optional().nullable(),
	url: z.string().optional().nullable(),
	available: z.boolean().default(true),
});

const createBookSchema = z.object({
	title: z.string().min(1, "Title is required"),
	slug: z.string().min(1, "Slug is required"),
	author: z.string().optional().default("Abimbola Lawuyi"),
	description: z.string().optional().nullable(),
	rating: z.number().min(0).max(5).optional().nullable(),
	publisher: z.string().optional().nullable(),
	publicationDate: z.string().optional().nullable(),
	preOrderUrl: z.string().optional().nullable(),
	relatedBookIds: z.array(z.string()).optional().default([]),
	buyUrl: z.string().optional().nullable(),
	coverImageId: z.string().optional().nullable(),
	categoryId: z.string().optional().nullable(),
	status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
	featuredOnHome: z.boolean().optional().default(false),
	prices: z
		.array(priceSchema)
		.min(1, "At least one pricing option is required to save a book"),
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
		const categoryFilter = searchParams.get("categoryId")?.trim() || "ALL";

		const whereConditions: Array<Record<string, unknown>> = [
			{ deletedAt: null },
		];

		if (statusFilter && statusFilter !== "ALL") {
			if (statusFilter === "FEATURED") {
				whereConditions.push({ featuredOnHome: true });
			} else {
				whereConditions.push({ status: statusFilter });
			}
		}

		if (categoryFilter && categoryFilter !== "ALL") {
			whereConditions.push({ categoryId: categoryFilter });
		}

		if (search) {
			whereConditions.push({
				OR: [
					{ title: { contains: search, mode: "insensitive" as const } },
					{ slug: { contains: search, mode: "insensitive" as const } },
					{ author: { contains: search, mode: "insensitive" as const } },
				],
			});
		}

		const books = await prisma.book.findMany({
			where: { AND: whereConditions },
			orderBy: { updatedAt: "desc" },
			include: { category: true, prices: true },
		});

		return NextResponse.json({ books });
	} catch (error) {
		console.error("Failed to fetch books:", error);
		return NextResponse.json(
			{ error: "Failed to fetch books" },
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
		const validated = createBookSchema.parse(body);
		const formattedSlug = validated.slug.trim().toLowerCase();

		const existing = await prisma.book.findFirst({
			where: { slug: formattedSlug, deletedAt: null },
		});
		if (existing) {
			return NextResponse.json(
				{ error: "A book with this slug already exists" },
				{ status: 400 },
			);
		}

		if (validated.featuredOnHome) {
			const currentFeatured = await prisma.book.findMany({
				where: { featuredOnHome: true, deletedAt: null },
				orderBy: { updatedAt: "desc" },
			});
			if (currentFeatured.length >= 3) {
				const toKeepIds = currentFeatured.slice(0, 2).map((b) => b.id);
				await prisma.book.updateMany({
					where: {
						featuredOnHome: true,
						id: { notIn: toKeepIds },
					},
					data: { featuredOnHome: false },
				});
			}
		}

		const book = await prisma.book.create({
			data: {
				title: validated.title,
				slug: formattedSlug,
				author: validated.author || "Abimbola Lawuyi",
				description: validated.description ?? null,
				rating: validated.rating ?? 5.0,
				publisher: validated.publisher ?? null,
				publicationDate: validated.publicationDate ?? null,
				preOrderUrl: validated.preOrderUrl ?? null,
				relatedBookIds: validated.relatedBookIds ?? [],
				buyUrl: validated.buyUrl ?? null,
				coverImageId: validated.coverImageId ?? null,
				categoryId: validated.categoryId ?? null,
				status: validated.status,
				featuredOnHome: validated.featuredOnHome ?? false,
				prices: {
					create: validated.prices.map((p) => ({
						type: p.type,
						amount:
							p.type === "FREE" || p.type === "COMING_SOON" ? null : p.amount,
						url: p.url || null,
						available: p.available,
					})),
				},
			},
			include: { category: true, prices: true },
		});

		return NextResponse.json({ book }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to create book:", error);
		return NextResponse.json(
			{ error: "Failed to create book" },
			{ status: 500 },
		);
	}
}

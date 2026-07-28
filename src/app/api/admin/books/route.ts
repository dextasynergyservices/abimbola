import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const priceSchema = z.object({
	type: z.enum(["HARD_COPY", "SOFT_COPY", "FREE", "COMING_SOON"]),
	amount: z.number().positive().optional().nullable(),
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
	coverImageId: z.string().optional().nullable(),
	categoryId: z.string().optional().nullable(),
	status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
	prices: z.array(priceSchema).default([]),
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
			whereConditions.push({ status: statusFilter });
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

		const book = await prisma.book.create({
			data: {
				title: validated.title,
				slug: formattedSlug,
				author: validated.author || "Abimbola Lawuyi",
				description: validated.description ?? null,
				rating: validated.rating ?? 5.0,
				publisher: validated.publisher ?? null,
				publicationDate: validated.publicationDate ?? null,
				coverImageId: validated.coverImageId ?? null,
				categoryId: validated.categoryId ?? null,
				status: validated.status,
				prices: {
					create: validated.prices.map((p) => ({
						type: p.type,
						amount:
							p.type === "FREE" || p.type === "COMING_SOON" ? null : p.amount,
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

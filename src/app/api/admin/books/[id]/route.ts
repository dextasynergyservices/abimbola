import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const priceSchema = z.object({
	type: z.enum(["HARD_COPY", "SOFT_COPY", "FREE", "COMING_SOON"]),
	amount: z.number().positive().optional().nullable(),
	available: z.boolean().default(true),
});

const updateBookSchema = z.object({
	title: z.string().min(1, "Title is required"),
	slug: z.string().min(1, "Slug is required"),
	author: z.string().optional().default("Abimbola Lawuyi"),
	description: z.string().optional().nullable(),
	rating: z.number().min(0).max(5).optional().nullable(),
	publisher: z.string().optional().nullable(),
	publicationDate: z.string().optional().nullable(),
	coverImageId: z.string().optional().nullable(),
	categoryId: z.string().optional().nullable(),
	status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
	prices: z.array(priceSchema).default([]),
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
		const book = await prisma.book.findUnique({
			where: { id },
			include: { category: true, prices: true },
		});

		if (!book || book.deletedAt) {
			return NextResponse.json({ error: "Book not found" }, { status: 404 });
		}

		return NextResponse.json({ book });
	} catch (error) {
		console.error("Failed to fetch book:", error);
		return NextResponse.json(
			{ error: "Failed to fetch book" },
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
		const validated = updateBookSchema.parse(body);

		const existing = await prisma.book.findUnique({ where: { id } });
		if (!existing || existing.deletedAt) {
			return NextResponse.json({ error: "Book not found" }, { status: 404 });
		}

		const formattedSlug = validated.slug.trim().toLowerCase();
		const duplicate = await prisma.book.findFirst({
			where: { slug: formattedSlug, id: { not: id }, deletedAt: null },
		});
		if (duplicate) {
			return NextResponse.json(
				{ error: "Another book with this slug already exists" },
				{ status: 400 },
			);
		}

		await prisma.bookPrice.deleteMany({ where: { bookId: id } });

		const book = await prisma.book.update({
			where: { id },
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

		return NextResponse.json({ book });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to update book:", error);
		return NextResponse.json(
			{ error: "Failed to update book" },
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
		const existing = await prisma.book.findUnique({ where: { id } });
		if (!existing || existing.deletedAt) {
			return NextResponse.json({ error: "Book not found" }, { status: 404 });
		}

		const book = await prisma.book.update({
			where: { id },
			data: { deletedAt: new Date() },
		});

		return NextResponse.json({ message: "Book deleted successfully", book });
	} catch (error) {
		console.error("Failed to delete book:", error);
		return NextResponse.json(
			{ error: "Failed to delete book" },
			{ status: 500 },
		);
	}
}

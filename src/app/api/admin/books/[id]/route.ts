import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { recordBookAudit } from "@/lib/book-audit";
import {
	findBookSlugConflict,
	releaseSlugFromOtherBooksHistory,
	revalidateBookUrls,
} from "@/lib/book-slugs";
import { revalidatePublicSite } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { nextPreviousSlugs, validateSlug } from "@/lib/slug";

const priceSchema = z.object({
	type: z.enum(["HARD_COPY", "SOFT_COPY", "FREE", "COMING_SOON"]),
	amount: z.number().positive().optional().nullable(),
	url: z.string().optional().nullable(),
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
	preOrderUrl: z.string().optional().nullable(),
	relatedBookIds: z.array(z.string()).optional().default([]),
	buyUrl: z.string().optional().nullable(),
	coverImageId: z.string().optional().nullable(),
	categoryId: z.string().optional().nullable(),
	status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
	featuredOnHome: z.boolean().optional().default(false),
	prices: z
		.array(priceSchema)
		.min(1, "At least one pricing option is required to save a book"),
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
		const slugError = validateSlug(formattedSlug);
		if (slugError) {
			return NextResponse.json({ error: slugError }, { status: 400 });
		}
		const conflict = await findBookSlugConflict(formattedSlug, id);
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
			await releaseSlugFromOtherBooksHistory(formattedSlug, id);
		}

		if (validated.featuredOnHome) {
			const currentFeatured = await prisma.book.findMany({
				where: { featuredOnHome: true, id: { not: id }, deletedAt: null },
				orderBy: { updatedAt: "desc" },
			});
			if (currentFeatured.length >= 3) {
				const toKeepIds = currentFeatured.slice(0, 2).map((b) => b.id);
				await prisma.book.updateMany({
					where: {
						featuredOnHome: true,
						id: { notIn: [...toKeepIds, id] },
					},
					data: { featuredOnHome: false },
				});
			}
		}

		await prisma.bookPrice.deleteMany({ where: { bookId: id } });

		const book = await prisma.book.update({
			where: { id },
			data: {
				title: validated.title,
				slug: formattedSlug,
				previousSlugs,
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

		await recordBookAudit(session.user.id, "UPDATE_BOOK", book.id, {
			title: book.title,
			slug: book.slug,
			status: book.status,
			...(slugChanged ? { previousSlug: existing.slug } : {}),
			...(existing.title !== book.title
				? { previousTitle: existing.title }
				: {}),
		});

		revalidatePublicSite();
		revalidateBookUrls(book.id, [book.slug, ...book.previousSlugs]);

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
		if (!existing) {
			return NextResponse.json({ error: "Book not found" }, { status: 404 });
		}

		// Permanent delete. Prices and reviews are removed by the DB cascade
		// (onDelete: Cascade); other books' "related books" lists are cleaned
		// in the same transaction so no dangling ids remain. The cover image
		// stays in the media library because it may be used elsewhere.
		const referencingBooks = await prisma.book.findMany({
			where: { relatedBookIds: { has: id } },
			select: { id: true, relatedBookIds: true },
		});
		const [book] = await prisma.$transaction([
			prisma.book.delete({ where: { id } }),
			...referencingBooks.map((b) =>
				prisma.book.update({
					where: { id: b.id },
					data: { relatedBookIds: b.relatedBookIds.filter((r) => r !== id) },
				}),
			),
		]);

		await recordBookAudit(session.user.id, "DELETE_BOOK", book.id, {
			title: book.title,
			slug: book.slug,
			previousSlugs: book.previousSlugs,
			permanent: true,
		});

		revalidatePublicSite();
		revalidateBookUrls(book.id, [book.slug, ...book.previousSlugs]);

		return NextResponse.json({
			message: "Book permanently deleted",
			book: { id: book.id, title: book.title },
		});
	} catch (error) {
		console.error("Failed to delete book:", error);
		return NextResponse.json(
			{ error: "Failed to delete book" },
			{ status: 500 },
		);
	}
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createCategorySchema = z.object({
	name: z.string().min(1, "Category name is required"),
});

function slugify(name: string) {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function GET() {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const categories = await prisma.bookCategory.findMany({
			orderBy: { sortOrder: "asc" },
			include: { _count: { select: { books: true } } },
		});
		return NextResponse.json({ categories });
	} catch (error) {
		console.error("Failed to fetch book categories:", error);
		return NextResponse.json(
			{ error: "Failed to fetch book categories" },
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
		const validated = createCategorySchema.parse(body);
		const slug = slugify(validated.name);

		const existing = await prisma.bookCategory.findFirst({
			where: { OR: [{ name: validated.name }, { slug }] },
		});
		if (existing) {
			return NextResponse.json(
				{ error: "A book category with this name already exists" },
				{ status: 400 },
			);
		}

		const count = await prisma.bookCategory.count();
		const category = await prisma.bookCategory.create({
			data: { name: validated.name, slug, sortOrder: count },
		});

		return NextResponse.json({ category }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to create book category:", error);
		return NextResponse.json(
			{ error: "Failed to create book category" },
			{ status: 500 },
		);
	}
}

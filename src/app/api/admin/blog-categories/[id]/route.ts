import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateCategorySchema = z.object({
	name: z.string().min(1, "Category name is required"),
});

function slugify(name: string) {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id } = await params;
		const body = await request.json();
		const validated = updateCategorySchema.parse(body);
		const slug = slugify(validated.name);

		const duplicate = await prisma.blogCategory.findFirst({
			where: { OR: [{ name: validated.name }, { slug }], id: { not: id } },
		});
		if (duplicate) {
			return NextResponse.json(
				{ error: "Another blog category with this name already exists" },
				{ status: 400 },
			);
		}

		const category = await prisma.blogCategory.update({
			where: { id },
			data: { name: validated.name, slug },
		});

		return NextResponse.json({ category });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to update blog category:", error);
		return NextResponse.json(
			{ error: "Failed to update blog category" },
			{ status: 500 },
		);
	}
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

		await prisma.post.updateMany({
			where: { categoryId: id },
			data: { categoryId: null },
		});

		await prisma.blogCategory.delete({ where: { id } });

		return NextResponse.json({ message: "Blog category deleted" });
	} catch (error) {
		console.error("Failed to delete blog category:", error);
		return NextResponse.json(
			{ error: "Failed to delete blog category" },
			{ status: 500 },
		);
	}
}

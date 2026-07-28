import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateMediaSchema = z.object({
	altText: z.string().optional().nullable(),
	caption: z.string().optional().nullable(),
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
		const media = await prisma.media.findUnique({
			where: { id },
			include: {
				uploadedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!media) {
			return NextResponse.json(
				{ error: "Media item not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ media });
	} catch (error) {
		console.error("Failed to fetch media item:", error);
		return NextResponse.json(
			{ error: "Failed to fetch media item" },
			{ status: 500 },
		);
	}
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
		const validated = updateMediaSchema.parse(body);

		const existing = await prisma.media.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json(
				{ error: "Media item not found" },
				{ status: 404 },
			);
		}

		const media = await prisma.media.update({
			where: { id },
			data: {
				altText:
					validated.altText !== undefined
						? validated.altText
						: existing.altText,
				caption:
					validated.caption !== undefined
						? validated.caption
						: existing.caption,
			},
			include: {
				uploadedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		const userId = session.user.id as string;
		await prisma.auditLog.create({
			data: {
				userId,
				action: "UPDATE_MEDIA",
				entityType: "Media",
				entityId: media.id,
				metadata: { altText: media.altText, caption: media.caption },
			},
		});

		return NextResponse.json({ media });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to update media item:", error);
		return NextResponse.json(
			{ error: "Failed to update media item" },
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
		const existing = await prisma.media.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json(
				{ error: "Media item not found" },
				{ status: 404 },
			);
		}

		await prisma.media.delete({
			where: { id },
		});

		const userId = session.user.id as string;
		await prisma.auditLog.create({
			data: {
				userId,
				action: "DELETE_MEDIA",
				entityType: "Media",
				entityId: id,
				metadata: {
					cloudinaryPublicId: existing.cloudinaryPublicId,
					secureUrl: existing.secureUrl,
				},
			},
		});

		return NextResponse.json({ message: "Media deleted successfully" });
	} catch (error) {
		console.error("Failed to delete media item:", error);
		return NextResponse.json(
			{ error: "Failed to delete media item" },
			{ status: 500 },
		);
	}
}

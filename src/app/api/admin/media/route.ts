import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const createMediaSchema = z.object({
	cloudinaryPublicId: z.string().min(1, "Cloudinary public ID is required"),
	secureUrl: z.string().url("Valid image URL is required"),
	width: z.number().optional().nullable(),
	height: z.number().optional().nullable(),
	altText: z.string().optional().nullable(),
	caption: z.string().optional().nullable(),
});

export async function GET(request: Request) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const query = searchParams.get("query")?.trim() || "";

		const where = query
			? {
					OR: [
						{ altText: { contains: query, mode: "insensitive" as const } },
						{ caption: { contains: query, mode: "insensitive" as const } },
						{
							cloudinaryPublicId: {
								contains: query,
								mode: "insensitive" as const,
							},
						},
					],
				}
			: {};

		const mediaList = await prisma.media.findMany({
			where,
			orderBy: { createdAt: "desc" },
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

		return NextResponse.json({ media: mediaList });
	} catch (error) {
		console.error("Failed to fetch media library:", error);
		return NextResponse.json(
			{ error: "Failed to fetch media library" },
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
		const validated = createMediaSchema.parse(body);

		const userId = session.user.id as string;

		// Check if record with public ID already exists
		const existing = await prisma.media.findUnique({
			where: { cloudinaryPublicId: validated.cloudinaryPublicId },
		});

		if (existing) {
			return NextResponse.json(
				{ media: existing, message: "Media record already exists" },
				{ status: 200 },
			);
		}

		const media = await prisma.media.create({
			data: {
				cloudinaryPublicId: validated.cloudinaryPublicId,
				secureUrl: validated.secureUrl,
				width: validated.width ?? null,
				height: validated.height ?? null,
				altText: validated.altText ?? null,
				caption: validated.caption ?? null,
				uploadedById: userId,
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

		// Record audit log
		await prisma.auditLog.create({
			data: {
				userId,
				action: "CREATE_MEDIA",
				entityType: "Media",
				entityId: media.id,
				metadata: {
					cloudinaryPublicId: media.cloudinaryPublicId,
					secureUrl: media.secureUrl,
				},
			},
		});

		return NextResponse.json({ media }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to save media record:", error);
		return NextResponse.json(
			{ error: "Failed to save media record" },
			{ status: 500 },
		);
	}
}

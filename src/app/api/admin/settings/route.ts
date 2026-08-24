import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
	authorName: z.string().optional().nullable(),
	authorInitials: z.string().max(3).optional().nullable(),
	authorBio: z.string().optional().nullable(),
	contactEmail: z.string().email().optional().nullable().or(z.literal("")),
	contactPhone: z.string().optional().nullable(),
	address: z.string().optional().nullable(),
	instagramUrl: z.string().optional().nullable(),
	facebookUrl: z.string().optional().nullable(),
	whatsappUrl: z.string().optional().nullable(),
	telegramUrl: z.string().optional().nullable(),
	discordUrl: z.string().optional().nullable(),
	tiktokUrl: z.string().optional().nullable(),
	youtubeUrl: z.string().optional().nullable(),
});

export async function GET() {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const settings = await prisma.siteSettings.upsert({
			where: { id: "singleton" },
			update: {},
			create: { id: "singleton" },
		});

		return NextResponse.json({ settings });
	} catch (error) {
		console.error("Failed to fetch settings:", error);
		return NextResponse.json(
			{ error: (error as Error).message || "Failed to fetch settings" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const validated = settingsSchema.parse(body);

		const data = {
			authorName: validated.authorName?.trim() || null,
			authorInitials: validated.authorInitials?.trim().toUpperCase() || null,
			authorBio: validated.authorBio?.trim() || null,
			contactEmail: validated.contactEmail || null,
			contactPhone: validated.contactPhone || null,
			address: validated.address || null,
			instagramUrl: validated.instagramUrl || null,
			facebookUrl: validated.facebookUrl || null,
			whatsappUrl: validated.whatsappUrl || null,
			telegramUrl: validated.telegramUrl || null,
			discordUrl: validated.discordUrl || null,
			tiktokUrl: validated.tiktokUrl || null,
			youtubeUrl: validated.youtubeUrl || null,
		};

		const settings = await prisma.siteSettings.upsert({
			where: { id: "singleton" },
			update: data,
			create: { id: "singleton", ...data },
		});

		try {
			revalidatePath("/");
			revalidatePath("/about");
			revalidatePath("/contact");
		} catch (_e) {
			// Ignore cache revalidation errors
		}

		return NextResponse.json({ settings });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to update settings:", error);
		return NextResponse.json(
			{ error: "Failed to update settings" },
			{ status: 500 },
		);
	}
}

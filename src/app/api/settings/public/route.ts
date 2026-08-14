import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
	try {
		const settings = await prisma.siteSettings.findUnique({
			where: { id: "singleton" },
			select: {
				authorName: true,
				authorInitials: true,
				authorBio: true,
				contactEmail: true,
				contactPhone: true,
				address: true,
				instagramUrl: true,
				facebookUrl: true,
				whatsappUrl: true,
				telegramUrl: true,
				discordUrl: true,
				tiktokUrl: true,
				youtubeUrl: true,
			},
		});

		return NextResponse.json({ settings: settings || {} });
	} catch (error) {
		console.error("Failed to fetch public settings:", error);
		return NextResponse.json({ settings: {} });
	}
}

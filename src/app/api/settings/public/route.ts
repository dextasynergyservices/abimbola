import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

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

		return NextResponse.json(
			{ settings: settings || {} },
			{
				headers: {
					"Cache-Control":
						"public, s-maxage=3600, stale-while-revalidate=86400",
				},
			},
		);
	} catch (error) {
		console.error("Failed to fetch public settings:", error);
		return NextResponse.json(
			{ settings: {} },
			{
				headers: {
					"Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
				},
			},
		);
	}
}

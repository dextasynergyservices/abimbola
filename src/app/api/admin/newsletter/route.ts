import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const subscribers = await prisma.newsletterSubscriber.findMany({
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({ subscribers });
	} catch (error) {
		console.error("Failed to fetch newsletter subscribers:", error);
		return NextResponse.json(
			{ error: "Failed to fetch newsletter subscribers" },
			{ status: 500 },
		);
	}
}

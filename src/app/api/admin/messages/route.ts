import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const statusFilter = searchParams.get("status")?.trim() || "ALL";

		const where =
			statusFilter !== "ALL"
				? { status: statusFilter as "UNREAD" | "READ" | "ARCHIVED" }
				: {};

		const messages = await prisma.contactMessage.findMany({
			where,
			orderBy: { createdAt: "desc" },
		});

		return NextResponse.json({ messages });
	} catch (error) {
		console.error("Failed to fetch messages:", error);
		return NextResponse.json(
			{ error: "Failed to fetch messages" },
			{ status: 500 },
		);
	}
}

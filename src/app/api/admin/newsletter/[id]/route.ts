import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
		await prisma.newsletterSubscriber.delete({ where: { id } });
		return NextResponse.json({ message: "Subscriber removed" });
	} catch (error) {
		console.error("Failed to delete newsletter subscriber:", error);
		return NextResponse.json(
			{ error: "Failed to delete subscriber" },
			{ status: 500 },
		);
	}
}

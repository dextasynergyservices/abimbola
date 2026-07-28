import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const updateMessageSchema = z.object({
	status: z.enum(["UNREAD", "READ", "ARCHIVED"]),
});

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
		const validated = updateMessageSchema.parse(body);

		const message = await prisma.contactMessage.update({
			where: { id },
			data: { status: validated.status },
		});

		return NextResponse.json({ message });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to update message:", error);
		return NextResponse.json(
			{ error: "Failed to update message" },
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
		await prisma.contactMessage.delete({ where: { id } });
		return NextResponse.json({ message: "Message deleted" });
	} catch (error) {
		console.error("Failed to delete message:", error);
		return NextResponse.json(
			{ error: "Failed to delete message" },
			{ status: 500 },
		);
	}
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const contactSchema = z.object({
	name: z.string().min(1, "Name is required").max(200),
	email: z.string().email("A valid email is required"),
	subject: z.string().max(200).optional().nullable(),
	message: z.string().min(1, "Message is required").max(5000),
});

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const validated = contactSchema.parse(body);

		const message = await prisma.contactMessage.create({
			data: {
				name: validated.name.trim(),
				email: validated.email.trim().toLowerCase(),
				subject: validated.subject?.trim() || null,
				message: validated.message.trim(),
			},
		});

		return NextResponse.json({ message }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to submit contact message:", error);
		return NextResponse.json(
			{ error: "Failed to send message. Please try again." },
			{ status: 500 },
		);
	}
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const subscribeSchema = z.object({
	firstName: z.string().min(1, "First name is required").max(200),
	email: z.string().email("A valid email is required"),
});

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const validated = subscribeSchema.parse(body);
		const email = validated.email.trim().toLowerCase();

		const subscriber = await prisma.newsletterSubscriber.upsert({
			where: { email },
			update: { firstName: validated.firstName.trim() },
			create: { firstName: validated.firstName.trim(), email },
		});

		return NextResponse.json({ subscriber }, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error("Failed to save newsletter subscriber:", error);
		return NextResponse.json(
			{ error: "Failed to subscribe. Please try again." },
			{ status: 500 },
		);
	}
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateCloudinarySignature } from "@/lib/cloudinary";

export async function POST(request: Request) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		let folder = "abimbola_uploads";
		try {
			const body = await request.json();
			if (body.folder && typeof body.folder === "string") {
				folder = body.folder.trim();
			}
		} catch {
			// Body is optional
		}

		const signatureData = generateCloudinarySignature({ folder });

		return NextResponse.json(signatureData);
	} catch (error) {
		console.error("Failed to generate upload signature:", error);
		return NextResponse.json(
			{ error: "Failed to generate upload signature" },
			{ status: 500 },
		);
	}
}

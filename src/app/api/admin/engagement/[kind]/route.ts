import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
	countsForAdmin,
	listForAdmin,
	moderate,
	parseKind,
	type StatusFilter,
} from "@/lib/engagement/moderation";

const STATUSES: StatusFilter[] = ["all", "visible", "hidden", "flagged"];

/** GET /api/admin/engagement/[reviews|comments]?status=&q=&page= */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ kind: string }> },
) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const kind = parseKind((await params).kind);
	if (!kind) return NextResponse.json({ error: "Not found" }, { status: 404 });

	try {
		const url = new URL(request.url);
		const statusParam = url.searchParams.get("status") as StatusFilter | null;
		const status =
			statusParam && STATUSES.includes(statusParam) ? statusParam : "all";
		const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
		const q = url.searchParams.get("q") || undefined;

		const [list, counts] = await Promise.all([
			listForAdmin(kind, { status, q, page }),
			countsForAdmin(),
		]);

		return NextResponse.json({ ...list, counts, page });
	} catch (error) {
		console.error(`Failed to list ${kind}:`, error);
		return NextResponse.json(
			{ error: `Failed to load ${kind}` },
			{ status: 500 },
		);
	}
}

const bulkSchema = z.object({
	ids: z.array(z.string().min(1)).min(1, "Select at least one item").max(100),
	action: z.enum(["hide", "show", "delete"]),
});

/** POST /api/admin/engagement/[kind] — bulk moderation */
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ kind: string }> },
) {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const kind = parseKind((await params).kind);
	if (!kind) return NextResponse.json({ error: "Not found" }, { status: 404 });

	try {
		const { ids, action } = bulkSchema.parse(await request.json());
		const count = await moderate(kind, ids, action, session.user.id);
		return NextResponse.json({ count });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: error.errors[0].message },
				{ status: 400 },
			);
		}
		console.error(`Bulk moderation failed for ${kind}:`, error);
		return NextResponse.json({ error: "Bulk action failed" }, { status: 500 });
	}
}

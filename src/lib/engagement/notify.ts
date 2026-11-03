import { prisma } from "@/lib/prisma";

/**
 * Email notifications for new reviews/comments via Resend's HTTP API
 * (no SDK dependency). Entirely optional: if RESEND_API_KEY is not set,
 * this is a no-op.
 *
 * Env:
 *   RESEND_API_KEY      – API key from resend.com
 *   NOTIFY_EMAIL_FROM   – verified sender, e.g. "Abimbola Lawuyi <notifications@yourdomain.com>"
 *   NOTIFY_EMAIL_TO     – recipient (falls back to Site Settings → contact email)
 */

interface NotifyInput {
	kind: "review" | "comment";
	itemTitle: string;
	name: string;
	body: string;
	rating?: number;
	flagged: boolean;
	flagReason?: string | null;
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export async function notifyNewSubmission(input: NotifyInput): Promise<void> {
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.NOTIFY_EMAIL_FROM;
	if (!apiKey || !from) return;

	try {
		let to = process.env.NOTIFY_EMAIL_TO;
		if (!to) {
			const settings = await prisma.siteSettings.findUnique({
				where: { id: "singleton" },
				select: { contactEmail: true },
			});
			to = settings?.contactEmail || undefined;
		}
		if (!to) return;

		const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
		const adminUrl = `${appUrl}/admin/engagement?tab=${input.kind === "review" ? "reviews" : "comments"}${input.flagged ? "&status=flagged" : ""}`;
		const label = input.kind === "review" ? "review" : "comment";
		const stars =
			typeof input.rating === "number"
				? `${"★".repeat(input.rating)}${"☆".repeat(5 - input.rating)} `
				: "";

		const subject = input.flagged
			? `[Held for review] New ${label} on "${input.itemTitle}"`
			: `New ${label} on "${input.itemTitle}"`;

		const html = `
			<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;color:#0f172a">
				<h2 style="margin:0 0 8px">New ${label} on &ldquo;${escapeHtml(input.itemTitle)}&rdquo;</h2>
				${
					input.flagged
						? `<p style="background:#fef3c7;border:1px solid #fcd34d;padding:8px 12px;border-radius:8px;margin:0 0 12px">
								Held by the spam filter (${escapeHtml(input.flagReason || "flagged")}). It is <strong>not visible</strong> until you approve it.
							</p>`
						: ""
				}
				<p style="margin:0 0 4px"><strong>${escapeHtml(input.name)}</strong> ${stars ? `<span style="color:#f59e0b">${stars}</span>` : ""}</p>
				<blockquote style="margin:0 0 16px;padding:12px 16px;background:#f8fafc;border-left:3px solid #f59e0b;white-space:pre-line">${escapeHtml(input.body)}</blockquote>
				<a href="${adminUrl}" style="display:inline-block;background:#f59e0b;color:#0f172a;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Moderate in admin</a>
			</div>`;

		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ from, to, subject, html }),
		});

		if (!res.ok) {
			console.error("[notify] Resend error:", res.status, await res.text());
		}
	} catch (error) {
		console.error("[notify] failed to send notification:", error);
	}
}

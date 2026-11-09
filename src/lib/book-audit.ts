import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BookAuditAction = "CREATE_BOOK" | "UPDATE_BOOK" | "DELETE_BOOK";

/**
 * Record who changed a book and what changed (title/slug/status), mirroring
 * the audit logging already done for posts and media. Best-effort: a logging
 * failure is reported but never blocks the admin's save.
 */
export async function recordBookAudit(
	userId: string | undefined | null,
	action: BookAuditAction,
	bookId: string,
	metadata: Prisma.InputJsonObject,
): Promise<void> {
	if (!userId) {
		console.error(`Book audit skipped (${action} ${bookId}): no user id`);
		return;
	}
	try {
		await prisma.auditLog.create({
			data: { userId, action, entityType: "Book", entityId: bookId, metadata },
		});
	} catch (error) {
		console.error(`Book audit failed (${action} ${bookId}):`, error);
	}
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
	const session = await auth();
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const [
			totalBooks,
			publishedPosts,
			draftPosts,
			totalSubscribers,
			recentBooks,
			recentPosts,
			newReviews,
			newComments,
			flaggedReviews,
			flaggedComments,
		] = await Promise.all([
			prisma.book.count({ where: { deletedAt: null } }),
			prisma.post.count({ where: { status: "PUBLISHED", deletedAt: null } }),
			prisma.post.count({ where: { status: "DRAFT", deletedAt: null } }),
			prisma.newsletterSubscriber.count(),
			prisma.book.findMany({
				where: { deletedAt: null },
				orderBy: { updatedAt: "desc" },
				take: 5,
				select: { id: true, title: true, status: true, updatedAt: true },
			}),
			prisma.post.findMany({
				where: { deletedAt: null },
				orderBy: { updatedAt: "desc" },
				take: 5,
				select: {
					id: true,
					title: true,
					slug: true,
					status: true,
					updatedAt: true,
				},
			}),
			prisma.bookReview.count({
				where: { deletedAt: null, createdAt: { gte: weekAgo } },
			}),
			prisma.postComment.count({
				where: {
					deletedAt: null,
					isAuthor: false,
					createdAt: { gte: weekAgo },
				},
			}),
			prisma.bookReview.count({
				where: { deletedAt: null, status: "HIDDEN", flagged: true },
			}),
			prisma.postComment.count({
				where: { deletedAt: null, status: "HIDDEN", flagged: true },
			}),
		]);

		return NextResponse.json({
			stats: {
				totalBooks,
				publishedPosts,
				draftPosts,
				totalSubscribers,
				newEngagementThisWeek: newReviews + newComments,
				flaggedEngagement: flaggedReviews + flaggedComments,
			},
			recentBooks,
			recentPosts,
		});
	} catch (error) {
		console.error("Failed to fetch admin stats:", error);
		return NextResponse.json(
			{ error: "Failed to fetch dashboard statistics" },
			{ status: 500 },
		);
	}
}

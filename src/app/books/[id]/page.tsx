import { notFound } from "next/navigation";
import { books } from "@/data/books";
import { getPublishedBookById } from "@/lib/books";
import BookDetail from "@/pages/BookDetail";

export default async function BookDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	const dbBook = await getPublishedBookById(id);

	if (dbBook) {
		return <BookDetail book={dbBook} />;
	}

	if (!books.some((book) => book.id === Number(id))) {
		notFound();
	}

	return <BookDetail bookId={id} />;
}

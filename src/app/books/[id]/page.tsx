import BookDetail from "@/pages/BookDetail";
import { books } from "@/data/books";
import { notFound } from "next/navigation";

export default async function BookDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	if (!books.some((book) => book.id === Number(id))) {
		notFound();
	}

	return <BookDetail bookId={id} />;
}

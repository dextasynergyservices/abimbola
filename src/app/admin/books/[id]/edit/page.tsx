import { BookForm } from "@/components/admin/BookForm";

export default async function EditBookPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return <BookForm bookId={id} />;
}

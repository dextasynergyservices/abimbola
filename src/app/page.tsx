import type { Metadata } from "next";
import Index from "@/pages/Index";

export const metadata: Metadata = {
	title: "Abimbola Lawuyi | Author, Coach & Educational Leader",
	description:
		"Official website of Abimbola Lawuyi - Inspiring growth, educational leadership, literature, and family transformation.",
};

export default function HomePage() {
	return <Index />;
}

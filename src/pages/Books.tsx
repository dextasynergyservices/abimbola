import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import book1 from "@/assets/For BOOKS (1).png";
// import book3 from "@/assets/ABIMBOLA PIX (2).png";

export const books = [
	{
		id: 1,
		title: "The hardest part of loving your child",
		author: "Abimola Lawuyi",
		price: "₦15,000",
		rating: 4.5,
		image: book1,
		category: "FAMILY & PARENTING",
		description:
			"A profound exploration into the emotional complexities of parenthood. This book delves deep into the often unspoken challenges and profound sacrifices that come with loving your children unconditionally.",
		publisher: "Abimbola Lawuyi Publishing",
		publicationDate: "2025",
	},
	{
		id: 2,
		title: "50 Life Lessons",
		author: "Abimola Lawuyi",
		price: "Coming Soon",
		rating: 5.0,
		image:
			"https://res.cloudinary.com/dxoorukfj/image/upload/v1784550650/50_50_Abimbola_tuaugi.png",
		category: "LIFE & WISDOM",
		description:
			"A curated collection of invaluable wisdom and reflections. This book offers 50 powerful life lessons designed to guide, inspire, and transform your everyday perspective.",
		publisher: "Abimbola Lawuyi Publishing",
		publicationDate: "2023",
	},
	{
		id: 3,
		title: "Dear Single",
		author: "Abimola Lawuyi",
		price: "Coming Soon",
		rating: 4.8,
		image:
			"https://res.cloudinary.com/dxoorukfj/image/upload/v1782469054/DS_NEW_niyokf.png",
		category: "RELATIONSHIP & LOVE",
		description:
			"An empowering manifesto for the unattached. Navigate the journey of singleness with grace, purpose, and self-discovery as you prepare for whatever the future holds.",
		publisher: "Abimbola Lawuyi Publishing",
		publicationDate: "2026",
	},
];

const Books = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");

	const categories = [
		"All",
		"RELATIONSHIP & LOVE",
		"FAMILY & PARENTING",
		"LIFE & WISDOM",
	];

	const filteredBooks = books.filter((book) => {
		const matchesCategory =
			selectedCategory === "All" || book.category === selectedCategory;
		const matchesSearch =
			book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
			book.category.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	return (
		<div className="min-h-screen flex flex-col">
			<Navigation />

			{/* Hero Section */}
			<section className="bg-gradient-to-br from-secondary/10 via-primary/10 to-accent/10 section-padding">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
						Our Bookstore
					</h1>
					<p className="text-xl text-muted-foreground max-w-2xl">
						Carefully curated books to nourish your mind and inspire your
						journey
					</p>
				</div>
			</section>

			{/* Search and Filter */}
			<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex flex-col md:flex-row gap-4 items-center">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search books..."
							className="pl-10"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
					<div className="flex gap-2 flex-wrap">
						{categories.map((category) => (
							<Button
								key={category}
								variant={selectedCategory === category ? "default" : "outline"}
								size="sm"
								onClick={() => setSelectedCategory(category)}
							>
								{category}
							</Button>
						))}
					</div>
				</div>
			</section>

			{/* Books Grid */}
			<section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
				{filteredBooks.length > 0 ? (
					<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
						{filteredBooks.map((book) => (
							<Card
								key={book.id}
								className="card-lift overflow-hidden flex flex-col h-full"
							>
								<div className="aspect-[2/3] overflow-hidden bg-muted">
									<img
										src={book.image}
										alt={book.title}
										className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
									/>
								</div>
								<CardContent className="pt-4 flex-1">
									<span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
										{book.category}
									</span>
									<h3 className="text-lg font-display font-semibold mt-2 mb-1">
										{book.title}
									</h3>
									<p className="text-sm text-muted-foreground mb-2">
										by {book.author}
									</p>
									<div className="flex items-center gap-1 mb-2">
										{[...Array(5)].map((_, i) => (
											<Star
												key={`star-${i}`}
												className={`h-4 w-4 ${
													i < Math.floor(book.rating)
														? "fill-secondary text-secondary"
														: "text-muted"
												}`}
											/>
										))}
										<span className="text-sm text-muted-foreground ml-1">
											({book.rating})
										</span>
									</div>
									{book.price === "Coming Soon" ? (
										<div className="mt-1">
											<span className="inline-flex items-center text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full uppercase tracking-wider">
												Coming Soon
											</span>
										</div>
									) : (
										<p className="text-xl font-bold text-primary">
											{book.price}
										</p>
									)}
								</CardContent>
								<CardFooter className="gap-2">
									<Link
										to={`/books/${book.id}`}
										className={
											book.price === "Coming Soon" ? "w-full" : "flex-1"
										}
									>
										<Button variant="outline" size="sm" className="w-full">
											Details
										</Button>
									</Link>
									{book.price !== "Coming Soon" && (
										<Button size="sm" className="flex-1">
											{book.price === "Free" ? "Download" : "Buy"}
										</Button>
									)}
								</CardFooter>
							</Card>
						))}
					</div>
				) : (
					<div className="text-center py-12">
						<p className="text-neutral-500 text-lg">
							No books found matching your criteria.
						</p>
					</div>
				)}
			</section>

			<Footer />
		</div>
	);
};

export default Books;

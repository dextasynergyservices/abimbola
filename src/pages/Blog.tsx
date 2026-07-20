import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import blogFeatured1 from "@/assets/blog-featured-1.jpg";
import blogFeatured2 from "@/assets/blog-featured-2.jpg";

const Blog = () => {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("All");

	const posts = [
		{
			id: 1,
			title: "The Art of Mindful Reading",
			excerpt:
				"Discover how to transform your reading experience into a meditative practice that enriches both mind and soul.",
			image: blogFeatured1,
			date: "Nov 1, 2025",
			author: "Sarah Mitchell",
			category: "Reflections",
		},
		{
			id: 2,
			title: "Whispers in the Garden",
			excerpt:
				"A collection of poetry exploring growth, change, and the quiet moments between the seasons.",
			image: blogFeatured2,
			date: "Oct 28, 2025",
			author: "James Chen",
			category: "Poems",
		},
		{
			id: 3,
			title: "The Last Letter from the Village",
			excerpt:
				"An evocative short story about a daughter uncovering her mother's long-lost letters of resilience and hope.",
			image: blogFeatured1,
			date: "Oct 25, 2025",
			author: "Emily Rose",
			category: "Short Stories",
		},
		{
			id: 4,
			title: "Creating a Space for Quiet Reflection",
			excerpt:
				"Transform any corner of your home into a sanctuary where you can sit and read in absolute peace.",
			image: blogFeatured2,
			date: "Oct 20, 2025",
			author: "Michael Brown",
			category: "Reflections",
		},
	];

	const categories = ["All", "Poems", "Reflections", "Short Stories"];

	const filteredPosts = posts.filter((post) => {
		const matchesCategory =
			selectedCategory === "All" || post.category === selectedCategory;
		const matchesSearch =
			post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
			post.category.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	return (
		<div className="min-h-screen flex flex-col">
			<Navigation />

			{/* Hero Section */}
			<section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 section-padding">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
						Our Blog
					</h1>
					<p className="text-xl text-muted-foreground max-w-2xl">
						Insights, stories, and musings on books, reading, and the literary
						life
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
							placeholder="Search articles..."
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

			{/* Blog Grid */}
			<section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
				{filteredPosts.length > 0 ? (
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
						{filteredPosts.map((post) => (
							<Card
								key={post.id}
								className="card-lift overflow-hidden flex flex-col"
							>
								<div className="aspect-video overflow-hidden">
									<img
										src={post.image}
										alt={post.title}
										className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
									/>
								</div>
								<CardContent className="pt-6 flex-1">
									<div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
										<span className="bg-primary/10 text-primary px-2 py-1 rounded">
											{post.category}
										</span>
										<div className="flex items-center">
											<Calendar className="h-4 w-4 mr-1" />
											{post.date}
										</div>
									</div>
									<h3 className="text-xl font-display font-semibold mb-2">
										{post.title}
									</h3>
									<p className="text-muted-foreground mb-3">{post.excerpt}</p>
									<p className="text-sm text-muted-foreground">
										by {post.author}
									</p>
								</CardContent>
								<CardFooter>
									<Link to={`/blog/${post.id}`} className="w-full">
										<Button variant="ghost" className="w-full">
											Read More
											<ArrowRight className="ml-2 h-4 w-4" />
										</Button>
									</Link>
								</CardFooter>
							</Card>
						))}
					</div>
				) : (
					<div className="text-center py-12">
						<p className="text-neutral-500 text-lg">
							No articles found matching your criteria.
						</p>
					</div>
				)}
			</section>

			<Footer />
		</div>
	);
};

export default Blog;

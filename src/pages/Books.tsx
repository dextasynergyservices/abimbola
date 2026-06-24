import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import book1 from "@/assets/For BOOKS (1).png";
import book2 from "@/assets/For BOOKS (2).png";
import book3 from "@/assets/ABIMBOLA PIX (2).png";
import book4 from "@/assets/For BOOKS (3).png";

export const books = [
    {
      id: 1,
      title: "The hardest part of loving your children",
      author: "Abimola Lawuyi",
      price: "₦15,000",
      rating: 4.5,
      image: book1,
      category: "Philosophy",
    },
    {
      id: 2,
      title: "50 life lessons",
      author: "Abimola Lawuyi",
      price: "₦20,000",
      rating: 5.0,
      image: book2,
      category: "Nature",
    },
    {
      id: 3,
      title: "Dear Mothers",
      author: "Abimola Lawuyi",
      price: "₦19,000",
      rating: 4.8,
      image: book3,
      category: "Mindfulness",
    },
    {
      id: 4,
      title: "Loving your children",
      author: "Abimola Lawuyi",
      price: "₦24,990",
      rating: 4.5,
      image: book4,
      category: "Philosophy",
    },
  ];

const Books = () => {
  const categories = ["All", "Philosophy", "Nature", "Mindfulness", "Fiction", "Self-Help"];

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
            Carefully curated books to nourish your mind and inspire your journey
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
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Books Grid */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Card key={book.id} className="card-lift overflow-hidden flex flex-col">
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
                      key={i}
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
                <p className="text-xl font-bold text-primary">{book.price}</p>
              </CardContent>
              <CardFooter className="gap-2">
                <Link to={`/books/${book.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Details
                  </Button>
                </Link>
                <Button size="sm" className="flex-1">
                  Buy
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Books;

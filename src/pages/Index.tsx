import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowRight, Calendar } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-image.jpg";
import blogFeatured1 from "@/assets/blog-featured-1.jpg";
import blogFeatured2 from "@/assets/blog-featured-2.jpg";
import book1 from "@/assets/book-1.jpg";
import book2 from "@/assets/book-2.jpg";
import book3 from "@/assets/book-3.jpg";

const Index = () => {
  const featuredPosts = [
    {
      id: 1,
      title: "The Art of Mindful Reading",
      excerpt: "Discover how to transform your reading experience into a meditative practice that enriches both mind and soul.",
      image: blogFeatured1,
      date: "Nov 1, 2025",
    },
    {
      id: 2,
      title: "Building Your Personal Library",
      excerpt: "A comprehensive guide to curating a collection that reflects your interests and inspires continuous learning.",
      image: blogFeatured2,
      date: "Oct 28, 2025",
    },
  ];

  const featuredBooks = [
    {
      id: 1,
      title: "Geometric Thoughts",
      author: "Sarah Mitchell",
      price: "$24.99",
      image: book1,
    },
    {
      id: 2,
      title: "Botanical Wisdom",
      author: "James Chen",
      price: "$29.99",
      image: book2,
    },
    {
      id: 3,
      title: "Tranquil Moments",
      author: "Emily Rose",
      price: "$19.99",
      image: book3,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/80" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-primary-foreground mb-6 animate-fade-in">
            Welcome to Abimola Lawuyi
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 animate-fade-in">
            Your garden of knowledge — where stories bloom and wisdom grows
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link to="/books">
              <Button size="lg" variant="secondary" className="text-lg">
                Explore Books
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/blog">
              <Button size="lg" variant="outline" className="text-lg bg-background/20 hover:bg-background/30 text-primary-foreground border-primary-foreground/30">
                Read the Blog
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Content Section */}
      <section className="section-padding max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Latest Blog Posts */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Latest Articles
              </h2>
              <Link to="/blog">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-6">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="card-lift overflow-hidden">
                  <div className="md:flex">
                    <div className="md:w-1/3">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="h-48 md:h-full w-full object-cover"
                      />
                    </div>
                    <div className="md:w-2/3">
                      <CardContent className="pt-6">
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <Calendar className="h-4 w-4 mr-1" />
                          {post.date}
                        </div>
                        <h3 className="text-xl font-display font-semibold mb-2">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground">{post.excerpt}</p>
                      </CardContent>
                      <CardFooter>
                        <Link to={`/blog/${post.id}`}>
                          <Button variant="link" className="p-0">
                            Read More
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Featured Books */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Featured Books
              </h2>
              <Link to="/books">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-6">
              {featuredBooks.map((book) => (
                <Card key={book.id} className="card-lift overflow-hidden">
                  <div className="flex">
                    <div className="w-32 flex-shrink-0">
                      <img
                        src={book.image}
                        alt={book.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <CardContent className="pt-6">
                        <h3 className="text-xl font-display font-semibold mb-1">
                          {book.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          by {book.author}
                        </p>
                        <p className="text-2xl font-bold text-primary">
                          {book.price}
                        </p>
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Link to={`/books/${book.id}`}>
                          <Button size="sm">View Details</Button>
                        </Link>
                        <Button size="sm" variant="secondary">
                          Add to Cart
                        </Button>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

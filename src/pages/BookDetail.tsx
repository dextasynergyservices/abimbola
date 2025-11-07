import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Star, ShoppingCart } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import book1 from "@/assets/For BOOKS (1).png";
import book2 from "@/assets/For BOOKS (2).png";
import book3 from "@/assets/ABIMBOLA PIX (2).png";
import book4 from "@/assets/For BOOKS (3).png";
import book5 from "@/assets/book-2.jpg";
import book6 from "@/assets/book-3.jpg";

const BookDetail = () => {
  const relatedBooks = [
    { id: 2, title: "Botanical Wisdom", price: "$29.99", image: book2 },
    { id: 3, title: "Tranquil Moments", price: "$19.99", image: book3 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Back Button */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/books">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Books
          </Button>
        </Link>
      </div>

      {/* Book Detail */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Book Image */}
          <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-xl">
            <img
              src={book1}
              alt="Geometric Thoughts"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Book Info */}
          <div className="space-y-6">
            <div>
              <span className="text-sm bg-accent/10 text-accent px-3 py-1 rounded">
                Philosophy
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-2">
                Geometric Thoughts
              </h1>
              <p className="text-xl text-muted-foreground">by Sarah Mitchell</p>
            </div>

            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < 4 ? "fill-secondary text-secondary" : "text-muted"
                  }`}
                />
              ))}
              <span className="text-muted-foreground">(4.5 out of 5)</span>
            </div>

            <div className="text-4xl font-bold text-primary">$24.99</div>

            <div className="flex gap-4">
              <Button size="lg" className="flex-1">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button size="lg" variant="secondary">
                Buy Now
              </Button>
            </div>

            <div className="pt-6 border-t border-border">
              <h2 className="text-2xl font-display font-bold mb-4">
                About This Book
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                "Geometric Thoughts" is a profound exploration of how mathematical patterns and philosophical concepts intersect to create a deeper understanding of our world. Through elegant prose and thought-provoking insights, Sarah Mitchell guides readers on a journey through abstract concepts made tangible.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This book challenges conventional thinking and invites readers to see the beauty in structure, the logic in creativity, and the harmony in apparent chaos. Perfect for anyone interested in the intersection of mathematics, philosophy, and creative thinking.
              </p>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-display font-semibold text-lg mb-2">
                Book Details
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Publisher:</dt>
                  <dd className="font-medium">Abimola Lawuyi Publishing</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Publication Date:</dt>
                  <dd className="font-medium">October 2025</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pages:</dt>
                  <dd className="font-medium">342</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Language:</dt>
                  <dd className="font-medium">English</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">ISBN:</dt>
                  <dd className="font-medium">978-1-234567-89-0</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
        <h2 className="text-3xl font-display font-bold mb-8">Customer Reviews</h2>
        <div className="space-y-6">
          {[1, 2].map((review) => (
            <Card key={review}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold">John Doe</p>
                    <p className="text-sm text-muted-foreground">
                      Verified Purchase
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-secondary text-secondary"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "This book completely changed how I think about abstract concepts. Mitchell's writing is clear, engaging, and profound. Highly recommended for anyone interested in philosophy and mathematics."
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Related Books */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-3xl font-display font-bold mb-8">You May Also Like</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {relatedBooks.map((book) => (
            <Card key={book.id} className="card-lift overflow-hidden">
              <div className="aspect-[2/3] overflow-hidden">
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-display font-semibold mb-1">{book.title}</h3>
                <p className="text-lg font-bold text-primary">{book.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BookDetail;

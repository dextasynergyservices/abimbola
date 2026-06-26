import { Link, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Star, ShoppingCart } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { books } from "./Books";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // Find the specific book based on the URL ID
  const book = books.find((b) => b.id === Number(id));

  // If book not found, redirect to the books page
  if (!book) {
    return <Navigate to="/books" />;
  }

  // Related books (just picking the first two that are not the current book)
  const relatedBooks = books.filter((b) => b.id !== book.id).slice(0, 2);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      


      {/* Book Detail */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Book Image */}
          <div className="flex justify-center md:justify-start lg:sticky lg:top-32 h-fit">
            <div className="w-full max-w-[480px]">
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-auto object-contain rounded-xl drop-shadow-2xl hover:scale-[1.03] transition-transform duration-500"
              />
            </div>
          </div>

          {/* Book Info */}
          <div className="space-y-6">
            <div>
              <span className="text-sm bg-accent/10 text-accent px-3 py-1 rounded">
                {book.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-bold mt-4 mb-2">
                {book.title}
              </h1>
              <p className="text-xl text-muted-foreground">by {book.author}</p>
            </div>

            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(book.rating) ? "fill-secondary text-secondary" : "text-muted"
                  }`}
                />
              ))}
              <span className="text-muted-foreground">({book.rating} out of 5)</span>
            </div>

            {book.price === "Coming Soon" ? (
              <div className="inline-flex items-center text-sm font-semibold bg-primary/10 text-primary px-4 py-1.5 rounded-full uppercase tracking-wider">
                Coming Soon
              </div>
            ) : (
              <div className="text-4xl font-bold text-primary">{book.price}</div>
            )}

            {book.price !== "Coming Soon" && (
              <div className="flex gap-4">
                <Button size="lg" className="flex-1">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {book.price === "Free" ? "Download" : "Buy"}
                </Button>
              </div>
            )}

            <div className="pt-6 border-t border-border">
              <h2 className="text-2xl font-display font-bold mb-4">
                About This Book
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                This is a placeholder description. Once you're ready, you can add a dedicated summary for "{book.title}" in the books data file.
              </p>
            </div>

            <div className="pt-6 border-t border-border">
              <h3 className="font-display font-semibold text-lg mb-2">
                Book Details
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Publisher:</dt>
                  <dd className="font-medium">Abimbola Lawuyi Publishing</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Publication Date:</dt>
                  <dd className="font-medium">2026</dd>
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
                    <p className="font-semibold">Reviewer {review}</p>
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
                  "This book completely changed my perspective. Highly recommended."
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
          {relatedBooks.map((relBook) => (
            <Card key={relBook.id} className="card-lift overflow-hidden">
              <div className="aspect-[2/3] overflow-hidden">
                <img
                  src={relBook.image}
                  alt={relBook.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-display font-semibold mb-1">{relBook.title}</h3>
                <p className="text-lg font-bold text-primary">{relBook.price}</p>
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

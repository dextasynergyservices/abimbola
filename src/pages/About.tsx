import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Heart, Users } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 section-padding">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            About Abimola Lawuyi
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Where thoughtful words and curated stories come together
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none space-y-6">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Abimola Lawuyi was founded on a simple belief: that words have the power to transform lives. Whether through the reflective insights of a thoughtful blog post or the immersive journey of a carefully chosen book, we believe in the magic of storytelling and the wisdom found in the written word.
          </p>

          <h2 className="text-3xl font-display font-bold mt-12 mb-6">Our Mission</h2>
          
          <p className="text-muted-foreground leading-relaxed">
            We curate content and books that nourish the mind and soul. Our blog explores themes of mindfulness, personal growth, and the literary life, while our bookstore offers a carefully selected collection of titles that inspire, challenge, and delight.
          </p>

          <div className="grid md:grid-cols-3 gap-6 my-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Quality Content</h3>
                <p className="text-sm text-muted-foreground">
                  Thoughtfully written articles and carefully selected books
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <Heart className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Passion for Reading</h3>
                <p className="text-sm text-muted-foreground">
                  We believe in the transformative power of reading
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">
                  Building a community of thoughtful readers and writers
                </p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-3xl font-display font-bold mt-12 mb-6">Our Story</h2>
          
          <p className="text-muted-foreground leading-relaxed">
            Abimola Lawuyi began as a small passion project in 2020, born from a love of literature and a desire to create a space where readers could discover both insightful articles and beautiful books. What started as a personal blog has grown into a full-fledged platform serving thousands of readers worldwide.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            Today, we continue to honor our founding principles: to provide quality content, to celebrate the written word, and to foster a community of curious, thoughtful readers. Whether you're here for our blog, browsing our bookstore, or both, we're grateful to have you as part of the Abimola Lawuyi community.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;

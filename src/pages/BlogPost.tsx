import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, ArrowLeft, ArrowRight } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import blogFeatured1 from "@/assets/blog-featured-1.jpg";
import blogFeatured2 from "@/assets/blog-featured-2.jpg";

const BlogPost = () => {
  const relatedPosts = [
    {
      id: 2,
      title: "Building Your Personal Library",
      image: blogFeatured2,
    },
    {
      id: 3,
      title: "The Power of Literary Fiction",
      image: blogFeatured1,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Back Button */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/blog">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
            The Art of Mindful Reading
          </h1>
          
          <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>Sarah Mitchell</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>November 1, 2025</span>
            </div>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded">
              Reading
            </span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="aspect-video rounded-lg overflow-hidden mb-12">
          <img
            src={blogFeatured1}
            alt="The Art of Mindful Reading"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none space-y-6">
          <p className="text-lg text-muted-foreground leading-relaxed">
            In our fast-paced digital world, reading has often become just another task to check off our endless to-do lists. But what if we could transform this simple act into a profound practice of mindfulness and presence?
          </p>

          <h2 className="text-2xl font-display font-bold mt-8 mb-4">
            The Lost Art of Deep Reading
          </h2>
          
          <p className="text-muted-foreground leading-relaxed">
            Deep reading is more than just absorbing information from a page. It's about creating a meaningful connection with the text, allowing the words to resonate with your inner experience. When we read mindfully, we give ourselves the gift of being fully present with the author's thoughts, emotions, and insights.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            This practice involves slowing down, savoring each sentence, and allowing space for reflection. It's about quality over quantity, depth over breadth. In this way, reading becomes a form of meditation—a way to quiet the mind and nourish the soul.
          </p>

          <h2 className="text-2xl font-display font-bold mt-8 mb-4">
            Creating Your Mindful Reading Practice
          </h2>
          
          <p className="text-muted-foreground leading-relaxed">
            Start by choosing a quiet space where you won't be disturbed. Turn off your phone and other digital distractions. Take a few deep breaths before opening your book, setting an intention to be fully present with the text.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            As you read, notice when your mind wanders—and it will. This is natural. Gently bring your attention back to the page, without judgment. Pay attention not just to the meaning of the words, but to how they make you feel, what memories they evoke, and what insights they spark.
          </p>

          <h2 className="text-2xl font-display font-bold mt-8 mb-4">
            The Transformative Power of Slow Reading
          </h2>
          
          <p className="text-muted-foreground leading-relaxed">
            When we read slowly and mindfully, we create space for transformation. We allow the author's wisdom to integrate into our own understanding. We give ourselves time to question, to wonder, and to grow.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            This approach to reading enriches not just our minds, but our entire being. It teaches us patience, cultivates our attention, and deepens our capacity for empathy and understanding.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            So the next time you pick up a book, consider making it a meditation. Let it be a practice of presence, a celebration of language, and a journey into the depths of human experience.
          </p>
        </div>

        {/* Author Bio */}
        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <h3 className="font-display font-semibold text-lg mb-2">
            About the Author
          </h3>
          <p className="text-muted-foreground">
            Sarah Mitchell is a writer and mindfulness practitioner who has spent over a decade exploring the intersection of literature and contemplative practice. She leads reading groups and workshops on mindful reading.
          </p>
        </div>
      </article>

      {/* Related Posts */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="text-3xl font-display font-bold mb-8">Related Articles</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {relatedPosts.map((post) => (
            <Card key={post.id} className="card-lift overflow-hidden">
              <div className="flex">
                <div className="w-1/3">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="w-2/3 flex items-center">
                  <div>
                    <h3 className="font-display font-semibold mb-2">
                      {post.title}
                    </h3>
                    <Link to={`/blog/${post.id}`}>
                      <Button variant="link" className="p-0">
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPost;

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Heart, Users, Music, PenTool } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 section-padding">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            About Abimbola Lawuyi
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Sharing wisdom through stories, poetry, and life experiences
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none space-y-6">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Abimbola Lawuyi believes every life experience carries a lesson, and she is passionate about helping others discover theirs. With warmth and wisdom, she shares powerful insights on personal growth, relationships, and purposeful living, encouraging reflection, healing, and transformation.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            A natural storyteller, Abimbola weaves real-life experiences with timeless truths through her writing, poetry, and songs, guiding readers toward greater self-awareness and fulfillment.
          </p>

          <div className="grid md:grid-cols-3 gap-6 my-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Published Author</h3>
                <p className="text-sm text-muted-foreground">
                  Co-author of 40 Pearls of Wisdom and upcoming personal books
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <PenTool className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Creative Writer</h3>
                <p className="text-sm text-muted-foreground">
                  Weaving stories, poetry, and songs from life experiences
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Mentor & Guide</h3>
                <p className="text-sm text-muted-foreground">
                  Passionate about helping others discover life's lessons
                </p>
              </CardContent>
            </Card>
          </div>

          <h2 className="text-3xl font-display font-bold mt-12 mb-6">Writing Journey</h2>
          
          <p className="text-muted-foreground leading-relaxed">
            She is the co-author of <strong>40 Pearls of Wisdom</strong> and is currently working on two deeply personal books: <strong>Fifty Life Lessons @ 50</strong> and <strong>Dear Single</strong>.
          </p>

          <h2 className="text-3xl font-display font-bold mt-12 mb-6">Beyond Writing</h2>
          
          <p className="text-muted-foreground leading-relaxed">
            When she's not writing or composing, Abimbola mentors others, contributes to school leadership and enjoys unwinding with music and movies.
          </p>

          <p className="text-muted-foreground leading-relaxed">
            She lives in Port Harcourt, Nigeria, with her family.
          </p>

          <div className="grid md:grid-cols-2 gap-6 my-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <Music className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Creative Pursuits</h3>
                <p className="text-sm text-muted-foreground">
                  Composes songs and poetry that inspire and transform
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <Heart className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="font-display font-semibold mb-2">Community Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Mentoring and educational leadership in her community
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
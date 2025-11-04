import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const StyleGuide = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Style Guide
        </h1>
        <p className="text-xl text-muted-foreground mb-12">
          Design system and component library for Eden's Nest
        </p>

        {/* Colors */}
        <section className="mb-16">
          <h2 className="text-3xl font-display font-bold mb-6">Color Palette</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Primary (Teal)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-20 bg-primary rounded-lg" />
                <div className="h-20 bg-primary-light rounded-lg" />
                <p className="text-sm text-muted-foreground pt-2">
                  Main brand color, used for primary actions and key elements
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Secondary (Coral)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-20 bg-secondary rounded-lg" />
                <div className="h-20 bg-secondary-light rounded-lg" />
                <p className="text-sm text-muted-foreground pt-2">
                  Accent color for highlights and secondary actions
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Accent (Amethyst)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-20 bg-accent rounded-lg" />
                <div className="h-20 bg-accent-light rounded-lg" />
                <p className="text-sm text-muted-foreground pt-2">
                  Decorative accent for badges and special elements
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-3xl font-display font-bold mb-6">Typography</h2>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Display (Headings)</p>
                <h1 className="text-5xl font-display font-bold">Playfair Display</h1>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Body (Content)</p>
                <p className="text-lg font-sans">
                  Inter - The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-display">Heading 1</h1>
                <h2 className="text-3xl font-display">Heading 2</h2>
                <h3 className="text-2xl font-display">Heading 3</h3>
                <h4 className="text-xl font-display">Heading 4</h4>
                <p className="text-base">Body Text - Regular paragraph text</p>
                <p className="text-sm text-muted-foreground">Small Text - Captions and meta information</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-3xl font-display font-bold mb-6">Buttons</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button>Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="destructive">Destructive Button</Button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg">Large</Button>
                  <Button>Default</Button>
                  <Button size="sm">Small</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Form Elements */}
        <section className="mb-16">
          <h2 className="text-3xl font-display font-bold mb-6">Form Elements</h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Input placeholder="Text Input" />
              <Input type="email" placeholder="Email Input" />
              <Input type="search" placeholder="Search Input" />
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section className="mb-16">
          <h2 className="text-3xl font-display font-bold mb-6">Cards</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Basic card component with header and content
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-lift">
              <CardHeader>
                <CardTitle>Hover Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Card with lift animation on hover (try hovering!)
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Spacing */}
        <section className="mb-16">
          <h2 className="text-3xl font-display font-bold mb-6">Spacing</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">section-padding</p>
                  <p className="text-sm">px-4 py-16 md:px-8 md:py-24 lg:px-16</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Border Radius</p>
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-primary rounded-sm" />
                    <div className="w-16 h-16 bg-primary rounded-md" />
                    <div className="w-16 h-16 bg-primary rounded-lg" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Effects */}
        <section className="mb-16">
          <h2 className="text-3xl font-display font-bold mb-6">Effects</h2>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Gradient Text</p>
                <p className="text-3xl font-display font-bold gradient-text">
                  Beautiful Gradient Text
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Card Shadows</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="h-24 bg-card rounded-lg shadow-sm flex items-center justify-center text-sm">
                    Small
                  </div>
                  <div className="h-24 bg-card rounded-lg shadow-md flex items-center justify-center text-sm">
                    Medium
                  </div>
                  <div className="h-24 bg-card rounded-lg shadow-lg flex items-center justify-center text-sm">
                    Large
                  </div>
                  <div className="h-24 bg-card rounded-lg shadow-xl flex items-center justify-center text-sm">
                    Extra Large
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default StyleGuide;

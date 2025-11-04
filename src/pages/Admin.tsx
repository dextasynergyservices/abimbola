import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BookOpen, Users, Settings, PlusCircle, Edit, Trash2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Admin = () => {
  const stats = [
    { label: "Total Posts", value: "24", icon: FileText, color: "text-primary" },
    { label: "Total Books", value: "156", icon: BookOpen, color: "text-secondary" },
    { label: "Users", value: "1,234", icon: Users, color: "text-accent" },
  ];

  const recentPosts = [
    { id: 1, title: "The Art of Mindful Reading", status: "Published", date: "Nov 1, 2025" },
    { id: 2, title: "Building Your Personal Library", status: "Published", date: "Oct 28, 2025" },
    { id: 3, title: "Draft: New Reading Habits", status: "Draft", date: "Nov 3, 2025" },
  ];

  const recentBooks = [
    { id: 1, title: "Geometric Thoughts", stock: 45, price: "$24.99" },
    { id: 2, title: "Botanical Wisdom", stock: 32, price: "$29.99" },
    { id: 3, title: "Tranquil Moments", stock: 18, price: "$19.99" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navigation />
      
      {/* Dashboard Header */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 section-padding">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your blog posts, books, and users
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Blog Posts Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>Manage your blog articles</CardDescription>
                </div>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{post.title}</h3>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            post.status === "Published"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {post.status}
                        </span>
                        <span>{post.date}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Books Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Books Inventory</CardTitle>
                  <CardDescription>Manage your book catalog</CardDescription>
                </div>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Book
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{book.title}</h3>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span>Stock: {book.stock}</span>
                        <span className="text-primary font-semibold">
                          {book.price}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-24 flex flex-col gap-2">
            <FileText className="h-6 w-6" />
            <span>All Posts</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2">
            <BookOpen className="h-6 w-6" />
            <span>All Books</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2">
            <Users className="h-6 w-6" />
            <span>Users</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2">
            <Settings className="h-6 w-6" />
            <span>Settings</span>
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Admin;

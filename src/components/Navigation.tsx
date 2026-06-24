import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const logo = "https://res.cloudinary.com/dxoorukfj/image/upload/v1782312802/Abimbola_LOGO_3_ms0jyd.png";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: "Books", path: "/books" },
    { name: "Community", path: "#community" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleNavClick = (path: string) => {
    setIsOpen(false);
    if (path.startsWith("#") && location.pathname === "/") {
      const el = document.querySelector(path);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled || isOpen
          ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 md:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="Abimbola Lawuyi"
              className="h-14 md:h-20 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) =>
              link.path.startsWith("#") ? (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={cn(
                    "text-[13px] font-medium tracking-wide uppercase link-underline transition-colors duration-300",
                    scrolled ? "text-neutral-600 hover:text-black" : "text-neutral-500 hover:text-black"
                  )}
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-[13px] font-medium tracking-wide uppercase link-underline transition-colors duration-300",
                    isActive(link.path)
                      ? "text-black"
                      : scrolled
                        ? "text-neutral-600 hover:text-black"
                        : "text-neutral-500 hover:text-black"
                  )}
                >
                  {link.name}
                </Link>
              )
            )}

            {/* CTA Button */}
            <Link
              to="#newsletter"
              onClick={() => handleNavClick("#newsletter")}
              className="ml-2 px-5 py-2.5 bg-black text-white text-[13px] font-medium tracking-wide uppercase rounded-full hover:bg-neutral-800 transition-colors duration-300"
            >
              Get the Letters
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-black"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-500 ease-in-out",
            isOpen ? "max-h-[400px] opacity-100 pb-8" : "max-h-0 opacity-0"
          )}
        >
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) =>
              link.path.startsWith("#") ? (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className="text-left px-4 py-3 text-[15px] font-medium text-neutral-600 hover:text-black hover:bg-neutral-50 rounded-lg transition-colors"
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 text-[15px] font-medium rounded-lg transition-colors",
                    isActive(link.path)
                      ? "text-black bg-neutral-50"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-50"
                  )}
                >
                  {link.name}
                </Link>
              )
            )}
            <div className="px-4 pt-3">
              <Link
                to="#newsletter"
                onClick={() => handleNavClick("#newsletter")}
                className="block text-center px-5 py-3 bg-black text-white text-[14px] font-medium rounded-full hover:bg-neutral-800 transition-colors"
              >
                Get the Letters
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

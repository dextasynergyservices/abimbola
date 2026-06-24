import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail } from "lucide-react";
import logo from "@/assets/AW - LOGO.png";

const Footer = () => {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-5">
            <Link to="/" className="inline-block">
              <img
                src={logo}
                alt="Abimbola Lawuyi"
                className="h-14 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-xs">
              A Lady with a Pen and a Purpose.
              <br />
              <em>God Inspires. I write.</em>
            </p>
            <div className="flex gap-4 pt-1">
              <a
                href="https://instagram.com/abimbolawrites"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-gold transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://bit.ly/abimbolawritesFB"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-gold transition-colors duration-300"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@abimbolalawuyi.com"
                className="text-neutral-400 hover:text-gold transition-colors duration-300"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs font-medium tracking-widest uppercase text-neutral-400 mb-6">
              Navigate
            </h3>
            <ul className="space-y-3">
              {[
                { name: "Home", path: "/" },
                { name: "About", path: "#about" },
                { name: "Blog", path: "/blog" },
                { name: "Books", path: "/books" },
                { name: "Community", path: "#community" },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-xs font-medium tracking-widest uppercase text-neutral-400 mb-6">
              Connect
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="#newsletter"
                  className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
                >
                  Newsletter
                </Link>
              </li>
              <li>
                <a
                  href="https://instagram.com/abimbolawrites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
                >
                  Instagram — @abimbolawrites
                </a>
              </li>
              <li>
                <a
                  href="https://bit.ly/abimbolawritesFB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@abimbolalawuyi.com"
                  className="text-sm text-neutral-300 hover:text-white transition-colors duration-300"
                >
                  hello@abimbolalawuyi.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-neutral-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} Abimbola Lawuyi. All rights reserved.
          </p>
          <p className="text-xs text-neutral-600 italic">
            AbimbolaWrites — the writing & publishing arm
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

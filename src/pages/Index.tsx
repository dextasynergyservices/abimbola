import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Feather, Heart, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import heroPortrait from "@/assets/ABIMBOLA PIX (1).png";
import aboutImage from "@/assets/about IMAGE.png";
import bookDearSingle from "@/assets/For BOOKS (3).png";
import bookHardestPart from "@/assets/For BOOKS (1).png";
import book50Lessons from "@/assets/For BOOKS (2).png";

/* ─── Scroll reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    const el = ref.current;
    if (el) {
      const targets = el.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale");
      targets.forEach((t) => observer.observe(t));
    }

    return () => observer.disconnect();
  }, []);

  return ref;
}

const Index = () => {
  const pageRef = useReveal();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", email: "" });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  return (
    <div ref={pageRef} className="min-h-screen flex flex-col bg-white">
      <Navigation />

      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section className="hero-section relative overflow-hidden pt-20">
        {/* ── Background image ── */}
        <div className="hero-bg-image" />

        {/* ── Gradient overlay for text readability on mobile ── */}
        <div className="hero-mobile-overlay" />

        {/* ── Main content wrapper ── */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12">
          <div className="hero-content-grid">

            {/* ── LEFT — Text column ── */}
            <div className="flex flex-col justify-center pt-10 pb-6 lg:py-20">

              {/* Eyebrow */}
              <div className="hero-eyebrow mb-5">
                <span className="text-[#c9963f] text-[0.68rem] font-semibold tracking-[0.22em] uppercase">
                  A Lady with a Pen and a Purpose
                </span>
              </div>

              {/* Headline */}
              <h1 className="hero-headline-text font-display text-[2.6rem] sm:text-5xl lg:text-[3.6rem] xl:text-[4rem] font-bold leading-[1.08] text-black mb-5">
                For the one who is<br />
                thinking deeply<br />
                about{" "}
                <em className="text-[#d4930a] not-italic relative inline-block font-display italic">
                  love.
                  <svg
                    className="hero-love-underline absolute -bottom-3 left-0 w-[110%] h-[18px] pointer-events-none"
                    viewBox="0 0 100 20"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2,8 Q40,0 98,4"
                      stroke="#f6b219"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15,16 Q50,11 85,13"
                      stroke="#f6b219"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  </svg>
                </em>
              </h1>

              {/* Subheadline */}
              <p className="hero-subheadline text-neutral-500 text-[0.97rem] sm:text-base leading-relaxed mb-8 max-w-[22rem]">
                I write about clarity, love, and the quiet work of knowing
                yourself — before you commit to anything or anyone.
              </p>

              {/* CTAs */}
              <div className="hero-cta flex flex-col sm:flex-row gap-3 mb-10 lg:mb-0">
                <Link
                  to="/books"
                  className="inline-flex items-center justify-center gap-2 px-7 py-[0.9rem] bg-black text-white text-sm font-semibold tracking-wide rounded-full hover:bg-neutral-800 transition-colors duration-300 shadow-[0_4px_18px_0_rgba(0,0,0,0.22)]"
                >
                  Read Dear Single
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#community"
                  className="inline-flex items-center justify-center gap-2 px-7 py-[0.9rem] border border-black/15 bg-white/80 text-black text-sm font-medium tracking-wide rounded-full hover:bg-white transition-colors duration-300 shadow-sm"
                >
                  Join the Community
                </a>
              </div>
            </div>

            {/* ── RIGHT — Portrait column ── */}
            <div className="hero-portrait-col">
              {/* Gold circle backdrop */}
              <div className="hero-gold-circle">
                {/* Portrait clipped inside circle */}
                <img
                  src={heroPortrait}
                  alt="Abimbola Lawuyi holding her book"
                  className="hero-portrait-img"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Features bar (overlapping bottom of hero) ── */}
        <div className="hero-features-bar lg:hidden">
          <div className="hero-features-inner">

            <div className="hero-feature-item">
              <span className="hero-feature-icon text-[#d4930a]"><Feather className="w-5 h-5" /></span>
              <div>
                <p className="hero-feature-title">Honest Stories</p>
                <p className="hero-feature-sub">from real life</p>
              </div>
            </div>

            <div className="hero-feature-divider" />

            <div className="hero-feature-item">
              <span className="hero-feature-icon text-[#d4930a]"><Heart className="w-5 h-5" /></span>
              <div>
                <p className="hero-feature-title">Deep Reflections</p>
                <p className="hero-feature-sub">on love &amp; life</p>
              </div>
            </div>

            <div className="hero-feature-divider" />

            <div className="hero-feature-item">
              <span className="hero-feature-icon text-[#d4930a]"><Users className="w-5 h-5" /></span>
              <div>
                <p className="hero-feature-title">A Community</p>
                <p className="hero-feature-sub">that gets it</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HERO IMAGE QUOTE (DARK FOOTER STRIP)
          ═══════════════════════════════════════════ */}
      <div className="w-full bg-neutral-900 py-6 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-neutral-300 text-sm md:text-base font-medium tracking-wide">
            <span className="text-white italic">"Singleness is not a waiting room for life — it is life."</span>
            <span className="text-gold ml-2">— From Dear Single, by Abimbola</span>
          </p>
        </div>
      </div>


      {/* ═══════════════════════════════════════════
          IMAGE AREA — CENTRE TEXT
          ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="reveal font-display text-3xl md:text-4xl lg:text-5xl text-black italic leading-snug">
            God Inspires. <span className="text-gold">I write.</span>
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SCROLLING STRIP
          ═══════════════════════════════════════════ */}
      <section className="bg-black py-4 overflow-hidden">
        <div className="marquee-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 whitespace-nowrap">
              <span className="text-white/80 text-sm tracking-widest uppercase">Clarity before Commitment</span>
              <span className="text-gold">✦</span>
              <span className="text-white/80 text-sm tracking-widest uppercase">A Lady with a Pen and a Purpose</span>
              <span className="text-gold">✦</span>
              <span className="text-white/80 text-sm tracking-widest uppercase">God Inspires. I write.</span>
              <span className="text-gold">✦</span>
              <span className="text-white/80 text-sm tracking-widest uppercase">Know Yourself before You Choose</span>
              <span className="text-gold">✦</span>
              <span className="text-white/80 text-sm tracking-widest uppercase">Dear Single — Coming Soon</span>
              <span className="text-gold">✦</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ABOUT SECTION
          ═══════════════════════════════════════════ */}
      <section id="about" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-start">
            {/* Left — Text */}
            <div>
              <span className="reveal section-label mb-6 block">About Abimbola</span>

              <h2 className="reveal font-display text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-tight text-black mb-8">
                I believe every life holds a lesson worth{" "}
                <em className="text-gold not-italic">writing down.</em>
              </h2>

              <div className="space-y-5 text-neutral-600 text-[15px] leading-relaxed">
                <p className="reveal">
                  My name is Abimbola Lawuyi — and for most of my life, I have been the person
                  people come to when they need to think something through. About love. About
                  faith. About the choices that will shape their next season.
                </p>
                <p className="reveal">
                  I am an author, coach, and educational leader with more than 20 years of
                  experience walking alongside people through their most important decisions. I
                  have sat with people at every stage — those still waiting, those already
                  committed, and those standing at crossroads they never expected. I know those
                  conversations. I have been in them myself.
                </p>
                <p className="reveal">
                  At the heart of everything I do is one belief — that love deserves clarity.
                  That the relationships we commit to should be chosen wisely, intentionally,
                  and with a deep knowledge of ourselves.
                </p>
              </div>

              {/* Author credits */}
              <div className="reveal mt-8 space-y-2">
                {[
                  "Author of Dear Single (forthcoming)",
                  "Author of The Hardest Part of Loving Your Child",
                  "Co-author of 40 Pearls of Wisdom",
                  "Author of 50 Life Lessons (forthcoming)",
                  "Educator, Coach & Mentor — 20+ years",
                ].map((credit) => (
                  <div key={credit} className="flex items-start gap-2.5">
                    <span className="text-gold mt-1 text-xs">—</span>
                    <span className="text-neutral-500 text-sm">{credit}</span>
                  </div>
                ))}
              </div>

              <div className="reveal mt-10">
                <Link
                  to="/books"
                  className="inline-flex items-center gap-2 text-black text-sm font-semibold tracking-wide uppercase link-underline"
                >
                  Explore My Books
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right — Image */}
            <div className="reveal-right relative">
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={aboutImage}
                  alt="Abimbola Lawuyi — Author, Coach, Educational Leader"
                  className="w-full h-auto object-cover"
                />
                {/* Quote overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-16">
                  <p className="font-display text-white italic text-lg">
                    "I believe every life holds a lesson worth writing down."
                  </p>
                  <p className="text-neutral-400 text-xs mt-2 tracking-wide">
                    Abimbola Lawuyi — Author · Coach · Educational Leader
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          BOOKS SECTION
          ═══════════════════════════════════════════ */}
      <section id="books" className="section-padding bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="reveal section-label justify-center mb-5 block">Books by Abimbola</span>
            <h2 className="reveal font-display text-3xl md:text-4xl lg:text-[2.75rem] font-semibold text-black mb-4">
              Words written to meet you exactly{" "}
              <em className="text-gold not-italic">where you are</em>
            </h2>
            <p className="reveal text-neutral-500 max-w-xl mx-auto text-[15px] leading-relaxed">
              Each book comes from a real season, a real question, a real need.
              Read the one that speaks to where you are right now.
            </p>
          </div>

          {/* Books grid */}
          <div className="grid md:grid-cols-3 gap-8 stagger-children">
            {/* Book 1 — Dear Single (Featured) */}
            <div className="reveal bg-white rounded-2xl overflow-hidden border border-neutral-100 card-lift relative">
              <div className="absolute top-4 right-4 z-10">
                <span className="px-3 py-1 bg-gold text-black text-[11px] font-semibold tracking-wider uppercase rounded-full">
                  New Book
                </span>
              </div>
              <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
                <img
                  src={bookDearSingle}
                  alt="Dear Single by Abimbola Lawuyi"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold text-black mb-1">Dear Single</h3>
                <p className="text-neutral-400 text-xs italic mb-3">Letters for the journey you are on right now</p>
                <p className="text-neutral-600 text-sm leading-relaxed mb-4">
                  This book is not only for single people. It is for anyone who wants to love
                  well — the one at a crossroads, the one in a relationship searching for
                  clarity, the one who has loved before and is learning what it really means to
                  choose wisely.
                </p>
                <p className="font-display text-neutral-400 text-sm italic mb-4">
                  "Singleness is not a waiting room for life — it is life. It is a season filled with purpose, growth, and self-discovery."
                </p>
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="text-black font-semibold">₦5,000</span>
                  <span className="text-neutral-400 text-xs">Digital</span>
                  <span className="text-neutral-300">·</span>
                  <span className="text-black font-semibold">₦8,000</span>
                  <span className="text-neutral-400 text-xs">Physical</span>
                </div>
                <Link
                  to="/books"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white text-sm font-medium rounded-full hover:bg-neutral-800 transition-colors"
                >
                  Get Your Copy
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Book 2 — The Hardest Part of Loving Your Child */}
            <div className="reveal bg-white rounded-2xl overflow-hidden border border-neutral-100 card-lift">
              <div className="absolute top-4 right-4 z-10 hidden">
                <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-[11px] font-semibold tracking-wider uppercase rounded-full">
                  Parenting & Faith
                </span>
              </div>
              <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
                <img
                  src={bookHardestPart}
                  alt="The Hardest Part of Loving Your Child"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <span className="text-gold text-[11px] font-medium tracking-wider uppercase">Parenting & Faith</span>
                <h3 className="font-display text-xl font-semibold text-black mt-2 mb-1">
                  The Hardest Part of Loving Your Child
                </h3>
                <p className="text-neutral-400 text-xs italic mb-3">By Abimbola Lawuyi</p>
                <p className="text-neutral-600 text-sm leading-relaxed mb-5">
                  A heartfelt exploration of the complexities, sacrifices, and deep grace found
                  in loving a child through every season — even the difficult ones.
                </p>
                <Link
                  to="/books"
                  className="inline-flex items-center gap-2 px-6 py-2.5 border border-black text-black text-sm font-medium rounded-full hover:bg-black hover:text-white transition-colors"
                >
                  Get Your Copy
                </Link>
              </div>
            </div>

            {/* Book 3 — 50 Life Lessons */}
            <div className="reveal bg-white rounded-2xl overflow-hidden border border-neutral-100 card-lift relative">
              <div className="absolute top-4 right-4 z-10">
                <span className="px-3 py-1 bg-neutral-900 text-white text-[11px] font-semibold tracking-wider uppercase rounded-full">
                  Coming Soon
                </span>
              </div>
              <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
                <img
                  src={book50Lessons}
                  alt="50 Life Lessons by Abimbola Lawuyi"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <span className="text-gold text-[11px] font-medium tracking-wider uppercase">Life & Wisdom</span>
                <h3 className="font-display text-xl font-semibold text-black mt-2 mb-1">50 Life Lessons</h3>
                <p className="text-neutral-400 text-xs italic mb-3">By Abimbola Lawuyi</p>
                <p className="text-neutral-600 text-sm leading-relaxed mb-5">
                  Fifty years of living teaches you things no classroom ever could. A collection
                  of hard-won wisdom for the person who is approaching a new decade — or simply
                  ready to stop living on autopilot.
                </p>
                <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-neutral-100 text-neutral-500 text-sm font-medium rounded-full cursor-default">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          COMMUNITY SECTION — THE CLARITY SPACE
          ═══════════════════════════════════════════ */}
      <section id="community" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left — Info */}
            <div>
              <span className="reveal section-label mb-6 block">The Clarity Space</span>

              <h2 className="reveal font-display text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-tight text-black mb-6">
                You should not have to figure this out{" "}
                <em className="text-gold not-italic">alone.</em>
              </h2>

              <p className="reveal text-neutral-600 text-[15px] leading-relaxed mb-8">
                The Clarity Space is a community for anyone who wants to think deeply about
                love, grow intentionally, and choose wisely — whether you are single, in a
                relationship, or simply done living without clarity. We gather once a month to
                talk, reflect, and do the quiet, important work of knowing ourselves.
              </p>

              {/* Membership details */}
              <div className="reveal bg-neutral-50 rounded-2xl p-6 md:p-8 mb-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-black">
                      The Clarity Space
                    </h3>
                    <p className="text-neutral-500 text-sm">'Dear Single' Book Review</p>
                  </div>
                  <span className="px-3 py-1 bg-gold/10 text-gold-dark text-[11px] font-semibold tracking-wider uppercase rounded-full">
                    Sept – Dec 2026
                  </span>
                </div>

                <p className="text-neutral-500 text-sm mb-5">
                  Entry: A copy of Dear Single
                </p>

                <div className="space-y-3">
                  {[
                    "FREE e-copy of 'Dear Single' workbook",
                    "Access to 1-on-1 coaching discount",
                    "Abimbola's bi-monthly letters",
                    "Monthly live session with Abimbola",
                    "Monthly focus theme + reflection prompts",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-neutral-700 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reveal">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-black text-white text-sm font-semibold tracking-wide rounded-full hover:bg-neutral-800 transition-colors duration-300"
                >
                  Join Now
                  <ArrowRight className="h-4 w-4" />
                </a>
                <p className="text-neutral-400 text-xs italic mt-4 max-w-sm">
                  A copy of Dear Single unlocks your founding seat. Only 25 founding seats are
                  available.
                </p>
              </div>
            </div>

            {/* Right — Visual */}
            <div className="reveal-right">
              <div className="relative bg-gradient-to-br from-gold/5 to-gold-light/10 rounded-2xl p-10 md:p-14">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
                    <span className="font-display text-3xl font-bold text-gold">25</span>
                  </div>
                  <h3 className="font-display text-2xl font-semibold text-black mb-2">
                    Founding Seats
                  </h3>
                  <p className="text-neutral-500 text-sm">
                    Limited to 25 founding members for an intimate, intentional experience.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          NEWSLETTER SECTION — LETTERS FROM ABIMBOLA
          ═══════════════════════════════════════════ */}
      <section id="newsletter" className="section-padding bg-neutral-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
            {/* Left — Copy */}
            <div>
              <span className="reveal section-label mb-6 block">Letters from Abimbola</span>

              <h2 className="reveal font-display text-3xl md:text-4xl lg:text-[2.75rem] font-semibold leading-tight text-black mb-6">
                Words worth receiving — in your{" "}
                <em className="text-gold not-italic">inbox.</em>
              </h2>

              <div className="space-y-5 text-neutral-600 text-[15px] leading-relaxed">
                <p className="reveal">
                  Twice a month, I send something real. A reflection. A letter. A thought I have
                  been sitting with. The kind of thing you read slowly, over tea, when you want
                  to think about your life on purpose.
                </p>
                <p className="reveal font-display text-lg italic text-black">
                  This is not a newsletter. These are letters.
                </p>
              </div>

              {/* What to expect */}
              <div className="reveal mt-8 space-y-2.5">
                {[
                  "A letter every two weeks",
                  "Reflections on love, clarity, faith, and life",
                  "Early access to new writing, books, and events",
                  "Nothing that wastes your time",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <span className="text-gold mt-1 text-xs">—</span>
                    <span className="text-neutral-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Form */}
            <div className="reveal-right">
              <div className="bg-white rounded-2xl p-8 md:p-10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                {!formSubmitted ? (
                  <>
                    <h3 className="font-display text-2xl font-semibold text-black mb-2">
                      Get the Letters
                    </h3>
                    <p className="text-neutral-500 text-sm mb-8">
                      Start receiving Abimbola's letters. Add your name below.
                    </p>

                    <form onSubmit={handleNewsletterSubmit} className="space-y-5">
                      <div>
                        <label
                          htmlFor="newsletter-first-name"
                          className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2"
                        >
                          First Name *
                        </label>
                        <input
                          id="newsletter-first-name"
                          type="text"
                          required
                          placeholder="Your first name"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="newsletter-email"
                          className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2"
                        >
                          Email Address *
                        </label>
                        <input
                          id="newsletter-email"
                          type="email"
                          required
                          placeholder="Your email address"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-black text-white text-sm font-semibold tracking-wide rounded-full hover:bg-neutral-800 transition-colors duration-300"
                      >
                        Send me the letters
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </form>

                    <p className="text-neutral-400 text-xs italic mt-5 text-center">
                      Bi-monthly. Thoughtful. You can unsubscribe anytime — but I hope you stay.
                    </p>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-5">
                      <Check className="h-6 w-6 text-gold" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-black mb-2">
                      <em>Welcome.</em> I am glad you are here.
                    </h3>
                    <p className="text-neutral-500 text-sm">
                      Check your inbox — your first letter is on its way.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;

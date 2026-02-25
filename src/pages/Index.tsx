import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import {
  ArrowRight,
  MessageSquareText,
  LayoutGrid,
  TrendingUp,
  Sparkles,
  DollarSign,
  Repeat,
  Quote,
  Play,
  CheckCircle2,
  Zap,
  Shield,
  Globe,
} from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import featureCollect from "@/assets/feature-collect.jpg";
import featureRevenue from "@/assets/feature-revenue.jpg";
import featureContent from "@/assets/feature-content.jpg";

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut" as const } },
};

/* ─── Animated Counter ─── */
const AnimatedNumber = ({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, value]);

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
};

/* ─── Nav ─── */
const Nav = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <nav className="sticky top-0 z-50 bg-card/70 backdrop-blur-xl border-b border-border/50">
    <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
      <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
        Happy<span className="text-primary">Client</span>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
        <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
        <a href="#results" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Results</a>
      </div>
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <Button asChild size="sm">
            <Link to="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
            </Link>
          </Button>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link to="/login">Get Started Free</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  </nav>
);

/* ─── Hero ─── */
const Hero = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <section className="relative overflow-hidden">
    {/* Subtle background radial */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06)_0%,transparent_60%)]" />

    <div className="relative max-w-6xl mx-auto px-6 pt-20 md:pt-28 pb-8">
      <div className="text-center max-w-4xl mx-auto">
        <motion.div variants={fadeIn} initial="hidden" animate="visible">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/8 border border-primary/15 px-4 py-1.5 text-xs font-semibold text-primary mb-8">
            <Zap className="w-3.5 h-3.5" />
            Now with AI-powered interviews &amp; revenue attribution
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-bold leading-[1.05] tracking-tight text-foreground"
        >
          Your best clients are your{" "}
          <span className="relative">
            <span className="text-primary">best marketing</span>
            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
              <path d="M2 8C50 2 250 2 298 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
            </svg>
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.1 }}
          className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Collect video &amp; text testimonials, showcase them everywhere, and track the revenue they drive — all from one beautiful platform.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
        >
          {isLoggedIn ? (
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link to="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="h-12 px-8 text-base shadow-[0_4px_20px_hsl(var(--primary)/0.3)]">
                <Link to="/login">
                  Start for free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                <a href="#how-it-works">
                  <Play className="mr-2 w-4 h-4" />
                  See how it works
                </a>
              </Button>
            </>
          )}
        </motion.div>

        {/* Social proof pills */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.35 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm"
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">{["S", "M", "A", "J"][i]}</span>
                </div>
              ))}
            </div>
            <span className="font-medium">2,000+ teams</span>
          </div>
          <span className="h-4 w-px bg-border hidden sm:block" />
          <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
            <DollarSign className="w-4 h-4 text-primary" />$4.2M attributed
          </span>
          <span className="h-4 w-px bg-border hidden sm:block" />
          <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
            <MessageSquareText className="w-4 h-4 text-primary" />12K+ testimonials
          </span>
        </motion.div>
      </div>

      {/* Hero product screenshot */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="mt-16 md:mt-20 relative"
      >
        <div className="relative rounded-xl overflow-hidden border border-border/60 shadow-[0_20px_80px_-20px_hsl(var(--primary)/0.15),0_0_0_1px_hsl(var(--border)/0.5)]">
          <img
            src={heroDashboard}
            alt="Happy Client dashboard showing testimonial management with revenue attribution"
            className="w-full"
          />
          {/* Glass overlay gradient at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>
      </motion.div>
    </div>
  </section>
);

/* ─── Logo Cloud ─── */
const logos = ["Acme Corp", "Bloom Agency", "Vertex SaaS", "Nova Digital", "Meridian", "Clearpath"];

const LogoCloud = () => (
  <section className="py-14 px-6">
    <motion.div
      variants={fadeIn}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="max-w-5xl mx-auto flex flex-col items-center gap-6"
    >
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/60">Trusted by teams at</span>
      <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
        {logos.map((name) => (
          <span key={name} className="text-lg font-semibold text-muted-foreground/30 select-none tracking-tight">
            {name}
          </span>
        ))}
      </div>
    </motion.div>
  </section>
);

/* ─── How It Works ─── */
const steps = [
  {
    icon: MessageSquareText,
    title: "Collect",
    desc: "Send a link. Get a testimonial. Text, video, or audio — your clients choose how to share their story.",
    bullets: ["Branded collection forms", "Video & audio capture", "AI follow-up interviews"],
  },
  {
    icon: LayoutGrid,
    title: "Showcase",
    desc: "Walls of love, widgets, embeds. Display social proof exactly where it converts visitors to customers.",
    bullets: ["Embeddable widgets", "Wall of love pages", "No-code customization"],
  },
  {
    icon: TrendingUp,
    title: "Measure",
    desc: "See exactly which testimonial drove which deal. Revenue attribution that proves social proof ROI.",
    bullets: ["Revenue attribution", "Conversion tracking", "Pipeline influence reports"],
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-28 md:py-36 px-6">
    <div className="max-w-5xl mx-auto">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-20">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4 block">How it works</span>
        <h2 className="text-3xl md:text-5xl font-bold text-foreground">Three steps. Zero friction.</h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">Go from zero testimonials to a revenue-driving social proof engine in under 10 minutes.</p>
      </motion.div>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-8">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            variants={fadeUp}
            className="relative rounded-2xl border border-border bg-card p-8 shadow-subtle hover:shadow-md transition-shadow duration-300"
          >
            <div className="absolute -top-4 left-8 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              {i + 1}
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/8 mb-6 mt-2">
              <s.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{s.title}</h3>
            <p className="text-muted-foreground leading-relaxed mb-5">{s.desc}</p>
            <ul className="space-y-2">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── Feature Showcase ─── */
const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Interviews",
    desc: "Our AI conducts follow-up interviews to extract deeper, more compelling stories. It asks the right questions, at the right time, so you get testimonials that actually sell.",
    image: featureCollect,
    bullets: ["Adaptive follow-up questions", "Sentiment-aware probing", "Auto-generated summaries"],
  },
  {
    icon: DollarSign,
    title: "Revenue Attribution",
    desc: "Tag testimonials to deals. Know which story closed which client. Finally, social proof with a measurable ROI that your CFO will love.",
    image: featureRevenue,
    bullets: ["Deal-level attribution", "Pipeline influence tracking", "Automated revenue reports"],
  },
  {
    icon: Repeat,
    title: "Content Studio",
    desc: "Turn one testimonial into social posts, case study snippets, and ad copy — automatically. One story, infinite formats.",
    image: featureContent,
    bullets: ["Auto-generate social posts", "Case study snippets", "Ad copy variations"],
  },
];

const FeatureShowcase = () => (
  <section id="features" className="py-28 md:py-36 px-6 bg-card/50">
    <div className="max-w-6xl mx-auto">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-24">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4 block">Features</span>
        <h2 className="text-3xl md:text-5xl font-bold text-foreground">Built for teams that close deals</h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">Every feature earns its keep. No bloat, no fluff — just the tools that move pipeline.</p>
      </motion.div>
      <div className="space-y-32">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className={`flex flex-col ${i % 2 !== 0 ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-12 md:gap-16`}
          >
            <div className="flex-1 max-w-lg">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/8 mb-6">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{f.title}</h3>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">{f.desc}</p>
              <ul className="space-y-3">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full">
              <div className="rounded-2xl overflow-hidden border border-border/60 shadow-[0_12px_40px_-12px_hsl(var(--foreground)/0.08)]">
                <img src={f.image} alt={f.title} className="w-full object-cover" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Metrics ─── */
const metrics = [
  { value: 40, suffix: "%", label: "higher close rates", sublabel: "when using social proof in sales" },
  { prefix: "$", value: 4, suffix: ".2M", label: "revenue influenced", sublabel: "attributed to testimonials" },
  { value: 3, suffix: "×", label: "more testimonials", sublabel: "collected vs manual outreach" },
];

const Metrics = () => (
  <section id="results" className="py-28 md:py-36 px-6">
    <div className="max-w-5xl mx-auto text-center">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4 block">Results</span>
        <h2 className="text-3xl md:text-5xl font-bold text-foreground">Numbers that speak louder</h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">Happy Client users see measurable results within their first 30 days.</p>
      </motion.div>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-16 grid sm:grid-cols-3 gap-8"
      >
        {metrics.map((m) => (
          <motion.div
            key={m.label}
            variants={fadeUp}
            className="rounded-2xl border border-border bg-card p-10 shadow-subtle"
          >
            <span className="text-5xl md:text-6xl font-bold text-primary tracking-tight">
              <AnimatedNumber value={m.value} suffix={m.suffix} prefix={m.prefix || ""} />
            </span>
            <p className="mt-3 text-foreground font-semibold text-lg">{m.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{m.sublabel}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── Testimonial ─── */
const TestimonialQuote = () => (
  <section className="py-28 md:py-36 px-6 bg-card/50">
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="max-w-3xl mx-auto text-center"
    >
      <div className="flex justify-center mb-8">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/8">
          <Quote className="w-7 h-7 text-primary" />
        </div>
      </div>
      <blockquote className="text-2xl md:text-3xl font-medium leading-snug text-foreground">
        "We collected 47 testimonials in our first week and attributed <span className="text-primary font-bold">$120K in pipeline</span> directly to them. This tool pays for itself on day one."
      </blockquote>
      <div className="mt-10 flex items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-bold text-primary">SC</span>
        </div>
        <div className="text-left">
          <p className="font-semibold text-foreground">Sarah Chen</p>
          <p className="text-sm text-muted-foreground">VP of Marketing, Vertex SaaS</p>
        </div>
      </div>
    </motion.div>
  </section>
);

/* ─── Trust badges ─── */
const TrustBar = () => (
  <section className="py-16 px-6">
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-12"
    >
      {[
        { icon: Shield, text: "SOC 2 Compliant" },
        { icon: Globe, text: "GDPR Ready" },
        { icon: Zap, text: "99.9% Uptime" },
        { icon: CheckCircle2, text: "256-bit Encryption" },
      ].map((item) => (
        <motion.div key={item.text} variants={fadeIn} className="flex items-center gap-2.5 text-muted-foreground/60">
          <item.icon className="w-5 h-5" />
          <span className="text-sm font-medium">{item.text}</span>
        </motion.div>
      ))}
    </motion.div>
  </section>
);

/* ─── Final CTA ─── */
const FinalCta = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <section className="py-28 md:py-36 px-6">
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="max-w-3xl mx-auto text-center"
    >
      <h2 className="text-3xl md:text-5xl font-bold text-foreground leading-tight">
        Ready to turn your clients into your <span className="text-primary">sales team</span>?
      </h2>
      <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
        Join 2,000+ teams already using Happy Client to collect, showcase, and monetize their testimonials.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg" className="h-12 px-8 text-base shadow-[0_4px_20px_hsl(var(--primary)/0.3)]">
          <Link to={isLoggedIn ? "/dashboard" : "/login"}>
            {isLoggedIn ? "Go to Dashboard" : "Start for free"}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">No credit card required · Set up in 2 minutes · Cancel anytime</p>
    </motion.div>
  </section>
);

/* ─── Footer ─── */
const Footer = () => (
  <footer className="border-t border-border py-12 px-6 bg-card/50">
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
      <span className="text-lg font-bold tracking-tight text-foreground">
        Happy<span className="text-primary">Client</span>
      </span>
      <div className="flex items-center gap-8 text-sm text-muted-foreground">
        <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
        <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
      </div>
      <span className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Happy Client</span>
    </div>
  </footer>
);

/* ─── Page ─── */
const Index = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Nav isLoggedIn={isLoggedIn} />
      <Hero isLoggedIn={isLoggedIn} />
      <LogoCloud />
      <HowItWorks />
      <FeatureShowcase />
      <Metrics />
      <TestimonialQuote />
      <TrustBar />
      <FinalCta isLoggedIn={isLoggedIn} />
      <Footer />
    </div>
  );
};

export default Index;

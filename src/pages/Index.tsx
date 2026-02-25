import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MessageSquareText,
  LayoutGrid,
  TrendingUp,
  Sparkles,
  DollarSign,
  Repeat,
  Quote,
} from "lucide-react";
import featureCollect from "@/assets/feature-collect.jpg";
import featureRevenue from "@/assets/feature-revenue.jpg";
import featureContent from "@/assets/feature-content.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ─── Nav ─── */
const Nav = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
    <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-6">
      <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
        Happy<span className="text-primary">Client</span>
      </Link>
      <div className="flex items-center gap-4">
        {isLoggedIn ? (
          <Button asChild size="sm">
            <Link to="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
            </Link>
          </Button>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Button asChild size="sm">
              <Link to="/login">Get Started</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  </nav>
);

/* ─── Hero ─── */
const Hero = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <section className="relative py-28 md:py-36 px-6">
    <div className="max-w-4xl mx-auto text-center">
      <motion.h1
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="text-4xl sm:text-5xl md:text-[56px] font-bold leading-[1.1] tracking-tight text-foreground"
      >
        Your best clients are your best marketing.{" "}
        <span className="text-primary">Let them prove it.</span>
      </motion.h1>
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
      >
        Collect video &amp; text testimonials, showcase them everywhere, and track the revenue they drive — all from one platform.
      </motion.p>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
      >
        {isLoggedIn ? (
          <Button asChild size="lg">
            <Link to="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild size="lg">
              <Link to="/login">
                Start for free
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#how-it-works">See how it works</a>
            </Button>
          </>
        )}
      </motion.div>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
        className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm"
      >
        <span className="text-muted-foreground">Trusted by 2,000+ teams</span>
        <span className="h-4 w-px bg-border" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 font-medium text-primary">
          <DollarSign className="w-3.5 h-3.5" />$4.2M revenue attributed
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 font-medium text-primary">
          <MessageSquareText className="w-3.5 h-3.5" />12,000+ testimonials
        </span>
      </motion.div>
    </div>
  </section>
);

/* ─── Logo Cloud ─── */
const logos = ["Acme Corp", "Bloom Agency", "Vertex SaaS", "Nova Digital", "Meridian", "Clearpath"];

const LogoCloud = () => (
  <section className="border-y border-border py-10 px-6 bg-card">
    <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Trusted by teams at</span>
      <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
        {logos.map((name) => (
          <span key={name} className="text-base font-semibold text-muted-foreground/50 select-none">
            {name}
          </span>
        ))}
      </div>
    </div>
  </section>
);

/* ─── How It Works ─── */
const steps = [
  {
    icon: MessageSquareText,
    title: "Collect",
    desc: "Send a link. Get a testimonial. Text, video, or audio — your clients choose.",
  },
  {
    icon: LayoutGrid,
    title: "Showcase",
    desc: "Walls of love, widgets, embeds. Display social proof where it converts.",
  },
  {
    icon: TrendingUp,
    title: "Measure",
    desc: "See exactly which testimonial drove which deal. Revenue attribution, built in.",
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-28 md:py-32 px-6">
    <div className="max-w-5xl mx-auto">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">How it works</h2>
        <p className="mt-3 text-muted-foreground text-lg">Three steps. Zero friction.</p>
      </motion.div>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            variants={fadeUp}
            className="rounded-xl border border-border bg-card p-8 shadow-subtle"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-light mb-5">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Step {i + 1}</span>
            <h3 className="mt-2 text-xl font-bold text-foreground">{s.title}</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">{s.desc}</p>
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
    desc: "Our AI conducts follow-up interviews to extract deeper, more compelling stories from your happiest clients.",
    image: featureCollect,
  },
  {
    icon: DollarSign,
    title: "Revenue Attribution",
    desc: "Tag testimonials to deals. Know which story closed which client. Finally, social proof with an ROI.",
    image: featureRevenue,
  },
  {
    icon: Repeat,
    title: "Content Studio",
    desc: "Turn one testimonial into social posts, case study snippets, and ad copy — automatically.",
    image: featureContent,
  },
];

const FeatureShowcase = () => (
  <section className="py-28 md:py-32 px-6 bg-card border-y border-border">
    <div className="max-w-5xl mx-auto">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-20">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Built for teams that close deals</h2>
        <p className="mt-3 text-muted-foreground text-lg">Every feature earns its keep.</p>
      </motion.div>
      <div className="space-y-24">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className={`flex flex-col md:flex-row items-center gap-12 ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
          >
            <div className="flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-light mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">{f.title}</h3>
              <p className="mt-3 text-muted-foreground text-lg leading-relaxed">{f.desc}</p>
            </div>
            <div className="flex-1 w-full">
              <img src={f.image} alt={f.title} className="aspect-[4/3] rounded-xl border border-border bg-muted/50 object-cover w-full" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Metrics ─── */
const metrics = [
  { value: "40%", label: "higher close rates" },
  { value: "$4.2M", label: "revenue influenced" },
  { value: "3×", label: "more testimonials collected" },
];

const Metrics = () => (
  <section className="py-28 md:py-32 px-6">
    <div className="max-w-5xl mx-auto text-center">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Results you can measure</h2>
        <p className="mt-3 text-muted-foreground text-lg">Happy Client users see measurable results within 30 days.</p>
      </motion.div>
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mt-14 grid sm:grid-cols-3 gap-6"
      >
        {metrics.map((m) => (
          <motion.div
            key={m.label}
            variants={fadeUp}
            className="rounded-xl border border-border bg-card p-10 shadow-subtle"
          >
            <span className="text-4xl md:text-5xl font-bold text-primary">{m.value}</span>
            <p className="mt-2 text-muted-foreground font-medium">{m.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ─── Testimonial ─── */
const TestimonialQuote = () => (
  <section className="py-28 md:py-32 px-6 bg-card border-y border-border">
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="max-w-3xl mx-auto text-center"
    >
      <Quote className="w-10 h-10 text-primary/20 mx-auto mb-6" />
      <blockquote className="text-2xl md:text-3xl font-medium italic leading-snug text-foreground">
        "We collected 47 testimonials in our first week and attributed $120K in pipeline directly to them. This tool pays for itself on day one."
      </blockquote>
      <div className="mt-8">
        <p className="font-semibold text-foreground">Sarah Chen</p>
        <p className="text-sm text-muted-foreground">VP of Marketing, Vertex SaaS</p>
      </div>
    </motion.div>
  </section>
);

/* ─── Final CTA ─── */
const FinalCta = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <section className="py-28 md:py-32 px-6">
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="max-w-2xl mx-auto text-center"
    >
      <h2 className="text-3xl md:text-4xl font-bold text-foreground">
        Ready to turn your clients into your sales team?
      </h2>
      <div className="mt-8">
        <Button asChild size="lg">
          <Link to={isLoggedIn ? "/dashboard" : "/login"}>
            {isLoggedIn ? "Go to Dashboard" : "Start for free"}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </Button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">No credit card required. Set up in 2 minutes.</p>
    </motion.div>
  </section>
);

/* ─── Footer ─── */
const Footer = () => (
  <footer className="border-t border-border py-10 px-6">
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <span className="text-sm font-bold tracking-tight text-foreground">
        Happy<span className="text-primary">Client</span>
      </span>
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
        <span>&copy; {new Date().getFullYear()} Happy Client</span>
      </div>
    </div>
  </footer>
);

/* ─── Page ─── */
const Index = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-background">
      <Nav isLoggedIn={isLoggedIn} />
      <Hero isLoggedIn={isLoggedIn} />
      <LogoCloud />
      <HowItWorks />
      <FeatureShowcase />
      <Metrics />
      <TestimonialQuote />
      <FinalCta isLoggedIn={isLoggedIn} />
      <Footer />
    </div>
  );
};

export default Index;

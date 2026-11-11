import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  FileUp,
  LayoutGrid,
  LineChart,
  MessageCircle,
  PanelsTopLeft,
  PenLine,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/shared/Logo";
import { ExampleWall } from "@/components/landing/ExampleWall";
import { PLANS, type PlanId } from "@/lib/billing-plans";
import { Reveal } from "@/components/shared/Reveal";
import { SALES_EMAIL } from "@/lib/config";
import { cn } from "@/lib/utils";

function SectionHeading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="eyebrow text-gold-deep">{eyebrow}</p>
      <h2 className="display mt-3 text-[2.25rem] text-foreground text-balance sm:text-[3rem]">{title}</h2>
      {lead && <p className="mt-4 text-lg text-muted-foreground text-pretty">{lead}</p>}
    </Reveal>
  );
}

const Nav = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
      <Link to="/" aria-label="Happy Client home">
        <Logo />
      </Link>
      <nav aria-label="Page sections" className="hidden items-center gap-8 md:flex">
        {[
          ["How it works", "#how-it-works"],
          ["Features", "#features"],
          ["Pricing", "#pricing"],
          ["Questions", "#questions"],
        ].map(([label, href]) => (
          <a key={href} href={href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            {label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-2">
        {isLoggedIn ? (
          <Button asChild>
            <Link to="/dashboard">
              Open dashboard <ArrowRight className="ml-1" />
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Start free</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  </header>
);

const Hero = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <section className="relative overflow-hidden">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--gold)/0.16),transparent_70%)]"
    />
    <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
      <Reveal immediate className="mx-auto max-w-3xl text-center">
        <p className="eyebrow text-gold-deep">Testimonials that do the selling</p>
        <h1 className="display mt-5 text-[2.9rem] text-foreground text-balance sm:text-[4.25rem] lg:text-[5rem]">
          Your happiest clients sell <span className="italic">better than you do.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground text-pretty sm:text-xl">
          Send one link. Clients answer a few questions or record a short video on their phone. You approve the good
          ones and put them on your website.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-[11rem]">
            <Link to={isLoggedIn ? "/dashboard" : "/signup"}>
              {isLoggedIn ? "Open dashboard" : "Start free"} <ArrowRight className="ml-1" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto sm:min-w-[11rem]">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>
        {!isLoggedIn && (
          <p className="mt-4 text-sm text-muted-foreground">Free for your first 25 testimonials. No card needed.</p>
        )}
      </Reveal>

      <Reveal immediate delay={150} className="mt-16 sm:mt-20">
        <ExampleWall />
      </Reveal>
    </div>
  </section>
);

const PROBLEMS = [
  {
    title: "Clients say kind things. Then the words are gone.",
    body: "A text, a comment on a call, a thank-you at the door. You hear it once and you cannot use it.",
  },
  {
    title: "Asking feels awkward, so you put it off.",
    body: "You do not know what to ask for, and they do not know what to write. So nobody starts.",
  },
  {
    title: "The few you have sit in a folder.",
    body: "Screenshots and old emails do not sell. Buyers need to see proof at the moment they decide.",
  },
];

const Problem = () => (
  <section className="border-y border-border bg-card/60 px-4 py-20 sm:px-6 sm:py-24">
    <div className="mx-auto max-w-6xl">
      <SectionHeading eyebrow="The problem" title="The proof you need is already out there." lead="You did the work and your clients are happy. Buyers cannot see any of it." />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {PROBLEMS.map((p, i) => (
          <Reveal key={p.title} delay={i * 80} className="rounded-2xl border border-border bg-background p-7">
            <span className="display text-3xl text-gold-deep">{i + 1}</span>
            <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground">{p.title}</h3>
            <p className="mt-2 text-[0.9375rem] text-muted-foreground">{p.body}</p>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const STEPS: { title: string; body: string; points: string[] }[] = [
  {
    title: "Send one link",
    body: "Share it by text, email, or a QR code on your counter. Clients need no account and no app.",
    points: ["Star rating first, so it takes seconds to start", "Guided questions that pull out real results", "Video or voice, recorded on their phone"],
  },
  {
    title: "Approve what you like",
    body: "Every testimonial waits for your review. Nothing goes public until you say so.",
    points: ["Clients give written permission on the form", "They choose how their name appears", "Star your best ones so they are easy to find"],
  },
  {
    title: "Put it where buyers look",
    body: "Publish a wall page, or paste one line of code on your website. You choose which testimonials appear.",
    points: ["A shareable wall in your colors", "Carousel, grid, or single-quote widgets", "Posts and case studies drafted for you"],
  },
];

const HowItWorks = () => (
  <section id="how-it-works" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
    <div className="mx-auto max-w-6xl">
      <SectionHeading eyebrow="How it works" title="Three steps. No tech skills." />
      <ol className="mt-16 grid gap-6 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <Reveal as="li" key={step.title} delay={i * 80} className="relative rounded-2xl border border-border bg-card p-7 shadow-subtle">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
            <h3 className="display mt-5 text-[1.75rem] text-foreground">{step.title}</h3>
            <p className="mt-2 text-[0.9375rem] text-muted-foreground">{step.body}</p>
            <ul className="mt-5 space-y-2.5 border-t border-border-subtle pt-5">
              {step.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={2.25} />
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ol>
    </div>
  </section>
);

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Video, title: "Video, voice and text", body: "Clients record in the browser on iPhone, Android or a laptop. They can also upload a file." },
  { icon: PenLine, title: "Questions that get specifics", body: "Ready-made question sets ask what life was like before, what changed, and who they would tell." },
  { icon: MessageCircle, title: "A guided interview", body: "An AI assistant asks follow-up questions, writes a draft, and the client approves every word." },
  { icon: BadgeCheck, title: "Permission on record", body: "Each submission stores the consent text the client agreed to and how they want to be named." },
  { icon: PanelsTopLeft, title: "A wall you can share", body: "One page in your colors. Send the link or add it to your site menu." },
  { icon: LayoutGrid, title: "Widgets for any website", body: "Paste one line of code. Works anywhere that accepts an embed, and matches light or dark pages." },
  { icon: Sparkles, title: "Content from every story", body: "Turn one testimonial into a social post, a short case study, or a quote graphic." },
  { icon: LineChart, title: "See what it earns", body: "Log the sales a testimonial helped close. Your dashboard shows which stories pull their weight." },
  { icon: FileUp, title: "Bring what you have", body: "Paste in testimonials you already own, or import a spreadsheet in one step." },
];

const Features = () => (
  <section id="features" className="scroll-mt-20 border-y border-border bg-card/60 px-4 py-20 sm:px-6 sm:py-28">
    <div className="mx-auto max-w-6xl">
      <SectionHeading eyebrow="Features" title="Everything between a happy client and a new one." />
      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-background p-7">
            <f.icon className="h-6 w-6 text-gold-deep" strokeWidth={1.5} />
            <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
            <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "scale"];

const Pricing = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <section id="pricing" className="scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
    <div className="mx-auto max-w-6xl">
      <SectionHeading eyebrow="Pricing" title="Start free. Pay when it pays." lead="The free plan has no time limit. Move up when you need more." />
      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const isScale = id === "scale";
          return (
            <div
              key={id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-7",
                plan.popular ? "border-foreground shadow-hover" : "border-border shadow-subtle",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-7 rounded-full bg-gold px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-foreground">
                  Most chosen
                </span>
              )}
              <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="display text-[2.75rem] text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={2.25} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-7 w-full" variant={plan.popular ? "default" : "outline"}>
                {isScale ? (
                  <a href={`mailto:${SALES_EMAIL}?subject=Happy%20Client%20Scale%20plan`}>Talk to us</a>
                ) : (
                  <Link to={isLoggedIn ? "/dashboard/settings/billing" : "/signup"}>{id === "free" ? "Start free" : `Choose ${plan.name}`}</Link>
                )}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">Every plan starts on Free. You upgrade from inside your account.</p>
    </div>
  </section>
);

const FAQS: { q: string; a: string }[] = [
  {
    q: "Do my clients need an account or an app?",
    a: "No. They open your link in any browser, answer the questions, and send. It takes about two minutes.",
  },
  {
    q: "Can they record video on a phone?",
    a: "Yes. The form records with the phone camera in the browser on iPhone and Android. If a phone blocks recording, the client can upload a video from their camera roll.",
  },
  {
    q: "Do I have permission to use what they send?",
    a: "The form asks each client to agree to your consent text and to choose how their name appears. Happy Client stores both with the testimonial. You can edit the consent text to fit your business.",
  },
  {
    q: "I already have testimonials. Can I add them?",
    a: "Yes. Add them one at a time, or import a spreadsheet saved as CSV. Use only testimonials you have the right to publish.",
  },
  {
    q: "Will the widget work on my website?",
    a: "The widget is one line of code. It works on any site that lets you paste custom code, such as WordPress, Webflow and Shopify.",
  },
  {
    q: "Who owns the testimonials?",
    a: "You do. Export everything to a spreadsheet at any time.",
  },
];

const Faq = () => (
  <section id="questions" className="scroll-mt-20 border-t border-border bg-card/60 px-4 py-20 sm:px-6 sm:py-28">
    <div className="mx-auto max-w-3xl">
      <SectionHeading eyebrow="Questions" title="Answers before you ask." />
      <Accordion type="single" collapsible className="mt-12">
        {FAQS.map((item, i) => (
          <AccordionItem key={item.q} value={`faq-${i}`} className="border-border">
            <AccordionTrigger className="py-5 text-left text-base font-semibold text-foreground hover:no-underline">{item.q}</AccordionTrigger>
            <AccordionContent className="pb-5 text-[0.9375rem] leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

const FinalCta = ({ isLoggedIn }: { isLoggedIn: boolean }) => (
  <section className="px-4 py-20 sm:px-6 sm:py-28">
    <Reveal className="mx-auto max-w-4xl rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 sm:py-20">
      <h2 className="display text-[2.5rem] text-primary-foreground text-balance sm:text-[3.5rem]">
        Ask one client <span className="italic text-gold">today.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/75 text-pretty">
        Make your form, send the link to your happiest client, and have your first testimonial before the week ends.
      </p>
      <Button asChild size="lg" className="mt-9 bg-gold text-foreground hover:bg-gold/90">
        <Link to={isLoggedIn ? "/dashboard" : "/signup"}>
          {isLoggedIn ? "Open dashboard" : "Start free"} <ArrowRight className="ml-1" />
        </Link>
      </Button>
      {!isLoggedIn && <p className="mt-4 text-sm text-primary-foreground/60">No card needed.</p>}
    </Reveal>
  </section>
);

const Footer = () => (
  <footer className="border-t border-border px-4 py-10 sm:px-6">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
      <Logo size="sm" />
      <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-muted-foreground">
        <a href="#how-it-works" className="hover:text-foreground">How it works</a>
        <a href="#pricing" className="hover:text-foreground">Pricing</a>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/login" className="hover:text-foreground">Sign in</Link>
      </nav>
      <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} Happy Client</p>
    </div>
  </footer>
);

/** Reads and clears the note main.tsx leaves when someone arrives from an email link. */
function takeAuthIntent(): string | null {
  try {
    const intent = sessionStorage.getItem("hc-auth-intent");
    if (intent) sessionStorage.removeItem("hc-auth-intent");
    return intent;
  } catch {
    return null;
  }
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user;

  // Someone who just confirmed their email should land in the app, not on the sales page.
  useEffect(() => {
    if (!user) return;
    const intent = takeAuthIntent();
    if (intent === "recovery") navigate("/login?mode=recovery", { replace: true });
    else if (intent === "dashboard") navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen scroll-smooth bg-background">
      <Nav isLoggedIn={isLoggedIn} />
      <main>
        <Hero isLoggedIn={isLoggedIn} />
        <Problem />
        <HowItWorks />
        <Features />
        <Pricing isLoggedIn={isLoggedIn} />
        <Faq />
        <FinalCta isLoggedIn={isLoggedIn} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

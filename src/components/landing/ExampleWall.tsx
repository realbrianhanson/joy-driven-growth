import { QuoteCard, type PublicTestimonial } from "@/components/shared/QuoteCard";

/**
 * Illustration for the landing page. These are invented examples of what a
 * customer's own wall could hold. They are labelled as examples on the page
 * and name no real person or company.
 */
const EXAMPLES: PublicTestimonial[] = [
  {
    id: "example-1",
    author_name: "Dana R.",
    author_title: "Homeowner",
    author_company: null,
    author_avatar: null,
    content: "They found the leak two other roofers missed. Fixed the same week, and the price matched the quote to the dollar.",
    rating: 5,
    type: "text",
  },
  {
    id: "example-2",
    author_name: "Marcus T.",
    author_title: "Member since March",
    author_company: null,
    author_avatar: null,
    content: "I had quit three gyms before this one. Eight months in, I still show up four days a week.",
    rating: 5,
    type: "text",
  },
  {
    id: "example-3",
    author_name: "Priya S.",
    author_title: "Shop owner",
    author_company: null,
    author_avatar: null,
    content: "My books were a year behind. She caught me up in six weeks and I finally know what I earn each month.",
    rating: 5,
    type: "text",
  },
];

export function ExampleWall() {
  return (
    <figure className="relative mx-auto w-full max-w-5xl">
      <div className="rounded-[1.75rem] border border-border bg-card/70 p-4 shadow-lift backdrop-blur sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-border-subtle pb-4">
          <p className="display text-xl text-foreground sm:text-2xl">What our customers say</p>
          <span className="rounded-full border border-border px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Example
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {EXAMPLES.map((t, i) => (
            <div key={t.id} className={i === 2 ? "hidden md:block" : undefined}>
              <QuoteCard testimonial={t} />
            </div>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        An example wall with invented quotes. Yours shows your own clients.
      </figcaption>
    </figure>
  );
}

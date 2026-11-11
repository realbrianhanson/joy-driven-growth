import { Link } from "react-router-dom";
import { ArrowRight, Code2, DollarSign, Key, Send, type LucideIcon } from "lucide-react";
import SettingsLayout from "@/components/settings/SettingsLayout";

interface Connection {
  icon: LucideIcon;
  title: string;
  body: string;
  to: string;
  cta: string;
}

/** Only what works today. Each row links to the place where you set it up. */
const CONNECTIONS: Connection[] = [
  {
    icon: Code2,
    title: "Your website",
    body: "Show testimonials on any page with one line of code. Make a widget, copy its code, and paste it into your site.",
    to: "/dashboard/widgets",
    cta: "Open widgets",
  },
  {
    icon: Send,
    title: "Text messages",
    body: "Text your form link to a list of clients. Available on paid plans.",
    to: "/dashboard/campaigns",
    cta: "Open text campaigns",
  },
  {
    icon: DollarSign,
    title: "Sales tracking",
    body: "When a buyer says a testimonial helped them decide, log the sale on that testimonial. Your Results page adds it up.",
    to: "/dashboard/testimonials",
    cta: "Open testimonials",
  },
  {
    icon: Key,
    title: "API",
    body: "Send testimonials in from your own systems, such as a CRM or a help desk. You need an API key.",
    to: "/dashboard/settings/api",
    cta: "Manage API keys",
  },
];

const SettingsIntegrations = () => (
  <SettingsLayout>
    <ul className="space-y-3">
      {CONNECTIONS.map((item) => (
        <li key={item.title}>
          <Link to={item.to} className="card-hover group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-subtle">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-light">
              <item.icon className="h-5 w-5 text-gold-deep" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-semibold text-foreground">{item.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{item.body}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                {item.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </SettingsLayout>
);

export default SettingsIntegrations;

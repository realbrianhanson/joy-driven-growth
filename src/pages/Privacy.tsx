import { Link } from "react-router-dom";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <header className="border-b border-border">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-tight text-foreground">
          Happy<span className="text-primary">Client</span>
        </Link>
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Sign in
        </Link>
      </div>
    </header>
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-12">Last updated: June 10, 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            This policy explains what data Happy Client collects, how we use it, and the choices you have.
            We're a testimonial-collection platform, so handling other people's words and media responsibly
            is core to what we do.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Information we collect</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
            <li><strong className="text-foreground">Account data</strong> — name, email, company, and authentication identifiers when you sign up.</li>
            <li><strong className="text-foreground">Testimonial data</strong> — text, audio, video, ratings, and contact details submitted to your collection forms.</li>
            <li><strong className="text-foreground">Usage data</strong> — pages visited, features used, and basic device/browser metadata to operate and improve the Service.</li>
            <li><strong className="text-foreground">Billing data</strong> — handled by our payment processor; we never store full card numbers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">How we use it</h2>
          <p className="text-muted-foreground leading-relaxed">
            To provide the Service, authenticate you, deliver SMS and email on your behalf, generate AI
            insights from your testimonials, attribute revenue, prevent abuse, and communicate important
            account or product updates.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Consent for testimonial authors</h2>
          <p className="text-muted-foreground leading-relaxed">
            Our collection forms include an explicit consent checkbox before submission. As the business
            collecting the testimonial, you are the controller of that content and are responsible for using
            it within the scope of consent you obtained.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell personal data. We share data only with subprocessors that help us run the Service
            (hosting, database, email/SMS delivery, payment processing, AI inference) under contracts that
            require appropriate confidentiality and security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            Traffic is encrypted in transit with TLS. Data is stored in managed, access-controlled
            infrastructure. Tenant data is isolated using row-level security policies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Retention</h2>
          <p className="text-muted-foreground leading-relaxed">
            We retain account and testimonial data while your account is active. You can delete individual
            testimonials at any time. When you close your account, we delete or anonymize your data within a
            reasonable period, subject to legal and accounting requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Your rights</h2>
          <p className="text-muted-foreground leading-relaxed">
            Depending on where you live, you may have the right to access, correct, export, or delete the
            personal data we hold about you. You can manage most of this from your dashboard or contact us
            for assistance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use first-party cookies and local storage strictly to keep you signed in and remember
            preferences. We don't use third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            We'll post any updates to this policy here and revise the "Last updated" date above.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy questions or data requests, reach us through your dashboard's support channel.
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-border text-sm text-muted-foreground">
        <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        <span className="mx-3">·</span>
        <Link to="/" className="hover:text-foreground transition-colors">Back to home</Link>
      </div>
    </main>
  </div>
);

export default Privacy;
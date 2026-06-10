import { Link } from "react-router-dom";

const Terms = () => (
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
      <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-12">Last updated: June 10, 2026</p>

      <div className="prose prose-neutral max-w-none space-y-8 text-foreground">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By creating an account or using Happy Client (the "Service"), you agree to be bound by these Terms.
            If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. The Service</h2>
          <p className="text-muted-foreground leading-relaxed">
            Happy Client provides tools to collect, manage, and display customer testimonials, including
            embeddable widgets, walls of love, AI-assisted interviews, SMS/email collection, and revenue
            attribution analytics.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Your account</h2>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for safeguarding your credentials and for all activity under your account.
            Notify us immediately of any unauthorized access.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Your content</h2>
          <p className="text-muted-foreground leading-relaxed">
            You retain ownership of all testimonials, media, and other content you submit ("Customer Content").
            You grant us a limited license to host, process, and display Customer Content solely to provide the
            Service. You represent that you have obtained the necessary consent from each testimonial author
            before collecting and publishing their submission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Acceptable use</h2>
          <p className="text-muted-foreground leading-relaxed">
            You will not (a) fabricate testimonials or misrepresent the source of any review, (b) use the
            Service to send unsolicited messages in violation of applicable law, (c) attempt to disrupt or
            reverse-engineer the Service, or (d) upload content that is illegal, infringing, or harmful.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Billing</h2>
          <p className="text-muted-foreground leading-relaxed">
            Paid plans are billed in advance on a monthly or annual basis and are non-refundable except where
            required by law. You may cancel at any time; cancellation takes effect at the end of the current
            billing period.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Termination</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may suspend or terminate your access for breach of these Terms or for conduct that we determine
            harms the Service or other users. You may close your account at any time from your dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">8. Disclaimers</h2>
          <p className="text-muted-foreground leading-relaxed">
            The Service is provided "as is" without warranties of any kind. We do not guarantee that the
            Service will be uninterrupted, error-free, or that any specific business result will be achieved.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">9. Limitation of liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, our aggregate liability for any claim arising from the
            Service will not exceed the amount you paid us in the twelve months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">10. Changes</h2>
          <p className="text-muted-foreground leading-relaxed">
            We may update these Terms from time to time. Material changes will be announced in-app or by email.
            Continued use after changes take effect constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about these Terms? Reach us through the support channel inside your dashboard.
          </p>
        </section>
      </div>

      <div className="mt-16 pt-8 border-t border-border text-sm text-muted-foreground">
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        <span className="mx-3">·</span>
        <Link to="/" className="hover:text-foreground transition-colors">Back to home</Link>
      </div>
    </main>
  </div>
);

export default Terms;
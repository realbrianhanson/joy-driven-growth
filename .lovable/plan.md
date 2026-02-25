

## Plan: Ultra-Premium Landing Page for Happy Client

### Overview
Replace the current minimal `Index.tsx` with a full marketing landing page, and update routing so `/` shows the landing page instead of redirecting to `/login`. Logged-in users will still see a "Go to Dashboard" CTA instead of "Get Started."

### Routing Change (App.tsx)
- Change `<Route path="/" element={<RootRedirect />} />` to render `<Index />` directly (with Suspense)
- Remove the `RootRedirect` component entirely
- The landing page itself will check auth state and show "Go to Dashboard" vs "Get Started" contextually

### Landing Page Structure (Index.tsx)
A single-file, long-scroll landing page with these sections:

**1. Sticky Navigation Bar**
- "Happy Client" typographic wordmark (left)
- "Sign In" text link + "Get Started" primary CTA button (right)
- Clean white background with subtle bottom border

**2. Hero Section**
- Large headline: *"Your best clients are your best marketing. Let them prove it."*
- Subline: *"Collect video & text testimonials, showcase them everywhere, and track the revenue they drive — all from one platform."*
- Two CTAs: "Start for free" (primary) + "See how it works" (ghost/outline)
- Social proof bar: "Trusted by 2,000+ teams" with small metric pills (e.g., "$4.2M revenue attributed", "12,000+ testimonials collected")

**3. Logo Cloud / Social Proof Strip**
- "Trusted by teams at" with 5-6 placeholder company-style text marks (styled as muted text, no actual logos needed — just names like "Acme Corp", "Bloom Agency", etc.)

**4. Three-Column Feature Grid — "How it works"**
- Step 1: Collect — "Send a link. Get a testimonial. Text, video, or audio — your clients choose."
- Step 2: Showcase — "Walls of love, widgets, embeds. Display social proof where it converts."
- Step 3: Measure — "See exactly which testimonial drove which deal. Revenue attribution, built in."
- Each card: white bg, subtle border, icon from lucide, title, description

**5. Feature Showcase Section — "Built for teams that close deals"**
- Left-right alternating layout (text + visual placeholder)
- Feature 1: AI-Powered Interviews — "Our AI conducts follow-up interviews to extract deeper, more compelling stories."
- Feature 2: Revenue Attribution — "Tag testimonials to deals. Know which story closed which client."
- Feature 3: Content Studio — "Turn one testimonial into social posts, case study snippets, and ad copy — automatically."

**6. Metrics / Results Section**
- Large stat cards in a row: "40% higher close rates", "$4.2M revenue influenced", "3x more testimonials collected"
- Subtext: "Happy Client users see measurable results within 30 days."

**7. Testimonial Quote (meta — testimonial about the testimonial tool)**
- Single large quote block with attribution
- Clean, centered, large italic text

**8. CTA Section**
- "Ready to turn your clients into your sales team?"
- "Start for free" button
- "No credit card required. Set up in 2 minutes."

**9. Footer**
- Minimal: "Happy Client" wordmark, copyright, links to Sign In

### Design Principles
- No emojis, no gradients, no bouncy animations
- Framer Motion for subtle fade-in-up on scroll (using `whileInView`)
- All white cards with `border` and `shadow-subtle` — consistent with existing design system
- Typography hierarchy: 56px hero headline, 36px section titles, 18px body
- Generous whitespace (py-24 to py-32 between sections)
- Indigo (#6366F1) accent used sparingly on CTAs and highlighted words only

### Files Changed
1. **`src/pages/Index.tsx`** — Complete rewrite with all sections above
2. **`src/App.tsx`** — Replace `RootRedirect` route with direct `Index` render at `/`

### Technical Notes
- Uses only existing dependencies: `framer-motion`, `lucide-react`, `react-router-dom`, existing UI components (`Button`, `Card`)
- No new packages needed
- Auth-aware: uses `useAuth()` to toggle CTA between "Get Started" and "Go to Dashboard"
- Fully responsive with mobile-first breakpoints


# Happy Client

Happy Client collects client testimonials with one link, lets the owner approve them, and shows them on a wall page or a website widget. It also logs the sales a testimonial helped close and drafts marketing copy from a client's own words.

Live site: https://happyclient.io
Lovable project: https://lovable.dev/projects/f6e5cf56-bcef-49af-adf9-a58e8274ed83

## How it is built

| Layer | What |
| --- | --- |
| App | Vite, React 18, TypeScript, Tailwind, shadcn/ui, TanStack Query, react-router |
| Data | Supabase (Lovable Cloud): Postgres with row-level security, Auth, Storage, Realtime |
| Server code | Supabase edge functions (Deno) in `supabase/functions` |
| AI | Lovable AI gateway, called only from edge functions |
| Email, texts, payments | Resend, Twilio, Stripe. Each one is optional. |

### Where things are

```
src/pages            One file for each screen
src/components       shared/ (used everywhere), layout/, testimonials/, form-builder/, content/, ui/ (shadcn)
src/hooks            Data hooks. Every query is scoped to the workspace owner.
src/lib              Pure helpers with unit tests in src/lib/__tests__
supabase/functions   Edge functions. _shared/ holds pure helpers with tests.
supabase/migrations  Database history
public/widget.js     The one-line embed script for customer websites
```

### Screens

- Public, no sign-in: landing page, collection form (`/collect/:slug`), guided interview (`/collect/:slug/ai`), wall (`/wall/:slug`), widget frame (`/embed/widget/:id`), team invite.
- Dashboard: Home, Testimonials, Forms, Text campaigns, Walls, Widgets, Content, Results, Settings.

### Edge functions

| Function | Who may call it | What it does |
| --- | --- | --- |
| `submit-testimonial` | Anyone with a published form slug, or an API key | Checks and saves a testimonial as "Needs review" |
| `ai-interview` | Anyone, for a published form with the interview on | Asks follow-up questions and writes a draft the client approves |
| `develop-testimonial` | Signed-in owner or team | Writes a polished draft beside the original words |
| `analyze-testimonial` | Signed-in user | Picks the best lines and themes |
| `generate-content` | Signed-in owner or team | Drafts a post, thread, email, case study or quote image from approved testimonials |
| `start-campaign` | Signed-in owner or team admin | The only way texts enter the sending queue. Enforces plan, country and length rules. |
| `process-campaign-jobs` | The database scheduler, with a shared key | Sends queued texts through Twilio |
| `twilio-status-webhook` | Twilio, signature checked | Records delivery results |
| `track-revenue` | Signed-in owner or team | Logs a sale against a testimonial |
| `send-team-invite` | Signed-in owner | Emails a team invite |
| `create-checkout-session`, `create-customer-portal`, `stripe-webhook` | Signed-in user, or Stripe with a signature | Billing |
| `send-sms` | Nobody | Retired. It answers 410. Delete it after the next deploy. |

## Rules the product keeps

These are product decisions. Keep them when you add features.

1. **Nothing invented.** No made-up numbers, logos, reviews or "trusted by" claims anywhere in the app or the landing page. The example wall on the landing page is labelled as an example.
2. **The client's words stay the client's words.** AI drafts never replace the original text. A pull quote must appear word for word in the testimonial, and the server checks that. Numbers in a generated draft that the client never gave are flagged for the owner.
3. **Permission is recorded.** Each submission stores the consent text the client agreed to, when, and how they want their name shown.
4. **Reviews are not filtered by rating.** The public review prompt on a form shows to every client. Sending only happy clients to a review site breaks the FTC Consumer Review Rule (16 CFR Part 465).
5. **Texts cost money and reach real phones.** Every limit on texting is enforced on the server.

## Run it on your computer

```sh
bun install
bun run dev        # http://localhost:8080
bun run test       # unit tests (vitest)
bun run lint
bun run build
```

The `.env` file holds the public Supabase URL and key. No secret belongs in it.

To type-check the edge functions:

```sh
cd supabase/functions && npx deno check --no-lock */index.ts
```

## How changes go live

1. Push to `main` on GitHub. Lovable syncs the code and rebuilds the preview.
2. **Edge functions and migrations do not deploy on sync.** After a push that changes `supabase/functions` or `supabase/migrations`, ask Lovable in the project chat to deploy the changed functions or run the new migration.
3. Click Publish in Lovable to update the live site.

## Secrets

Set these in Lovable under Cloud, Secrets. A missing optional secret turns its feature off with a clear message. Nothing crashes.

| Secret | Needed for | Notes |
| --- | --- | --- |
| `LOVABLE_API_KEY` | All AI features | Lovable sets this for you |
| `PUBLIC_APP_URL` | Links in invite emails and texts | Defaults to `https://happyclient.io` |
| `RESEND_API_KEY` | Team invite emails | Without it, the owner copies the invite link by hand |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Text campaigns | See "Turn on text campaigns" |
| `INTERNAL_WORKER_KEY` | Text campaigns | Shared key between the database scheduler and the sender |
| `SMS_ALLOWED_COUNTRY_CODES` | Text campaigns | Optional. Comma-separated calling codes, such as `1,44`. Defaults to `1` (US and Canada). |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO` | Billing | See "Turn on billing" |
| `AI_MODEL_FAST`, `AI_MODEL_QUALITY` | Optional | Force a model ID. See "AI models". |

## AI models

Every AI call goes through `supabase/functions/_shared/ai.ts`. It tries a short list of models in order and uses the first one that answers, so a retired model costs one fast failed request and the feature keeps working. The current list starts with `google/gemini-3.8-flash`.

To change models with no code change, set `AI_MODEL_FAST` (chat) or `AI_MODEL_QUALITY` (writing) to a model ID from Lovable, Connectors, AI, Available models.

## Turn on billing

Checkout stays closed until real Stripe price IDs are in place. Until then the app shows "Email us to upgrade".

1. In Stripe, create two monthly products: Starter at $29 and Pro at $79. Scale is sold by contact, so it needs no product.
2. Add the four Stripe secrets from the table above.
3. In `src/lib/billing-plans.ts`, replace the two `price_REPLACE_ME` placeholders with the real price IDs.
4. In Stripe, Developers, Webhooks, add the endpoint `https://ldniwvyjycerpdlwhntu.supabase.co/functions/v1/stripe-webhook` with these events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `payment_intent.succeeded`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Test with card `4242 4242 4242 4242` in Stripe test mode before you switch to live keys.

Plan limits such as "25 testimonials" on Free are listed on the pricing page. Today the server enforces only the monthly text allowance. Enforce the other limits before you charge for them.

## Turn on text campaigns

Texts go out only through the `start-campaign` function. It checks the sender's plan allowance (Free 0, Starter 100, Pro 500 each month, Scale no monthly cap), the country of every number, the message length, and that the message carries the owner's form link. The browser cannot write to the sending queue.

1. Add the three Twilio secrets and `INTERNAL_WORKER_KEY` (a long random string).
2. In the SQL editor, point the scheduler at the sender:

   ```sql
   ALTER DATABASE postgres SET app.worker_url = 'https://ldniwvyjycerpdlwhntu.supabase.co/functions/v1/process-campaign-jobs';
   ALTER DATABASE postgres SET app.worker_key = '<the same INTERNAL_WORKER_KEY value>';
   ```

3. Turn the scheduler on. It is off by default, because two jobs that fire every minute keep a small database busy for nothing while texting is not set up:

   ```sql
   SELECT cron.schedule('promote-scheduled-campaigns', '* * * * *', $$ SELECT public.promote_scheduled_campaigns(); $$);
   SELECT cron.schedule('drain-campaign-jobs', '* * * * *', $$
     SELECT net.http_post(
       url := current_setting('app.worker_url', true),
       headers := jsonb_build_object('content-type', 'application/json', 'x-internal-key', current_setting('app.worker_key', true)),
       body := '{}'::jsonb
     ) WHERE current_setting('app.worker_url', true) IS NOT NULL;
   $$);
   SELECT cron.schedule('trim-cron-history', '17 3 * * *', $$ DELETE FROM cron.job_run_details WHERE end_time < now() - interval '2 days'; $$);
   ```

4. Register the sending number with Twilio for A2P 10DLC (a Brand and a Campaign). Carriers block unregistered traffic.
5. To let one account send before checkout is live, set its plan by hand:

   ```sql
   UPDATE subscriptions SET plan = 'starter', status = 'active' WHERE user_id = '<the account owner id>';
   ```

The owner is responsible for consent. The builder makes them confirm that every person on the list agreed to get texts, and the default message includes "Reply STOP to opt out".

## Check before you trust it with real data

- [ ] Send a test submission through a published form on a phone, with a video. It shows up under Needs review and the video plays.
- [ ] Approve it, add it to a wall, and open the wall in a private window.
- [ ] Paste a widget's embed code into a page on another site.
- [ ] In Content, write one draft. Read it against the testimonial.
- [ ] Invite a second email address as "View only" and confirm it cannot approve.
- [ ] If text campaigns are on, send one campaign to your own phone.
- [ ] If billing is on, buy the Starter plan with a test card and confirm the plan shows on Settings, Plan and billing.

## Database size

The database runs on the Tiny instance. On 10 November 2026 it ran out of disk IO budget and stopped answering for hours. If the app is slow or sign-in hangs, open Cloud, Overview, Advanced settings in Lovable, check the health cards, and move the database up one size.

## Known limits

- Plan limits other than the text allowance are not enforced on the server.
- Media buckets are public by link. File names are random and cannot be listed, but a link that leaks stays readable. Private buckets with signed links are the next step.
- The owner gets no email when a new testimonial arrives. The dashboard shows a live notice.
- Video and audio testimonials have no transcript, so Content works from written text only.
- Sales are logged by hand. There is no link to a customer's own Stripe account.

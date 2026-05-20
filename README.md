# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Enabling billing

Billing is built but disconnected by default so the project remains remixable. To turn it on:

### 1. Create products in Stripe

Create two recurring products in your Stripe dashboard:
- **Starter** — $29/mo
- **Pro** — $79/mo

(Scale is "contact sales" only — no Stripe product needed.)

Copy the price IDs (they look like `price_1XYZabc...`).

### 2. Set Supabase Edge Function secrets

In your Supabase project → Project Settings → Edge Functions → Secrets, add:

```
STRIPE_SECRET_KEY=sk_live_...      # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
```

### 3. Update price IDs in code

Edit `src/lib/billing-plans.ts` and replace the `STRIPE_PRICE_IDS` placeholders with your real price IDs.

### 4. Configure the Stripe webhook

In your Stripe dashboard → Developers → Webhooks → Add endpoint:

- **Endpoint URL**: `https://<your-project>.supabase.co/functions/v1/stripe-webhook`
- **Events to send**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `payment_intent.succeeded`

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

### 5. Test

Open the app → Settings → Billing → Upgrade. The "Billing not yet connected" banner should disappear once all four secrets are set. Use Stripe test cards (`4242 4242 4242 4242`) until you're ready to flip to live keys.

## Enabling SMS campaigns

SMS sends run server-side via a queue worker + Twilio status webhooks. To enable:

### 1. Set Supabase Edge Function secrets

```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...   # the 10DLC-registered sending number
INTERNAL_WORKER_KEY=<a long random string>
```

### 2. Wire pg_cron to the worker endpoint

After the migration runs, open the Supabase SQL editor and run:

```sql
ALTER DATABASE postgres SET app.worker_url = 'https://<your-project>.supabase.co/functions/v1/process-campaign-jobs';
ALTER DATABASE postgres SET app.worker_key = '<the same INTERNAL_WORKER_KEY value>';
```

This makes the pg_cron job (which runs every minute) able to invoke the worker with the right URL and shared secret.

### 3. Configure Twilio's status callback

The worker passes `StatusCallback=https://<your-project>.supabase.co/functions/v1/twilio-status-webhook` on every outbound SMS, so Twilio will POST delivery updates automatically. No additional Twilio dashboard config needed; just make sure your AuthToken matches `TWILIO_AUTH_TOKEN`.

### 4. TCPA / 10DLC

The Compliance disclosure on the campaign recipients step is informational. You are still responsible for:
- Collecting prior express written consent before sending to any US number.
- Including "Reply STOP to unsubscribe" in your message template (the default template does this).
- Registering your business and use case via Twilio 10DLC, including a Brand and Campaign approval. Happy Client does not handle this for you.

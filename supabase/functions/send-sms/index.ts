import { json, preflight } from "../_shared/http.ts";

/**
 * Retired.
 *
 * This endpoint used to send one text to any number for any signed-in
 * account, with no allowance and no country check. Nothing in the app called
 * it, and it could be used to run up the Twilio bill. Texts now go out only
 * through start-campaign, which enforces every rule on the server.
 *
 * The file stays so that the next deploy replaces the old code. Once that
 * deploy is done, the function can be deleted.
 */
Deno.serve((req) => {
  if (req.method === "OPTIONS") return preflight();
  return json({ error: "gone", message: "This endpoint was retired. Text campaigns are sent from the app." }, 410);
});

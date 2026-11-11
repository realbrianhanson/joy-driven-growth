import "@fontsource-variable/inter";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/hooks/use-auth";
import App from "./App.tsx";
import "./index.css";

// Email links (confirm, magic link, password reset) arrive with a token in the
// URL hash. supabase-js consumes and removes it, so note the intent first.
try {
  const hash = window.location.hash;
  if (/type=recovery/.test(hash)) sessionStorage.setItem("hc-auth-intent", "recovery");
  else if (/access_token=/.test(hash) && window.location.pathname === "/") sessionStorage.setItem("hc-auth-intent", "dashboard");
} catch {
  /* storage blocked: the app still works, the user just lands on the page in the link */
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>,
);

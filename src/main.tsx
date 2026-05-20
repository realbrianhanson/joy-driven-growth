import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "@/hooks/use-auth";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <DemoModeProvider>
      <App />
    </DemoModeProvider>
  </AuthProvider>
);

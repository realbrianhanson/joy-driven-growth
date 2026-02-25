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

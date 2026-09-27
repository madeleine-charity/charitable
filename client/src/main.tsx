import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import App from "./App";
import "./index.css";

// Provisioned by the Clerk Vercel Marketplace integration (exposed via envPrefix in vite.config.ts).
const publishableKey = import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={publishableKey} afterSignOutUrl="/">
    <App />
  </ClerkProvider>,
);

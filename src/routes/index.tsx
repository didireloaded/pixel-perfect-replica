import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

// The app reads browser-only state (localStorage, navigator) during render,
// so it is loaded only after hydration.
const BetweenApp = lazy(() => import("../between/App.jsx"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Between — Chat Insights" },
      { name: "description", content: "Import a WhatsApp chat and review measured, evidence-linked insights on your device." },
      { property: "og:title", content: "Between — Chat Insights" },
      { property: "og:description", content: "Import a WhatsApp chat and review measured, evidence-linked insights on your device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    import("../between/register-sw.js").then((m) => {
      if (document.readyState === "complete") m.registerServiceWorker();
      else window.addEventListener("load", () => m.registerServiceWorker(), { once: true });
    });
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <BetweenApp />
    </Suspense>
  );
}

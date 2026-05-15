import { useEffect, useState } from "react";
import { GridBackground } from "./components/GridBackground";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { CanvasDemo } from "./components/CanvasDemo";
import { ProvidersStrip } from "./components/ProvidersStrip";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { DownloadSection } from "./components/DownloadSection";
import { Footer } from "./components/Footer";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";

type Route = "home" | "privacy" | "terms";

function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, "");
  if (h === "privacy") return "privacy";
  if (h === "terms") return "terms";
  return "home";
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <GridBackground />
      <Nav />
      {route === "privacy" ? (
        <main className="relative z-10">
          <PrivacyPage />
        </main>
      ) : route === "terms" ? (
        <main className="relative z-10">
          <TermsPage />
        </main>
      ) : (
        <main className="relative z-10 flex flex-col">
          <section className="mx-auto w-full max-w-7xl px-6 sm:px-10">
            <div className="grid grid-cols-1 gap-x-10 gap-y-12 pt-12 sm:pt-20 lg:grid-cols-3">
              <div className="lg:col-span-1 lg:row-start-1">
                <Hero />
              </div>
              <div className="lg:col-span-2 lg:row-start-1">
                <CanvasDemo />
              </div>
            </div>
          </section>
          <div className="mx-auto flex w-full max-w-7xl flex-col px-6 sm:px-10">
            <ProvidersStrip />
            <Features />
            <HowItWorks />
            <DownloadSection />
          </div>
        </main>
      )}
      <Footer />
    </div>
  );
}

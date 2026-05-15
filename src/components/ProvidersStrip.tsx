import { ProviderLogo, type Provider } from "./ProviderLogo";

const PROVIDERS: { id: Provider; name: string; tagline: string }[] = [
  { id: "claude", name: "Claude", tagline: "Anthropic" },
  { id: "codex", name: "Codex", tagline: "OpenAI" },
  { id: "cursor", name: "Cursor", tagline: "Cursor" },
];

export function ProvidersStrip() {
  return (
    <section
      className="mt-8 flex flex-col gap-6 border-t border-border pt-10"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Bring your own provider · Use the subscription you already pay for
      </span>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {PROVIDERS.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center border border-border bg-background">
                <ProviderLogo provider={p.id} size={14} />
              </span>
              <span
                className="text-sm font-medium text-foreground"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                {p.name}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {p.tagline}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[12px] leading-[1.6] text-muted-foreground">
        Sign in with the CLI you already use. No API keys to manage. No new
        bill. lmcanvas spawns your CLI in the background and renders the
        canvas around it.
      </p>
    </section>
  );
}

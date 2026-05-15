const STEPS = [
  {
    n: "01",
    title: "Install the app",
    body: "Download the .dmg, drag to Applications. macOS 11+.",
  },
  {
    n: "02",
    title: "Connect a provider",
    body: "Sign in to Claude Code, Codex, or cursor-agent — whichever you already use. The CLI handles auth. lmcanvas never sees your tokens.",
  },
  {
    n: "03",
    title: "Open a canvas",
    body: "Type a prompt. Branch from the response. Zoom out. Keep going.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mt-32 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          How it works
        </span>
        <h2
          className="text-3xl leading-[1.05] text-foreground sm:text-4xl"
          style={{
            fontFamily: "var(--font-geist-pixel-square)",
            fontWeight: 700,
          }}
        >
          Three steps. About a minute.
        </h2>
      </header>
      <ol className="flex flex-col">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            className="grid grid-cols-[64px_1fr] gap-6 border-t border-border py-6 sm:grid-cols-[96px_1fr] sm:gap-10"
            style={
              i === STEPS.length - 1
                ? { borderBottom: "1px solid var(--border)" }
                : undefined
            }
          >
            <span
              className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {s.n}
            </span>
            <div className="flex flex-col gap-2">
              <div className="text-base font-medium text-foreground">
                {s.title}
              </div>
              <p
                className="text-[13px] leading-[1.6] text-muted-foreground"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {s.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

import { GitBranch, HardDrive, Workflow, MousePointer2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    icon: GitBranch,
    title: "Branch anywhere",
    body: "Fork from any node — or highlight a phrase mid-response and spawn a child that picks up that thread. Every detour stays on the canvas.",
  },
  {
    icon: HardDrive,
    title: "Local-first",
    body: "Everything lives in ~/.local-lmcanvas as plain JSON. No cloud, no sync, no account. Your conversations don't leave your machine except through your own AI provider.",
  },
  {
    icon: Workflow,
    title: "Multi-provider",
    body: "Use Claude for one canvas, Codex for another, Cursor for a third. Switch per-canvas, settle the inner debate by running the same prompt down two branches.",
  },
  {
    icon: MousePointer2,
    title: "Built for thinking",
    body: "Zoom out to see the shape of a problem. Zoom in to push a single thread further. The structure is the point.",
  },
];

export function Features() {
  return (
    <section className="mt-32 flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          What you get
        </span>
        <h2
          className="text-3xl leading-[1.05] text-foreground sm:text-4xl"
          style={{
            fontFamily: "var(--font-geist-pixel-square)",
            fontWeight: 700,
          }}
        >
          A canvas, not a chat box.
        </h2>
      </header>
      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex flex-col gap-3 bg-background p-6">
            <f.icon className="h-4 w-4 text-foreground" strokeWidth={1.5} />
            <div className="text-sm font-medium text-foreground">{f.title}</div>
            <p
              className="text-[13px] leading-[1.6] text-muted-foreground"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

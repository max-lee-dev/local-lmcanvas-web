import { motion } from "framer-motion";
import { ArrowDown, Apple } from "lucide-react";

const DMG_URL =
  "https://github.com/max-lee-dev/local-lmcanvas/releases/latest/download/local-lmcanvas.dmg";

export function DownloadSection() {
  return (
    <section
      id="download"
      className="mt-32 mb-32 flex flex-col gap-10 border-y border-border py-16"
    >
      <header className="flex flex-col gap-3">
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Download
        </span>
        <h2
          className="text-3xl leading-[1.05] text-foreground sm:text-4xl"
          style={{
            fontFamily: "var(--font-geist-pixel-square)",
            fontWeight: 700,
          }}
        >
          Get the app.
        </h2>
      </header>

      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-[2fr_1fr]">
        <motion.a
          href={DMG_URL}
          whileHover={{ y: -1 }}
          className="group flex items-center justify-between bg-background px-6 py-8"
        >
          <div className="flex items-center gap-4">
            <Apple className="h-7 w-7 text-foreground" strokeWidth={1.5} />
            <div className="flex flex-col gap-1">
              <div
                className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                macOS · Apple Silicon · Intel
              </div>
              <div className="text-lg font-medium text-foreground">
                local-lmcanvas.dmg
              </div>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-background transition-opacity group-hover:opacity-90"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Download
            <ArrowDown className="h-3 w-3" />
          </span>
        </motion.a>

        <div className="flex flex-col gap-2 bg-background px-6 py-8">
          <div
            className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Requires
          </div>
          <ul
            className="flex flex-col gap-1 text-[12px] text-muted-foreground"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            <li>macOS 11 or later</li>
            <li>Claude Code, Codex, or cursor-agent CLI</li>
            <li>~90mb disk</li>
          </ul>
        </div>
      </div>

      <p
        className="max-w-2xl text-[12px] leading-[1.6] text-muted-foreground"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        Windows and Linux builds are not available yet. The app spawns
        provider CLIs (osascript on macOS to open Terminal for sign-in
        flows), so cross-platform support requires per-OS work.
      </p>
    </section>
  );
}

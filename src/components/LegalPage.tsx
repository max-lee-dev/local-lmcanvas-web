import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
};

export function LegalPage({ eyebrow, title, updated, children }: Props) {
  return (
    <div className="relative mx-auto w-full max-w-3xl px-6 py-16 sm:px-10 sm:py-24">
      <a
        href="#/"
        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        <ArrowLeft className="h-3 w-3" />
        Back to home
      </a>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mt-10"
      >
        <div
          className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {eyebrow}
        </div>
        <h1
          className="mt-3 text-4xl leading-[1.05] text-foreground sm:text-5xl"
          style={{
            fontFamily: "var(--font-geist-pixel-square)",
            fontWeight: 700,
          }}
        >
          {title}
        </h1>
        <div
          className="mt-3 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          Last updated · {updated}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
        className="legal mt-12 flex flex-col gap-6 text-[14px] leading-[1.75] text-foreground/90"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        {children}
      </motion.div>

      <style>{`
        .legal h2 {
          font-family: var(--font-geist-pixel-square);
          font-weight: 700;
          font-size: 1.5rem;
          line-height: 1.2;
          margin-top: 1.75rem;
          color: var(--foreground);
        }
        .legal h3 {
          font-family: var(--font-geist-mono);
          font-weight: 500;
          font-size: 0.85rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-top: 1.25rem;
          color: var(--muted-foreground);
        }
        .legal p { color: var(--muted-foreground); }
        .legal strong { color: var(--foreground); font-weight: 500; }
        .legal a { color: var(--foreground); text-decoration: underline; text-underline-offset: 2px; }
        .legal ul { display: flex; flex-direction: column; gap: 0.4rem; padding-left: 1.25rem; color: var(--muted-foreground); }
        .legal li { list-style: disc; }
        .legal code {
          font-family: var(--font-geist-mono);
          background: var(--muted);
          padding: 0 0.3rem;
          border-radius: 3px;
          font-size: 0.85em;
        }
      `}</style>
    </div>
  );
}

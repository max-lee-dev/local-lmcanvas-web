import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { GithubIcon } from "./GithubIcon";
import { DEFAULT_DMG_URL, REPO_URL } from "../lib/download";

export function Hero() {
  return (
    <section className="flex flex-col pt-6 sm:pt-10 lg:pt-14">
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="inline-flex items-center gap-2 self-start text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        <img
          src="/app-icon.png"
          alt=""
          className="h-4 w-4 rounded-[4px]"
          draggable={false}
        />
        LMCanvas · v0.1
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
        className="mt-6 w-[min(560px,95vw)] text-5xl leading-[1.02] text-foreground sm:text-6xl xl:text-7xl"
        style={{
          fontFamily: "var(--font-geist-pixel-square)",
          fontWeight: 900,
        }}
      >
        Linear chat<br />is dead.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
        className="mt-8 w-[min(520px,90vw)] text-[14px] leading-[1.7] text-muted-foreground"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        Every AI chat works the same way: one thread, one path, one direction.
        LMCanvas gives you a canvas — branch a conversation the moment
        you want to try a different angle, keep every approach in view.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
        className="mt-8 flex flex-col items-start gap-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={DEFAULT_DMG_URL}
            download
            className="inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] text-background hover:opacity-90"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            Download for macOS
            <ArrowDown className="h-3.5 w-3.5" />
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border bg-card px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] text-foreground hover:bg-muted"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            <GithubIcon className="h-3.5 w-3.5" />
            Source
          </a>
        </div>
      </motion.div>
    </section>
  );
}

import { REPO_URL } from "../lib/download";

export function Footer() {
  return (
    <footer
      className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-3 border-t border-border px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        LMCanvas · open source · MIT
      </span>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <a href="#/privacy" className="hover:text-foreground">
          privacy
        </a>
        <a href="#/terms" className="hover:text-foreground">
          terms
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
        >
          github
        </a>
        <a
          href={`${REPO_URL}/issues`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground"
        >
          issues
        </a>
      </div>
    </footer>
  );
}

const REPO_URL = "https://github.com/max-lee-dev/local-lmcanvas";

export function Footer() {
  return (
    <footer
      className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-border px-6 py-8 sm:px-10"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        local-lmcanvas · open source · MIT
      </span>
      <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
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

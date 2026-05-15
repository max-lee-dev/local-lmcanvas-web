import { GithubIcon } from "./GithubIcon";

const REPO_URL = "https://github.com/max-lee-dev/local-lmcanvas";

export function Nav() {
  return (
    <nav
      className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      <a
        href="#"
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-foreground hover:opacity-80"
      >
        <img
          src="/app-icon.png"
          alt=""
          className="h-4 w-4 rounded-[4px]"
          draggable={false}
        />
        LMCanvas
      </a>
      <div className="flex items-center gap-4">
        <a
          href="#download"
          className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
        >
          download
        </a>
        <a
          href="#how"
          className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
        >
          how it works
        </a>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
        >
          <GithubIcon className="h-3.5 w-3.5" />
          github
        </a>
      </div>
    </nav>
  );
}

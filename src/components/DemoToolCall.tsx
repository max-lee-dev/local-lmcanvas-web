import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  FilePen,
  FileText,
  Globe,
  Link as LinkIcon,
  Loader2,
  Pencil,
  Search,
  Terminal,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";

export type DemoToolBlock = {
  id: string;
  name: string;
  summary: string;
  input: Record<string, unknown>;
  result?: string;
  isError?: boolean;
  running?: boolean;
};

const ICONS: Record<string, LucideIcon> = {
  Bash: Terminal,
  Read: FileText,
  Edit: Pencil,
  Write: FilePen,
  Grep: Search,
  WebSearch: Globe,
  WebFetch: LinkIcon,
};

function getIcon(name: string): LucideIcon {
  return ICONS[name] ?? Wrench;
}

export function DemoToolCall({ block }: { block: DemoToolBlock }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = getIcon(block.name);
  const running = block.running ?? false;
  const isError = block.isError ?? false;

  return (
    <div
      className={clsx(
        "my-1 overflow-hidden rounded-[8px] border",
        isError
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-card"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={clsx(
          "flex w-full items-center gap-1.5 px-2 py-1 text-left transition-colors cursor-pointer",
          isError ? "hover:bg-destructive/10" : "hover:bg-muted"
        )}
        aria-expanded={expanded}
      >
        <Icon
          size={11}
          className={clsx(
            "shrink-0",
            isError ? "text-destructive" : "text-muted-foreground"
          )}
        />
        <span
          className={clsx(
            "shrink-0 text-[10px] font-medium",
            isError ? "text-destructive" : "text-foreground"
          )}
        >
          {block.name}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground">
          {block.summary}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          {running ? (
            <Loader2 size={11} className="animate-spin text-muted-foreground" />
          ) : isError ? (
            <span className="text-[9px] font-medium text-destructive">failed</span>
          ) : (
            <CheckCircle2 size={11} className="text-foreground" />
          )}
          <ChevronDown
            size={11}
            className={clsx(
              "text-muted-foreground transition-transform",
              expanded && "rotate-180"
            )}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={clsx(
              "overflow-hidden border-t",
              isError ? "border-destructive/30" : "border-border"
            )}
          >
            <div className="px-2 py-1.5">
              <SectionLabel>input</SectionLabel>
              <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap break-words rounded-[6px] bg-muted px-2 py-1 font-mono text-[9.5px] leading-snug text-foreground">
                {JSON.stringify(block.input, null, 2)}
              </pre>
              {block.result !== undefined && (
                <>
                  <SectionLabel>{isError ? "error" : "result"}</SectionLabel>
                  <pre
                    className={clsx(
                      "mt-0.5 overflow-x-auto whitespace-pre-wrap break-words rounded-[6px] px-2 py-1 font-mono text-[9.5px] leading-snug",
                      isError
                        ? "bg-destructive/5 text-destructive"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {block.result}
                  </pre>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1.5 text-[8px] font-medium uppercase tracking-wide text-muted-foreground first:mt-0">
      {children}
    </div>
  );
}

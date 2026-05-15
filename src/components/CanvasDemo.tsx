import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, Check, ChevronDown, Plus } from "lucide-react";
import clsx from "clsx";
import { ProviderLogo, type Provider } from "./ProviderLogo";
import { DemoToolCall, type DemoToolBlock } from "./DemoToolCall";

const DEMO_PROVIDERS: Provider[] = ["claude", "codex", "cursor"];
const PROVIDER_LABELS: Record<Provider, string> = {
  claude: "Opus 4.7",
  codex: "GPT-5.3 Codex",
  cursor: "Auto",
};

type AssistantBlock =
  | { kind: "text"; text: string }
  | { kind: "tool"; block: DemoToolBlock };

type DemoNode = {
  id: string;
  x: number; // %
  y: number; // %
  provider: Provider;
  userText: string;
  assistant?: AssistantBlock[];
};

type NodePos = { x: number; y: number };

const NODE_W = 340;
const FALLBACK_NODE_H_PCT = 18;

const ROOT: DemoNode = {
  id: "root",
  x: 38,
  y: 3,
  provider: "claude",
  userText: "/dashboard is taking 8s on prod — find why and propose fixes",
  assistant: [
    {
      kind: "text",
      text: "Tracing the slow query first.",
    },
    {
      kind: "tool",
      block: {
        id: "r1",
        name: "Grep",
        summary: 'pattern: "dashboard" in app/routes',
        input: { pattern: "dashboard", path: "app/routes" },
        result:
          "app/routes/dashboard.ts:34: const events = await db.userEvents.findMany({ where: { userId } })\napp/routes/dashboard.ts:41:   for (const e of events) { const meta = await db.eventMeta.findUnique(...) }",
      },
    },
    {
      kind: "tool",
      block: {
        id: "r2",
        name: "Bash",
        summary: "EXPLAIN ANALYZE on the dashboard query",
        input: { command: "psql -c 'EXPLAIN ANALYZE SELECT ...'" },
        result:
          "Seq Scan on user_events  (cost=0..184221 rows=812k)\n  Filter: (created_at > now() - '30 days')\n  Rows Removed by Filter: 2.4M\nExecution Time: 7984.221 ms",
      },
    },
    {
      kind: "text",
      text: "Two real fixes worth comparing in parallel: (1) composite index on (user_id, created_at) — leaves SQL untouched, ships today; (2) materialized view that aggregates per-day — bigger lift but reads stay cheap as the table grows.",
    },
  ],
};

const BRANCH_LEFT: DemoNode = {
  id: "branch-left",
  x: 38,
  y: 52,
  provider: "claude",
  userText: "ship the index — fastest path to unblock prod",
  assistant: [
    {
      kind: "text",
      text: "Writing the migration and running it against a prod snapshot to confirm the plan flips.",
    },
    {
      kind: "tool",
      block: {
        id: "l1",
        name: "Write",
        summary: "migrations/0042_user_events_idx.sql",
        input: {
          file_path: "migrations/0042_user_events_idx.sql",
          content:
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS\n  user_events_user_created_idx\n  ON user_events (user_id, created_at DESC);\n",
        },
        result: "File written: 3 lines",
      },
    },
    {
      kind: "tool",
      block: {
        id: "l2",
        name: "Bash",
        summary: "psql < migrations/0042 && re-run EXPLAIN",
        input: {
          command: "psql -f migrations/0042_user_events_idx.sql && psql -c 'EXPLAIN ANALYZE ...'",
        },
        running: true,
      },
    },
    {
      kind: "text",
      text: "Plan flipped to Index Scan. 7984ms → 241ms. Index is 64MB on disk, no app changes needed.",
    },
  ],
};

const BRANCH: DemoNode = {
  id: "branch",
  x: 92,
  y: 52,
  provider: "codex",
  userText: "try the materialized view approach in parallel",
  assistant: [
    {
      kind: "text",
      text: "Aggregating per (user_id, day) so the dashboard becomes a 30-row read regardless of how many events the user has.",
    },
    {
      kind: "tool",
      block: {
        id: "t1",
        name: "Write",
        summary: "migrations/0043_dashboard_mv.sql",
        input: {
          file_path: "migrations/0043_dashboard_mv.sql",
          content:
            "CREATE MATERIALIZED VIEW dashboard_daily AS\nSELECT user_id, date_trunc('day', created_at) AS day,\n       count(*) AS events, sum(amount) AS total\nFROM user_events\nWHERE created_at > now() - interval '90 days'\nGROUP BY 1, 2;\n\nCREATE UNIQUE INDEX ON dashboard_daily (user_id, day);\n",
        },
        result: "File written: 8 lines",
      },
    },
    {
      kind: "tool",
      block: {
        id: "t2",
        name: "Bash",
        summary: "REFRESH MATERIALIZED VIEW + EXPLAIN dashboard read",
        input: {
          command:
            "psql -c 'REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_daily' && psql -c 'EXPLAIN ANALYZE SELECT * FROM dashboard_daily WHERE user_id = $1'",
        },
        result:
          "REFRESH MATERIALIZED VIEW\nIndex Scan using dashboard_daily_user_id_day_idx  (cost=0.42..8.44 rows=30)\nExecution Time: 78.4 ms",
      },
    },
    {
      kind: "tool",
      block: {
        id: "t3",
        name: "Write",
        summary: "app/routes/dashboard.ts — read from view",
        input: {
          file_path: "app/routes/dashboard.ts",
          content:
            "const rows = await db.dashboardDaily.findMany({\n  where: { userId, day: { gte: thirtyDaysAgo } },\n  orderBy: { day: 'desc' },\n});\n",
        },
        running: true,
      },
    },
    {
      kind: "text",
      text: "78ms p95 — 100x. Trade-off: refresh cron is 5min so the dashboard is stale by up to 5min. Worth checking with product before we pick this over the index.",
    },
  ],
};

// Pixel-space bezier that mirrors @xyflow/react's getBezierPath. Each endpoint
// has a horizontal "side" (left/right) and the control-point offset uses the
// same curvature math as xyflow so the edge curves smoothly regardless of the
// nodes' relative position.
type Side = "left" | "right" | "top" | "bottom";

function anchorPos(
  cx: number,
  cy: number,
  w: number,
  h: number,
  side: Side,
): { x: number; y: number } {
  switch (side) {
    case "right": return { x: cx + w / 2, y: cy };
    case "left": return { x: cx - w / 2, y: cy };
    case "top": return { x: cx, y: cy - h / 2 };
    case "bottom": return { x: cx, y: cy + h / 2 };
  }
}

function controlOffset(distance: number, curvature = 0.25): number {
  if (distance >= 0) return 0.5 * distance;
  return curvature * 25 * Math.sqrt(-distance);
}

function edgePath(
  from: { x: number; y: number; side: Side },
  to: { x: number; y: number; side: Side },
): string {
  let sx: number;
  let sy: number;
  let tx: number;
  let ty: number;
  if (from.side === "right" || from.side === "left") {
    const dist = from.side === "right" ? to.x - from.x : from.x - to.x;
    const off = controlOffset(dist);
    sx = from.side === "right" ? from.x + off : from.x - off;
    sy = from.y;
  } else {
    const dist = from.side === "bottom" ? to.y - from.y : from.y - to.y;
    const off = controlOffset(dist);
    sy = from.side === "bottom" ? from.y + off : from.y - off;
    sx = from.x;
  }
  if (to.side === "right" || to.side === "left") {
    const dist = to.side === "right" ? from.x - to.x : to.x - from.x;
    const off = controlOffset(dist);
    tx = to.side === "right" ? to.x + off : to.x - off;
    ty = to.y;
  } else {
    const dist = to.side === "bottom" ? from.y - to.y : to.y - from.y;
    const off = controlOffset(dist);
    ty = to.side === "bottom" ? to.y + off : to.y - off;
    tx = to.x;
  }
  return `M ${from.x} ${from.y} C ${sx} ${sy}, ${tx} ${ty}, ${to.x} ${to.y}`;
}

function ModelBadge({
  provider,
  onChange,
}: {
  provider: Provider;
  onChange: (next: Provider) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent): void => {
      const root = wrapperRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (p: Provider): void => {
    onChange(p);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={`flex items-center gap-1 rounded-sm border border-border bg-card text-foreground px-1.5 py-[5px] text-xs font-medium cursor-pointer transition-colors hover:bg-muted ${
          open ? "bg-muted" : ""
        }`}
        style={{ fontFamily: "var(--font-geist-pixel-square)" }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <ProviderLogo provider={provider} size={10} />
        <span className="tracking-tight text-[8px]">
          {PROVIDER_LABELS[provider]}
        </span>
        {provider === "claude" && (
          <Brain className="w-[10px] h-[10px] text-amber-500 opacity-90" />
        )}
        <ChevronDown
          className={`w-[8px] h-[8px] text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-border bg-card shadow-lg overflow-hidden"
            role="listbox"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div
              className="px-2.5 pt-2 pb-1 text-[8px] uppercase tracking-[0.14em] text-muted-foreground"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Canvas model
            </div>
            {DEMO_PROVIDERS.map((p) => {
              const isActive = p === provider;
              return (
                <button
                  key={p}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => pick(p)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[11px] transition-colors cursor-pointer ${
                    isActive
                      ? "bg-accent/15 text-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <ProviderLogo provider={p} size={12} />
                  <span className="flex-1">{PROVIDER_LABELS[p]}</span>
                  {isActive && (
                    <Check className="h-3 w-3 text-foreground/70" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function nextStreamStep(
  text: string,
  pos: number,
): { delay: number; nextPos: number } {
  const r = Math.random();
  const burst =
    r < 0.18 ? 1 : r < 0.58 ? 2 : r < 0.85 ? 3 : r < 0.95 ? 5 : 8;
  const nextPos = Math.min(pos + burst, text.length);
  let delay = 3 + Math.random() * 8;
  if (Math.random() < 0.08) delay += 35 + Math.random() * 45;
  const justTyped = text.slice(pos, nextPos);
  if (/[,;:]/.test(justTyped)) delay += 30 + Math.random() * 45;
  if (/[.!?]/.test(justTyped)) delay += 70 + Math.random() * 80;
  if (/\n/.test(justTyped)) delay += 110 + Math.random() * 70;
  return { delay, nextPos };
}

function useStreamingAssistant(
  blocks: AssistantBlock[] | undefined,
  start: boolean,
  onDone?: () => void,
) {
  const [progress, setProgress] = useState({ index: 0, chars: 0 });
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!start) return;
    if (!blocks || blocks.length === 0) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }
    if (progress.index >= blocks.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDoneRef.current?.();
      }
      return;
    }
    const cur = blocks[progress.index];
    if (cur.kind === "text") {
      if (progress.chars < cur.text.length) {
        const { delay, nextPos } = nextStreamStep(cur.text, progress.chars);
        const id = setTimeout(() => {
          setProgress((p) => ({ ...p, chars: nextPos }));
        }, delay);
        return () => clearTimeout(id);
      }
      const id = setTimeout(
        () => setProgress({ index: progress.index + 1, chars: 0 }),
        90 + Math.random() * 110,
      );
      return () => clearTimeout(id);
    }
    const dwell = cur.block.running
      ? 425 + Math.random() * 175
      : 160 + Math.random() * 130;
    const id = setTimeout(
      () => setProgress({ index: progress.index + 1, chars: 0 }),
      dwell,
    );
    return () => clearTimeout(id);
  }, [start, blocks, progress]);

  return progress;
}

type DemoNodeCardProps = {
  node: DemoNode;
  provider: Provider;
  onProviderChange: (id: string, next: Provider) => void;
  position: NodePos;
  containerRef: React.RefObject<HTMLDivElement | null>;
  streamStart: boolean;
  isDraft: boolean;
  onStreamDone?: () => void;
  onPositionChange: (id: string, next: NodePos) => void;
  onHeightChange: (id: string, heightPct: number) => void;
  onAddFollowUp: (parentId: string) => void;
  onCommitDraft: (id: string, text: string) => void;
};

function DemoNodeCard({
  node,
  provider,
  onProviderChange,
  position,
  containerRef,
  streamStart,
  isDraft,
  onStreamDone,
  onPositionChange,
  onHeightChange,
  onAddFollowUp,
  onCommitDraft,
}: DemoNodeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const [draftText, setDraftText] = useState("");

  // Autofocus the textarea the moment the node becomes a draft.
  useEffect(() => {
    if (!isDraft) return;
    const t = requestAnimationFrame(() => draftRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [isDraft]);

  // Auto-grow the textarea to fit its content.
  useLayoutEffect(() => {
    const el = draftRef.current;
    if (!el || !isDraft) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draftText, isDraft]);
  const dragState = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPosX: number;
    startPosY: number;
    moved: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const progress = useStreamingAssistant(
    node.assistant,
    streamStart,
    onStreamDone,
  );

  useLayoutEffect(() => {
    const el = cardRef.current;
    const container = containerRef.current;
    if (!el || !container) return;
    const report = () => {
      const cRect = container.getBoundingClientRect();
      if (!cRect.height) return;
      const h = el.getBoundingClientRect().height;
      onHeightChange(node.id, (h / cRect.height) * 100);
    };
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => ro.disconnect();
  }, [node.id, containerRef, onHeightChange]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const container = containerRef.current;
      if (!container) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragState.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
        moved: false,
      };
    },
    [containerRef, position.x, position.y],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const st = dragState.current;
      if (!st || st.pointerId !== e.pointerId) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dxPct = ((e.clientX - st.startClientX) / rect.width) * 100;
      const dyPct = ((e.clientY - st.startClientY) / rect.height) * 100;
      if (!st.moved && Math.hypot(dxPct, dyPct) > 0.2) {
        st.moved = true;
        setDragging(true);
      }
      if (st.moved) {
        onPositionChange(node.id, {
          x: st.startPosX + dxPct,
          y: st.startPosY + dyPct,
        });
      }
    },
    [containerRef, node.id, onPositionChange],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragState.current;
    if (!st || st.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragState.current = null;
    setDragging(false);
  }, []);

  const blocks = node.assistant ?? [];
  const showCount = Math.min(progress.index + 1, blocks.length);
  const hasStreamed = streamStart && showCount > 0;
  const showFollowUp = hovered && !dragging;

  return (
    <motion.div
      ref={cardRef}
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="absolute -translate-x-1/2 select-none"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: NODE_W,
        zIndex: dragging ? 30 : hovered ? 20 : 10,
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <div
        className="relative border border-border rounded-[10px] bg-card shadow-sm px-5 pb-4 pt-12"
        style={{
          boxShadow: dragging
            ? "0 12px 32px -8px rgba(0,0,0,0.25)"
            : undefined,
        }}
      >
        <div className="absolute left-4 top-3">
          <ModelBadge
            provider={provider}
            onChange={(next) => onProviderChange(node.id, next)}
          />
        </div>

        {isDraft ? (
          <textarea
            ref={draftRef}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const trimmed = draftText.trim();
                if (!trimmed) return;
                onCommitDraft(node.id, trimmed);
              }
            }}
            placeholder="Reply…  (Enter to send)"
            rows={1}
            className="w-full resize-none bg-transparent text-[13px] leading-snug text-foreground placeholder:text-muted-foreground/70 outline-none"
            style={{ cursor: "text" }}
          />
        ) : (
          <div className="text-[13px] leading-snug text-foreground">
            {node.userText}
          </div>
        )}

        {hasStreamed && (
          <>
            <div className="my-4 h-px w-full bg-border" />
            <div className="flex flex-col gap-1">
              {blocks.slice(0, showCount).map((b, i) => {
                const isCurrent =
                  i === progress.index && progress.index < blocks.length;
                if (b.kind === "text") {
                  const text = isCurrent
                    ? b.text.slice(0, progress.chars)
                    : b.text;
                  const showCaret =
                    isCurrent && progress.chars < b.text.length;
                  return (
                    <div
                      key={`t-${i}`}
                      className="text-[12px] leading-[1.55] text-foreground/90"
                    >
                      {text}
                      {showCaret && (
                        <span className="ml-[1px] inline-block h-[0.95em] w-[2px] translate-y-[2px] animate-pulse bg-foreground/70" />
                      )}
                    </div>
                  );
                }
                const block = b.block;
                const stillRunning = isCurrent && (block.running ?? false);
                const effective: DemoToolBlock = stillRunning
                  ? block
                  : {
                      ...block,
                      running: false,
                      result: block.result ?? "ok",
                    };
                return <DemoToolCall key={block.id} block={effective} />;
              })}
            </div>
          </>
        )}

        {/* Follow-up pill — appears on hover, mirrors the real app's footer button */}
        <div
          className={clsx(
            "absolute -bottom-4 left-0 right-0 flex justify-center transition-opacity duration-150",
            showFollowUp ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onAddFollowUp(node.id);
            }}
            className="pointer-events-auto flex h-7 min-w-[50px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground px-2 text-xs font-semibold text-background shadow-lg transition hover:opacity-90"
            title="Follow up"
            aria-label="Create follow-up"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

type FollowUpTemplate = Omit<DemoNode, "id" | "x" | "y">;

const FOLLOW_UP_TEMPLATES: FollowUpTemplate[] = [
  {
    provider: "claude",
    userText: "what tests would you write for this?",
    assistant: [
      {
        kind: "text",
        text: "Two layers worth covering: (1) a unit test that feeds a fixed geocoding JSON into the deserializer so the field names stay locked, and (2) an integration test against a wiremock-style local server so CI never hits open-meteo directly.",
      },
    ],
  },
  {
    provider: "codex",
    userText: "swap reqwest for ureq — single-threaded blocking is fine",
    assistant: [
      {
        kind: "text",
        text: "Good call — `ureq` drops tokio entirely and shrinks the binary by ~40%. The whole `main` becomes synchronous, no `#[tokio::main]` attr, and error handling stays the same with `anyhow`.",
      },
    ],
  },
  {
    provider: "cursor",
    userText: "what about windows support?",
    assistant: [
      {
        kind: "text",
        text: "Should work as-is — `reqwest` ships with rustls, so there's no openssl dependency to fight on Windows. Only thing to double-check is terminal color output if you decide to add any.",
      },
    ],
  },
  {
    provider: "claude",
    userText: "show me the trimmed main loop",
    assistant: [
      {
        kind: "text",
        text: "Linear by design: parse args → geocode city → fetch forecast → print. Keeping the dataflow obvious matters more than abstracting it; this is a 90-line script, not a service.",
      },
    ],
  },
];

type DemoEdge = { id: string; from: string; to: string };

function clampPct(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function CanvasDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<DemoNode[]>([ROOT, BRANCH_LEFT, BRANCH]);
  const [edges, setEdges] = useState<DemoEdge[]>([
    { id: "root->branch-left", from: "root", to: "branch-left" },
    { id: "root->branch", from: "root", to: "branch" },
  ]);
  const [positions, setPositions] = useState<Record<string, NodePos>>({
    root: { x: ROOT.x, y: ROOT.y },
    "branch-left": { x: BRANCH_LEFT.x, y: BRANCH_LEFT.y },
    branch: { x: BRANCH.x, y: BRANCH.y },
  });
  const [providers, setProviders] = useState<Record<string, Provider>>({
    root: ROOT.provider,
    "branch-left": BRANCH_LEFT.provider,
    branch: BRANCH.provider,
  });
  const [heights, setHeights] = useState<Record<string, number>>({});
  const heightsRef = useRef<Record<string, number>>({});
  useEffect(() => {
    heightsRef.current = heights;
  }, [heights]);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [streamStarts, setStreamStarts] = useState<Record<string, boolean>>({
    root: false,
    "branch-left": false,
    branch: false,
  });
  const [visibleIds, setVisibleIds] = useState<Set<string>>(
    () => new Set(["root"]),
  );
  const followUpCounterRef = useRef(0);
  const commitCounterRef = useRef(0);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setContainerSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => setStreamStarts((prev) => ({ ...prev, root: true })),
      450,
    );
    return () => clearTimeout(t);
  }, []);

  const onRootDone = useCallback(() => {
    const t1 = setTimeout(() => {
      setPositions((prev) => {
        const rootPos = prev.root;
        if (!rootPos) return prev;
        const rootH = heightsRef.current["root"] ?? FALLBACK_NODE_H_PCT;
        return {
          ...prev,
          "branch-left": {
            x: rootPos.x,
            y: rootPos.y + rootH + 3,
          },
        };
      });
      setVisibleIds((prev) => new Set(prev).add("branch-left"));
    }, 650);
    const t2 = setTimeout(
      () => setStreamStarts((prev) => ({ ...prev, "branch-left": true })),
      1200,
    );
    const t3 = setTimeout(
      () => setVisibleIds((prev) => new Set(prev).add("branch")),
      1150,
    );
    const t4 = setTimeout(
      () => setStreamStarts((prev) => ({ ...prev, branch: true })),
      1700,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const onPositionChange = useCallback((id: string, next: NodePos) => {
    setPositions((prev) => ({ ...prev, [id]: next }));
  }, []);

  const onProviderChange = useCallback((id: string, next: Provider) => {
    setProviders((prev) => ({ ...prev, [id]: next }));
  }, []);

  const onHeightChange = useCallback((id: string, heightPct: number) => {
    setHeights((prev) => {
      const cur = prev[id];
      if (cur !== undefined && Math.abs(cur - heightPct) < 0.05) return prev;
      return { ...prev, [id]: heightPct };
    });
  }, []);

  const [drafts, setDrafts] = useState<Set<string>>(() => new Set());

  const onAddFollowUp = useCallback((parentId: string) => {
    setPositions((prevPositions) => {
      const parentPos = prevPositions[parentId];
      if (!parentPos) return prevPositions;

      const idx = followUpCounterRef.current++;
      const newId = `followup-${idx + 1}`;

      // Spawn directly under the parent: same x, top edge below parent's bottom.
      const parentHeightPct = heights[parentId] ?? FALLBACK_NODE_H_PCT;
      const newPos: NodePos = {
        x: clampPct(parentPos.x, 8, 92),
        y: clampPct(parentPos.y + parentHeightPct + 4, 6, 90),
      };

      // Inherit the parent's current provider; fresh draft has no assistant yet.
      const parentProvider = providers[parentId] ?? "claude";
      const newNode: DemoNode = {
        id: newId,
        x: newPos.x,
        y: newPos.y,
        provider: parentProvider,
        userText: "",
      };
      setNodes((prev) => [...prev, newNode]);
      setProviders((prev) => ({ ...prev, [newId]: parentProvider }));
      setEdges((prev) => [
        ...prev,
        { id: `${parentId}->${newId}`, from: parentId, to: newId },
      ]);
      setVisibleIds((prev) => new Set(prev).add(newId));
      setDrafts((prev) => new Set(prev).add(newId));

      return { ...prevPositions, [newId]: newPos };
    });
  }, [heights, providers]);

  const onCommitDraft = useCallback((id: string, text: string) => {
    const idx = commitCounterRef.current++;
    const tpl = FOLLOW_UP_TEMPLATES[idx % FOLLOW_UP_TEMPLATES.length];
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, userText: text, assistant: tpl.assistant } : n,
      ),
    );
    setDrafts((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setTimeout(() => {
      setStreamStarts((prev) => ({ ...prev, [id]: true }));
    }, 300);
  }, []);

  const edgePathsD = useMemo(() => {
    const { w, h } = containerSize;
    if (!w || !h) return [];
    return edges
      .map((e) => {
        if (!visibleIds.has(e.to)) return null;
        const fromPos = positions[e.from];
        const toPos = positions[e.to];
        if (!fromPos || !toPos) return null;
        const fromH = ((heights[e.from] ?? FALLBACK_NODE_H_PCT) / 100) * h;
        const toH = ((heights[e.to] ?? FALLBACK_NODE_H_PCT) / 100) * h;
        const fromCx = (fromPos.x / 100) * w;
        const fromCy = (fromPos.y / 100) * h + fromH / 2;
        const toCx = (toPos.x / 100) * w;
        const toCy = (toPos.y / 100) * h + toH / 2;
        // Pick attach sides based on which axis dominates. If the child sits
        // mostly below/above the parent, anchor from the bottom/top so the
        // edge doesn't snake out the side and curl back. Otherwise use the
        // horizontal sides as before.
        const dx = toCx - fromCx;
        const dy = toCy - fromCy;
        const vertical = Math.abs(dy) > Math.abs(dx);
        const fromSide: Side = vertical
          ? dy > 0 ? "bottom" : "top"
          : dx > 0 ? "right" : "left";
        const toSide: Side = vertical
          ? dy > 0 ? "top" : "bottom"
          : dx > 0 ? "left" : "right";
        const fromAnchor = anchorPos(fromCx, fromCy, NODE_W, fromH, fromSide);
        const toAnchor = anchorPos(toCx, toCy, NODE_W, toH, toSide);
        return {
          id: e.id,
          d: edgePath(
            { ...fromAnchor, side: fromSide },
            { ...toAnchor, side: toSide },
          ),
        };
      })
      .filter((p): p is { id: string; d: string } => p !== null);
  }, [edges, positions, heights, containerSize, visibleIds]);

  return (
    <section className="h-full">
      <div
        ref={containerRef}
        className="relative h-full min-h-[560px] w-full lg:min-h-[640px]"
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          {edgePathsD.map((p) => (
            <motion.path
              key={p.id}
              d={p.d}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth={2.25}
              strokeLinecap="round"
              opacity={0.95}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.95 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          ))}
        </svg>

        <div className="absolute inset-0">
          {nodes.map((n) => {
            if (!visibleIds.has(n.id)) return null;
            const pos = positions[n.id];
            if (!pos) return null;
            const prov = providers[n.id] ?? n.provider;
            return (
              <DemoNodeCard
                key={n.id}
                node={n}
                provider={prov}
                onProviderChange={onProviderChange}
                position={pos}
                containerRef={containerRef}
                streamStart={!!streamStarts[n.id]}
                isDraft={drafts.has(n.id)}
                onStreamDone={n.id === "root" ? onRootDone : undefined}
                onPositionChange={onPositionChange}
                onHeightChange={onHeightChange}
                onAddFollowUp={onAddFollowUp}
                onCommitDraft={onCommitDraft}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

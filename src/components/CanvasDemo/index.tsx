import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import type { Provider } from "../ProviderLogo";
import { DemoNodeCard } from "./DemoNodeCard";
import { anchorPos, chooseSides, edgePath } from "./edge";
import { BRANCH, BRANCH_LEFT, FOLLOW_UP_TEMPLATES, ROOT } from "./data";
import {
  FALLBACK_NODE_H_PCT,
  NODE_W,
  type DemoEdge,
  type DemoNode,
  type NodePos,
  type Side,
} from "./types";

function clampPct(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Snapshot at mount — we don't rebuild the graph if the viewport crosses the
// breakpoint mid-session, but we do pick the right initial layout per device.
function useIsMobileSnapshot() {
  const [isMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  return isMobile;
}

export function CanvasDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobileSnapshot();
  const [nodes, setNodes] = useState<DemoNode[]>(() =>
    isMobile ? [ROOT, BRANCH_LEFT] : [ROOT, BRANCH_LEFT, BRANCH],
  );
  const [edges, setEdges] = useState<DemoEdge[]>(() =>
    isMobile
      ? [{ id: "root->branch-left", from: "root", to: "branch-left" }]
      : [
          { id: "root->branch-left", from: "root", to: "branch-left" },
          { id: "root->branch", from: "root", to: "branch" },
        ],
  );
  const [positions, setPositions] = useState<Record<string, NodePos>>(() => {
    const rootPos = { x: isMobile ? 50 : ROOT.x, y: ROOT.y };
    const base: Record<string, NodePos> = {
      root: rootPos,
      "branch-left": { x: BRANCH_LEFT.x, y: BRANCH_LEFT.y },
    };
    if (!isMobile) base.branch = { x: BRANCH.x, y: BRANCH.y };
    return base;
  });
  const [providers, setProviders] = useState<Record<string, Provider>>(() => {
    const base: Record<string, Provider> = {
      root: ROOT.provider,
      "branch-left": BRANCH_LEFT.provider,
    };
    if (!isMobile) base.branch = BRANCH.provider;
    return base;
  });
  const [heights, setHeights] = useState<Record<string, number>>({});
  const heightsRef = useRef<Record<string, number>>({});
  useEffect(() => {
    heightsRef.current = heights;
  }, [heights]);
  // Sides are locked the first time an edge is rendered. Without this, a
  // child node's height growing during streaming could flip the dominant axis
  // and swap right↔left for bottom↔top — making the curve "snap" into a new
  // shape mid-stream.
  const edgeSidesRef = useRef<Record<string, { from: Side; to: Side }>>({});
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [streamStarts, setStreamStarts] = useState<Record<string, boolean>>(() => {
    const base: Record<string, boolean> = {
      root: false,
      "branch-left": false,
    };
    if (!isMobile) base.branch = false;
    return base;
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
            x: isMobile ? rootPos.x : rootPos.x - 14,
            y: rootPos.y + rootH + 32,
          },
        };
      });
      setVisibleIds((prev) => new Set(prev).add("branch-left"));
    }, 650);
    const t2 = setTimeout(
      () => setStreamStarts((prev) => ({ ...prev, "branch-left": true })),
      1200,
    );
    if (isMobile) {
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
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
  }, [isMobile]);

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

      const parentHeightPct = heights[parentId] ?? FALLBACK_NODE_H_PCT;
      const newPos: NodePos = {
        x: clampPct(parentPos.x, 8, 92),
        y: clampPct(parentPos.y + parentHeightPct + 4, 6, 90),
      };

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
        // Lock side selection per edge. chooseSides() biases toward bottom→top
        // which keeps the child's anchor at its fixed top edge — that anchor
        // doesn't drift as the child grows during streaming.
        let sides = edgeSidesRef.current[e.id];
        if (!sides) {
          sides = chooseSides(fromCx, fromCy, toCx, toCy);
          edgeSidesRef.current[e.id] = sides;
        }
        const fromAnchor = anchorPos(fromCx, fromCy, NODE_W, fromH, sides.from);
        const toAnchor = anchorPos(toCx, toCy, NODE_W, toH, sides.to);
        return {
          id: e.id,
          d: edgePath(
            { ...fromAnchor, side: sides.from },
            { ...toAnchor, side: sides.to },
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
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth={2.25}
              strokeLinecap="round"
              initial={{ d: p.d, opacity: 0 }}
              animate={{ d: p.d, opacity: 0.95 }}
              transition={{
                opacity: { duration: 0.35, ease: "easeOut" },
                d: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
              }}
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

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import clsx from "clsx";
import type { Provider } from "../ProviderLogo";
import { DemoToolCall, type DemoToolBlock } from "../DemoToolCall";
import { ModelBadge } from "./ModelBadge";
import { useStreamingAssistant } from "./useStreamingAssistant";
import { NODE_W, type DemoNode, type NodePos } from "./types";

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

const BLOCK_TRANSITION = {
  height: { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const },
  opacity: { duration: 0.22, ease: "easeOut" as const },
};

export function DemoNodeCard({
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

  useEffect(() => {
    if (!isDraft) return;
    const t = requestAnimationFrame(() => draftRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [isDraft]);

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
      // Anchor the entrance scale to the top so the card appears to "drop in"
      // from the parent rather than balloon out from its center. Streaming
      // height growth then happens naturally below this fixed top edge.
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: NODE_W,
        zIndex: dragging ? 30 : hovered ? 20 : 10,
        cursor: dragging ? "grabbing" : "grab",
        touchAction: "none",
        transformOrigin: "50% 0%",
      }}
      className="absolute -translate-x-1/2 select-none"
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

        <AnimatePresence initial={false}>
          {hasStreamed && (
            <motion.div
              key="assistant-stream"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={BLOCK_TRANSITION}
              style={{ overflow: "hidden" }}
            >
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
                  // Each block fades + grows from 0 height so the card extends
                  // smoothly downward instead of snapping by a full row.
                  return (
                    <motion.div
                      key={block.id}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={BLOCK_TRANSITION}
                      style={{ overflow: "hidden" }}
                    >
                      <DemoToolCall block={effective} />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

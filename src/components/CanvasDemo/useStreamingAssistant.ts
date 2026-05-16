import { useEffect, useRef, useState } from "react";
import type { AssistantBlock } from "./types";

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

export function useStreamingAssistant(
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

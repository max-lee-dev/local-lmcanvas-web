import type { Side } from "./types";

// Pixel-space bezier that mirrors @xyflow/react's getBezierPath. Each endpoint
// has a side (top/right/bottom/left) and the control-point offset uses the same
// curvature math as xyflow so the edge curves smoothly regardless of the
// nodes' relative position.

export function anchorPos(
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

export function edgePath(
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

// Parent-child layout: children always sit below their parent in y-space, so we
// hard-bias toward bottom→top. The previous heuristic (|dx| vs |dy|) could flip
// to right→left mid-stream as a node's height grew, snapping the curve into a
// new shape. With sides pinned to vertical, the anchor is the top edge of the
// child — which sits at its fixed y-position regardless of measured height, so
// the endpoint doesn't drift as content streams in.
export function chooseSides(
  fromCx: number,
  fromCy: number,
  toCx: number,
  toCy: number,
): { from: Side; to: Side } {
  const dy = toCy - fromCy;
  const dx = toCx - fromCx;
  // Only fall back to horizontal when the targets are essentially at the same y.
  const horizontal = Math.abs(dx) > Math.abs(dy) * 2;
  if (horizontal) {
    return dx > 0
      ? { from: "right", to: "left" }
      : { from: "left", to: "right" };
  }
  return dy > 0 ? { from: "bottom", to: "top" } : { from: "top", to: "bottom" };
}

import type { Provider } from "../ProviderLogo";
import type { DemoToolBlock } from "../DemoToolCall";

export type AssistantBlock =
  | { kind: "text"; text: string }
  | { kind: "tool"; block: DemoToolBlock };

export type DemoNode = {
  id: string;
  x: number; // %
  y: number; // %
  provider: Provider;
  userText: string;
  assistant?: AssistantBlock[];
};

export type NodePos = { x: number; y: number };
export type DemoEdge = { id: string; from: string; to: string };
export type Side = "left" | "right" | "top" | "bottom";

export type FollowUpTemplate = Omit<DemoNode, "id" | "x" | "y">;

export const NODE_W = 340;
export const FALLBACK_NODE_H_PCT = 18;

export const DEMO_PROVIDERS: Provider[] = ["claude", "codex", "cursor"];
export const PROVIDER_LABELS: Record<Provider, string> = {
  claude: "Opus 4.7",
  codex: "GPT-5.3 Codex",
  cursor: "Auto",
};

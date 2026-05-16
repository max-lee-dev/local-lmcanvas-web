import type { DemoNode, FollowUpTemplate } from "./types";

export const ROOT: DemoNode = {
  id: "root",
  x: 55,
  y: 0,
  provider: "claude",
  userText:
    "users say avatars sometimes show the wrong person right after login — find it",
  assistant: [
    {
      kind: "text",
      text: "Two plausible suspects — the avatar fetch's cache key, or the axios auth interceptor. Locating both.",
    },
    {
      kind: "tool",
      block: {
        id: "r1",
        name: "Grep",
        summary: 'pattern: "useAvatar|/api/avatar"',
        input: { pattern: "useAvatar|/api/avatar", path: "src" },
        result:
          "src/hooks/useAvatar.ts:7: queryKey: ['avatar'],\nsrc/hooks/useAvatar.ts:8: queryFn: () => api.get('/api/avatar')\nsrc/lib/api.ts:14: api.interceptors.request.use((cfg) => { cfg.headers.Authorization = `Bearer ${getToken()}`; return cfg })",
      },
    },
    {
      kind: "tool",
      block: {
        id: "r2",
        name: "Read",
        summary: "src/hooks/useAvatar.ts",
        input: { file_path: "src/hooks/useAvatar.ts" },
        result:
          "export function useAvatar() {\n  return useQuery({\n    queryKey: ['avatar'],\n    queryFn: () => api.get('/api/avatar').then(r => r.data),\n    staleTime: 5 * 60_000,\n  })\n}",
      },
    },
    {
      kind: "text",
      text: "Both are real candidates. Chasing them in parallel — whichever repros is the real bug.",
    },
  ],
};

export const BRANCH_LEFT: DemoNode = {
  id: "branch-left",
  x: 47,
  y: 46,
  provider: "claude",
  userText: "go after the cache key first",
  assistant: [
    {
      kind: "text",
      text: "Trying to repro: sign in as A, sign out, sign in as B without a hard reload.",
    },
    {
      kind: "tool",
      block: {
        id: "l1",
        name: "Bash",
        summary: "playwright: login-swap repro",
        input: { command: "bunx playwright test e2e/avatar-swap.spec.ts" },
        result:
          "[chromium] avatar-swap › shows correct avatar after re-login\n  expected: 'B.png'\n  received: 'A.png'\n  1 failed, 0 passed",
      },
    },
    {
      kind: "text",
      text: "Reproduced. react-query keeps `['avatar']` cached across the logout because the key never changes — B's session reads A's cached body until staleTime expires.",
    },
    {
      kind: "tool",
      block: {
        id: "l2",
        name: "Edit",
        summary: "src/hooks/useAvatar.ts — scope key to userId",
        input: {
          file_path: "src/hooks/useAvatar.ts",
          old_string: "queryKey: ['avatar'],",
          new_string: "queryKey: ['avatar', userId],",
        },
        result: "1 replacement",
      },
    },
    {
      kind: "text",
      text: "Re-ran the spec — passes. This is the bug.",
    },
  ],
};

export const BRANCH: DemoNode = {
  id: "branch",
  x: 92,
  y: 46,
  provider: "codex",
  userText: "check the auth interceptor — could it be sending a stale token?",
  assistant: [
    {
      kind: "text",
      text: "Reading the client and tracing where the token comes from on each request.",
    },
    {
      kind: "tool",
      block: {
        id: "t1",
        name: "Read",
        summary: "src/lib/api.ts + src/lib/auth.ts",
        input: { file_path: "src/lib/api.ts" },
        result:
          "api.interceptors.request.use((cfg) => {\n  cfg.headers.Authorization = `Bearer ${getToken()}`\n  return cfg\n})\n\n// auth.ts\nexport const getToken = () => sessionStore.getState().accessToken",
      },
    },
    {
      kind: "tool",
      block: {
        id: "t2",
        name: "Grep",
        summary: 'pattern: "sessionStore.setState" — when does the token rotate?',
        input: { pattern: "sessionStore.setState", path: "src" },
        result:
          "src/auth/login.ts:22:  sessionStore.setState({ accessToken: tok })\nsrc/auth/logout.ts:8:  sessionStore.setState({ accessToken: null })",
      },
    },
    {
      kind: "text",
      text: "Interceptor reads `getToken()` fresh on every request from a zustand store that's synchronously updated on login/logout. No closure capture, no shared singleton. Not the bug here — whatever the cache branch finds is the real cause.",
    },
  ],
};

export const FOLLOW_UP_TEMPLATES: FollowUpTemplate[] = [
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

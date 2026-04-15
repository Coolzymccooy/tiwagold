import type {
  CopilotMessage,
  CopilotSession,
  CopilotSuggestedPrompt,
} from "@/types/copilot";

const messages: CopilotMessage[] = [
  {
    id: "msg_sys_0",
    role: "system",
    content:
      "You are Tiwa Gold Copilot — a focused XAU/USD trading assistant. Be concise, reference live setups when relevant, never give generic advice.",
    at: "2026-04-14T00:50:00.000Z",
    status: "complete",
  },
  {
    id: "msg_user_1",
    role: "user",
    content: "Walk me through the logic on the Sniper setup queued for Asian session.",
    at: "2026-04-14T00:51:12.000Z",
    status: "complete",
  },
  {
    id: "msg_assistant_1",
    role: "assistant",
    content:
      "trd_3 is a sniper-tier long at 2320.00. HTF trend on 4H is up; Asian session just finished a textbook accumulation — range compressed into the upper third, OB at 2314–2318 held twice. Score 95 reflects trend + structure + clean invalidation at 2310. Risk is 1R = 10 points; TP1 at 2340 gives 2R.",
    at: "2026-04-14T00:51:35.000Z",
    status: "complete",
    citations: [{ label: "trd_3 setup", tradeId: "trd_3" }],
  },
];

export const MOCK_COPILOT_SESSION: CopilotSession = {
  id: "cps_session_1",
  title: "Asian session sniper review",
  createdAt: "2026-04-14T00:50:00.000Z",
  updatedAt: "2026-04-14T00:51:35.000Z",
  messages,
};

export const MOCK_COPILOT_SUGGESTED_PROMPTS: CopilotSuggestedPrompt[] = [
  {
    kind: "trade_review",
    label: "Review my active setups",
    prompt: "Review every active XAU/USD setup and flag the weakest thesis.",
  },
  {
    kind: "macro_brief",
    label: "Macro brief for today",
    prompt: "Give me a 60-second macro brief for gold today, ranked by impact.",
  },
  {
    kind: "session_plan",
    label: "Plan the next session",
    prompt: "Build a session plan for the upcoming London open on XAU/USD.",
  },
  {
    kind: "risk_check",
    label: "Check my risk exposure",
    prompt: "Check my current risk exposure and flag anything above plan.",
  },
];

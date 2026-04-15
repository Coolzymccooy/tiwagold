import type {
  CopilotMessage,
  CopilotSession,
  CopilotSuggestedPrompt,
} from "@/types/copilot";

import { toCopilotView } from "../selectors";

function localIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
}

function makeMessage(overrides: Partial<CopilotMessage> = {}): CopilotMessage {
  const base: CopilotMessage = {
    id: "msg_base",
    role: "assistant",
    content: "Gold is consolidating near 2345.",
    at: localIso(2026, 4, 14, 10, 30),
    status: "complete",
  };
  return { ...base, ...overrides };
}

function makeSession(
  overrides: Partial<CopilotSession> = {},
): CopilotSession {
  const base: CopilotSession = {
    id: "cop_session_base",
    title: "NY open plan",
    createdAt: localIso(2026, 4, 14, 9, 0),
    updatedAt: localIso(2026, 4, 14, 10, 30),
    messages: [],
  };
  return { ...base, ...overrides };
}

describe("copilot selectors — toCopilotView base shape", () => {
  it("returns undefined when session is undefined", () => {
    expect(toCopilotView(undefined, undefined)).toBeUndefined();
  });

  it("returns undefined even when prompts are provided but session is not", () => {
    const prompts: CopilotSuggestedPrompt[] = [
      { kind: "trade_review", label: "Review", prompt: "Review my last trade" },
    ];
    expect(toCopilotView(undefined, prompts)).toBeUndefined();
  });

  it("maps sessionId, title, and uses the hardcoded subtitle", () => {
    const view = toCopilotView(
      makeSession({ id: "cop_42", title: "London recap" }),
      undefined,
    );
    expect(view?.sessionId).toBe("cop_42");
    expect(view?.title).toBe("London recap");
    expect(view?.subtitle).toBe("Focused XAU/USD assistant");
  });

  it("defaults suggestedPrompts to empty array when prompts is undefined", () => {
    const view = toCopilotView(makeSession(), undefined);
    expect(view?.suggestedPrompts).toEqual([]);
  });

  it("sets hasMessages=false when there are no visible messages", () => {
    const view = toCopilotView(makeSession({ messages: [] }), []);
    expect(view?.hasMessages).toBe(false);
  });

  it("sets hasMessages=true when at least one non-system message exists", () => {
    const view = toCopilotView(
      makeSession({
        messages: [makeMessage({ id: "m1", role: "assistant" })],
      }),
      undefined,
    );
    expect(view?.hasMessages).toBe(true);
  });
});

describe("copilot selectors — message filtering and ordering", () => {
  it("filters out system messages from the mapped rows", () => {
    const view = toCopilotView(
      makeSession({
        messages: [
          makeMessage({ id: "sys1", role: "system", content: "you are Tiwa" }),
          makeMessage({ id: "u1", role: "user", content: "brief me" }),
          makeMessage({ id: "a1", role: "assistant", content: "here" }),
        ],
      }),
      undefined,
    );
    expect(view?.messages.map((m) => m.id)).toEqual(["u1", "a1"]);
    expect(view?.hasMessages).toBe(true);
  });

  it("hasMessages is false when the only messages are system messages", () => {
    const view = toCopilotView(
      makeSession({
        messages: [
          makeMessage({ id: "sys1", role: "system" }),
          makeMessage({ id: "sys2", role: "system" }),
        ],
      }),
      undefined,
    );
    expect(view?.messages).toEqual([]);
    expect(view?.hasMessages).toBe(false);
  });

  it("preserves the original order of non-system messages", () => {
    const view = toCopilotView(
      makeSession({
        messages: [
          makeMessage({ id: "u1", role: "user" }),
          makeMessage({ id: "sys1", role: "system" }),
          makeMessage({ id: "a1", role: "assistant" }),
          makeMessage({ id: "u2", role: "user" }),
        ],
      }),
      undefined,
    );
    expect(view?.messages.map((m) => m.id)).toEqual(["u1", "a1", "u2"]);
  });
});

describe("copilot selectors — message row mapping", () => {
  it("maps user messages as isUser=true with accent tone", () => {
    const view = toCopilotView(
      makeSession({
        messages: [makeMessage({ id: "u1", role: "user" })],
      }),
      undefined,
    );
    const row = view?.messages[0];
    expect(row?.isUser).toBe(true);
    expect(row?.isAssistant).toBe(false);
    expect(row?.isSystem).toBe(false);
    expect(row?.tone).toBe("accent");
  });

  it("maps assistant messages as isAssistant=true with primary tone", () => {
    const view = toCopilotView(
      makeSession({
        messages: [makeMessage({ id: "a1", role: "assistant" })],
      }),
      undefined,
    );
    const row = view?.messages[0];
    expect(row?.isAssistant).toBe(true);
    expect(row?.isUser).toBe(false);
    expect(row?.isSystem).toBe(false);
    expect(row?.tone).toBe("primary");
  });

  it("passes through id, content, and status verbatim", () => {
    const view = toCopilotView(
      makeSession({
        messages: [
          makeMessage({
            id: "a7",
            role: "assistant",
            content: "Watch 2350 for a pullback.",
            status: "streaming",
          }),
        ],
      }),
      undefined,
    );
    const row = view?.messages[0];
    expect(row?.id).toBe("a7");
    expect(row?.content).toBe("Watch 2350 for a pullback.");
    expect(row?.status).toBe("streaming");
  });

  it("defaults citationLabels to empty array when citations are undefined", () => {
    const view = toCopilotView(
      makeSession({
        messages: [
          makeMessage({ id: "a1", role: "assistant", citations: undefined }),
        ],
      }),
      undefined,
    );
    expect(view?.messages[0]?.citationLabels).toEqual([]);
  });

  it("maps citations to their labels in order", () => {
    const view = toCopilotView(
      makeSession({
        messages: [
          makeMessage({
            id: "a1",
            role: "assistant",
            citations: [
              { label: "Trade #42", tradeId: "trd_42" },
              { label: "NFP release", url: "https://example.com" },
            ],
          }),
        ],
      }),
      undefined,
    );
    expect(view?.messages[0]?.citationLabels).toEqual([
      "Trade #42",
      "NFP release",
    ]);
  });
});

describe("copilot selectors — timestamp formatting", () => {
  it("formats the timestamp as zero-padded HH:MM in local time", () => {
    const view = toCopilotView(
      makeSession({
        messages: [
          makeMessage({ id: "a1", at: localIso(2026, 4, 14, 9, 5) }),
        ],
      }),
      undefined,
    );
    expect(view?.messages[0]?.timestampLabel).toBe("09:05");
  });

  it("pads both single-digit hour and single-digit minute", () => {
    const view = toCopilotView(
      makeSession({
        messages: [
          makeMessage({ id: "a1", at: localIso(2026, 4, 14, 0, 0) }),
        ],
      }),
      undefined,
    );
    expect(view?.messages[0]?.timestampLabel).toBe("00:00");
  });

  it("returns empty string for an invalid ISO input", () => {
    const view = toCopilotView(
      makeSession({
        messages: [makeMessage({ id: "a1", at: "not-a-date" })],
      }),
      undefined,
    );
    expect(view?.messages[0]?.timestampLabel).toBe("");
  });
});

describe("copilot selectors — suggested prompts", () => {
  it("maps each prompt through kind/label/prompt passthrough", () => {
    const prompts: CopilotSuggestedPrompt[] = [
      {
        kind: "trade_review",
        label: "Review last trade",
        prompt: "Review my last closed trade",
      },
      {
        kind: "macro_brief",
        label: "Macro brief",
        prompt: "Summarise macro for today",
      },
    ];
    const view = toCopilotView(makeSession(), prompts);
    expect(view?.suggestedPrompts).toEqual([
      {
        kind: "trade_review",
        label: "Review last trade",
        prompt: "Review my last closed trade",
      },
      {
        kind: "macro_brief",
        label: "Macro brief",
        prompt: "Summarise macro for today",
      },
    ]);
  });

  it("preserves prompt order", () => {
    const prompts: CopilotSuggestedPrompt[] = [
      { kind: "risk_check", label: "Risk", prompt: "Check risk" },
      { kind: "session_plan", label: "Plan", prompt: "Plan session" },
      { kind: "trade_review", label: "Review", prompt: "Review" },
    ];
    const view = toCopilotView(makeSession(), prompts);
    expect(view?.suggestedPrompts.map((p) => p.kind)).toEqual([
      "risk_check",
      "session_plan",
      "trade_review",
    ]);
  });
});

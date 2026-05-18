/* eslint-disable import/first -- jest.mock blocks must precede SUT imports so the mocked bindings are in place when the SUT is loaded. */
const mockAuthFetch = jest.fn();
const mockIsLiveBackendEnabled = jest.fn();
jest.mock("@/services/liveBackend", () => ({
  __esModule: true,
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
  isLiveBackendEnabled: () => mockIsLiveBackendEnabled(),
}));

import {
  fetchCopilotConversationsLive,
  fetchCopilotPromptsLive,
  fetchCopilotSessionLive,
  sendCopilotChatLive,
} from "@/services/copilot";
import { mapAgentRunDto } from "@/mappers/copilot";

beforeEach(() => {
  mockAuthFetch.mockReset();
  mockIsLiveBackendEnabled.mockReset();
});

describe("fetchCopilotSessionLive", () => {
  test("GETs /copilot/sessions/:id with the bearer token", async () => {
    const session = {
      id: "cps_main_u1",
      title: "Conversation with Tiwa",
      createdAt: "2026-05-12T00:00:00.000Z",
      updatedAt: "2026-05-12T00:01:00.000Z",
      messages: [],
    };
    mockAuthFetch.mockResolvedValueOnce(session);

    const result = await fetchCopilotSessionLive("cps_main_u1", "ACCESS");

    expect(result).toEqual(session);
    expect(mockAuthFetch).toHaveBeenCalledWith("/copilot/sessions/cps_main_u1", {
      method: "GET",
      bearerToken: "ACCESS",
    });
  });

  test("URL-encodes the session id to keep slashes/spaces safe", async () => {
    mockAuthFetch.mockResolvedValueOnce({});
    await fetchCopilotSessionLive("session/with spaces", "ACCESS");
    const callPath = mockAuthFetch.mock.calls[0][0] as string;
    expect(callPath).toBe("/copilot/sessions/session%2Fwith%20spaces");
  });

  test("propagates auth errors from the underlying transport", async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error("401 unauthorized"));
    await expect(
      fetchCopilotSessionLive("cps_main_u1", "ACCESS"),
    ).rejects.toThrow("401 unauthorized");
  });
});

describe("fetchCopilotConversationsLive", () => {
  test("GETs /copilot/conversations and returns the array shape", async () => {
    const list = [
      {
        id: "cps_main_u1",
        title: "Conversation with Tiwa",
        createdAt: "2026-05-12T00:00:00.000Z",
        updatedAt: "2026-05-12T00:01:00.000Z",
        messageCount: 4,
        previewSnippet: "Gold testing 2305…",
      },
    ];
    mockAuthFetch.mockResolvedValueOnce(list);

    const result = await fetchCopilotConversationsLive("ACCESS");

    expect(result).toEqual(list);
    expect(mockAuthFetch).toHaveBeenCalledWith("/copilot/conversations", {
      method: "GET",
      bearerToken: "ACCESS",
    });
  });
});

describe("fetchCopilotPromptsLive", () => {
  test("GETs /copilot/suggested-prompts with bearer token", async () => {
    const prompts = [
      { kind: "macro_brief", label: "Macro brief", prompt: "What's the macro setup?" },
    ];
    mockAuthFetch.mockResolvedValueOnce(prompts);

    const result = await fetchCopilotPromptsLive("ACCESS");

    expect(result).toEqual(prompts);
    expect(mockAuthFetch).toHaveBeenCalledWith("/copilot/suggested-prompts", {
      method: "GET",
      bearerToken: "ACCESS",
    });
  });
});

describe("sendCopilotChatLive", () => {
  test("POSTs the minimum payload when only prompt is supplied", async () => {
    const chunk = {
      conversationId: "cps_main_u1",
      messageId: "msg_a123",
      deltaText: "Patience — DXY still ranging.",
      status: "complete" as const,
    };
    mockAuthFetch.mockResolvedValueOnce(chunk);

    const result = await sendCopilotChatLive({ prompt: "What now?" }, "ACCESS");

    expect(result).toEqual(chunk);
    expect(mockAuthFetch).toHaveBeenCalledWith("/copilot/chat", {
      method: "POST",
      bearerToken: "ACCESS",
      body: { prompt: "What now?" },
      extraHeaders: { Accept: "application/vnd.tiwagold.v2+json" },
    });
  });

  test("forwards conversationId and context when present", async () => {
    mockAuthFetch.mockResolvedValueOnce({
      conversationId: "cps_main_u1",
      messageId: "msg_a456",
      deltaText: "ok",
      status: "complete",
    });

    await sendCopilotChatLive(
      {
        prompt: "Review trd_42",
        conversationId: "cps_main_u1",
        context: { tradeId: "trd_42" },
      },
      "ACCESS",
    );

    expect(mockAuthFetch).toHaveBeenCalledWith("/copilot/chat", {
      method: "POST",
      bearerToken: "ACCESS",
      body: {
        prompt: "Review trd_42",
        conversationId: "cps_main_u1",
        context: { tradeId: "trd_42" },
      },
      extraHeaders: { Accept: "application/vnd.tiwagold.v2+json" },
    });
  });

  test("propagates transport errors so React Query can surface them", async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error("500 internal"));
    await expect(
      sendCopilotChatLive({ prompt: "hi" }, "ACCESS"),
    ).rejects.toThrow("500 internal");
  });

  test("includes v2 Accept header in the extraHeaders", async () => {
    mockAuthFetch.mockResolvedValueOnce({
      conversationId: "cps_1",
      messageId: "msg_1",
      deltaText: "response",
      status: "complete",
    });

    await sendCopilotChatLive({ prompt: "test" }, "ACCESS");

    expect(mockAuthFetch).toHaveBeenCalledWith(
      "/copilot/chat",
      expect.objectContaining({
        extraHeaders: { Accept: "application/vnd.tiwagold.v2+json" },
      }),
    );
  });
});

describe("mapAgentRunDto", () => {
  test("normalises a completed run with one agent", () => {
    const dto = {
      id: "run_abc123",
      status: "completed",
      failureReason: null,
      channel: "copilot",
      prompt: "Analyse the setup",
      startedAt: "2026-05-18T10:00:00.000Z",
      completedAt: "2026-05-18T10:05:30.000Z",
      synthesisReport: "Gold is holding 2320 support, breakout risk at 2330.",
      agents: [
        {
          taskIndex: 0,
          name: "market_analyzer",
          status: "completed",
          summary: "Analysed the setup",
          durationMs: 5000,
          iterations: 2,
          apiCalls: 3,
          milestones: ["request_sent", "data_received", "analysis_complete"],
          resultText: "Setup intact",
          error: null,
        },
      ],
    };

    const result = mapAgentRunDto(dto);

    expect(result).toEqual({
      id: "run_abc123",
      status: "completed",
      failureReason: undefined,
      channel: "copilot",
      prompt: "Analyse the setup",
      startedAt: "2026-05-18T10:00:00.000Z",
      completedAt: "2026-05-18T10:05:30.000Z",
      synthesisReport: "Gold is holding 2320 support, breakout risk at 2330.",
      agents: [
        {
          taskIndex: 0,
          name: "market_analyzer",
          status: "completed",
          summary: "Analysed the setup",
          durationMs: 5000,
          iterations: 2,
          apiCalls: 3,
          milestones: ["request_sent", "data_received", "analysis_complete"],
          resultText: "Setup intact",
          error: undefined,
        },
      ],
    });
  });

  test("treats missing fields and null fields as undefined on the domain side", () => {
    const dto = {
      id: "run_def456",
      status: "running",
      channel: "mcp",
      prompt: "Check exposure",
      startedAt: "2026-05-18T11:00:00.000Z",
      agents: [
        {
          taskIndex: 0,
          name: "risk_checker",
          status: "running",
          milestones: [],
        },
      ],
    };

    const result = mapAgentRunDto(dto);

    expect(result.failureReason).toBeUndefined();
    expect(result.completedAt).toBeUndefined();
    expect(result.synthesisReport).toBeUndefined();
    const agent = result.agents[0];
    if (!agent) throw new Error("expected at least one agent");
    expect(agent.summary).toBeUndefined();
    expect(agent.durationMs).toBeUndefined();
    expect(agent.iterations).toBeUndefined();
    expect(agent.apiCalls).toBeUndefined();
    expect(agent.resultText).toBeUndefined();
    expect(agent.error).toBeUndefined();
  });
});

import { render } from "@testing-library/react-native";
import type { CopilotAgentRun } from "@/types/copilot";
import { AgentRunCard } from "../primitives/AgentRunCard";

describe("AgentRunCard", () => {
  const mockTask = {
    taskIndex: 0,
    name: "Analyze Market",
    status: "completed" as const,
    milestones: ["Data fetched", "Analysis complete"],
    durationMs: 2500,
  };

  const baseRun: CopilotAgentRun = {
    id: "run-1",
    status: "completed",
    channel: "copilot",
    prompt: "What is the market sentiment today?",
    startedAt: "2026-05-18T10:00:00Z",
    completedAt: "2026-05-18T10:01:00Z",
    agents: [mockTask],
    synthesisReport: "Market sentiment is bullish based on recent trends.",
  };

  it("renders prompt text", () => {
    const { getByText } = render(<AgentRunCard run={baseRun} />);
    expect(getByText(baseRun.prompt)).toBeTruthy();
  });

  it("renders all agent task rows", () => {
    const runWithTasks: CopilotAgentRun = {
      ...baseRun,
      agents: [
        { ...mockTask, taskIndex: 0, name: "Task 1" },
        { ...mockTask, taskIndex: 1, name: "Task 2" },
      ],
    };
    const { getByText } = render(<AgentRunCard run={runWithTasks} />);
    expect(getByText("Task 1")).toBeTruthy();
    expect(getByText("Task 2")).toBeTruthy();
  });

  it("shows synthesis report when completed", () => {
    const { getByText } = render(<AgentRunCard run={baseRun} />);
    expect(getByText("SYNTHESIS REPORT")).toBeTruthy();
    expect(getByText(baseRun.synthesisReport!)).toBeTruthy();
  });

  it("shows compiling message when synthesisReport is not available", () => {
    const runWithoutReport: CopilotAgentRun = {
      ...baseRun,
      synthesisReport: undefined,
    };
    const { getByText } = render(<AgentRunCard run={runWithoutReport} />);
    expect(getByText("Compiling report…")).toBeTruthy();
  });

  it("shows failure banner when status is failed", () => {
    const failedRun: CopilotAgentRun = {
      ...baseRun,
      status: "failed",
      failureReason: "Market data unavailable",
    };
    const { getByText } = render(<AgentRunCard run={failedRun} />);
    expect(getByText("Market data unavailable")).toBeTruthy();
  });

  it("shows default failure message when failureReason is not provided", () => {
    const failedRun: CopilotAgentRun = {
      ...baseRun,
      status: "failed",
      failureReason: undefined,
    };
    const { getByText } = render(<AgentRunCard run={failedRun} />);
    expect(getByText("Agent run failed")).toBeTruthy();
  });

  it("does not render synthesis section when run is failed", () => {
    const failedRun: CopilotAgentRun = {
      ...baseRun,
      status: "failed",
      synthesisReport: "This should not appear",
    };
    const { queryByText } = render(<AgentRunCard run={failedRun} />);
    expect(queryByText("SYNTHESIS REPORT")).toBeNull();
    expect(queryByText("This should not appear")).toBeNull();
  });

  it("renders empty agent list without crashing", () => {
    const runWithoutAgents: CopilotAgentRun = {
      ...baseRun,
      agents: [],
    };
    const { getByText } = render(<AgentRunCard run={runWithoutAgents} />);
    expect(getByText(baseRun.prompt)).toBeTruthy();
  });
});

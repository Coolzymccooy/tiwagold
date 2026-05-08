/* eslint-disable import/first -- jest.mock blocks must precede SUT imports so the mocked bindings are in place when the SUT is loaded. */
const mockMutateAsync = jest.fn();
const mockUseRotateBridgeToken = jest.fn(() => ({
  mutateAsync: mockMutateAsync,
  isPending: false,
}));

jest.mock("@/services/broker", () => ({
  __esModule: true,
  useRotateBridgeToken: () => mockUseRotateBridgeToken(),
}));

import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import { RotateBridgeTokenButton } from "@/features/settings/components/RotateBridgeTokenButton";

const mockedClipboard = Clipboard as jest.Mocked<typeof Clipboard>;

interface AlertButton {
  text?: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

beforeEach(() => {
  mockMutateAsync.mockReset();
  mockUseRotateBridgeToken.mockImplementation(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }));
  mockedClipboard.setStringAsync.mockReset();
  mockedClipboard.setStringAsync.mockResolvedValue(true);
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("RotateBridgeTokenButton", () => {
  test("renders the rotate label by default", () => {
    const { getByText } = render(<RotateBridgeTokenButton />);
    expect(getByText("Rotate bridge token")).toBeTruthy();
  });

  test("press shows a destructive confirm Alert", () => {
    const { getByText } = render(<RotateBridgeTokenButton />);
    fireEvent.press(getByText("Rotate bridge token"));
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const [title, , buttons] = (Alert.alert as jest.Mock).mock.calls[0] as [
      string,
      string,
      AlertButton[],
    ];
    expect(title).toMatch(/rotate bridge token/i);
    const rotate = buttons.find((b) => b.text === "Rotate");
    expect(rotate?.style).toBe("destructive");
  });

  test("confirming the Alert calls mutateAsync and reveals the token", async () => {
    mockMutateAsync.mockResolvedValueOnce({ token: "a".repeat(64) });
    const { getByText, queryByText } = render(<RotateBridgeTokenButton />);
    fireEvent.press(getByText("Rotate bridge token"));
    const buttons = ((Alert.alert as jest.Mock).mock.calls[0] as [
      string,
      string,
      AlertButton[],
    ])[2];
    const rotate = buttons.find((b) => b.text === "Rotate");
    expect(rotate).toBeDefined();
    await rotate!.onPress!();

    await waitFor(() => {
      expect(queryByText("New bridge token")).toBeTruthy();
    });
    expect(mockMutateAsync).toHaveBeenCalledTimes(1);
  });

  test("rotation failure surfaces an error Alert", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("503 unavailable"));
    const { getByText } = render(<RotateBridgeTokenButton />);
    fireEvent.press(getByText("Rotate bridge token"));
    const firstButtons = ((Alert.alert as jest.Mock).mock.calls[0] as [
      string,
      string,
      AlertButton[],
    ])[2];
    const rotate = firstButtons.find((b) => b.text === "Rotate");
    await rotate!.onPress!();
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledTimes(2);
    });
    const [errorTitle, errorBody] = (Alert.alert as jest.Mock).mock.calls[1] as [
      string,
      string,
    ];
    expect(errorTitle).toBe("Rotation failed");
    expect(errorBody).toContain("503");
  });

  test("Copy button writes the token to the system clipboard", async () => {
    const token = "b".repeat(64);
    mockMutateAsync.mockResolvedValueOnce({ token });
    const { getByText } = render(<RotateBridgeTokenButton />);
    fireEvent.press(getByText("Rotate bridge token"));
    const rotate = ((Alert.alert as jest.Mock).mock.calls[0] as [
      string,
      string,
      AlertButton[],
    ])[2].find((b) => b.text === "Rotate");
    await rotate!.onPress!();
    await waitFor(() => expect(getByText("Copy")).toBeTruthy());

    fireEvent.press(getByText("Copy"));

    await waitFor(() => {
      expect(mockedClipboard.setStringAsync).toHaveBeenCalledWith(token);
      expect(getByText("Copied")).toBeTruthy();
    });
  });

  test("Done button dismisses the modal", async () => {
    mockMutateAsync.mockResolvedValueOnce({ token: "c".repeat(64) });
    const { getByText, queryByText } = render(<RotateBridgeTokenButton />);
    fireEvent.press(getByText("Rotate bridge token"));
    const rotate = ((Alert.alert as jest.Mock).mock.calls[0] as [
      string,
      string,
      AlertButton[],
    ])[2].find((b) => b.text === "Rotate");
    await rotate!.onPress!();
    await waitFor(() => expect(getByText("New bridge token")).toBeTruthy());

    fireEvent.press(getByText("Done"));
    await waitFor(() => {
      expect(queryByText("New bridge token")).toBeNull();
    });
  });

  test("button is disabled while a rotation is in-flight", () => {
    mockUseRotateBridgeToken.mockImplementation(() => ({
      mutateAsync: mockMutateAsync,
      isPending: true,
    }));
    const { getByText } = render(<RotateBridgeTokenButton />);
    expect(getByText("Rotating…")).toBeTruthy();
    fireEvent.press(getByText("Rotating…"));
    // disabled prop blocks onPress, so Alert never fires.
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});

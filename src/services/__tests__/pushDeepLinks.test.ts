import { handleNotificationResponse } from "@/services/pushDeepLinks";

function makeResponse(data: unknown): Parameters<typeof handleNotificationResponse>[0] {
  return {
    notification: {
      request: {
        content: { data },
      },
    },
  };
}

describe("handleNotificationResponse", () => {
  test("type=pending_trade navigates to /(tabs)/pending", () => {
    const navigate = jest.fn();
    const route = handleNotificationResponse(
      makeResponse({ type: "pending_trade", tradeId: "trade_1" }),
      { navigate },
    );
    expect(route).toBe("/(tabs)/pending");
    expect(navigate).toHaveBeenCalledWith("/(tabs)/pending");
  });

  test("ignores unknown notification types", () => {
    const navigate = jest.fn();
    const route = handleNotificationResponse(
      makeResponse({ type: "marketing_blast" }),
      { navigate },
    );
    expect(route).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  test("handles missing data field gracefully", () => {
    const navigate = jest.fn();
    expect(
      handleNotificationResponse(makeResponse(undefined), { navigate }),
    ).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  test("handles non-object data field gracefully", () => {
    const navigate = jest.fn();
    expect(
      handleNotificationResponse(makeResponse("not an object"), { navigate }),
    ).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });

  test("handles missing nested fields without throwing", () => {
    const navigate = jest.fn();
    expect(
      handleNotificationResponse(
        // intentionally malformed — guard against bad payloads at runtime
        { notification: { request: { content: {} } } },
        { navigate },
      ),
    ).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });
});

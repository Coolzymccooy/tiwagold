/* eslint-disable import/first -- jest.mock blocks must precede SUT imports so the mocked bindings are in place when the SUT is loaded. */
type ExtraShape = {
  eas?: { projectId?: unknown };
};

const mutableExtra: { value: ExtraShape } = {
  value: { eas: { projectId: "proj-test" } },
};

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: mutableExtra.value };
    },
  },
}));

const mockAuthFetch = jest.fn();
jest.mock("@/services/liveBackend", () => ({
  __esModule: true,
  authFetch: (...args: unknown[]) => mockAuthFetch(...args),
}));

import * as Notifications from "expo-notifications";
import {
  ensurePushPermission,
  getExpoPushToken,
  registerExpoPushTokenWithCloud,
  clearExpoPushTokenFromCloud,
} from "@/services/expoPushToken";

const mockedNotifications = Notifications as jest.Mocked<typeof Notifications>;

beforeEach(() => {
  mockAuthFetch.mockReset();
  mockedNotifications.getPermissionsAsync.mockReset();
  mockedNotifications.requestPermissionsAsync.mockReset();
  mockedNotifications.getExpoPushTokenAsync.mockReset();
  mutableExtra.value = { eas: { projectId: "proj-test" } };
});

describe("ensurePushPermission", () => {
  test("returns true when permission already granted", async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);
    expect(await ensurePushPermission()).toBe(true);
    expect(mockedNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test("requests permission when not already granted", async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: true,
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);
    mockedNotifications.requestPermissionsAsync.mockResolvedValue({
      granted: true,
    } as Awaited<ReturnType<typeof Notifications.requestPermissionsAsync>>);
    expect(await ensurePushPermission()).toBe(true);
    expect(mockedNotifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  test("returns false when user denied + canAskAgain=false", async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);
    expect(await ensurePushPermission()).toBe(false);
    expect(mockedNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  test("returns false when getPermissionsAsync throws", async () => {
    mockedNotifications.getPermissionsAsync.mockRejectedValue(
      new Error("native crash"),
    );
    expect(await ensurePushPermission()).toBe(false);
  });
});

describe("getExpoPushToken", () => {
  test("returns the token from Expo", async () => {
    mockedNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: "ExponentPushToken[abc]",
    } as Awaited<ReturnType<typeof Notifications.getExpoPushTokenAsync>>);
    expect(await getExpoPushToken()).toBe("ExponentPushToken[abc]");
    expect(mockedNotifications.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: "proj-test",
    });
  });

  test("returns null when projectId is not configured", async () => {
    mutableExtra.value = {};
    expect(await getExpoPushToken()).toBeNull();
    expect(mockedNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  test("returns null when Expo throws", async () => {
    mockedNotifications.getExpoPushTokenAsync.mockRejectedValue(
      new Error("FCM unavailable"),
    );
    expect(await getExpoPushToken()).toBeNull();
  });
});

describe("registerExpoPushTokenWithCloud", () => {
  function setHappyPath(): void {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);
    mockedNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: "ExponentPushToken[ok]",
    } as Awaited<ReturnType<typeof Notifications.getExpoPushTokenAsync>>);
  }

  test("happy path: permission + token + PUT to /me/expo-push-token", async () => {
    setHappyPath();
    mockAuthFetch.mockResolvedValueOnce({ ok: true });

    const result = await registerExpoPushTokenWithCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(true);
    expect(result.token).toBe("ExponentPushToken[ok]");
    expect(mockAuthFetch).toHaveBeenCalledWith("/me/expo-push-token", {
      method: "PUT",
      bearerToken: "ACCESS",
      body: { token: "ExponentPushToken[ok]" },
    });
  });

  test("permission denied → returns reason without hitting the cloud", async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);

    const result = await registerExpoPushTokenWithCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("permission_denied");
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("missing projectId → returns no_project_id", async () => {
    mutableExtra.value = {};
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);

    const result = await registerExpoPushTokenWithCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("no_project_id");
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("failed token fetch → fetch_token_failed", async () => {
    mockedNotifications.getPermissionsAsync.mockResolvedValue({
      granted: true,
      canAskAgain: true,
    } as Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>);
    mockedNotifications.getExpoPushTokenAsync.mockRejectedValue(
      new Error("FCM not configured"),
    );

    const result = await registerExpoPushTokenWithCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("fetch_token_failed");
    expect(mockAuthFetch).not.toHaveBeenCalled();
  });

  test("cloud PUT failure → cloud_register_failed with error message", async () => {
    setHappyPath();
    mockAuthFetch.mockRejectedValueOnce(new Error("503 Service Unavailable"));

    const result = await registerExpoPushTokenWithCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("cloud_register_failed");
    expect(result.error).toContain("503");
  });

  test("never throws — caller can fire-and-forget", async () => {
    mockedNotifications.getPermissionsAsync.mockRejectedValue(new Error("boom"));
    await expect(
      registerExpoPushTokenWithCloud({ bearerToken: "ACCESS" }),
    ).resolves.toMatchObject({ ok: false });
  });
});

describe("clearExpoPushTokenFromCloud", () => {
  test("PUTs token=null on sign-out", async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true });

    const result = await clearExpoPushTokenFromCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(true);
    expect(mockAuthFetch).toHaveBeenCalledWith("/me/expo-push-token", {
      method: "PUT",
      bearerToken: "ACCESS",
      body: { token: null },
    });
  });

  test("network failure → returns ok=false without throwing", async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error("ECONNRESET"));
    const result = await clearExpoPushTokenFromCloud({ bearerToken: "ACCESS" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("ECONNRESET");
  });
});

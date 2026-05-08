/**
 * Push notification deep links — Phase N3.
 *
 * The cloud's `notifyFanOutRecipients` sends pushes with
 * `data: { type: "pending_trade", tradeId }`. When the user taps the
 * notification we open the Pending Signals tab so they land on their queue
 * instead of wherever they last left off in the app.
 *
 * The handler is split into a pure function so it can be unit-tested without
 * spinning up Expo's notification listener machinery.
 */

import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { router as expoRouter } from "expo-router";

interface NotificationResponseLike {
  notification: {
    request: {
      content: {
        data?: unknown;
      };
    };
  };
}

interface RouterLike {
  navigate: (path: string) => void;
}

/**
 * Pure handler — given a notification response payload and a router,
 * navigates to the right destination. Returns the chosen route or `null`
 * when the payload doesn't match a known deep-link shape (so callers can
 * decide whether to log).
 */
export function handleNotificationResponse(
  response: NotificationResponseLike,
  router: RouterLike,
): string | null {
  const data = response.notification?.request?.content?.data;
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  if (record.type === "pending_trade") {
    const route = "/(tabs)/pending";
    router.navigate(route);
    return route;
  }
  return null;
}

/**
 * Mounts the Expo notification-response listener for the lifetime of the
 * caller component. Designed to be invoked once at the app root.
 */
export function usePushNotificationDeepLinks(): void {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response as NotificationResponseLike, {
          navigate: (path) => expoRouter.navigate(path as never),
        });
      },
    );
    return () => subscription.remove();
  }, []);
}

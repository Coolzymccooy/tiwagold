import { Platform, ToastAndroid } from "react-native";

/**
 * Lightweight transient feedback. Uses the native Android toast (zero deps);
 * on iOS it is a no-op for now (callers should also surface durable state, e.g.
 * an error banner, so iOS users aren't left without feedback). Kept tiny on
 * purpose — the app has no toast/snackbar system yet, and approve/deny flows
 * need *some* "it's working / it worked" signal beyond the slide's pending label.
 */
export function showToast(message: string): void {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  }
}

import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import * as Updates from "expo-updates";

/**
 * Drives the in-app "Update ready — tap to restart" banner.
 *
 * On launch and whenever the app returns to the foreground, checks the EAS
 * update channel for a newer JS bundle (same runtime version). If one exists it
 * is downloaded in the background and `updateReady` flips true; the banner then
 * lets the user apply it immediately via `applyUpdate()` (Updates.reloadAsync).
 *
 * No-ops in dev / Expo Go (Updates.isEnabled === false) so local development is
 * unaffected. All failures are swallowed — update discovery is best-effort and
 * must never interrupt the app.
 */
export function useOtaUpdate(): {
  updateReady: boolean;
  applyUpdate: () => Promise<void>;
} {
  const [updateReady, setUpdateReady] = useState(false);
  const inFlight = useRef(false);

  const check = useCallback(async () => {
    if (__DEV__ || !Updates.isEnabled) return;
    if (inFlight.current || updateReady) return;
    inFlight.current = true;
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
        setUpdateReady(true);
      }
    } catch {
      // best-effort: network blips / no update / not enabled — ignore
    } finally {
      inFlight.current = false;
    }
  }, [updateReady]);

  useEffect(() => {
    void check();
    const sub = AppState.addEventListener("change", (status: AppStateStatus) => {
      if (status === "active") void check();
    });
    return () => sub.remove();
  }, [check]);

  const applyUpdate = useCallback(async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      // if reload fails the banner stays; user can retry / next launch applies it
    }
  }, []);

  return { updateReady, applyUpdate };
}

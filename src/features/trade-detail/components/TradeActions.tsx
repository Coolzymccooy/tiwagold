import { StyleSheet, View } from "react-native";
import { PressableScale, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { SignedIntentError } from "@/services/signedIntent";
import type { TradeDetailActionError } from "../hooks";
import type { TradeDetailView } from "../types";
import { SlideToExecute } from "./SlideToExecute";

export interface TradeActionsProps {
  view: TradeDetailView;
  approve: () => void;
  execute: () => void;
  cancel: () => void;
  isApproving: boolean;
  isExecuting: boolean;
  isCancelling: boolean;
  isRequestingIntent: boolean;
  actionError: TradeDetailActionError | null;
}

export function TradeActions(props: TradeActionsProps) {
  const {
    view,
    approve,
    execute,
    cancel,
    isApproving,
    isExecuting,
    isCancelling,
    isRequestingIntent,
    actionError,
  } = props;

  if (!view.canApprove && !view.canExecute && !view.canCancel) {
    return null;
  }

  const approvePending = isApproving || (isRequestingIntent && !isExecuting);
  const executePending = isExecuting || (isRequestingIntent && !isApproving);
  const errorMessage = actionError ? resolveActionErrorMessage(actionError) : null;

  return (
    <View style={styles.actions}>
      {view.canApprove ? (
        <SlideToExecute
          variant="approve"
          label={COPY.tradeDetail.slideToExecute.approveIdle}
          pendingLabel={COPY.tradeDetail.slideToExecute.pending}
          reducedMotionLabel={COPY.tradeDetail.slideToExecute.reducedMotionApprove}
          onConfirm={approve}
          pending={approvePending}
          disabled={isCancelling}
        />
      ) : null}
      {view.canExecute ? (
        <SlideToExecute
          variant="execute"
          label={COPY.tradeDetail.slideToExecute.executeIdle}
          pendingLabel={COPY.tradeDetail.slideToExecute.pending}
          reducedMotionLabel={COPY.tradeDetail.slideToExecute.reducedMotionExecute}
          onConfirm={execute}
          pending={executePending}
          disabled={isCancelling}
        />
      ) : null}
      {view.canCancel ? (
        <PressableScale
          accessibilityRole="button"
          onPress={cancel}
          disabled={isCancelling || isApproving || isExecuting || isRequestingIntent}
          style={styles.cancelBtn}
        >
          <Text variant="title" weight="semibold" align="center" tone="danger">
            {COPY.tradeDetail.actions.cancel}
          </Text>
        </PressableScale>
      ) : null}
      {errorMessage ? (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={styles.errorBanner}
        >
          <Text variant="body" tone="danger" align="center">
            {errorMessage}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function resolveActionErrorMessage(error: TradeDetailActionError): string {
  if (error instanceof SignedIntentError) {
    return COPY.tradeDetail.slideToExecute.intentError[error.code];
  }
  return error.message || COPY.tradeDetail.slideToExecute.error;
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
  },
  cancelBtn: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: "rgba(229,96,77,0.10)",
    borderColor: palette.status.danger,
  },
  errorBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.status.danger,
    backgroundColor: "rgba(229,96,77,0.08)",
  },
});

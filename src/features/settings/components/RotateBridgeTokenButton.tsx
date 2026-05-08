import { useCallback, useState } from "react";
import { Alert, Modal, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { KeyRound, X } from "lucide-react-native";
import { GlassCard, PressableScale, Text } from "@/design/primitives";
import { font, palette, radius, spacing } from "@/design/tokens";
import { useRotateBridgeToken } from "@/services/broker";

/**
 * Rotates the user's per-user MT5 bridge token via POST /me/bridge-token/rotate
 * and surfaces the new plaintext value in a one-time modal with a
 * copy-to-clipboard action.
 *
 * The cloud sha256-hashes tokens at rest, so the plaintext is shown ONCE per
 * rotation. Dismissing the modal clears the local state — the user can rotate
 * again to get a fresh one, but this exact value is gone from memory.
 */
export function RotateBridgeTokenButton() {
  const rotate = useRotateBridgeToken();
  const [revealedToken, setRevealedToken] = useState<string | null>(null);

  const handlePress = useCallback(() => {
    Alert.alert(
      "Rotate bridge token?",
      "This revokes your current bridge token. Your trading container will need to be re-provisioned with the new value. Tiwa will only display the new token once.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rotate",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await rotate.mutateAsync();
              setRevealedToken(result.token);
            } catch (err) {
              Alert.alert(
                "Rotation failed",
                (err as Error)?.message ?? "Unknown error",
              );
            }
          },
        },
      ],
    );
  }, [rotate]);

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel="Rotate bridge token"
        onPress={handlePress}
        disabled={rotate.isPending}
        style={[styles.button, rotate.isPending && styles.buttonDisabled]}
      >
        <KeyRound size={16} color={palette.fg.muted} />
        <Text variant="body" weight="semibold" style={styles.buttonText}>
          {rotate.isPending ? "Rotating…" : "Rotate bridge token"}
        </Text>
      </PressableScale>
      <RevealedTokenModal
        token={revealedToken}
        onDismiss={() => setRevealedToken(null)}
      />
    </>
  );
}

interface RevealedTokenModalProps {
  token: string | null;
  onDismiss: () => void;
}

function RevealedTokenModal({ token, onDismiss }: RevealedTokenModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!token) return;
    try {
      await Clipboard.setStringAsync(token);
      setCopied(true);
    } catch {
      // Clipboard API failure is rare; the token is still selectable in the
      // text block so the user can copy manually.
    }
  }, [token]);

  const handleClose = useCallback(() => {
    setCopied(false);
    onDismiss();
  }, [onDismiss]);

  return (
    <Modal
      visible={token !== null}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <GlassCard style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIcon}>
              <KeyRound size={18} color={palette.accent.gold} />
            </View>
            <View style={styles.modalHeaderText}>
              <Text variant="title" weight="semibold">
                New bridge token
              </Text>
              <Text variant="caption" tone="muted">
                Save this now — Tiwa will not show it again.
              </Text>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={handleClose}
              hitSlop={12}
              style={styles.closeIcon}
            >
              <X size={18} color={palette.fg.muted} />
            </PressableScale>
          </View>

          <View style={styles.tokenBox}>
            <Text
              variant="caption"
              family="mono"
              selectable
              style={styles.tokenText}
            >
              {token ?? ""}
            </Text>
          </View>

          <View style={styles.actions}>
            <PressableScale
              accessibilityRole="button"
              onPress={handleCopy}
              style={[styles.actionBtn, styles.copyBtn]}
            >
              <Text variant="body" weight="semibold" style={styles.copyBtnText}>
                {copied ? "Copied" : "Copy"}
              </Text>
            </PressableScale>
            <PressableScale
              accessibilityRole="button"
              onPress={handleClose}
              style={[styles.actionBtn, styles.doneBtn]}
            >
              <Text variant="body" weight="semibold" style={styles.doneBtnText}>
                Done
              </Text>
            </PressableScale>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.hairline,
    backgroundColor: palette.bg.elevated,
    alignSelf: "flex-start",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: palette.fg.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modal: {
    width: "100%",
    maxWidth: 380,
    gap: spacing.md,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  modalIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(233,177,76,0.10)",
    borderWidth: 1,
    borderColor: palette.accent.goldDeep,
  },
  modalHeaderText: {
    flex: 1,
    gap: 2,
  },
  closeIcon: {
    padding: spacing.xs,
  },
  tokenBox: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: palette.bg.base,
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  tokenText: {
    color: palette.fg.primary,
    fontFamily: font.monoWeights.medium,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  copyBtn: {
    backgroundColor: palette.accent.gold,
  },
  copyBtnText: {
    color: palette.bg.base,
  },
  doneBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: palette.hairline,
  },
  doneBtnText: {
    color: palette.fg.primary,
  },
});

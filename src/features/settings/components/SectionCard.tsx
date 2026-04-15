import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { GlassCard, Text } from "@/design/primitives";
import { spacing } from "@/design/tokens";

interface SectionCardProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function SectionCard({ title, children, footer }: SectionCardProps) {
  return (
    <GlassCard style={styles.card}>
      <Text variant="caption" tone="muted" weight="semibold" style={styles.title}>
        {title.toUpperCase()}
      </Text>
      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  title: {
    letterSpacing: 1.2,
  },
  body: {
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.sm,
  },
});

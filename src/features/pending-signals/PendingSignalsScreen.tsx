import { useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Alert } from "react-native";
import { Screen, Text } from "@/design/primitives";
import { palette, spacing, font } from "@/design/tokens";
import { FlashList } from "@shopify/flash-list";
import {
  usePendingTrades,
  useApproveTrade,
  useDenyTrade,
} from "@/services/pendingTrades";
import type { PendingTrade } from "@/types/dto/pendingTrades";
import { PendingTradeCard } from "./components/PendingTradeCard";

const COPY = {
  title: "Pending Signals",
  subtitle: "Tap Approve to place a trade on your MT5 account",
  emptyTitle: "No pending signals",
  emptyBody:
    "Tiwa will notify you when the next setup fires. You can leave the app — push notifications cover you.",
  errorTitle: "Couldn't load pending signals",
  errorBody: "Pull to retry, or check your connection.",
  loading: "Loading pending signals…",
};

function keyExtractor(t: PendingTrade): string {
  return t.id;
}

export function PendingSignalsScreen() {
  const { data, isLoading, isRefetching, isError, refetch } = usePendingTrades();
  const approve = useApproveTrade();
  const deny = useDenyTrade();

  const handleApprove = useCallback(
    async (tradeId: string) => {
      try {
        await approve.mutateAsync({ tradeId });
      } catch (err) {
        Alert.alert("Approve failed", (err as Error)?.message ?? "Unknown error");
      }
    },
    [approve],
  );

  const handleDeny = useCallback(
    async (tradeId: string) => {
      try {
        await deny.mutateAsync({ tradeId });
      } catch (err) {
        Alert.alert("Deny failed", (err as Error)?.message ?? "Unknown error");
      }
    },
    [deny],
  );

  const renderItem = useCallback(
    ({ item }: { item: PendingTrade }) => (
      <View style={styles.cardWrap}>
        <PendingTradeCard
          trade={item}
          onApprove={handleApprove}
          onDeny={handleDeny}
          busy={approve.isPending || deny.isPending}
        />
      </View>
    ),
    [handleApprove, handleDeny, approve.isPending, deny.isPending],
  );

  if (isLoading && !data) {
    return (
      <Screen>
        <Header />
        <View style={styles.center}>
          <ActivityIndicator color={palette.accent.gold} />
          <Text variant="caption" tone="muted" style={styles.loadingText}>
            {COPY.loading}
          </Text>
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <Header />
        <ScrollView
          contentContainerStyle={styles.center}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={palette.accent.gold}
            />
          }
        >
          <Text variant="title" style={styles.errorTitle}>
            {COPY.errorTitle}
          </Text>
          <Text variant="body" tone="muted" style={styles.errorBody}>
            {COPY.errorBody}
          </Text>
        </ScrollView>
      </Screen>
    );
  }

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <Screen>
        <Header />
        <ScrollView
          contentContainerStyle={styles.center}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={palette.accent.gold}
            />
          }
        >
          <Text variant="title" style={styles.emptyTitle}>
            {COPY.emptyTitle}
          </Text>
          <Text variant="body" tone="muted" style={styles.emptyBody}>
            {COPY.emptyBody}
          </Text>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header />
      <FlashList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={palette.accent.gold}
          />
        }
      />
    </Screen>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text variant="display" style={styles.headerTitle}>
        {COPY.title}
      </Text>
      <Text variant="body" tone="muted">
        {COPY.subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  headerTitle: {
    fontFamily: font.sansWeights.bold,
    color: palette.fg.primary,
  },
  cardWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing["3xl"],
  },
  center: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  loadingText: {
    marginTop: spacing.sm,
  },
  emptyTitle: {
    color: palette.fg.primary,
    fontFamily: font.sansWeights.semibold,
  },
  emptyBody: {
    textAlign: "center",
    maxWidth: 320,
  },
  errorTitle: {
    color: palette.status.danger,
    fontFamily: font.sansWeights.semibold,
  },
  errorBody: {
    textAlign: "center",
  },
});

import { useCallback } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { router } from "expo-router";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { MacroRadar } from "@/components/MacroRadar";
import { FilterBar } from "./components/FilterBar";
import { TradeCard } from "./components/TradeCard";
import { useTradeFeed } from "./hooks";
import type { TradeFeedItem } from "./types";

function keyExtractor(item: TradeFeedItem): string {
  return item.trade.id;
}

export function TradeFeedScreen() {
  const { items, filter, setFilter, isLoading, isRefreshing, isError, refetch } =
    useTradeFeed();

  const handlePressTrade = useCallback((tradeId: string) => {
    router.push(`/trade/${tradeId}`);
  }, []);

  const renderItem: ListRenderItem<TradeFeedItem> = useCallback(
    ({ item }) => <TradeCard item={item} onPress={handlePressTrade} />,
    [handlePressTrade],
  );

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headline" weight="bold">
            {COPY.tradeFeed.title}
          </Text>
          <Text variant="caption" tone="muted">
            {COPY.tradeFeed.subtitle}
          </Text>
        </View>

        <MacroRadar />

        <FilterBar
          value={filter}
          onChange={setFilter}
          labels={COPY.tradeFeed.filter}
        />

        <View style={styles.body}>
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <FlashList
              data={items}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              ItemSeparatorComponent={ItemSeparator}
              contentContainerStyle={listContentStyle}
              refreshing={isRefreshing}
              onRefresh={refetch}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Screen>
  );
}

function LoadingState() {
  return (
    <GlassCard style={styles.stateCard}>
      <ActivityIndicator color={palette.accent.gold} />
      <Text variant="body" tone="muted" align="center">
        {COPY.tradeFeed.loading}
      </Text>
    </GlassCard>
  );
}

function EmptyState() {
  return (
    <GlassCard style={styles.stateCard}>
      <Text variant="title" weight="semibold" align="center">
        {COPY.tradeFeed.empty.title}
      </Text>
      <Text variant="body" tone="muted" align="center">
        {COPY.tradeFeed.empty.body}
      </Text>
    </GlassCard>
  );
}

interface ErrorStateProps {
  onRetry: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <GlassCard style={styles.stateCard}>
      <Text variant="title" weight="semibold" align="center" tone="danger">
        {COPY.tradeFeed.error.title}
      </Text>
      <Text variant="body" tone="muted" align="center">
        {COPY.tradeFeed.error.body}
      </Text>
      <PressableScale
        accessibilityRole="button"
        onPress={onRetry}
        style={styles.retry}
      >
        <Text variant="title" weight="semibold" align="center">
          {COPY.tradeFeed.error.retry}
        </Text>
      </PressableScale>
    </GlassCard>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const listContentStyle = { paddingBottom: spacing["2xl"] };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    gap: spacing.xs,
  },
  body: {
    flex: 1,
  },
  separator: {
    height: spacing.md,
  },
  stateCard: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  retry: {
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.accent.gold,
  },
});

import { useCallback } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { router } from "expo-router";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, radius, spacing } from "@/design/tokens";
import { COPY } from "@/content/copy";
import { FilterBar } from "./components/FilterBar";
import { LivePortfolioHeader } from "./components/LivePortfolioHeader";
import { TradeCard } from "./components/TradeCard";
import { useTradeFeed } from "./hooks";
import type { TradeFeedItem } from "./types";

function keyExtractor(item: TradeFeedItem): string {
  return item.trade.id;
}

function formatCurrency(value: number | null, currency: string): string {
  if (value === null || Number.isNaN(value)) return "—";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return formatter.format(value);
}

function formatPortfolioPnl(value: number): string | null {
  if (value === 0) return null;
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded >= 0 ? "+$" : "-$";
  return `${sign}${Math.abs(rounded).toFixed(2)}`;
}

export function TradeFeedScreen() {
  const {
    items,
    counts,
    filter,
    setFilter,
    isLoading,
    isRefreshing,
    isError,
    refetch,
    portfolio,
    actionError,
  } = useTradeFeed();

  const handlePressTrade = useCallback((tradeId: string) => {
    router.push(`/trade/${tradeId}`);
  }, []);

  const renderItem: ListRenderItem<TradeFeedItem> = useCallback(
    ({ item }) => <TradeCard item={item} onPress={handlePressTrade} />,
    [handlePressTrade],
  );

  const equityLabel = formatCurrency(portfolio.equity, portfolio.currency);
  const portfolioPnlLabel = formatPortfolioPnl(portfolio.dailyPnlUsd);
  const portfolioTone =
    portfolio.dailyPnlUsd > 0
      ? "positive"
      : portfolio.dailyPnlUsd < 0
        ? "negative"
        : "neutral";

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.headerStack}>
          <LivePortfolioHeader
            equityLabel={equityLabel}
            pnlLabel={portfolioPnlLabel}
            pnlTone={portfolioTone}
          />
          <FilterBar
            value={filter}
            onChange={setFilter}
            labels={COPY.tradeFeed.filter}
            counts={counts}
          />
        </View>

        {actionError ? (
          <View style={styles.errorBanner}>
            <Text variant="caption" tone="danger" weight="semibold">
              {actionError}
            </Text>
          </View>
        ) : null}

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
    paddingTop: spacing.lg,
  },
  headerStack: {
    gap: spacing.md,
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
  errorBanner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: "rgba(229,96,77,0.10)",
    borderWidth: 1,
    borderColor: "rgba(229,96,77,0.30)",
  },
});

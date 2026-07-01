import { useState, useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { GlassCard, PressableScale, Screen, Text } from "@/design/primitives";
import { palette, spacing, radius } from "@/design/tokens";

/**
 * Help / education screen — explains how Tiwa works, the automated trade
 * management, and the Blue Guardian rules in play. Reached from Settings.
 */

interface Item {
  title: string;
  body: string;
  tone?: "default" | "gold" | "success" | "danger";
}

function Bullet({ item }: { item: Item }) {
  const dot =
    item.tone === "success" ? palette.status.success
    : item.tone === "danger" ? palette.status.danger
    : item.tone === "gold" ? palette.accent.gold
    : palette.fg.subtle;
  return (
    <View style={styles.bullet}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <View style={styles.bulletText}>
        <Text variant="body" weight="semibold">{item.title}</Text>
        <Text variant="caption" tone="muted" style={styles.bulletBody}>{item.body}</Text>
      </View>
    </View>
  );
}

function Section({
  title,
  subtitle,
  items,
  defaultOpen = false,
}: {
  title: string;
  subtitle?: string;
  items: Item[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  return (
    <GlassCard style={styles.section}>
      <PressableScale onPress={toggle} style={styles.sectionHeader} accessibilityRole="button">
        <View style={styles.sectionHeaderText}>
          <Text variant="title" weight="semibold">{title}</Text>
          {subtitle ? (
            <Text variant="caption" tone="muted" style={styles.sectionSub}>{subtitle}</Text>
          ) : null}
        </View>
        <Text variant="title" tone="muted" style={styles.chevron}>{open ? "–" : "+"}</Text>
      </PressableScale>
      {open ? (
        <View style={styles.sectionBody}>
          {items.map((it) => (
            <Bullet key={it.title} item={it} />
          ))}
        </View>
      ) : null}
    </GlassCard>
  );
}

export function HelpScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text variant="headline" weight="bold">How Tiwa works</Text>
          <Text variant="caption" tone="muted" style={styles.headerSub}>
            Your guide to signals, automated trade management, and the Blue Guardian guardrails keeping your funded account safe.
          </Text>
        </View>

        <Section
          title="1 · The flow"
          subtitle="Signal → your approval → auto-execute"
          defaultOpen
          items={[
            { title: "Tiwa finds the setup", body: "Tiwa scans XAU/USD (gold) around the clock and sends you a vetted setup with entry, stop, targets and a score.", tone: "gold" },
            { title: "You approve — nothing trades without you", body: "Open the signal and slide to approve. If you do nothing, it simply expires (~30 min). You are always in control." },
            { title: "Tiwa places the order", body: "On approval, Tiwa places the order on your MT5 account with a stop loss and take profit already attached — so the broker protects you even before Tiwa's own management kicks in." },
            { title: "Tiwa manages it from there", body: "Once live, Tiwa actively manages the trade for you (next section). You don't need to touch anything." },
          ]}
        />

        <Section
          title="2 · Automated trade management"
          subtitle="What Tiwa does after you approve"
          items={[
            { title: "TP1 protection — bank 50% + stop to breakeven", body: "When price reaches the first target, Tiwa closes half the position to bank the win and moves your stop to breakeven. The rest runs risk-free toward the final target.", tone: "success" },
            { title: "Basket protector", body: "If several same-direction winners stack up together, Tiwa banks all but one and moves the runner's stop to breakeven — locking gains before a reversal can stop the whole cluster out.", tone: "success" },
            { title: "Guardian Shield — the safety net", body: "If your open trades' combined floating loss reaches the danger threshold (1% of balance on a Blue Guardian account), Tiwa flattens everything to protect the account. It only ever closes — never opens.", tone: "gold" },
            { title: "All automatic", body: "Every one of these runs on its own. You never have to manually close or move a stop." },
          ]}
        />

        <Section
          title="3 · Blue Guardian rules in play"
          subtitle="The compliance suite keeping your funded account alive"
          items={[
            { title: "Why this matters", body: "Your account is a Blue Guardian funded account. BG has strict rules — break one and the account fails. Tiwa is tuned to keep you inside every one of them.", tone: "gold" },
            { title: "Trailing / overall drawdown (6%)", body: "Your equity can't fall 6% from its high-water mark. A breach terminates the account — Tiwa's Guardian Shield closes well before this.", tone: "danger" },
            { title: "Daily-loss limit (3%)", body: "You can't lose more than 3% of the account in a single day. The 1% Guardian Shield keeps any single event well under this.", tone: "danger" },
            { title: "1% Guardian-shield auto-close", body: "Positions are flattened before floating loss becomes dangerous — the tight, BG-aligned catastrophe brake." },
            { title: "Margin caps", body: "Tiwa won't over-leverage the account — position sizing is scaled to your balance and margin is kept well below BG's ceiling." },
            { title: "Consistency rules", body: "No single day should dominate your profits. Tiwa spreads results so the account stays consistent." },
            { title: "Minimum-hold time", body: "Trades are held long enough to be valid — no closing within seconds (BG disallows it)." },
            { title: "Inactivity limit", body: "The account must trade periodically to stay active; Tiwa's ongoing signals keep it in good standing." },
            { title: "Daily-profit cap", body: "Daily gains are capped for consistency, so one big day doesn't flag the account." },
            { title: "News-window close-blocking", body: "During high-impact (“red-folder”) news, BG bans closing trades — so Tiwa pauses its voluntary closes (TP1 / basket) until the window passes.", tone: "gold" },
            { title: "The point", body: "These guardrails exist to keep your funded account from breaching Blue Guardian's rules — which would fail the account." },
          ]}
        />

        <Section
          title="4 · What to look out for"
          subtitle="Getting the best out of Tiwa"
          items={[
            { title: "Approve promptly", body: "Signals expire in about 30 minutes. Miss one and it's gone — just wait for the next; Tiwa is patient by design." },
            { title: "Let the management work", body: "Don't manually close trades or move stops. Tiwa banks profit at TP1, protects runners, and shields the account for you." },
            { title: "News pauses are normal", body: "If a trade isn't closing during high-impact news, that's the Blue Guardian rule in action — not a bug." },
            { title: "Keep your bridge online", body: "The green “Bridge online” status in Settings means Tiwa can manage your trades. If it goes offline, management pauses until it reconnects.", tone: "success" },
            { title: "Watch your dashboard", body: "Your balance, open trades and P&L update live. Approved trades move from Pending to Active once routed." },
            { title: "One account, one plan", body: "For this run, everyone trades a $100k Blue Guardian account with the same rules and the same guardrails." },
          ]}
        />

        <View style={styles.footer}>
          <Text variant="caption" tone="muted" align="center">
            Questions about a specific trade or rule? Reach out to your operator — every management action is logged.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing["3xl"], gap: spacing.md },
  header: { paddingVertical: spacing.lg, gap: spacing.xs },
  headerSub: { lineHeight: 18 },
  section: { padding: spacing.lg, gap: spacing.sm },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionHeaderText: { flex: 1, gap: 2, paddingRight: spacing.sm },
  sectionSub: {},
  chevron: { width: 20, textAlign: "center" },
  sectionBody: { gap: spacing.md, marginTop: spacing.md, borderTopWidth: 1, borderTopColor: palette.hairline, paddingTop: spacing.md },
  bullet: { flexDirection: "row", gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: radius.pill, marginTop: 5 },
  bulletText: { flex: 1, gap: 2 },
  bulletBody: { lineHeight: 17 },
  footer: { paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
});

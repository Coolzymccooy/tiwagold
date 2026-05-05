import type {
  AnalyticsEquitySeries,
  AnalyticsRange,
  AnalyticsSummary,
  EngineBreakdown,
  EquityPoint,
  ModeBreakdown,
  PerformanceBucket,
  SessionBreakdown,
} from "@/types/analytics";
import type {
  JournalDto,
  JournalEquityPointDto,
  JournalSessionBreakdownEntryDto,
  JournalTradeRowDto,
} from "@/types/dto/journal";
import {
  TRADE_SYMBOL,
  type CandidateStatus,
  type EngineTier,
  type SessionName,
  type Trade,
  type TradeAutopsy,
  type TradeMode,
  type TradeTimelineEvent,
} from "@/types/trade";

const KNOWN_SESSIONS: readonly SessionName[] = [
  "london",
  "new_york",
  "asian",
  "off_hours",
];

function normalizeSession(value: string | null | undefined): SessionName {
  const trimmed = (value ?? "").trim().toLowerCase();
  if (trimmed === "ny" || trimmed === "newyork" || trimmed === "new_york") {
    return "new_york";
  }
  if (trimmed === "london") return "london";
  if (trimmed === "asia" || trimmed === "asian") return "asian";
  return "off_hours";
}

function inferEngineTier(setupType: string | null | undefined): EngineTier {
  const value = (setupType ?? "").toLowerCase();
  if (value.includes("aggressive") || value.includes("breakout")) {
    return "aggressive";
  }
  return "conservative";
}

function inferMode(setupType: string | null | undefined): TradeMode {
  return inferEngineTier(setupType) === "aggressive" ? "aggressive" : "conservative";
}

function statusFromJournalState(state: string): CandidateStatus {
  switch (state.toUpperCase()) {
    case "VALID":
    case "WAIT":
      return "created";
    case "TRIGGERED":
    case "CLOSED":
      return "executed";
    case "REJECTED":
      return "risk_blocked";
    case "EXPIRED":
      return "expired";
    case "CANCELLED":
      return "cancelled";
    default:
      return "created";
  }
}

function autopsyFromRow(row: JournalTradeRowDto): TradeAutopsy | undefined {
  if (!row.result || row.result === "EXPIRED") return undefined;
  const outcome: TradeAutopsy["outcome"] =
    row.result === "WIN" ? "win" : row.result === "LOSS" ? "loss" : "breakeven";
  const rMultiple = row.rMultiple ?? 0;
  const risk = Math.abs(row.entry - row.stopLoss);
  const direction = row.direction === "BUY" ? 1 : -1;
  const exitPrice =
    risk > 0 ? row.entry + direction * rMultiple * risk : row.entry;
  const closedAt = row.closedAt ?? row.createdAt;
  const durationMinutes = Math.max(
    0,
    Math.round(
      (new Date(closedAt).getTime() - new Date(row.createdAt).getTime()) / 60_000,
    ),
  );
  return {
    outcome,
    exitPrice: Number(exitPrice.toFixed(2)),
    exitReason: outcome === "win" ? "Take-profit hit" : outcome === "loss" ? "Stop-loss hit" : "Closed at breakeven",
    pnl: Number((rMultiple * risk).toFixed(2)),
    pnlR: Number(rMultiple.toFixed(2)),
    durationMinutes,
    lessons: [],
  };
}

function buildTimeline(row: JournalTradeRowDto): TradeTimelineEvent[] {
  const events: TradeTimelineEvent[] = [
    {
      id: `evt_created_${row.id}`,
      at: row.createdAt,
      kind: "created",
      summary: row.setupType ?? "Setup created",
    },
  ];
  const upper = row.state.toUpperCase();
  if (upper === "TRIGGERED" || upper === "CLOSED") {
    events.push({
      id: `evt_triggered_${row.id}`,
      at: row.closedAt ?? row.createdAt,
      kind: "triggered",
      summary: "Order routed to broker",
    });
  }
  if (upper === "CLOSED" && row.result) {
    const closedAt = row.closedAt ?? row.createdAt;
    const kind: TradeTimelineEvent["kind"] =
      row.result === "WIN" ? "tp1_hit" : row.result === "LOSS" ? "stop_hit" : "note";
    events.push({
      id: `evt_closed_${row.id}`,
      at: closedAt,
      kind,
      summary:
        row.result === "WIN"
          ? "Take-profit reached"
          : row.result === "LOSS"
            ? "Stop-loss reached"
            : "Closed",
    });
  }
  return events;
}

export function journalRowToTrade(row: JournalTradeRowDto): Trade {
  const sessionTag = normalizeSession(row.session);
  const setupType = row.setupType ?? "unknown";
  const engineTier = inferEngineTier(row.setupType);
  const mode = inferMode(row.setupType);
  const closedAt = row.closedAt ?? null;
  const updatedAt = closedAt ?? row.createdAt;
  const expiresAtMs = new Date(row.createdAt).getTime() + 4 * 60 * 60 * 1000;
  const expiresAt = Number.isFinite(expiresAtMs)
    ? new Date(expiresAtMs).toISOString()
    : row.createdAt;
  const status = statusFromJournalState(row.state);
  return {
    id: row.id,
    dedupeKey: row.id,
    symbol: TRADE_SYMBOL,
    direction: row.direction,
    mode,
    engineTier,
    strategyTag: setupType,
    setupType,
    sessionTag,
    score: row.setupScore ?? 0,
    proposedEntry: row.entry,
    stopLoss: row.stopLoss,
    tp1: row.tp1,
    tp2: row.tp2,
    riskReward: row.rr,
    htfTrend: "unknown",
    ltfStructure: "unknown",
    confluenceTags: [],
    expiresAt,
    createdAt: row.createdAt,
    updatedAt,
    status,
    timeline: buildTimeline(row),
    autopsy: autopsyFromRow(row),
  };
}

export function journalToTrades(dto: JournalDto): Trade[] {
  return dto.trades.map(journalRowToTrade);
}

function parseEquityDate(value: string): number {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function rangeWindowDays(range: AnalyticsRange): number | null {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "ytd":
    case "all":
      return null;
  }
}

function filterEquityByRange(
  points: EquityPoint[],
  range: AnalyticsRange,
): EquityPoint[] {
  if (points.length === 0) return [];
  const last = points[points.length - 1];
  if (!last) return [];
  const latestMs = parseEquityDate(last.at);
  if (range === "all") return points.map((p) => ({ ...p }));
  if (range === "ytd") {
    const year = new Date(latestMs).getUTCFullYear();
    const cutoff = new Date(Date.UTC(year, 0, 1)).getTime();
    return points
      .filter((p) => parseEquityDate(p.at) >= cutoff)
      .map((p) => ({ ...p }));
  }
  const days = rangeWindowDays(range);
  if (days === null) return points.map((p) => ({ ...p }));
  const cutoff = latestMs - days * 24 * 60 * 60 * 1000;
  return points
    .filter((p) => parseEquityDate(p.at) >= cutoff)
    .map((p) => ({ ...p }));
}

function equityFromJournal(
  rows: JournalEquityPointDto[],
  startingEquity: number,
): EquityPoint[] {
  let lastDate: string | null = null;
  return rows.map((row) => {
    const at = row.date ?? lastDate ?? new Date().toISOString();
    if (row.date) lastDate = row.date;
    const equity = startingEquity + row.r;
    return {
      at,
      rRunning: Number(row.r.toFixed(2)),
      equity: Number(equity.toFixed(2)),
    };
  });
}

const STARTING_EQUITY = 10_000;

function winRate(wins: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((wins / total) * 100).toFixed(2));
}

function avgR(totalR: number, total: number): number {
  if (total <= 0) return 0;
  return Number((totalR / total).toFixed(2));
}

function bucketsBySession(
  breakdown: Record<string, JournalSessionBreakdownEntryDto>,
  rows: JournalTradeRowDto[],
): SessionBreakdown[] {
  const sumByLabel = new Map<SessionName, { totalR: number; total: number; wins: number }>();
  for (const session of KNOWN_SESSIONS) {
    sumByLabel.set(session, { totalR: 0, total: 0, wins: 0 });
  }
  for (const row of rows) {
    const session = normalizeSession(row.session);
    const bucket = sumByLabel.get(session);
    if (!bucket) continue;
    bucket.totalR += row.rMultiple ?? 0;
  }
  for (const [rawSession, entry] of Object.entries(breakdown)) {
    const session = normalizeSession(rawSession);
    const bucket = sumByLabel.get(session);
    if (!bucket) continue;
    bucket.total += entry.total;
    bucket.wins += entry.wins;
  }
  const out: SessionBreakdown[] = [];
  for (const session of KNOWN_SESSIONS) {
    const bucket = sumByLabel.get(session);
    if (!bucket || bucket.total === 0) continue;
    out.push({
      session,
      trades: bucket.total,
      winRate: winRate(bucket.wins, bucket.total),
      avgR: avgR(bucket.totalR, bucket.total),
    });
  }
  return out;
}

function bucketsByEngine(rows: JournalTradeRowDto[]): EngineBreakdown[] {
  const buckets: Record<EngineTier, { trades: number; wins: number; totalR: number }> = {
    conservative: { trades: 0, wins: 0, totalR: 0 },
    aggressive: { trades: 0, wins: 0, totalR: 0 },
  };
  for (const row of rows) {
    const tier = inferEngineTier(row.setupType);
    const bucket = buckets[tier];
    if (row.state.toUpperCase() !== "CLOSED") continue;
    bucket.trades += 1;
    if (row.result === "WIN") bucket.wins += 1;
    bucket.totalR += row.rMultiple ?? 0;
  }
  const result: EngineBreakdown[] = [];
  for (const tier of ["conservative", "aggressive"] as const) {
    const bucket = buckets[tier];
    if (bucket.trades === 0) continue;
    result.push({
      engine: tier,
      trades: bucket.trades,
      winRate: winRate(bucket.wins, bucket.trades),
      avgR: avgR(bucket.totalR, bucket.trades),
    });
  }
  return result;
}

function bucketsByMode(rows: JournalTradeRowDto[]): ModeBreakdown[] {
  const buckets: Record<TradeMode, { trades: number; wins: number; totalR: number }> = {
    conservative: { trades: 0, wins: 0, totalR: 0 },
    aggressive: { trades: 0, wins: 0, totalR: 0 },
  };
  for (const row of rows) {
    if (row.state.toUpperCase() !== "CLOSED") continue;
    const mode = inferMode(row.setupType);
    const bucket = buckets[mode];
    bucket.trades += 1;
    if (row.result === "WIN") bucket.wins += 1;
    bucket.totalR += row.rMultiple ?? 0;
  }
  const result: ModeBreakdown[] = [];
  for (const mode of ["conservative", "aggressive"] as const) {
    const bucket = buckets[mode];
    if (bucket.trades === 0) continue;
    result.push({
      mode,
      trades: bucket.trades,
      winRate: winRate(bucket.wins, bucket.trades),
      avgR: avgR(bucket.totalR, bucket.trades),
    });
  }
  return result;
}

export type { PerformanceBucket };

function streakFromRows(rows: JournalTradeRowDto[]): { kind: "win" | "loss"; count: number } {
  const closed = rows
    .filter((row) => row.state.toUpperCase() === "CLOSED" && row.result)
    .sort((a, b) => parseEquityDate(b.closedAt ?? b.createdAt) - parseEquityDate(a.closedAt ?? a.createdAt));
  if (closed.length === 0) return { kind: "win", count: 0 };
  const head = closed[0];
  if (!head) return { kind: "win", count: 0 };
  const kind: "win" | "loss" = head.result === "WIN" ? "win" : "loss";
  let count = 0;
  for (const row of closed) {
    if (kind === "win" && row.result !== "WIN") break;
    if (kind === "loss" && row.result !== "LOSS") break;
    count += 1;
  }
  return { kind, count };
}

function bestWorstR(rows: JournalTradeRowDto[]): { best: number; worst: number } {
  let best = 0;
  let worst = 0;
  for (const row of rows) {
    if (row.rMultiple === null || row.rMultiple === undefined) continue;
    if (row.rMultiple > best) best = row.rMultiple;
    if (row.rMultiple < worst) worst = row.rMultiple;
  }
  return { best: Number(best.toFixed(2)), worst: Number(worst.toFixed(2)) };
}

function expectancyFromRows(rows: JournalTradeRowDto[]): number {
  const closed = rows.filter((row) => row.state.toUpperCase() === "CLOSED");
  if (closed.length === 0) return 0;
  const totalR = closed.reduce((sum, row) => sum + (row.rMultiple ?? 0), 0);
  return Number((totalR / closed.length).toFixed(2));
}

export function journalToAnalyticsSummary(
  dto: JournalDto,
  range: AnalyticsRange,
): AnalyticsSummary {
  const equity = equityFromJournal(dto.equityCurve, STARTING_EQUITY);
  const filteredEquity = filterEquityByRange(equity, range);
  const closed = dto.trades.filter((row) => row.state.toUpperCase() === "CLOSED");
  const wins = closed.filter((row) => row.result === "WIN").length;
  const totalR = closed.reduce((sum, row) => sum + (row.rMultiple ?? 0), 0);
  const { best, worst } = bestWorstR(dto.trades);
  return {
    range,
    totalTrades: dto.trades.length,
    activeTrades: dto.openTrades,
    closedTrades: closed.length,
    winRate: winRate(wins, closed.length),
    avgR: avgR(totalR, closed.length),
    totalR: Number(totalR.toFixed(2)),
    bestTradeR: best,
    worstTradeR: worst,
    expectancy: expectancyFromRows(dto.trades),
    equityCurve: filteredEquity,
    byEngine: bucketsByEngine(dto.trades),
    bySession: bucketsBySession(dto.sessionBreakdown, dto.trades),
    byMode: bucketsByMode(dto.trades),
    streak: streakFromRows(dto.trades),
  };
}

export function journalToAnalyticsEquity(
  dto: JournalDto,
  range: AnalyticsRange,
): AnalyticsEquitySeries {
  const points = filterEquityByRange(
    equityFromJournal(dto.equityCurve, STARTING_EQUITY),
    range,
  );
  if (points.length === 0) {
    return {
      range,
      points: [],
      startingEquity: 0,
      endingEquity: 0,
      peakEquity: 0,
      maxDrawdownR: 0,
    };
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) {
    return {
      range,
      points: [],
      startingEquity: 0,
      endingEquity: 0,
      peakEquity: 0,
      maxDrawdownR: 0,
    };
  }
  let peakEquity = first.equity;
  let peakR = first.rRunning;
  let maxDrawdownR = 0;
  for (const point of points) {
    if (point.equity > peakEquity) peakEquity = point.equity;
    if (point.rRunning > peakR) peakR = point.rRunning;
    const drawdown = peakR - point.rRunning;
    if (drawdown > maxDrawdownR) maxDrawdownR = drawdown;
  }
  return {
    range,
    points,
    startingEquity: first.equity,
    endingEquity: last.equity,
    peakEquity,
    maxDrawdownR: Number(maxDrawdownR.toFixed(2)),
  };
}

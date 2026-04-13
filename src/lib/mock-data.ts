export type TradeStatus = 'PENDING' | 'OPEN' | 'CLOSED' | 'REJECTED';
export type TradeType = 'BUY' | 'SELL';
export type EngineType = 'Conservative' | 'Aggressive' | 'Sniper';
export type SessionType = 'London' | 'NY' | 'Asian' | 'Sydney';
export type ExecutionType = 'Market' | 'Limit' | 'Stop';

export interface Trade {
  id: string;
  symbol: string;
  type: TradeType;
  entryPrice: number;
  currentPrice: number;
  takeProfit: number;
  stopLoss: number;
  status: TradeStatus;
  profitLoss: number;
  engine: EngineType;
  timestamp: string;
  logic: string[];
  
  // New PRD fields
  score: number;
  session: SessionType;
  expiry: string;
  riskPercent: number;
  context: string;
  executionType: ExecutionType;
  autopsy?: string;
}

export const MOCK_TRADES: Trade[] = [
  {
    id: 'trd_1',
    symbol: 'XAU/USD',
    type: 'BUY',
    entryPrice: 2345.50,
    currentPrice: 2350.20,
    takeProfit: 2360.00,
    stopLoss: 2335.00,
    status: 'OPEN',
    profitLoss: 47.00,
    engine: 'Conservative',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    score: 88,
    session: 'NY',
    expiry: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    riskPercent: 1.0,
    context: 'HTF: Bullish macro structure. LTF: Pullback into 15m FVG.',
    executionType: 'Market',
    logic: [
      'Price bounced off major support at 2340',
      'RSI oversold on 15m timeframe',
      'Moving average crossover (9 EMA > 21 EMA)'
    ]
  },
  {
    id: 'trd_2',
    symbol: 'XAU/USD',
    type: 'SELL',
    entryPrice: 2380.00,
    currentPrice: 2375.00,
    takeProfit: 2365.00,
    stopLoss: 2385.00,
    status: 'CLOSED',
    profitLoss: 50.00,
    engine: 'Aggressive',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    score: 78,
    session: 'London',
    expiry: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    riskPercent: 2.5,
    context: 'HTF: Approaching weekly supply. LTF: Momentum divergence.',
    executionType: 'Market',
    logic: [
      'Double top formation on 1H chart',
      'Bearish divergence on MACD',
      'Volume spike on rejection candle'
    ],
    autopsy: 'Trade executed perfectly according to plan. Price hit the range support and immediately reversed. Take profit was hit during the London open volume spike. Excellent read on the Asian session consolidation.'
  },
  {
    id: 'trd_3',
    symbol: 'XAU/USD',
    type: 'BUY',
    entryPrice: 2320.00,
    currentPrice: 2320.00,
    takeProfit: 2340.00,
    stopLoss: 2310.00,
    status: 'PENDING',
    profitLoss: 0,
    engine: 'Sniper',
    timestamp: new Date().toISOString(),
    score: 95,
    session: 'Asian',
    expiry: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    riskPercent: 1.5,
    context: 'HTF: Bullish trend continuation. LTF: Accumulation phase complete.',
    executionType: 'Limit',
    logic: [
      'Strong momentum on 4H timeframe',
      'Breakout of Asian session range',
      'Awaiting user approval for execution'
    ]
  },
  {
    id: 'trd_4',
    symbol: 'XAU/USD',
    type: 'SELL',
    entryPrice: 2395.00,
    currentPrice: 2395.00,
    takeProfit: 2370.00,
    stopLoss: 2405.00,
    status: 'PENDING',
    profitLoss: 0,
    engine: 'Conservative',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    score: 82,
    session: 'NY',
    expiry: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    riskPercent: 1.0,
    context: 'HTF: Bearish order flow. LTF: Distribution schematic playing out.',
    executionType: 'Limit',
    logic: [
      'Rejection at major daily resistance',
      'Bearish engulfing candle on 1H',
      'High impact news catalyst'
    ]
  }
];

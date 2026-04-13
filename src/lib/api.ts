import { Trade, TradeStatus, MOCK_TRADES } from './mock-data';

// In-memory store for the session
let trades = [...MOCK_TRADES];

// Simulate live price updates for open trades
setInterval(() => {
  trades = trades.map(t => {
    if (t.status === 'OPEN') {
      // Random price fluctuation between -0.5 and +0.5
      const change = (Math.random() - 0.5);
      const newCurrentPrice = t.currentPrice + change;
      const profitLossChange = t.type === 'BUY' ? change : -change;
      
      return { 
        ...t, 
        currentPrice: newCurrentPrice, 
        profitLoss: t.profitLoss + (profitLossChange * 10) // Multiply by 10 for visible PnL changes
      };
    }
    return t;
  });
}, 3000);

export const api = {
  getTrades: async (): Promise<Trade[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...trades];
  },
  
  getTrade: async (id: string): Promise<Trade | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return trades.find(t => t.id === id);
  },
  
  updateTradeStatus: async (id: string, status: TradeStatus): Promise<Trade> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    trades = trades.map(t => t.id === id ? { ...t, status } : t);
    const updated = trades.find(t => t.id === id);
    if (!updated) throw new Error('Trade not found');
    return updated;
  },

  connectBroker: async (credentials: { accountId: string, password: string, server: string }): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (!credentials.accountId || !credentials.password || !credentials.server) {
      throw new Error('Missing credentials');
    }
    return { success: true };
  }
};

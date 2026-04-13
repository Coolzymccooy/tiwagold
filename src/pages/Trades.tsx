import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Trade } from '@/lib/mock-data';
import { api } from '@/lib/api';
import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle, Check, X, Globe, Activity, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

type FilterTab = 'ALL' | 'PENDING' | 'OPEN' | 'CLOSED';

export function Trades() {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const queryClient = useQueryClient();

  const { data: trades, isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: api.getTrades,
    refetchInterval: 3000
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.updateTradeStatus(id, 'OPEN'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Trade approved and executed');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.updateTradeStatus(id, 'REJECTED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.info('Trade rejected');
    }
  });

  if (isLoading && !trades) {
    return (
      <div className="p-6 space-y-4 pt-12">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  const filteredTrades = trades?.filter(t => {
    if (activeTab === 'ALL') return t.status !== 'REJECTED';
    return t.status === activeTab;
  }) || [];

  const totalOpenProfit = trades?.filter(t => t.status === 'OPEN').reduce((sum, t) => sum + t.profitLoss, 0) || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Portfolio Header */}
      <div className="px-6 pt-12 pb-6 bg-[#030712] sticky top-0 z-20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-400">Live Portfolio</span>
          <div className={cn(
            "px-2.5 py-1 rounded-full text-xs font-bold flex items-center",
            totalOpenProfit >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          )}>
            {totalOpenProfit >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            ${Math.abs(totalOpenProfit).toFixed(2)}
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">$24,592.50</h1>
      </div>

      {/* Tabs */}
      <div className="px-6 py-2 overflow-x-auto hide-scrollbar sticky top-[104px] bg-[#030712]/90 backdrop-blur-xl z-20 border-b border-white/5">
        <div className="flex space-x-6">
          {(['ALL', 'PENDING', 'OPEN', 'CLOSED'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative py-2 text-sm font-bold whitespace-nowrap transition-colors"
            >
              <span className={activeTab === tab ? "text-white" : "text-gray-500"}>
                {tab}
              </span>
              {tab === 'PENDING' && trades?.some(t => t.status === 'PENDING') && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[9px] bg-amber-500 text-gray-950 rounded-full">
                  {trades.filter(t => t.status === 'PENDING').length}
                </span>
              )}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredTrades.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-12 text-gray-500"
            >
              No {activeTab.toLowerCase()} trades found.
            </motion.div>
          ) : (
            filteredTrades.map((trade, index) => (
              <motion.div
                key={trade.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <TradeCard 
                  trade={trade} 
                  onApprove={(e) => { e.preventDefault(); approveMutation.mutate(trade.id); }}
                  onReject={(e) => { e.preventDefault(); rejectMutation.mutate(trade.id); }}
                  isApproving={approveMutation.isPending && approveMutation.variables === trade.id}
                  isRejecting={rejectMutation.isPending && rejectMutation.variables === trade.id}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TradeCard({ 
  trade, 
  onApprove, 
  onReject,
  isApproving,
  isRejecting
}: { 
  trade: Trade, 
  onApprove: (e: React.MouseEvent) => void,
  onReject: (e: React.MouseEvent) => void,
  isApproving: boolean,
  isRejecting: boolean
}) {
  const isBuy = trade.type === 'BUY';
  const isProfit = trade.profitLoss > 0;
  const isPending = trade.status === 'PENDING';

  return (
    <Link 
      to={`/trade/${trade.id}`}
      className="block bg-white/5 rounded-3xl p-5 border border-white/5 shadow-lg active:scale-[0.98] transition-transform overflow-hidden relative"
    >
      {/* Subtle background gradient based on type */}
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none",
        isBuy ? "bg-green-500" : "bg-red-500"
      )} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "p-2.5 rounded-2xl",
            isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          )}>
            {isBuy ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg leading-tight">{trade.symbol}</h3>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xs text-gray-400 font-medium flex items-center">
                <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", 
                  trade.engine === 'Sniper' ? 'bg-purple-400' : 
                  trade.engine === 'Aggressive' ? 'bg-orange-400' : 'bg-blue-400'
                )} />
                {trade.engine}
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span className="text-xs font-bold text-amber-500">
                {trade.score}/100
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          {!isPending && (
            <div className={cn(
              "text-lg font-bold transition-colors duration-300",
              isProfit ? "text-green-400" : "text-red-400"
            )}>
              {isProfit ? '+' : ''}{trade.profitLoss.toFixed(2)}
            </div>
          )}
          <div className="flex items-center justify-end space-x-1 mt-1">
            {trade.status === 'OPEN' ? (
              <Clock className="w-3 h-3 text-amber-500 animate-pulse" />
            ) : trade.status === 'PENDING' ? (
              <AlertCircle className="w-3 h-3 text-blue-400" />
            ) : (
              <CheckCircle2 className="w-3 h-3 text-gray-500" />
            )}
            <span className={cn(
              "text-xs font-medium",
              trade.status === 'PENDING' ? "text-blue-400" : "text-gray-500"
            )}>
              {trade.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 relative z-10">
        <div className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
          <Globe className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] font-medium text-gray-300 uppercase">{trade.session}</span>
        </div>
        <div className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
          <ShieldAlert className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] font-medium text-gray-300 uppercase">Risk {trade.riskPercent}%</span>
        </div>
        <div className="flex items-center space-x-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
          <Activity className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] font-medium text-gray-300 uppercase">{trade.executionType}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 relative z-10">
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Entry</div>
          <div className="font-mono text-sm text-gray-200">{trade.entryPrice.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current</div>
          <div className="font-mono text-sm text-white transition-all duration-300">{trade.currentPrice.toFixed(2)}</div>
        </div>
      </div>

      {isPending && (
        <div className="mt-5 pt-4 border-t border-white/5 flex space-x-3 relative z-10">
          <button 
            onClick={onReject}
            disabled={isRejecting || isApproving}
            className="flex-1 flex items-center justify-center space-x-1 bg-white/5 hover:bg-white/10 text-red-400 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {isRejecting ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <X className="w-4 h-4" />}
            <span>Reject</span>
          </button>
          <button 
            onClick={onApprove}
            disabled={isApproving || isRejecting}
            className="flex-1 flex items-center justify-center space-x-1 bg-amber-500 hover:bg-amber-400 text-gray-950 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20"
          >
            {isApproving ? <div className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            <span>Approve</span>
          </button>
        </div>
      )}
    </Link>
  );
}

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Target, ShieldAlert, BrainCircuit, Activity, Check, X, ChevronDown, Globe, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, ReferenceLine, ResponsiveContainer, YAxis } from 'recharts';

// Generate dummy chart data based on entry price
const generateChartData = (entry: number, current: number) => {
  const data = [];
  let price = entry - (entry * 0.001);
  for (let i = 0; i < 20; i++) {
    data.push({ time: i, price: price });
    price += (current - price) / (20 - i) + (Math.random() - 0.5) * (entry * 0.0005);
  }
  data.push({ time: 20, price: current });
  return data;
};

export function TradeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: trade, isLoading } = useQuery({
    queryKey: ['trade', id],
    queryFn: () => api.getTrade(id!),
    enabled: !!id,
    refetchInterval: 3000
  });

  const approveMutation = useMutation({
    mutationFn: () => api.updateTradeStatus(id!, 'OPEN'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trade', id] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Trade approved and executed');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.updateTradeStatus(id!, 'REJECTED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.info('Trade rejected');
      navigate('/');
    }
  });

  if (isLoading) return <div className="p-6 pt-12">Loading...</div>;
  if (!trade) return <div className="p-6 pt-12">Trade not found</div>;

  const isBuy = trade.type === 'BUY';
  const isProfit = trade.profitLoss > 0;
  const isPending = trade.status === 'PENDING';

  const chartData = generateChartData(trade.entryPrice, trade.currentPrice);
  const minPrice = Math.min(trade.stopLoss, trade.takeProfit, ...chartData.map(d => d.price));
  const maxPrice = Math.max(trade.stopLoss, trade.takeProfit, ...chartData.map(d => d.price));

  return (
    <div className="pb-32">
      {/* Header Actions */}
      <div className="px-4 py-4 flex items-center sticky top-0 bg-[#030712]/80 backdrop-blur-xl z-20 border-b border-white/5">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="ml-2 font-bold text-white">Trade Detail</span>
      </div>

      <div className="px-6 py-6">
        {/* Hero Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">{trade.symbol}</h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold",
                isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}>
                {trade.type}
              </span>
              <span className="text-sm text-gray-400">{trade.engine} Engine</span>
            </div>
          </div>
          <div className="text-right">
            {!isPending && (
              <div className={cn(
                "text-3xl font-bold transition-colors duration-300",
                isProfit ? "text-green-400" : "text-red-400"
              )}>
                {isProfit ? '+' : ''}{trade.profitLoss.toFixed(2)}
              </div>
            )}
            <div className={cn(
              "text-sm font-medium mt-1",
              isPending ? "text-blue-400" : "text-gray-500"
            )}>
              {trade.status}
            </div>
          </div>
        </div>

        {/* Dynamic Trade Visualizer */}
        <div className="mb-8 bg-white/5 rounded-3xl border border-white/5 h-48 relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Live Action</div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, bottom: 20 }}>
              <YAxis domain={[minPrice, maxPrice]} hide />
              <ReferenceLine y={trade.takeProfit} stroke="#22c55e" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'TP', fill: '#22c55e', fontSize: 10 }} />
              <ReferenceLine y={trade.stopLoss} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'SL', fill: '#ef4444', fontSize: 10 }} />
              <ReferenceLine y={trade.entryPrice} stroke="#9ca3af" strokeDasharray="3 3" label={{ position: 'insideLeft', value: 'ENTRY', fill: '#9ca3af', fontSize: 10 }} />
              <Line type="monotone" dataKey="price" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Price Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center space-x-2 text-gray-400 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Current</span>
            </div>
            <div className="font-mono text-xl text-white transition-all duration-300">{trade.currentPrice.toFixed(2)}</div>
          </div>
          <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20">
            <div className="flex items-center space-x-2 text-green-400 mb-2">
              <Target className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Target</span>
            </div>
            <div className="font-mono text-xl text-green-400">{trade.takeProfit.toFixed(2)}</div>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-3">
          {trade.status === 'CLOSED' && trade.autopsy && (
            <ExpandableSection title="AI Post-Trade Autopsy" icon={Sparkles} defaultOpen={true}>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <p className="text-sm text-amber-200/80 leading-relaxed">
                  {trade.autopsy}
                </p>
              </div>
            </ExpandableSection>
          )}

          <ExpandableSection title="Market Context" icon={Globe} defaultOpen={trade.status !== 'CLOSED'}>
            <p className="text-sm text-gray-300 leading-relaxed">
              {trade.context}
            </p>
            <div className="flex space-x-6 mt-4 pt-4 border-t border-white/5">
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Session</div>
                <div className="font-medium text-white">{trade.session}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Setup Score</div>
                <div className="font-medium text-amber-400">{trade.score}/100</div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="Trade Logic" icon={BrainCircuit} defaultOpen={trade.status !== 'CLOSED'}>
            <div className="space-y-3">
              {trade.logic.map((reason, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                  <p className="text-sm text-gray-300 leading-relaxed">{reason}</p>
                </div>
              ))}
            </div>
          </ExpandableSection>

          <ExpandableSection title="Risk Management" icon={ShieldAlert}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Risk per Trade</div>
                <div className="font-medium text-white">{trade.riskPercent}%</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Risk/Reward</div>
                <div className="font-medium text-white">
                  1 : {(Math.abs(trade.takeProfit - trade.entryPrice) / Math.abs(trade.entryPrice - trade.stopLoss)).toFixed(1)}
                </div>
              </div>
            </div>
          </ExpandableSection>

          <ExpandableSection title="Execution Details" icon={Zap}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Order Type</div>
                <div className="font-medium text-white">{trade.executionType}</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Expiry</div>
                <div className="font-medium text-white">
                  {format(new Date(trade.expiry), 'HH:mm (MMM d)')}
                </div>
              </div>
            </div>
          </ExpandableSection>
        </div>
      </div>

      {/* Pending Actions Bottom Bar */}
      {isPending && (
        <div className="fixed bottom-0 left-0 w-full p-6 glass-panel z-50 rounded-t-3xl">
          <div className="flex space-x-4 max-w-md mx-auto items-center">
            <button 
              onClick={() => rejectMutation.mutate()}
              disabled={rejectMutation.isPending || approveMutation.isPending}
              className="w-16 h-16 flex-shrink-0 flex items-center justify-center bg-white/5 hover:bg-white/10 text-red-400 rounded-2xl transition-colors disabled:opacity-50"
            >
              {rejectMutation.isPending ? <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> : <X className="w-6 h-6" />}
            </button>
            
            <div className="flex-1">
              <SlideToExecute 
                onExecute={() => approveMutation.mutate()} 
                isLoading={approveMutation.isPending} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlideToExecute({ onExecute, isLoading }: { onExecute: () => void, isLoading: boolean }) {
  const [isExecuted, setIsExecuted] = useState(false);
  
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x > 150) {
      setIsExecuted(true);
      onExecute();
    }
  };

  return (
    <div className="relative h-16 bg-white/5 rounded-2xl overflow-hidden flex items-center px-2 border border-white/10">
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-sm z-0 pointer-events-none">
        {isLoading ? 'Executing...' : 'Slide to Approve'}
      </div>
      <motion.div
        drag={!isLoading && !isExecuted ? "x" : false}
        dragConstraints={{ left: 0, right: 200 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ x: isExecuted ? 200 : 0 }}
        className={cn(
          "w-12 h-12 rounded-xl z-10 flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing",
          isExecuted ? "bg-green-500 text-white" : "bg-gradient-to-r from-amber-400 to-amber-600 text-gray-950"
        )}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
        ) : isExecuted ? (
          <Check className="w-5 h-5" />
        ) : (
          <ArrowRight className="w-5 h-5" />
        )}
      </motion.div>
    </div>
  );
}

function ExpandableSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false 
}: { 
  title: string, 
  icon: any, 
  children: React.ReactNode, 
  defaultOpen?: boolean 
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/5 rounded-xl text-amber-400">
            <Icon className="w-4 h-4" />
          </div>
          <span className="font-bold text-white">{title}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-5 h-5 text-gray-500" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-5 pt-0 border-t border-white/5 mt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

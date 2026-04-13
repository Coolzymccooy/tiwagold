import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

export function Analytics() {
  const { data: trades } = useQuery({
    queryKey: ['trades'],
    queryFn: api.getTrades
  });

  const executedTrades = trades?.filter(t => t.status === 'OPEN' || t.status === 'CLOSED') || [];

  const engineStats = executedTrades.reduce((acc, trade) => {
    if (!acc[trade.engine]) {
      acc[trade.engine] = { name: trade.engine, profit: 0, count: 0 };
    }
    acc[trade.engine].profit += trade.profitLoss;
    acc[trade.engine].count += 1;
    return acc;
  }, {} as Record<string, { name: string, profit: number, count: number }>);

  const chartData = Object.values(engineStats || {});
  const totalProfit = chartData.reduce((sum, stat) => sum + stat.profit, 0);

  return (
    <div className="p-6 space-y-6 pb-32">
      <h1 className="text-2xl font-bold text-white mb-6">Performance</h1>

      {/* Overview Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-[2rem] p-6 border border-amber-500/20 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/20 rounded-full blur-[50px]" />
        
        <div className="relative z-10">
          <div className="text-amber-200/80 text-sm font-medium mb-1">Total Net Profit</div>
          <div className="text-4xl font-bold text-white mb-8">
            ${totalProfit.toFixed(2)}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-md border border-white/5">
              <div className="text-amber-200/60 text-xs mb-1">Win Rate</div>
              <div className="text-xl font-bold text-white">75%</div>
            </div>
            <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-md border border-white/5">
              <div className="text-amber-200/60 text-xs mb-1">Executed</div>
              <div className="text-xl font-bold text-white">{executedTrades.length}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Engine Performance Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-bold text-white mb-4">Engine Performance</h2>
        <div className="h-64 w-full bg-white/5 rounded-3xl p-4 border border-white/5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip 
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                contentStyle={{ backgroundColor: '#111827', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
              />
              <Area type="monotone" dataKey="profit" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Engine Breakdown List */}
      <div className="space-y-3">
        {chartData.map((stat, index) => (
          <motion.div 
            key={stat.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
            className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5"
          >
            <div>
              <div className="font-bold text-white">{stat.name}</div>
              <div className="text-xs text-gray-400">{stat.count} trades executed</div>
            </div>
            <div className={`font-bold text-lg ${stat.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stat.profit >= 0 ? '+' : ''}{stat.profit.toFixed(2)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

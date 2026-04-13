import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { Shield, Zap, LogOut, Bell, Link as LinkIcon, Server, Key, User as UserIcon, ChevronLeft, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export function Settings() {
  const { user, logout, updateUser } = useAuth();
  const [riskLevel, setRiskLevel] = useState(50);
  const [maxTrades, setMaxTrades] = useState(3);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showMt5Form, setShowMt5Form] = useState(false);
  const [mt5Creds, setMt5Creds] = useState({ accountId: '', password: '', server: 'MetaQuotes-Demo' });
  
  const [toggles, setToggles] = useState({
    conservative: true,
    aggressive: false,
    sniper: true,
    notifications: true
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === 'notifications') {
        toast.success(`Push notifications ${next[key] ? 'enabled' : 'disabled'}`);
      } else {
        const keyStr = String(key);
        toast.success(`${keyStr.charAt(0).toUpperCase() + keyStr.slice(1)} engine ${next[key] ? 'enabled' : 'disabled'}`);
      }
      return next;
    });
  };

  const handleConnectBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mt5Creds.accountId || !mt5Creds.password || !mt5Creds.server) {
      toast.error('Please fill in all MT5 credentials');
      return;
    }

    setIsConnecting(true);
    try {
      await api.connectBroker(mt5Creds);
      setIsBrokerConnected(true);
      setShowMt5Form(false);
      toast.success('MT5 Broker successfully connected');
    } catch (e) {
      toast.error('Failed to connect broker. Check credentials.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ photoUrl: reader.result as string });
        toast.success('Profile image updated');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 space-y-6 pb-32">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* Profile Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4 bg-white/5 p-5 rounded-3xl border border-white/5"
      >
        <div 
          className="relative w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-amber-500/20 cursor-pointer overflow-hidden group"
          onClick={() => fileInputRef.current?.click()}
        >
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              {user?.name.charAt(0) || 'T'}
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user?.name || 'Trader'}</h2>
          <p className="text-sm text-gray-400">{user?.email}</p>
          <span className="inline-block mt-1 px-2.5 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-md">
            {user?.tier || 'Pro Tier'}
          </span>
        </div>
      </motion.div>

      {/* Broker Connection (MT5) */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 overflow-hidden transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/20 rounded-xl">
                <LinkIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Broker Status</h3>
                <p className="text-xs text-gray-400">Connect MT5 to execute trades</p>
              </div>
            </div>
            {isBrokerConnected && (
              <span className="px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg">
                Connected
              </span>
            )}
          </div>
          
          <AnimatePresence mode="wait">
            {!isBrokerConnected && !showMt5Form && (
              <motion.button 
                key="connect-btn"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowMt5Form(true)}
                className="w-full py-3.5 bg-white text-gray-950 font-bold rounded-2xl transition-all flex justify-center items-center space-x-2"
              >
                <span>Connect MT5 Account</span>
              </motion.button>
            )}

            {showMt5Form && !isBrokerConnected && (
              <motion.form 
                key="mt5-form"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                onSubmit={handleConnectBroker} 
                className="space-y-4 mt-6 pt-6 border-t border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-white">MT5 Credentials</h4>
                  <button type="button" onClick={() => setShowMt5Form(false)} className="text-xs text-gray-400 hover:text-white flex items-center">
                    <ChevronLeft className="w-3 h-3 mr-1" /> Cancel
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Account ID"
                      value={mt5Creds.accountId}
                      onChange={(e) => setMt5Creds({...mt5Creds, accountId: e.target.value})}
                      className="w-full pl-11 pr-4 py-3.5 bg-black/50 border border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none text-white transition-all"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-gray-500" />
                    </div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={mt5Creds.password}
                      onChange={(e) => setMt5Creds({...mt5Creds, password: e.target.value})}
                      className="w-full pl-11 pr-4 py-3.5 bg-black/50 border border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none text-white transition-all"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Server className="h-4 w-4 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      placeholder="Broker Server"
                      value={mt5Creds.server}
                      onChange={(e) => setMt5Creds({...mt5Creds, server: e.target.value})}
                      className="w-full pl-11 pr-4 py-3.5 bg-black/50 border border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 outline-none text-white transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isConnecting}
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-2xl transition-all disabled:opacity-70 flex justify-center items-center space-x-2 mt-2"
                >
                  {isConnecting ? (
                    <div className="w-5 h-5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                  ) : (
                    <span>Secure Connect</span>
                  )}
                </button>
              </motion.form>
            )}

            {isBrokerConnected && (
              <motion.div 
                key="connected-state"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 pt-4 border-t border-white/5"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-400">Account ID</span>
                  <span className="text-sm font-mono font-bold text-white">
                    ••••{mt5Creds.accountId.slice(-4) || '1234'}
                  </span>
                </div>
                <button 
                  onClick={() => { setIsBrokerConnected(false); toast.info('Broker disconnected'); }}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
                >
                  Disconnect MT5
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* Risk Management */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center space-x-2 mb-4 px-2">
          <Shield className="w-4 h-4 text-gray-500" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Risk Management</h3>
        </div>
        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 space-y-6">
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">Max Daily Drawdown</label>
              <span className="text-sm font-bold text-amber-400">{riskLevel}%</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="20" 
              value={riskLevel}
              onChange={(e) => setRiskLevel(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">Max Open Trades</label>
              <span className="text-sm font-bold text-amber-400">{maxTrades}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={maxTrades}
              onChange={(e) => setMaxTrades(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      </motion.section>

      {/* Engine Configuration */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex items-center space-x-2 mb-4 px-2">
          <Zap className="w-4 h-4 text-gray-500" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Engines</h3>
        </div>
        <div className="bg-white/5 rounded-3xl border border-white/5 overflow-hidden">
          <ToggleRow 
            label="Conservative Engine" 
            description="Low risk, steady gains"
            checked={toggles.conservative}
            onChange={() => handleToggle('conservative')}
          />
          <div className="h-px bg-white/5" />
          <ToggleRow 
            label="Aggressive Engine" 
            description="High frequency, higher risk"
            checked={toggles.aggressive}
            onChange={() => handleToggle('aggressive')}
          />
          <div className="h-px bg-white/5" />
          <ToggleRow 
            label="Sniper Engine" 
            description="High precision, low frequency"
            checked={toggles.sniper}
            onChange={() => handleToggle('sniper')}
          />
        </div>
      </motion.section>

      {/* Actions */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-4">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-4 rounded-2xl font-bold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </motion.section>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: () => void }) {
  return (
    <div className="p-5 flex items-center justify-between">
      <div>
        <div className="font-bold text-white">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{description}</div>
      </div>
      <button 
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-amber-500' : 'bg-gray-700'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

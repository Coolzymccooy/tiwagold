import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Sparkles, Send } from 'lucide-react';

export function Copilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi! I am Tiwa Copilot. Ask me about current market conditions, specific setups, or macro events.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'Based on current order flow and the upcoming CPI release, gold is showing strong support at 2340. I recommend keeping stops tight until the data drops.' 
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-amber-500/30 z-40"
      >
        <Sparkles className="w-6 h-6 text-gray-950" />
      </motion.button>

      {/* Chat Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 top-20 bg-[#030712]/95 backdrop-blur-2xl z-50 rounded-t-[2rem] border-t border-white/10 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Tiwa Copilot</h3>
                  <p className="text-xs text-amber-400">Live Market AI</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-amber-500 text-gray-950 rounded-tr-sm font-medium' 
                      : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/5'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-sm flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 pt-2 pb-safe">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about XAUUSD..."
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-5 pr-12 py-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-2 p-2 bg-amber-500 rounded-full text-gray-950 hover:bg-amber-400 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

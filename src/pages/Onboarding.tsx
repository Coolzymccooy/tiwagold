import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/AuthContext';
import { BrainCircuit, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react';

const slides = [
  {
    id: 'engines',
    icon: BrainCircuit,
    title: 'Three Powerful Engines',
    description: 'Tiwa Gold uses three distinct AI models to analyze the XAU/USD market.',
    features: [
      { name: 'Conservative', desc: 'Low risk, steady gains. Focuses on high-probability setups.' },
      { name: 'Aggressive', desc: 'High frequency, higher risk. Captures intraday volatility.' },
      { name: 'Sniper', desc: 'High precision, low frequency. Waits for perfect confluences.' }
    ]
  },
  {
    id: 'execution',
    icon: ShieldCheck,
    title: 'Semi-Automated Execution',
    description: 'You are always in control. Tiwa finds the trades, you approve them.',
    features: [
      { name: 'Pending Signals', desc: 'Trades appear as PENDING with full logic and context.' },
      { name: 'Slide to Execute', desc: 'Review the risk/reward and slide to approve instantly.' },
      { name: 'Auto-Trading (Coming Soon)', desc: 'Fully automated execution for advanced users.' }
    ]
  },
  {
    id: 'ai',
    icon: Zap,
    title: 'Advanced AI Capabilities',
    description: 'More than just signals. Tiwa is your personal trading mentor.',
    features: [
      { name: 'Tiwa Copilot', desc: 'Chat with our AI for live market context and macro analysis.' },
      { name: 'Post-Trade Autopsy', desc: 'Smart journaling explains exactly why a trade won or lost.' },
      { name: 'Macro Radar', desc: 'Live countdowns to high-volatility news events (CPI, NFP).' }
    ]
  }
];

export function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      completeOnboarding();
      navigate('/');
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="h-[100dvh] bg-[#030712] flex flex-col relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

      {/* Progress Indicators */}
      <div className="pt-safe px-6 py-6 flex space-x-2 z-10">
        {slides.map((_, idx) => (
          <div 
            key={idx} 
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${idx <= currentSlide ? 'bg-amber-500' : 'bg-white/10'}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
              <slide.icon className="w-8 h-8 text-white" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">{slide.title}</h1>
              <p className="text-gray-400 text-lg leading-relaxed">{slide.description}</p>
            </div>

            <div className="space-y-4">
              {slide.features.map((feature, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (idx * 0.1) }}
                  key={idx} 
                  className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-start space-x-3"
                >
                  <div className="mt-0.5 p-1 bg-amber-500/20 rounded-full">
                    <Check className="w-3 h-3 text-amber-500" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{feature.name}</div>
                    <div className="text-xs text-gray-400 mt-1 leading-relaxed">{feature.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Action */}
      <div className="p-6 pb-safe z-10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 font-bold rounded-2xl px-5 py-4 flex items-center justify-center space-x-2 transition-all shadow-lg shadow-amber-500/20"
        >
          <span>{currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}

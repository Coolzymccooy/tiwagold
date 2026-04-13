import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, BarChart2, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Copilot } from './Copilot';

export function Layout() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: LayoutGrid, label: 'Feed' },
    { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex justify-center h-[100dvh] bg-black overflow-hidden">
      <div className="w-full max-w-md bg-[#030712] shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="min-h-full pb-28"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <Copilot />

        {/* Bottom Navigation - Premium Glassmorphism */}
        <nav className="absolute bottom-0 w-full z-50">
          {/* Gradient fade to black behind the glass */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent pointer-events-none h-32 -top-12" />
          
          <div className="relative glass-panel mx-4 mb-6 rounded-3xl flex justify-around items-center h-16 px-2 shadow-2xl shadow-black/50">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/' && location.pathname.startsWith('/trade/'));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative flex flex-col items-center justify-center w-16 h-full"
                >
                  <div className={cn(
                    "p-2 rounded-2xl transition-all duration-300 z-10",
                    isActive ? "text-amber-400" : "text-gray-500 hover:text-gray-300"
                  )}>
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {isActive && (
                    <motion.div 
                      layoutId="nav-indicator"
                      className="absolute inset-y-2 inset-x-2 bg-white/5 rounded-xl z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

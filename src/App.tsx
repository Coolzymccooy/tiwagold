import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Trades } from './pages/Trades';
import { TradeDetail } from './pages/TradeDetail';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Onboarding } from './pages/Onboarding';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isFirstLogin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isFirstLogin) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isFirstLogin } = useAuth();
  if (isAuthenticated && isFirstLogin) return <Navigate to="/onboarding" replace />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-center" theme="dark" richColors />
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            
            <Route path="/onboarding" element={
              <Onboarding />
            } />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Trades />} />
              <Route path="trade/:id" element={<TradeDetail />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

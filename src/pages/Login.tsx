import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Activity, ArrowRight, ShieldCheck, ScanFace, Eye, EyeOff, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, isSignUp);
      toast.success(isSignUp ? 'Account created successfully' : 'Successfully logged in');
      navigate('/');
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometric = async () => {
    setIsScanning(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
      await login('biometric@tiwagold.com');
      toast.success('Face ID Recognized');
      navigate('/');
    } catch (error) {
      toast.error('Biometric login failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      await login('google_user@tiwagold.com', isSignUp);
      toast.success('Google Sign In successful');
      navigate('/');
    } catch (error) {
      toast.error('Google Sign In failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      toast.error('Please enter your email address first to reset password');
      return;
    }
    toast.success(`Password reset link sent to ${email}`);
  };

  return (
    <div className="h-[100dvh] bg-[#030712] flex flex-col justify-center px-6 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -right-[10%] w-[70%] h-[50%] rounded-full bg-amber-500 blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[10%] -left-[20%] w-[60%] h-[60%] rounded-full bg-orange-600 blur-[120px] pointer-events-none" 
      />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-amber-400 to-orange-600 mb-6 shadow-2xl shadow-amber-500/20 relative">
            {isScanning && (
              <motion.div 
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)] z-20 rounded-full"
              />
            )}
            <Activity className="w-10 h-10 text-white relative z-10" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Tiwa Gold</h1>
          <p className="text-gray-400 text-sm">{isSignUp ? 'Create your account' : 'Precision trading intelligence'}</p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          onSubmit={handleAuth} 
          className="space-y-4"
        >
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all peer"
                placeholder="Email Address"
              />
              <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-[#030712] px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:text-amber-500">
                Email Address
              </label>
            </div>
            
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-12 py-4 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all peer"
                placeholder="Password"
              />
              <label className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-[#030712] px-2 peer-focus:px-2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-3 peer-focus:text-amber-500">
                Password
              </label>
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {!isSignUp && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex justify-end"
              >
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-sm text-amber-500 hover:text-amber-400 font-medium"
                >
                  Forgot Password?
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading || isScanning}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 font-bold rounded-2xl px-5 py-4 mt-2 flex items-center justify-center space-x-2 transition-all disabled:opacity-70 shadow-lg shadow-amber-500/20"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">Or continue with</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isScanning}
              className="w-full bg-white/5 border border-white/10 text-white font-bold rounded-2xl py-3.5 flex items-center justify-center space-x-2 transition-all hover:bg-white/10 disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleBiometric}
              disabled={isLoading || isScanning}
              className="w-full bg-white/5 border border-white/10 text-white font-bold rounded-2xl py-3.5 flex items-center justify-center space-x-2 transition-all hover:bg-white/10 disabled:opacity-70"
            >
              {isScanning ? (
                <div className="w-5 h-5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              ) : (
                <>
                  <ScanFace className="w-5 h-5 text-amber-400" />
                  <span>Face ID</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-600">
            <ShieldCheck className="w-3 h-3" />
            <span>Bank-grade security encryption</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

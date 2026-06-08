import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { auth, googleProvider, signInWithPopup } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Fingerprint, Lock, KeyRound, ArrowRight, CornerDownRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const AuthPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Biometric login states
  const [isScanning, setIsScanning] = useState(false);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [schoolCode, setSchoolCode] = useState('');
  const [pin, setPin] = useState('');
  
  // For standard real auth option
  const [showRealAuth, setShowRealAuth] = useState(false);

  // Auto navigate if already logged in (optional, but let's let them play with biometric if they want)
  // Let's redirect only if they arrived but are already logged in via firebase
  useEffect(() => {
    if (user && !showRealAuth) {
      // Just let them explore, but we can auto-navigate
    }
  }, [user]);

  const handleFingerprintClick = () => {
    if (isScanning || scanState === 'success') return;
    setIsScanning(true);
    setScanState('scanning');

    setTimeout(() => {
      setScanState('success');
      setIsScanning(false);
      
      // Save simulated session handle to local storage
      const existingName = localStorage.getItem('bonga_user_nickname');
      if (!existingName) {
        localStorage.setItem('bonga_user_nickname', 'Operator');
      }
      localStorage.setItem('bonga_biometric_unlocked', 'true');
      
      // Delay to show beautiful checkmark animation before routing
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }, 1800);
  };

  const handleUnlockPIN = (e: React.FormEvent) => {
    e.preventDefault();
    setScanState('scanning');
    setIsScanning(true);
    
    setTimeout(() => {
      setScanState('success');
      setIsScanning(false);
      const existingName = localStorage.getItem('bonga_user_nickname');
      if (!existingName) {
        localStorage.setItem('bonga_user_nickname', 'Operator');
      }
      localStorage.setItem('bonga_biometric_unlocked', 'true');
      setTimeout(() => {
        navigate('/');
      }, 800);
    }, 1200);
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (error) {
      console.error('Google Auth bypass failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-4 bg-[#F8FAFC]">
      {/* Container holding biometric mock design card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-slate-150 p-8 rounded-[2.5rem] shadow-xl text-slate-800 text-center flex flex-col items-center relative overflow-hidden"
      >
        {/* Glow backdrop graphic */}
        <div className="absolute top-[-10%] left-[-10%] w-[180px] h-[180px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header Branding */}
        <div className="mb-6">
          <Logo size={72} />
        </div>

        {/* Greeting Section */}
        <div className="mb-8">
          <p className="text-purple-primary font-display font-medium text-lg leading-none mb-1">
            Welcome back, {user?.displayName ? user.displayName.split(' ')[0] : (localStorage.getItem('bonga_user_nickname') || 'Operator')}
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">
            Secure Biometric Core
          </p>
        </div>

        {/* Primary Biometric Fingerprint Action */}
        <div className="mb-8 relative flex flex-col items-center">
          <div 
            onClick={handleFingerprintClick}
            className={`w-28 h-28 rounded-full border border-dashed flex items-center justify-center cursor-pointer transition-all ${
              scanState === 'scanning'
                ? 'border-purple-primary bg-purple-primary/5 scale-105'
                : scanState === 'success'
                ? 'border-emerald-500 bg-emerald-50 scale-100'
                : 'border-slate-205 bg-slate-50/50 hover:bg-slate-100 hover:border-purple-primary/40'
            }`}
          >
            <AnimatePresence mode="wait">
              {scanState === 'scanning' ? (
                <motion.div 
                  key="scanning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative flex items-center justify-center"
                >
                  {/* Rotating ripple circles */}
                  <div className="absolute inset-0 w-20 h-20 bg-purple-primary/10 rounded-full animate-ping" />
                  <Fingerprint className="text-purple-primary animate-pulse" size={48} strokeWidth={1.5} />
                </motion.div>
              ) : scanState === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex flex-col items-center justify-center text-emerald-500"
                >
                  <CheckCircle size={44} strokeWidth={2} className="animate-bounce" />
                </motion.div>
              ) : (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center text-purple-primary"
                >
                  <Fingerprint size={48} strokeWidth={1} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-widest mt-3.5 mb-1">
            {scanState === 'scanning' 
              ? 'Verifying Biometric Scan...' 
              : scanState === 'success'
              ? 'Biometric Mask Ok!'
              : 'Tap for immediate biometric access'}
          </p>
          <div className="h-1.5 w-12 rounded-full overflow-hidden bg-slate-100 mt-1">
            {scanState === 'scanning' && (
              <div className="bg-purple-primary h-full w-full animate-pulse" />
            )}
            {scanState === 'success' && (
              <div className="bg-emerald-500 h-full w-full" />
            )}
          </div>
        </div>

        {/* Alternative Code Input (PIN & School Code) */}
        <form onSubmit={handleUnlockPIN} className="w-full text-left space-y-4 mb-8">
          <div className="relative">
            <input 
              type="text" 
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              placeholder="School Code" 
              className="w-full py-2 px-1 bg-transparent border-b border-slate-200 focus:border-purple-primary outline-none text-xs font-semibold placeholder:text-slate-400 text-slate-800 transition-colors"
              required
            />
          </div>
          <div className="relative">
            <input 
              type="password" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Access PIN" 
              className="w-full py-2 px-1 bg-transparent border-b border-slate-200 focus:border-purple-primary outline-none text-xs font-semibold placeholder:text-slate-400 text-slate-800 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isScanning || scanState === 'success'}
            className="w-full mt-6 py-3 bg-[#4F46E5] hover:bg-[#3F37C9] disabled:bg-purple-300 text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-xs transition-colors shadow-lg active:scale-[0.98]"
          >
            <Lock size={13} className="text-indigo-150" />
            <span>Unlock Secure Core</span>
          </button>
        </form>

        {/* Extra: Bypass or Google Authentication Section */}
        <div className="w-full pt-4 border-t border-slate-100 flex flex-col items-center">
          {!showRealAuth ? (
            <button 
              onClick={() => setShowRealAuth(true)}
              className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 hover:text-purple-primary transition-colors flex items-center gap-1"
            >
              Operator Google Sign In <CornerDownRight size={10} />
            </button>
          ) : (
            <div className="w-full space-y-2">
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 shrink-0" />
                <span>Continue with Google</span>
              </button>
              <button 
                onClick={() => setShowRealAuth(false)}
                className="text-[9px] font-bold text-slate-400 hover:text-slate-700"
              >
                Back to Biometric View
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

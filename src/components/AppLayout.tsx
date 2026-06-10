import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  Home, 
  History, 
  Compass, 
  BookOpen, 
  User, 
  Clock, 
  Bell, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  HeartHandshake,
  FileText,
  AlertTriangle,
  Landmark,
  Coins,
  Globe,
  Settings,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Volume2,
  VolumeX,
  Phone,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signOut } from '../firebase';
import Onboarding from './Onboarding';
import Logo from './Logo';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState('08:49');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'EN' | 'SW'>('EN');
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isSirenActive, setIsSirenActive] = useState(false);

  // Acoustic alarm system powered by Web Audio API
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const oscRef = React.useRef<OscillatorNode | null>(null);
  const gainRef = React.useRef<GainNode | null>(null);

  const startSiren = () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // rich protective alarm sound
      osc.frequency.setValueAtTime(800, ctx.currentTime);

      // Sweep frequency up and down like a physical emergency beacon
      let isHigh = false;
      const interval = setInterval(() => {
        if (ctx.state === 'closed') {
          clearInterval(interval);
          return;
        }
        const freq = isHigh ? 720 : 1050;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        isHigh = !isHigh;
        if ('vibrate' in navigator) {
          navigator.vibrate(60);
        }
      }, 300);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      
      oscRef.current = osc;
      gainRef.current = gain;
      setIsSirenActive(true);

      // Store a cleanup on the osc node itself or use a ref for the interval
      (osc as any).intervalId = interval;
    } catch (err) {
      console.warn('Audio context restriction:', err);
    }
  };

  const stopSiren = () => {
    try {
      if (oscRef.current) {
        clearInterval((oscRef.current as any).intervalId);
        try {
          oscRef.current.stop();
        } catch (e) {}
        oscRef.current.disconnect();
        oscRef.current = null;
      }
      if (gainRef.current) {
        gainRef.current.disconnect();
        gainRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (err) {
      console.warn('Audio shutdown failed:', err);
    }
    setIsSirenActive(false);
  };

  // Safe cleanup on state changes or route changes
  useEffect(() => {
    return () => {
      // Auto shutdown sound if layout unmounts
      if (oscRef.current) {
        clearInterval((oscRef.current as any).intervalId);
        try {
          oscRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const triggerClickHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  };

  // Update time for the mockup status bar dynamically
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // high-fidelity 12-hour format like image or 24h
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Check if current path is an admin / operator full-screen dashboard
  const isOperatorDashboard = location.pathname.includes('-dashboard');

  if (isOperatorDashboard) {
    // Render full-screen layout for operator/admin dashboards on computer
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Simple Operator Desktop Menu */}
        <header className="bg-white border-b border-slate-200 py-3 px-6 flex justify-between items-center shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="font-display font-extrabold text-[#4F46E5] text-lg tracking-tight">Bonga Admin Control</span>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-[#4F46E5] text-[10px] font-bold uppercase tracking-widest rounded-md border border-indigo-200/50">
              {profile?.role || 'Operator'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-slate-800 hover:text-[#4F46E5] transition-colors uppercase tracking-widest py-1.5 px-4 bg-slate-100 rounded-xl"
            >
              ← Back to App View
            </button>
            <button
              onClick={() => {
                signOut(auth);
                navigate('/');
              }}
              className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest flex items-center gap-1.5"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>
        <main className="flex-grow overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  // Handle simulation features

  // Determine active Tab index
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/report') return 'report';
    if (path === '/support') return 'support';
    if (path === '/alerts') return 'safe-houses';
    if (path.startsWith('/resources')) return 'alerts';
    if (path === '/history') return 'cases';
    if (path === '/donate') return 'donate';
    if (path === '/profile' || path === '/auth') return 'profile';
    return '';
  };

  const activeTab = getActiveTab();

  const handleLogout = () => {
    signOut(auth);
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 relative overflow-x-hidden">
      {/* Dynamic global ambient blur graphics */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-200/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-205/30 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Global Responsive Header & Navbar */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-100 z-50 select-none">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo Brand Brandmark */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <Logo size={54} />
          </Link>

          {/* Center Links (Visible on Desktop / Tablet) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-2xl">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'home' 
                  ? 'bg-white text-[#4F46E5] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/report" 
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'report' 
                  ? 'bg-white text-[#4F46E5] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Report
            </Link>
            <Link 
              to="/support" 
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'support' 
                  ? 'bg-white text-[#4F46E5] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100/40'
              }`}
            >
              Support
            </Link>
            <Link 
              to="/resources" 
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'alerts' 
                  ? 'bg-white text-[#4F46E5] shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Alerts
            </Link>
          </nav>

          {/* Right Session / Operator Menu Button */}
          <div className="flex items-center gap-3 relative">
            {profile && profile.role !== 'User' && (
              <span className="hidden lg:inline-block px-2.5 py-0.5 bg-indigo-50 text-[#4F46E5] text-[9.5px] font-bold uppercase tracking-wider rounded-md border border-indigo-200/50">
                {profile.role.replace('/Teacher', '')}
              </span>
            )}
            
            {/* 🔔 Notifications Button and Simulator */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 transition-colors relative"
                title="Notifications"
                id="header-bell-btn"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-primary rounded-full animate-pulse" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-slate-150 rounded-2xl shadow-xl p-4 z-50 space-y-2 text-left"
                    id="notifications-dropdown"
                  >
                    <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider">Active Safeguards</span>
                      <span className="text-[8px] px-1.5 py-0.5 bg-indigo-50 text-[#4F46E5] font-extrabold rounded">Live telemetry</span>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-none">
                      <div className="p-2 hover:bg-slate-50 rounded-lg text-[10px] font-semibold text-slate-700 leading-relaxed border border-slate-50 flex items-start gap-2">
                        <ShieldAlert size={14} className="text-[#4F46E5] shrink-0 mt-0.5" />
                        <span>
                          <span className="text-purple-primary font-bold">Encrypted Tunnel Active</span>. Local anonymizer is screening secure reports.
                        </span>
                      </div>
                      <div className="p-2 hover:bg-slate-50 rounded-lg text-[10px] font-semibold text-slate-700 leading-relaxed border border-slate-50 flex items-start gap-2">
                        <MapPin size={14} className="text-[#4F46E5] shrink-0 mt-0.5" />
                        <span>
                          Merti Sanctuary and County Office telemetry directories mapped.
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-center text-[9px] uppercase tracking-widest text-[#4F46E5] font-extrabold pt-1.5 border-t border-slate-100 hover:text-purple-dark text-slate-400"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 👤 Profile with Google User Avatar */}
            <Link 
              to="/profile"
              className="w-8 h-8 rounded-full overflow-hidden border border-slate-201 flex items-center justify-center text-slate-600 hover:border-[#4F46E5] transition-colors shrink-0"
              title="User Profile"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={16} />
              )}
            </Link>

            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-9 h-9 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-850 transition-colors relative"
              title="More Options"
            >
              <Menu size={20} />
              {profile && profile.role !== 'User' && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#4F46E5] rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Global Slide Drawer for Operator panels & custom nodes */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-[270px] bg-white border-l border-slate-150 shadow-2xl z-[110] flex flex-col p-5"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-150 mb-4 shrink-0">
                <Logo size={48} />
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 flex-grow overflow-y-auto pr-1">
                <div>
                  <p className="text-[10px] font-extrabold text-[#4F46E5] uppercase tracking-widest mb-2 px-1">More Options</p>
                  <div className="space-y-0.5">
                    <Link 
                      to="/alerts" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Landmark size={14} className="text-emerald-500" />
                      <span>Safe Houses</span>
                      <ChevronRight size={12} className="text-slate-400 ml-auto" />
                    </Link>

                    <Link 
                      to="/donate" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <Coins size={14} className="text-indigo-500" />
                      <span>Donate</span>
                      <ChevronRight size={12} className="text-slate-400 ml-auto" />
                    </Link>

                    <Link 
                      to="/resources" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <BookOpen size={14} className="text-purple-primary" />
                      <span>Learning Hub</span>
                      <ChevronRight size={12} className="text-slate-400 ml-auto" />
                    </Link>

                    <Link 
                      to="/history" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors"
                    >
                      <History size={14} className="text-slate-500" />
                      <span>My Cases</span>
                      <ChevronRight size={12} className="text-slate-400 ml-auto" />
                    </Link>

                    {/* Interactive Simulated Language Action Selector */}
                    <button 
                      onClick={() => {
                        const nextLang = currentLanguage === 'EN' ? 'SW' : 'EN';
                        setCurrentLanguage(nextLang);
                        alert(`Language switched to ${nextLang === 'EN' ? 'English' : 'Kiswahili'}.`);
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors text-left"
                    >
                      <Globe size={14} className="text-blue-500" />
                      <span>Language: {currentLanguage === 'EN' ? 'English (EN)' : 'Kiswahili (SW)'}</span>
                      <span className="text-[8px] font-extrabold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded ml-auto">Swap</span>
                    </button>

                    {/* Interactive Simulated Security Level Indicator Toggle */}
                    <button 
                      onClick={() => {
                        alert("Safeguards configuration: Multi-hop encryption routing is enabled by default to protect children coordinates.");
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors text-left"
                    >
                      <Settings size={14} className="text-slate-500" />
                      <span>Box Settings</span>
                      <span className="text-[8px] font-extrabold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded ml-auto">SECURE</span>
                    </button>
                  </div>
                </div>

                {/* If operator roles exist */}
                {profile && profile.role !== 'User' && (
                  <div className="pt-3 border-t border-slate-150">
                    <p className="text-[10px] font-extrabold text-[#4F46E5] uppercase tracking-widest mb-2 px-1">Operator Portals</p>
                    <div className="space-y-1.5">
                      {profile.role === 'Admin' && (
                        <Link 
                          to="/admin-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50 text-orange-900 border border-orange-200/50 text-xs font-extrabold hover:bg-orange-100/60"
                        >
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck size={13} /> Admin Panel
                          </span>
                          <ChevronRight size={14} />
                        </Link>
                      )}

                      {(profile.role === 'Mentor/Teacher' || profile.role === 'Admin') && (
                        <Link 
                          to="/school-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200/50 text-xs font-extrabold hover:bg-purple-100/60"
                        >
                          <span>School Club Hub</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}

                      {(profile.role === 'Protection Officer' || profile.role === 'Admin') && (
                        <Link 
                          to="/protection-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200/50 text-xs font-extrabold hover:bg-blue-100/60"
                        >
                          <span>Protection Desk</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}

                      {(profile.role === 'Disaster Management Officer' || profile.role === 'Admin') && (
                        <Link 
                          to="/disaster-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/50 text-xs font-extrabold hover:bg-amber-100/60"
                        >
                          <span>Disaster Dispatch</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-150 pt-3">
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-650 hover:bg-red-100 border border-red-200/40 font-bold text-xs uppercase tracking-widest transition-colors"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                ) : (
                  <Link 
                    to="/auth" 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#4F46E5] text-white font-bold text-xs uppercase tracking-widest transition-colors text-center shadow-xs hover:bg-[#3F37C9]"
                  >
                    Login Account
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Spacious Content Body Container */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 pb-24 md:pb-12 relative z-10">
        {children}
      </main>

      {/* Floating Modern Native-style bottom Navigation bar ONLY visible on Mobile standard screen ports */}
      <div className="md:hidden fixed bottom-4 inset-x-4 bg-white/95 backdrop-blur-md border border-slate-200/60 py-2.5 px-2 flex justify-around items-center rounded-2xl shadow-lg z-40 select-none animate-fadeIn">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all ${
            activeTab === 'home' ? 'text-[#4F46E5] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={18} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Home</span>
        </Link>

        <Link 
          to="/report" 
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all ${
            activeTab === 'report' ? 'text-[#4F46E5] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText size={18} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Report</span>
        </Link>

        <Link 
          to="/support" 
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all ${
            activeTab === 'support' ? 'text-[#4F46E5] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <HeartHandshake size={18} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Support</span>
        </Link>

        <Link 
          to="/resources" 
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all ${
            activeTab === 'alerts' ? 'text-[#4F46E5] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertTriangle size={18} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Alerts</span>
        </Link>

        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center gap-1 w-14 transition-all ${
            activeTab === 'profile' ? 'text-[#4F46E5] scale-105 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={18} />
          <span className="text-[9px] font-bold uppercase tracking-tight">Profile</span>
        </Link>
      </div>

      {/* Real-time Floating SOS Panic Button */}
      <motion.button
        id="floating-sos-btn"
        onClick={() => {
          triggerClickHaptic();
          setIsSOSOpen(true);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-45 w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(220,38,38,0.4)] cursor-pointer text-center select-none"
        title="Emergency Panic SOS"
      >
        <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-25 pointer-events-none" />
        <AlertCircle size={20} className="text-white relative z-10" />
        <span className="text-[9px] font-bold tracking-wider uppercase leading-none mt-0.5 relative z-10">SOS</span>
      </motion.button>

      {/* SOS Emergency Dashboard Dialog */}
      <AnimatePresence>
        {isSOSOpen && (
          <>
            {/* Dark glass backdrop mask */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsSOSOpen(false);
                stopSiren();
              }}
              className="fixed inset-0 bg-slate-900/65 backdrop-blur-md z-[150] flex items-center justify-center p-4 select-none"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-white border border-slate-100 rounded-[2.2rem] shadow-2xl p-6 relative flex flex-col text-left overflow-hidden"
              >
                {/* Red alert label indicator */}
                <div className="absolute top-0 inset-x-0 h-2 bg-red-600" />

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-display font-bold text-slate-900 leading-tight">
                      Emergency response panel
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Immediate Local Safeguards
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsSOSOpen(false);
                      stopSiren();
                    }}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Option 1: Acoustic Sirens deterrent */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isSirenActive 
                      ? 'bg-red-50 border-red-200 animate-pulse' 
                      : 'bg-slate-50 border-slate-150'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                          isSirenActive ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isSirenActive ? <Volume2 size={18} className="animate-bounce" /> : <VolumeX size={18} />}
                        </div>
                        <div>
                          <h3 className={`text-xs font-bold ${isSirenActive ? 'text-red-950' : 'text-slate-800'}`}>
                            Sound Defensive Siren
                          </h3>
                          <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                            Play loud tone & trigger phone haptic warning
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          triggerClickHaptic();
                          if (isSirenActive) {
                            stopSiren();
                          } else {
                            startSiren();
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          isSirenActive 
                            ? 'bg-red-600 text-white' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-205'
                        }`}
                      >
                        {isSirenActive ? 'Mute' : 'Activate'}
                      </button>
                    </div>
                  </div>

                  {/* Option 2: Offline Emergency cellular coordinates */}
                  <div 
                    onClick={() => {
                      setIsSOSOpen(false);
                      stopSiren();
                      navigate('/');
                      setTimeout(() => {
                        window.dispatchEvent(new Event('bonga_trigger_sms_modal'));
                      }, 100);
                    }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-150 hover:border-indigo-400 cursor-pointer transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0">
                        <ShieldAlert size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          Offline SMS Dispatcher
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                          Compile GPS cellular tower package to dispatch
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>

                  {/* Option 3: Direct helpline phone dials */}
                  <div 
                    onClick={() => {
                      triggerClickHaptic();
                      alert("Simulating emergency dial to Country Child Rescue Hub: Dialing 116...");
                    }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-150 hover:border-[#06B6D4] cursor-pointer transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Phone size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          Call Child Protection (116)
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                          Toll-free 24/7 children voice helpline
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </div>

                <div className="mt-5 bg-slate-50 rounded-xl p-3.5 border border-slate-150/40 text-[9.5px] text-slate-500 font-semibold leading-relaxed text-center">
                  All transmissions are metadata-stripped. If you are in immediate physical threat, run towards the nearest high-altitude Safe House.
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Onboarding />
    </div>
  );
};

export default AppLayout;

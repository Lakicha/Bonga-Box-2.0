import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { 
  ShieldCheck, 
  ChevronRight, 
  MapPin, 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  PhoneCall, 
  MessageSquare, 
  Signal, 
  WifiOff, 
  Sparkles, 
  Copy, 
  Check, 
  Compass, 
  BookOpen, 
  User, 
  X, 
  UserCheck,
  HeartHandshake,
  Landmark,
  Coins,
  Bell,
  Heart,
  CloudRain,
  AlertCircle,
  FileText,
  Zap,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mode state: true = Online Mode, false = Offline Mode
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // USSD Overlay state
  const [isUSSDOpen, setIsUSSDOpen] = useState<boolean>(false);
  const [ussdDialing, setUssdDialing] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Nickname or profile name
  const [nickname] = useState(() => {
    return localStorage.getItem('bonga_user_nickname') || 'Theo';
  });

  // Safety scans state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<string>('02:44 PM');

  // Trigger Safety Scan
  const handleRunCheck = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep(0);

    const steps = [
      'Establishing biometric secure index...',
      'Verifying encrypted county cell relay...',
      'Monitoring flash meteorology indexes...',
      'Safety check complete. Node all-clear.'
    ];

    const timer = setInterval(() => {
      setScanStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            setIsScanning(false);
            const now = new Date();
            setLastCheckTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText("*123#");
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // User details
  const displayName = user?.displayName 
    ? user.displayName.split(' ')[0] 
    : (user?.email ? user.email.split('@')[0] : nickname);

  // Render USSD dial simulation
  const triggerUSSDDialSim = () => {
    setUssdDialing(true);
    setTimeout(() => {
      setUssdDialing(false);
      setIsUSSDOpen(false);
      alert("USSD safety response initiated. Live dispatch registered your offline ping.");
    }, 1500);
  };

  return (
    <div className="font-sans max-w-4xl mx-auto py-2 px-1 relative select-none">
      
      {/* Top Interactive Connectivity Switch (Online vs Offline Demonstration) */}
      <div className="flex justify-between items-center bg-white border border-slate-150 rounded-2xl px-4 py-2.5 mb-6 shadow-xs max-w-xs ml-auto">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          {isOnline ? (
            <>
              <Signal size={12} className="text-emerald-500 animate-pulse" /> Live Connectivity
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-purple-primary animate-pulse" /> Emergency SMS/USSD Only
            </>
          )}
        </span>
        <button
          onClick={() => {
            setIsOnline(!isOnline);
            // Alert user of mockup demonstration view
          }}
          className={`px-3 py-1 text-[8.5px] font-bold rounded-lg transition-all flex items-center gap-1 ${
            isOnline 
              ? 'bg-purple-105 hover:bg-purple-150 text-[#4F46E5]' 
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {isOnline ? (
            <>
              <Zap size={10} />
              <span>Go Offline</span>
            </>
          ) : (
            <>
              <Globe size={10} />
              <span>Go Online</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isOnline ? (
          /* ==================================================================== */
          /* 2. PREMIUM HOME (ONLINE MAIN DASHBOARD)                             */
          /* ==================================================================== */
          <motion.div
            key="online-home"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* 2. Premium Home Bento Header: Profile Thumbnail & SAFE badge */}
            <div className="bg-white border border-slate-150 rounded-[2.2rem] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
              <div className="flex items-center gap-4">
                {/* Profile Thumbnail with PROTECT indicators */}
                <div className="relative w-14 h-14 rounded-full border border-slate-150 shrink-0 flex items-center justify-center bg-indigo-50/70 text-[#4F46E5] overflow-hidden">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={displayName} 
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 text-[#4F46E5] font-display font-black text-sm rounded-full">
                      {displayName ? displayName.substring(0, 2).toUpperCase() : <User size={18} />}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
                    <Check size={8} strokeWidth={4} />
                  </div>
                </div>

                <div>
                  <h1 className="text-lg sm:text-xl font-display font-extrabold text-slate-900 leading-tight">
                    Welcome, {displayName}
                  </h1>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 mb-2">
                    Safe Space Club Member
                  </p>
                  
                  {/* Replay Onboarding Carousel button */}
                  <button 
                    onClick={() => window.dispatchEvent(new Event('bonga_trigger_onboarding_carousel'))}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#4F46E5] to-[#3F37C9] text-white text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all text-left"
                    title="Launch interactive guidelines"
                  >
                    <Sparkles size={10} className="text-amber-300 animate-pulse" />
                    <span>Launch Safety Carousel Tour</span>
                  </button>
                </div>
              </div>

              {/* Centered SAFE Status Badge with Green Tinted Glow */}
              <div className="bg-emerald-50/70 border border-emerald-150/40 rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-sm hover:shadow-emerald-100/30 transition-all max-w-sm md:shrink-0">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center animate-pulse">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-display font-black text-xs uppercase tracking-wide">SAFE</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-bold">System Status: All Protected</p>
                </div>
              </div>
            </div>

            {/* Environmental Shield: Two minimalist cards showing "Operational Status" and "Last Sync" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-primary/5 flex items-center justify-center text-[#4F46E5] shrink-0">
                  <Signal size={15} />
                </div>
                <div>
                  <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest">Operational Status</p>
                  <p className="text-xs font-bold text-purple-primary font-mono mt-0.5">ACTIVE SECURE ENVELOPE</p>
                </div>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-primary/5 flex items-center justify-center text-[#4F46E5] shrink-0">
                    <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <p className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest">Last Sync Time</p>
                    <p className="text-xs font-bold text-purple-primary font-mono mt-0.5">{lastCheckTime}</p>
                  </div>
                </div>
                <button
                  onClick={handleRunCheck}
                  disabled={isScanning}
                  className="px-2.5 py-1 hover:bg-slate-50 border border-slate-205 rounded-lg text-[8.5px] font-black text-slate-950 uppercase tracking-wider transition-colors disabled:opacity-40"
                >
                  Sync Now
                </button>
              </div>
            </div>

            {/* Active safety check details during handshake */}
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-2xl text-[10px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-purple-primary rounded-full animate-spin" />
                  <span className="font-extrabold text-purple-primary uppercase tracking-wide">Syncing local matrices...</span>
                </div>
                <p className="text-slate-600 font-semibold italic pl-5.5">
                  {[
                    'Mapping safe lines...',
                    'Connecting cell relays...',
                    'Refreshed meteorology coordinates...',
                    'Success: Fully loaded.'
                  ][scanStep]}
                </p>
              </motion.div>
            )}

            {/* Critical Channels: FGM Risk and Flood Alert Action Bento Cards */}
            <div>
              <p className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest pl-1 mb-2.5">
                Active Protection Nodes
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Row 1: Item 1 - Emergency SOS */}
                <div 
                  onClick={() => setIsUSSDOpen(true)}
                  className="bg-red-50/40 border border-red-105 hover:border-red-300 rounded-2xl p-5 transition-all cursor-pointer shadow-xs group text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-8 -mt-8" />
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-650 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <AlertCircle size={20} className="animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-display font-black text-red-950 group-hover:text-red-750 transition-colors">
                      Emergency SOS Dispatch
                    </h3>
                    <ChevronRight size={14} className="text-red-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-red-700/80 leading-normal font-semibold">
                    Anonymously alert community guardians immediately. Dial interactive fallback USSD codes without internet access.
                  </p>
                </div>

                {/* Row 1: Item 2 - Report Incident */}
                <div 
                  onClick={() => navigate('/report')}
                  className="bg-white border border-slate-150 rounded-2xl p-5 hover:border-[#4F46E5]/40 transition-all cursor-pointer shadow-xs group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <FileText size={20} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-display font-black text-slate-900 group-hover:text-purple-primary transition-colors">
                      Report Incident
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                    Submit a secure, metadata-stripped report. Multi-party coordination guarantees immediate officer responses.
                  </p>
                </div>

                {/* Row 2: Item 1 - Talk to Counselor */}
                <div 
                  onClick={() => navigate('/support')}
                  className="bg-white border border-slate-150 rounded-2xl p-5 hover:border-[#4F46E5]/40 transition-all cursor-pointer shadow-xs group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-650 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <HeartHandshake size={20} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-display font-black text-slate-900 group-hover:text-purple-primary transition-colors">
                      Talk to Counselor
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                    Speak securely with protection officers and gender-based violence advisors with fully anonymous chat logs.
                  </p>
                </div>

                {/* Row 2: Item 2 - Find Safe House */}
                <div 
                  onClick={() => navigate('/alerts')}
                  className="bg-white border border-slate-150 rounded-2xl p-5 hover:border-[#4F46E5]/40 transition-all cursor-pointer shadow-xs group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <Landmark size={20} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-display font-black text-slate-900 group-hover:text-purple-primary transition-colors">
                      Find Safe House
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                    Locate nearby school sanctuaries and humanitarian hubs with offline road navigation directions.
                  </p>
                </div>

                {/* Row 3: Item 1 - Flood Alerts */}
                <div 
                  onClick={() => navigate('/alerts')}
                  className="bg-white border border-slate-150 rounded-2xl p-5 hover:border-[#4F46E5]/40 transition-all cursor-pointer shadow-xs group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-display font-black text-slate-900 group-hover:text-purple-primary transition-colors">
                      Flood Alerts & Shelters
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                    Live county water levels and meteorology telemetry charts with rain advisory alerts.
                  </p>
                </div>

                {/* Row 3: Item 2 - Learning Hub */}
                <div 
                  onClick={() => navigate('/resources')}
                  className="bg-white border border-slate-150 rounded-2xl p-5 hover:border-[#4F46E5]/40 transition-all cursor-pointer shadow-xs group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-display font-black text-slate-900 group-hover:text-purple-primary transition-colors">
                      Learning Hub
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                    Read climate defense guidelines, health rights safety booklets, and community club manuals.
                  </p>
                </div>

                {/* Row 4: Item 1 - Donate */}
                <div 
                  onClick={() => navigate('/donate')}
                  className="bg-white border border-slate-150 rounded-2xl p-5 hover:border-[#4F46E5]/40 transition-all cursor-pointer shadow-xs group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <Coins size={20} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-display font-black text-slate-900 group-hover:text-purple-primary transition-colors">
                      Donate & Support
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                    Fund critical rescue operations and secure local sanctuaries to protect vulnerable young girls.
                  </p>
                </div>

                {/* Row 4: Item 2 - Community Updates */}
                <div 
                  onClick={() => alert("Under active construction: County coordinators are updating local shelter registries real-time.")}
                  className="bg-white border border-slate-150 rounded-2xl p-5 hover:border-[#4F46E5]/40 transition-all cursor-pointer shadow-xs group text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50/60 text-indigo-650 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <Sparkles size={20} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-display font-black text-slate-900 group-hover:text-purple-primary transition-colors">
                      Community Updates
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-semibold">
                    Read the latest community defense briefs and emergency planning resources from coordinators.
                  </p>
                </div>

              </div>
            </div>

            {/* Offline Access: Contrasting Dark-Navy Footer Section */}
            <div className="bg-slate-900 text-white rounded-[2.2rem] p-6 shadow-lg border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-400/20 text-indigo-400 text-[8px] font-black uppercase rounded tracking-wider">
                    Offline Access Node
                  </span>
                  <h3 className="text-base font-display font-black text-white mt-1.5 mb-1">
                    No active cell data connection?
                  </h3>
                  <p className="text-[10.5px] text-slate-400 leading-normal font-medium max-w-md">
                    Use our verified analog fallbacks to stream location telemetry reports to dispatchers with absolute anonymity.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 shrink-0">
                  <button
                    onClick={() => setIsUSSDOpen(true)}
                    className="flex items-center gap-1.5 px-4.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-transform active:scale-95"
                  >
                    <PhoneCall size={12} className="text-indigo-200" />
                    <span>Dial USSD</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsOnline(false);
                      // Simulates switching to SMS mode
                    }}
                    className="flex items-center gap-1.5 px-4.5 py-3 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-bold rounded-xl text-xs transition-transform active:scale-95"
                  >
                    <MessageSquare size={13} className="text-[#06B6D4]" />
                    <span>Send SMS Report</span>
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        ) : (
          /* ==================================================================== */
          /* 8. OFFLINE CONNECTIVITY GATEWAY (EMERGENCY STATUS)                    */
          /* ==================================================================== */
          <motion.div
            key="offline-gateway"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white border border-slate-150 rounded-[2.2rem] p-10 shadow-lg text-center flex flex-col items-center max-w-md mx-auto my-6"
          >
            {/* Large purple signal-slash icon in center */}
            <div className="w-20 h-20 bg-purple-primary/5 text-purple-primary rounded-full flex items-center justify-center mb-6 border border-purple-primary/10">
              <WifiOff size={44} strokeWidth={1.5} className="animate-pulse" />
            </div>

            {/* Message title */}
            <h2 className="text-xl font-display font-black text-purple-primary tracking-tight leading-none mb-2.5">
              You're Offline
            </h2>
            
            <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6 max-w-xs mx-auto">
              Internet connection lost or low cell data detected. Bonga Box has automatically routed to SMS & USSD emergency mode.
            </p>

            {/* Two stacked primary call-to-actions */}
            <div className="w-full space-y-3">
              <button
                onClick={() => {
                  alert("SMS safety transmission prepared. This sends masked, compressed report coordinates directly through local cellular towers.");
                }}
                className="w-full py-3.5 bg-purple-primary hover:bg-purple-dark text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-xs transition-transform active:scale-[0.98] shadow-md"
              >
                <MessageSquare size={14} className="text-purple-105" />
                <span>Send SMS Report</span>
              </button>

              <button
                onClick={() => setIsUSSDOpen(true)}
                className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs transition-transform active:scale-[0.98]"
              >
                <PhoneCall size={13} className="text-purple-primary" />
                <span>Dial *123#</span>
              </button>
            </div>

            <button
              onClick={() => setIsOnline(true)}
              className="text-[9.5px] font-bold text-slate-400 hover:text-purple-primary transition-colors uppercase tracking-widest mt-6 cursor-pointer"
            >
              Back to Online Interface
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================================================================== */
      /* 9. USSD DIALING OVERLAY (QUICK ACTION)                              */
      /* ==================================================================== */}
      <AnimatePresence>
        {isUSSDOpen && (
          <>
            {/* Blurred glass white backdrop mask */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUSSDOpen(false)}
              className="fixed inset-0 bg-white/70 backdrop-blur-md z-150 flex items-center justify-center p-4"
            >
              {/* Centered small white card modal */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card
                className="w-full max-w-sm bg-white border border-slate-150 p-6 rounded-[2rem] shadow-2xl relative text-center"
              >
                {/* Close handle button */}
                <button 
                  onClick={() => setIsUSSDOpen(false)}
                  className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X size={15} />
                </button>

                {/* Subtitle / Context label */}
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 mt-1">
                  Bonga Analog Network
                </p>

                {/* USSD code displayed in large, bold purple */}
                <div className="bg-purple-primary/5 py-4 px-2 rounded-2xl mb-5 border border-purple-primary/10">
                  <span className="text-3xl font-display font-black text-purple-primary tracking-tight font-mono">
                    *123#
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6 px-1">
                  Connect without internet to file local FGM incidents, status logs, and spatial flash flood warnings instantly.
                </p>

                {/* Interaction Actions */}
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    onClick={triggerUSSDDialSim}
                    disabled={ussdDialing}
                    className="w-full py-3 bg-[#4F46E5] hover:bg-[#3F37C9] text-white font-extrabold text-xs tracking-wide rounded-xl flex items-center justify-center gap-1.5 shadow-md"
                  >
                    {ussdDialing ? (
                      <span className="animate-pulse">Loading interface...</span>
                    ) : (
                      <>
                        <PhoneCall size={12} />
                        <span>Dial Now</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCopyCode}
                    className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-205 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check size={12} className="text-emerald-500" />
                        <span className="text-emerald-600 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} className="text-slate-500" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacing Footnotes */}
      <footer className="mt-8 pt-4 border-t border-slate-100 text-center">
        <p className="text-[9px] text-text-dim leading-relaxed max-w-md mx-auto">
          Standard telecom safety regulations apply. Analog cells log data hashes under secure county dispatch authorities.
        </p>
      </footer>

    </div>
  );
};

export default Home;

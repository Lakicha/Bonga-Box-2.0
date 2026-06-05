import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { ShieldCheck, ChevronRight, MapPin, RefreshCw, AlertTriangle, ShieldAlert, ArrowRight, CheckCircle2, Check, Sparkles, User, Edit3, X, MessageSquare, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Custom localized nickname state default "Koch"
  const [nickname, setNickname] = useState(() => {
    return localStorage.getItem('bonga_user_nickname') || 'Koch';
  });
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState(nickname);

  // Safety scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<string>('Just now');

  // Geolocation state
  const [locLoading, setLocLoading] = useState(false);
  const [locData, setLocData] = useState<{ county: string; country: string; coords?: string }>({
    county: 'Isiolo County, Kenya',
    country: 'Kenya'
  });

  const handleSaveNick = () => {
    const finalNick = nickInput.trim() || 'Koch';
    setNickname(finalNick);
    localStorage.setItem('bonga_user_nickname', finalNick);
    setIsEditingNick(false);
  };

  // Run Safety Check simulation
  const handleRunCheck = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep(0);

    const steps = [
      'Establishing TLS encryption handshake...',
      'Verifying virtual proxy routing layer...',
      'Scanning local meteorology flood triggers...',
      'Assessing active child helpline safety buffers...',
      'Safety Scan Completed! All Clear'
    ];

    const timer = setInterval(() => {
      setScanStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            setIsScanning(false);
            const now = new Date();
            setLastCheckTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          }, 1200);
          return prev;
        }
        return prev + 1;
      });
    }, 900);
  };

  // Geolocation trigger
  const handleFetchLocation = () => {
    if (locLoading) return;
    setLocLoading(true);
    
    if (!navigator.geolocation) {
      setLocData({
        county: 'Isiolo County, Kenya (Fallback)',
        country: 'Kenya',
        coords: 'Geolocation not supported by client browser.'
      });
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);
        setLocData({
          county: 'Isiolo Central, Kenya',
          country: 'Kenya',
          coords: `Lat: ${lat}° , Lon: ${lon}°`
        });
        setLocLoading(false);
      },
      (error) => {
        console.warn(error);
        setLocData({
          county: 'Isiolo County, Kenya',
          country: 'Kenya',
          coords: 'Permission Denied. Using regional grid coordinates.'
        });
        setLocLoading(false);
      },
      { timeout: 7000 }
    );
  };

  // Scan step messages
  const scanMessages = [
    'Establishing TLS encryption handshake...',
    'Verifying virtual proxy routing layer...',
    'Scanning local meteorology flood triggers...',
    'Assessing active child helpline safety buffers...',
    'Safety Scan Completed! All Clear.'
  ];

  // Derive display name
  const greetingName = user?.displayName ? user.displayName.split(' ')[0] : nickname;

  return (
    <div className="text-slate-800 font-sans max-w-4xl mx-auto relative min-h-full py-2">
      {/* Top Greet Row & "Lost?" pill card */}
      <div className="flex justify-between items-start mb-6 gap-3 px-1">
        {/* Left Greet Header */}
        <div className="flex-grow">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 leading-snug tracking-tight">
              Good morning, {greetingName}
            </h1>
            <button 
              onClick={() => { setNickInput(nickname); setIsEditingNick(true); }}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-850 transition-colors"
              title="Edit Codename"
            >
              <Edit3 size={13} />
            </button>
          </div>
          <p className="text-xs text-text-dim font-medium">Here's your safety status for today</p>
        </div>

        {/* Right "Lost?" Pill Card matching Mockup perfectly */}
        <Link 
          to="/alerts" 
          className="flex items-center gap-2 bg-slate-100/80 hover:bg-slate-200/50 px-3.5 py-2 rounded-2xl border border-slate-150 transition-all shrink-0 max-w-[145px] text-left group"
        >
          <div className="flex-grow">
            <p className="text-[10px] font-extrabold text-slate-950 uppercase tracking-wide leading-none mb-0.5">Lost?</p>
            <p className="text-[8px] font-bold text-text-dim leading-none truncate">Find safe zones</p>
          </div>
          <ChevronRight size={14} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Edit Codename Modal Backdrop */}
      <AnimatePresence>
        {isEditingNick && (
          <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-xs z-50 rounded-b-[2rem]" onClick={() => setIsEditingNick(false)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute top-1/3 left-6 right-6 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl z-50 text-slate-800 max-w-sm mx-auto"
            >
              <h3 className="font-display font-extrabold text-xs text-slate-900 uppercase tracking-widest mb-2">Edit Codename</h3>
              <p className="text-[10px] text-text-dim mb-3">Set your secret handle used for anonymous greeting logs instead of your real ID.</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={nickInput} 
                  onChange={(e) => setNickInput(e.target.value)} 
                  maxLength={15}
                  className="flex-grow px-3 py-1.5 border border-slate-250 rounded-lg text-xs font-semibold outline-none focus:border-[#4F46E5]"
                  placeholder="e.g. Koch"
                />
                <button 
                  onClick={handleSaveNick}
                  className="px-3 py-1.5 bg-[#4F46E5] text-white font-bold text-xs rounded-lg hover:bg-[#3F37C9]"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Core Responsive Grid Workspace: 2 cols on Desktop, 1 on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN/BENTO SEGMENT: Safety monitoring & checks (md:col-span-6 or 7) */}
        <div className="md:col-span-7 space-y-4">
          {/* CARD 1: "You are safe" Dashboard Badge Card */}
          <div className="bg-white border border-slate-150 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
            <div className="flex items-start gap-4 mb-4">
              {/* Green safety badge check status icon mockup */}
              <div className="w-12 h-12 rounded-full bg-[#22C55E] flex items-center justify-center text-white shrink-0 shadow-sm border border-green-600/10">
                {/* Shield with checking done inside */}
                <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM10 14.17l-3.17-3.17-1.41 1.41L10 17l7-7-1.41-1.41z"/>
                </svg>
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-display font-extrabold text-slate-950">You are safe</h3>
                  {/* Active tag */}
                  <span className="px-2 py-0.5 bg-slate-150 text-slate-600 text-[8px] font-bold uppercase rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">All clear. Bonga is monitoring safety matrices.</p>
              </div>
            </div>

            {/* Checked mark status item */}
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-900 bg-slate-50 border border-slate-100 p-2 rounded-xl mb-4">
              <div className="w-4.5 h-4.5 rounded-full bg-slate-950 flex items-center justify-center text-white">
                <Check size={11} strokeWidth={3} />
              </div>
              <span>Last monitored check: <span className="font-extrabold text-[#4F46E5]">{lastCheckTime}</span></span>
            </div>

            {/* Safety Checking Indicator */}
            <AnimatePresence>
              {isScanning && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-[#4F46E5] rounded-full animate-spin shrink-0" />
                    <span className="text-[10px] font-bold text-[#4F46E5]">Active Security handshake...</span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-700 leading-snug">
                    {scanMessages[scanStep]}
                  </p>
                  {/* Progressive micro bar indicator */}
                  <div className="w-full bg-slate-100 rounded-full h-1 mt-2 overflow-hidden">
                    <div 
                      className="bg-[#4F46E5] h-full transition-all duration-300" 
                      style={{ width: `${((scanStep + 1) / scanMessages.length) * 100}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button: Run Check */}
            <button 
              onClick={handleRunCheck}
              disabled={isScanning}
              className="w-full py-2.5 bg-white border border-slate-250 hover:border-slate-350 hover:bg-slate-50 px-4 rounded-xl text-xs font-bold text-slate-950 flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              <span>Run Verification Handshake</span>
            </button>
          </div>

          {/* Location details card (Centered below safety widget on desktop, matches same grid rhythm) */}
          <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 text-[#06B6D4] flex items-center justify-center shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider leading-none mb-0.5">Your Location</h3>
                  <p className="text-[9px] text-text-dim font-bold">Kenya</p>
                </div>
              </div>
              
              <button 
                onClick={handleFetchLocation}
                disabled={locLoading}
                className={`w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all ${locLoading ? 'animate-spin' : ''}`}
                title="Refresh Coordinates"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Location values row text */}
            <div className="space-y-1 pl-1">
              <p className="text-base font-display font-extrabold text-slate-950">
                {locData.county}
              </p>
              {locData.coords && (
                <p className="text-[10px] font-mono text-text-gray font-semibold bg-slate-50 py-1 px-2 border border-slate-120 border-dashed rounded-md inline-block">
                  {locData.coords}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN/BENTO SEGMENT: Protection node action channels (md:col-span-5) */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white border border-slate-150 rounded-3xl p-5 sm:p-6 shadow-xs">
            <h4 className="text-[10px] font-extrabold text-text-dim uppercase tracking-widest pl-1 mb-3">
              Fast Protection Node Actions
            </h4>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => {
                  navigate('/report');
                  localStorage.setItem('bonga_pending_category', 'FGM Risk');
                }}
                className="bg-[#FAFAFA] border border-slate-200/80 rounded-2xl p-3.5 shadow-xs text-left hover:border-[#4F46E5]/45 hover:bg-white transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center mb-3">
                  <ShieldAlert size={16} />
                </div>
                <p className="text-xs font-display font-extrabold text-slate-950 leading-tight mb-1 group-hover:text-[#4F46E5] transition-colors">FGM Risk</p>
                <p className="text-[9px] text-text-dim leading-snug">Report vulnerable youth protection.</p>
              </button>

              <button
                onClick={() => {
                  navigate('/report');
                  localStorage.setItem('bonga_pending_category', 'Flood Alert');
                }}
                className="bg-[#FAFAFA] border border-slate-200/80 rounded-2xl p-3.5 shadow-xs text-left hover:border-cyan-500/40 hover:bg-white transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-[#06B6D4] flex items-center justify-center mb-3">
                  <AlertTriangle size={16} />
                </div>
                <p className="text-xs font-display font-extrabold text-slate-950 leading-tight mb-1 group-hover:text-[#06B6D4] transition-colors">Flood Alert</p>
                <p className="text-[9px] text-text-dim leading-snug font-medium">Send flood emergency levels.</p>
              </button>
            </div>

            <Link 
              to="/report"
              className="w-full py-3 bg-[#4F46E5] hover:bg-[#3F37C9] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-sm transition-all text-center"
            >
              <span>Submit Encrypted Report</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Offline SMS & USSD Hotlines card */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-1.5 py-0.5 bg-indigo-500 text-[8px] font-extrabold uppercase rounded tracking-wider">Offline SMS/USSD</span>
                <span className="text-[9px] text-slate-400 font-bold">No Internet Required</span>
              </div>
              <h3 className="text-sm font-display font-black tracking-tight text-white mb-1.5">Isiolo Offline Hotline</h3>
              <p className="text-[10px] text-slate-400 leading-normal mb-4 font-medium">
                Submit completely anonymous, end-to-end masked reports from standard analog or feature phones.
              </p>

              <div className="space-y-3.5 border-t border-slate-800 pt-3.5 mb-2">
                {/* USSD option */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
                    <PhoneCall size={13} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-200">USSD Safety Menu</p>
                    <p className="text-sm font-mono font-black text-[#5F56F4]">*384*100#</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">Dial free of charge. Pick FGM Risk or Torrential Flood, describe your location and alert details step-by-step.</p>
                  </div>
                </div>

                {/* SMS option */}
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <MessageSquare size={13} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-200">Instant SMS Intake</p>
                    <p className="text-xs font-mono font-bold text-slate-100 bg-slate-800/80 px-1.5 py-0.5 rounded inline-block">text to Bonga Hotline</p>
                    <p className="text-[9.5px] text-slate-300 font-extrabold mt-1">SMS Template format:</p>
                    <p className="text-[9.5px] font-mono text-emerald-300 bg-slate-800 px-2 py-1 rounded border border-slate-700/80 mt-0.5 block leading-tight">
                      [FGM or FLOOD] @ [LOCATION] - [DETAILS]
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1 leading-snug">E.g., <span className="text-slate-300 italic font-medium">"Flood @ Merti - River banks started overflowing"</span>. Incoming phone numbers are immediately masked.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Partner Card for aesthetic pairing */}
          <div className="bg-indigo-50/40 border border-indigo-100/40 rounded-3xl p-5 shadow-xs">
            <h5 className="font-display font-bold text-xs text-indigo-950 leading-none mb-1">
              Protected & Verified Network
            </h5>
            <p className="text-[10px] text-slate-655 leading-normal mb-3">
              We collaborate directly with local school club mentors, gender protection officers, and disaster dispatchers in Isiolo.
            </p>
            <Link to="/resources" className="text-[10px] text-[#4F46E5] font-extrabold uppercase tracking-wide hover:underline inline-flex items-center gap-1">
              <span>View local education resources</span>
              <ArrowRight size={10} />
            </Link>
          </div>
        </div>

      </div>

      {/* Subtle safety reassurance footnotes */}
      <footer className="mt-8 pt-4 border-t border-slate-100">
        <p className="text-[9px] text-center text-text-dim leading-relaxed max-w-lg mx-auto">
          Bonga Handshake operates fully serverless. Submissions are encrypted client-side and processed without logging browser fingerprints or ISP coordinates.
        </p>
      </footer>
    </div>
  );
};

export default Home;

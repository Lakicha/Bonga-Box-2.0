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
  Globe,
  Send,
  Smartphone
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

  // USSD Interactive Flow States
  const [ussdActiveTab, setUssdActiveTab] = useState<'ussd' | 'sms'>('ussd');
  const [ussdSessionState, setUssdSessionState] = useState<'dialpad' | 'menu' | 'fgm_location' | 'fgm_minors' | 'fgm_success' | 'shelter_list' | 'shelter_detail' | 'responder_list' | 'responder_success' | 'language_feedback'>('dialpad');
  const [ussdSelectedShelter, setUssdSelectedShelter] = useState<string>('');
  const [ussdMenuLanguage, setUssdMenuLanguage] = useState<'EN' | 'SW'>('EN');
  const [ussdInputValue, setUssdInputValue] = useState<string>('');
  const [ussdError, setUssdError] = useState<string>('');

  // Offline SMS States
  const [smsIncidentType, setSmsIncidentType] = useState<string>('fgm_threat');
  const [smsLocation, setSmsLocation] = useState<string>('');
  const [smsDetails, setSmsDetails] = useState<string>('');
  const [smsLogs, setSmsLogs] = useState<string[]>([]);
  const [smsTransmissionStage, setSmsTransmissionStage] = useState<number>(0); // 0 = not started, 1-4 = steps, 5 = done
  const [smsStatusText, setSmsStatusText] = useState<string>('');
  
  // Simulated incoming notification toast state
  const [incomingNotifications, setIncomingNotifications] = useState<Array<{ id: string; sender: string; text: string }>>([]);

  const resetUssdSession = () => {
    setUssdSessionState('dialpad');
    setUssdInputValue('');
    setUssdError('');
  };

  const handleUssdDial = () => {
    if (ussdInputValue !== '*123#') {
      setUssdError(ussdMenuLanguage === 'EN' ? 'Invalid MMI code. Dial *123# for Bonga Box.' : 'Msimbo batili. Piga *123# kwa Bonga Box.');
      return;
    }
    setUssdError('');
    setUssdDialing(true);
    setTimeout(() => {
      setUssdDialing(false);
      setUssdSessionState('menu');
    }, 1000);
  };

  const handleUssdSubmitInput = (value: string) => {
    const choice = value.trim();
    if (!choice) return;

    if (ussdSessionState === 'menu') {
      if (choice === '1') {
        setUssdSessionState('fgm_location');
      } else if (choice === '2') {
        setUssdSessionState('shelter_list');
      } else if (choice === '3') {
        setUssdSessionState('responder_list');
      } else if (choice === '4') {
        const nextLang = ussdMenuLanguage === 'EN' ? 'SW' : 'EN';
        setUssdMenuLanguage(nextLang);
        setUssdSessionState('language_feedback');
      } else {
        setUssdError(ussdMenuLanguage === 'EN' ? 'Select 1, 2, 3, or 4.' : 'Chagua 1, 2, 3, au 4.');
      }
    } else if (ussdSessionState === 'fgm_location') {
      if (['1', '2', '3', '4'].includes(choice)) {
        setUssdSessionState('fgm_minors');
      } else {
        setUssdError(ussdMenuLanguage === 'EN' ? 'Select options 1-4.' : 'Chagua 1-4.');
      }
    } else if (ussdSessionState === 'fgm_minors') {
      if (['1', '2', '3'].includes(choice)) {
        setUssdSessionState('fgm_success');
        // Let's add a simulated database log or anonymous local alert
        const localReportIds = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
        localReportIds.push('anon_' + Math.floor(Math.random() * 90000 + 10000));
        localStorage.setItem('bonga_anonymous_reports', JSON.stringify(localReportIds));
      } else {
        setUssdError(ussdMenuLanguage === 'EN' ? 'Select options 1-3.' : 'Chagua 1-3.');
      }
    } else if (ussdSessionState === 'shelter_list') {
      if (['1', '2', '3'].includes(choice)) {
        const shelters = [
          'Merti Central Sanctuary (Safe & dry altitude level 340m)',
          'Isiolo High School Safe Center (Staffed by Red Cross & Guardians)',
          'Garba Tulla Community Sanctuary (Secure food and sanitation depot)'
        ];
        setUssdSelectedShelter(shelters[parseInt(choice) - 1]);
        setUssdSessionState('shelter_detail');
      } else {
        setUssdError(ussdMenuLanguage === 'EN' ? 'Select 1, 2, or 3.' : 'Chagua 1, 2, au 3.');
      }
    } else if (ussdSessionState === 'responder_list') {
      if (['1', '2'].includes(choice)) {
        setUssdSessionState('responder_success');
      } else {
        setUssdError(ussdMenuLanguage === 'EN' ? 'Select 1 or 2.' : 'Chagua 1 au 2.');
      }
    }
    setUssdInputValue('');
  };

  const handleSmsTransmit = () => {
    if (!smsLocation.trim() || !smsDetails.trim()) {
      alert("Please provide both a coordinates/location and description to compile the SMS pack.");
      return;
    }

    setSmsTransmissionStage(1);
    setSmsStatusText("Analyzing local cell spectrum channels...");
    setSmsLogs([]);
    
    // Step-by-step telemetry compiles:
    const steps = [
      { t: "Extracting cellular tower triangulation coordinates...", log: "[TELEMETRY] Triangulation signature compiled: 37.69E, 0.58N" },
      { t: "Encoding message using confidential bit-packing algorithms...", log: "[ENCRYPTION] Encrypted binary packet: " + Math.random().toString(36).substring(2, 10).toUpperCase() },
      { t: "Transmitting 160-character base-64 fragments offline...", log: "[SPECTRUM] Dispatched GSM envelope via County Relays" },
      { t: "Verifying cellular dispatch authorities confirmation handshake...", log: "[STATUS] Secure analog transfer verified successfully!" },
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setSmsStatusText(steps[current].t);
        setSmsLogs(prev => [...prev, steps[current].log]);
        setSmsTransmissionStage(current + 2);
        current++;
      } else {
        clearInterval(interval);
        setSmsTransmissionStage(5);
        setSmsStatusText("SMS Handshake Confirmed!");
        
        // Add anonymous local mock report
        const localReportIds = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
        localReportIds.push('sms_' + Math.floor(Math.random() * 90000 + 10000));
        localStorage.setItem('bonga_anonymous_reports', JSON.stringify(localReportIds));
        
        // Trigger simulated incoming notification on the top right
        setTimeout(() => {
          const newNotif = {
            id: Date.now().toString(),
            sender: "Bonga SMS Sentinel",
            text: `DELIVERY CONFIRMED: Incident filed at ${smsLocation}. Zero-data coordinates registered. Emergency dispatches informed.`
          };
          setIncomingNotifications(prev => [newNotif, ...prev]);
        }, 1500);
      }
    }, 1000);
  };

  const resetSmsForm = () => {
    setSmsLocation('');
    setSmsDetails('');
    setSmsLogs([]);
    setSmsTransmissionStage(0);
    setSmsStatusText('');
  };

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
      
      {/* Interactive Simulated SMS Toast Notification */}
      <div className="fixed top-4 right-4 z-200 pointer-events-none flex flex-col gap-2 max-w-sm w-full">
        <AnimatePresence>
          {incomingNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-xl pointer-events-auto flex items-start gap-3 relative overflow-hidden"
            >
              {/* Top border colored orange accent indicator */}
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Bell size={16} className="animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest">{notif.sender}</p>
                <p className="text-[11px] text-slate-100 font-medium mt-0.5 leading-relaxed">{notif.text}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[8.5px] text-slate-400 font-extrabold font-mono">Analog Relay Mesh · Just Now</span>
                  <button 
                    onClick={() => {
                      setIncomingNotifications(prev => prev.filter(n => n.id !== notif.id));
                    }}
                    className="ml-auto text-[9px] text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
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
                    onClick={() => {
                      setUssdActiveTab('ussd');
                      setIsUSSDOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Smartphone size={12} className="text-indigo-200" />
                    <span>Dial USSD (*123#)</span>
                  </button>
                  <button
                    onClick={() => {
                      setUssdActiveTab('sms');
                      setIsUSSDOpen(true);
                      resetSmsForm();
                    }}
                    className="flex items-center gap-1.5 px-4.5 py-3 bg-slate-800 hover:bg-slate-750 text-white border border-slate-705 font-bold rounded-xl text-xs transition-transform active:scale-95 cursor-pointer"
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
                  setUssdActiveTab('sms');
                  setIsUSSDOpen(true);
                  resetSmsForm();
                }}
                className="w-full py-3.5 bg-purple-primary hover:bg-purple-dark text-white font-bold rounded-2xl flex items-center justify-center gap-2 text-xs transition-transform active:scale-[0.98] shadow-md cursor-pointer"
              >
                <MessageSquare size={14} className="text-purple-105" />
                <span>Send SMS Report</span>
              </button>

              <button
                onClick={() => {
                  setUssdActiveTab('ussd');
                  setIsUSSDOpen(true);
                  resetUssdSession();
                }}
                className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-bold rounded-2xl flex items-center justify-center gap-2 text-xs transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Smartphone size={13} className="text-purple-primary" />
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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-150 flex items-center justify-center p-4"
            >
              {/* Centered robust white card modal */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking card
                className="w-full max-w-md bg-white border border-slate-150 rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden"
              >
                {/* Modal Header */}
                <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[10px] font-extrabold text-[#4F46E5] uppercase tracking-widest font-mono">
                      Bonga Secure Offline Gateway
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsUSSDOpen(false)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Tab Selector buttons */}
                <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1">
                  <button
                    onClick={() => {
                      setUssdActiveTab('ussd');
                      resetUssdSession();
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      ussdActiveTab === 'ussd'
                        ? 'bg-white text-[#4F46E5] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Smartphone size={13} />
                    <span>Dial USSD Menu</span>
                  </button>

                  <button
                    onClick={() => {
                      setUssdActiveTab('sms');
                      resetSmsForm();
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      ussdActiveTab === 'sms'
                        ? 'bg-white text-[#4F46E5] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>Draft SMS Report</span>
                  </button>
                </div>

                {/* Main Tab Content */}
                <div className="p-6">
                  {/* --- TAB 1: USSD INTERACTIVE CELLULAR --- */}
                  {ussdActiveTab === 'ussd' && (
                    <div className="space-y-4">
                      {/* Mobile Smartphone Frame Container */}
                      {ussdSessionState === 'dialpad' ? (
                        <div className="text-center py-4">
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 leading-none">
                            CELLULAR SPECTRUM CARRIER
                          </p>
                          <div className="bg-slate-50 border border-slate-150 py-4 px-2 rounded-2xl mb-5 text-center">
                            <span className="text-3xl font-display font-black text-[#4F46E5] tracking-tight font-mono">
                              *123#
                            </span>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wide">
                              Bonga Emergency USSD Address
                            </p>
                          </div>

                          <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6 max-w-xs mx-auto">
                            Dial standard offline codes to read high-ground safe shelters, trigger emergency coordinates, or log confidential FGM threats.
                          </p>

                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                setUssdInputValue('*123#');
                                handleUssdDial();
                              }}
                              disabled={ussdDialing}
                              className="w-full py-3.5 bg-[#4F46E5] hover:bg-[#3F37C9] text-white font-extrabold text-xs tracking-wide rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-opacity cursor-pointer disabled:opacity-50"
                            >
                              {ussdDialing ? (
                                <span className="animate-pulse flex items-center gap-1">Starting secure analog channel...</span>
                              ) : (
                                <>
                                  <Smartphone size={14} />
                                  <span>Simulate Call *123#</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={handleCopyCode}
                              className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-205 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {copiedCode ? (
                                <>
                                  <Check size={13} className="text-emerald-500" />
                                  <span className="text-emerald-600 font-bold">Code Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} className="text-slate-500" />
                                  <span>Copy Gateway Code</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* MONOSPACED PHONE SCREEN SIMULATION */
                        <div className="space-y-4">
                          <div className="bg-[#121824] border-2 border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-[#10B981] leading-relaxed shadow-inner overflow-hidden relative">
                            {/* Shiny glass glare effect */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full transform rotate-45" />
                            
                            <div className="flex justify-between items-center text-[9px] text-[#4F46E5] font-black uppercase tracking-wider border-b border-slate-800 pb-2 mb-2">
                              <span>Bonga Mobile Link</span>
                              <span className="text-emerald-505 flex items-center gap-1 animate-pulse">
                                <span>● SECURE</span>
                              </span>
                            </div>

                            {/* Content based on dynamic menu steps */}
                            {ussdSessionState === 'menu' && (
                              <div className="space-y-1.5 text-left">
                                <p className="font-bold text-white uppercase text-[10px]">
                                  {ussdMenuLanguage === 'EN' ? 'Bonga Box Active Hub:' : 'Mfumo Wa Bonga Box:'}
                                </p>
                                <p>1. Confide FGM Incident Report</p>
                                <p>2. Interactive High Shelter List</p>
                                <p>3. Dispatch First Responder SOS</p>
                                <p>4. Language ({ussdMenuLanguage})</p>
                                <p className="text-emerald-500/60 mt-2 text-[9px] border-t border-slate-800/60 pt-1.5">
                                  {ussdMenuLanguage === 'EN' ? 'Type option number below:' : 'Andika lugha au namba:'}
                                </p>
                              </div>
                            )}

                            {ussdSessionState === 'fgm_location' && (
                              <div className="space-y-1.5 text-left">
                                <p className="font-bold text-white uppercase text-[10px]">USSD: Reporting Location?</p>
                                <p>1. Isiolo Central District</p>
                                <p>2. Merti Sanctuary Camp</p>
                                <p>3. Garba Tulla County Area</p>
                                <p>4. Kinna / Sericho Border</p>
                                <p className="text-slate-400 text-[9px] mt-2">Enter option (1-4):</p>
                              </div>
                            )}

                            {ussdSessionState === 'fgm_minors' && (
                              <div className="space-y-1.5 text-left">
                                <p className="font-bold text-white uppercase text-[10px]">USSD: Total Girls under risk?</p>
                                <p>1. 1 - 2 minors</p>
                                <p>2. 3 - 5 minors surrounded</p>
                                <p>3. Large multi-family group</p>
                                <p className="text-slate-400 text-[9px] mt-2">Enter option (1-3):</p>
                              </div>
                            )}

                            {ussdSessionState === 'fgm_success' && (
                              <div className="space-y-2 text-left">
                                <div className="text-center py-2 text-emerald-450">
                                  <p className="font-black text-white text-[12px] uppercase">SUBMISSION ACCEPTED!</p>
                                </div>
                                <p className="text-[10px] leading-normal text-slate-350">
                                  Your anonymous telemetry coordinates have been scrambler-dispatched over GSM towers under Node code #BG-{Math.floor(1000 + Math.random() * 9000)}. Neighborhood guardians are on-route. High safety priority.
                                </p>
                                <p className="text-[9px] text-[#4F46E5] italic">Thank you for defending Isiolo Girls.</p>
                              </div>
                            )}

                            {ussdSessionState === 'shelter_list' && (
                              <div className="space-y-1.5 text-left">
                                <p className="font-bold text-white uppercase text-[10px]">USSD: Evac Shelters:</p>
                                <p>1. Merti Sanctuary (2.4 km)</p>
                                <p>2. Isiolo High Center (5.1 km)</p>
                                <p>3. Garba Tulla Sanctuary (12.3 km)</p>
                                <p className="text-slate-400 text-[9px] mt-2">Enter shelter option (1-3):</p>
                              </div>
                            )}

                            {ussdSessionState === 'shelter_detail' && (
                              <div className="space-y-2 text-left">
                                <p className="font-bold text-white uppercase text-[10px]">USSD: Shelter Info Detail</p>
                                <p className="text-slate-100">{ussdSelectedShelter}</p>
                                <div className="text-teal-400 text-[9.5px] py-1 border-t border-b border-slate-800/85">
                                  ● Elevated altitude 300m+ clear of swells<br/>
                                  ● Secure sanitary and food packs stocked
                                </div>
                                <p className="text-slate-400 text-[9.5px]">Type 0 to go back to directory</p>
                              </div>
                            )}

                            {ussdSessionState === 'responder_list' && (
                              <div className="space-y-1.5 text-left">
                                <p className="font-bold text-white uppercase text-[10px]">USSD: Dispatch Target?</p>
                                <p>1. Local Security Council</p>
                                <p>2. Volunteer Community Guardian Network</p>
                                <p className="text-slate-400 text-[9px] mt-2">Enter SOS Target (1-2):</p>
                              </div>
                            )}

                            {ussdSessionState === 'responder_success' && (
                              <div className="space-y-2 text-left">
                                <p className="font-bold text-white uppercase text-red-400 text-[10px]">SOS ENVELOPE RECORDED</p>
                                <p className="text-slate-300">
                                  Your cell-tower triangulation telemetry coordinates registered dynamically. Safe Space Guardians on standby inside Isiolo county office.
                                </p>
                                <p className="text-slate-400 text-[9px]">Check your emergency SMS channel for pings shortly.</p>
                              </div>
                            )}

                            {ussdSessionState === 'language_feedback' && (
                              <div className="space-y-2 text-center py-2">
                                <p className="font-bold text-white">LUGHA IMEBADILISHWA!</p>
                                <p className="text-slate-350 text-[10px]">
                                  Bonga Box sasa inatumia lugha ya Kiswahili kwa miamala yote ya dharura ya USSD.
                                </p>
                                <p className="text-emerald-500 text-[9px] mt-2">Type 0 or click back below to reload menu</p>
                              </div>
                            )}

                            {ussdError && (
                              <p className="text-red-450 font-bold border-t border-red-900/50 pt-1 mt-1.5 text-[10px]">
                                Error: {ussdError}
                              </p>
                            )}
                          </div>

                          {/* Quick selector buttons representing quick dial selections */}
                          <div className="space-y-2">
                            {/* Interactive direct dialer actions */}
                            {['menu', 'fgm_location', 'fgm_minors', 'shelter_list', 'responder_list'].includes(ussdSessionState) && (
                              <div className="flex flex-wrap items-center justify-center gap-1.5 py-1 bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                                <span className="text-[9px] font-extrabold text-slate-400 mr-2 uppercase tracking-wider">Tap to Select:</span>
                                {ussdSessionState === 'menu' && ['1', '2', '3', '4'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleUssdSubmitInput(val)}
                                    className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-black text-xs transition-colors cursor-pointer"
                                  >
                                    {val}
                                  </button>
                                ))}
                                {ussdSessionState === 'fgm_location' && ['1', '2', '3', '4'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleUssdSubmitInput(val)}
                                    className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-black text-xs transition-colors cursor-pointer"
                                  >
                                    {val}
                                  </button>
                                ))}
                                {ussdSessionState === 'fgm_minors' && ['1', '2', '3'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleUssdSubmitInput(val)}
                                    className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-black text-xs transition-colors cursor-pointer"
                                  >
                                    {val}
                                  </button>
                                ))}
                                {ussdSessionState === 'shelter_list' && ['1', '2', '3'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleUssdSubmitInput(val)}
                                    className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-black text-xs transition-colors cursor-pointer"
                                  >
                                    {val}
                                  </button>
                                ))}
                                {ussdSessionState === 'responder_list' && ['1', '2'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleUssdSubmitInput(val)}
                                    className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-black text-xs transition-colors cursor-pointer"
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Standard USSD Action panel buttons */}
                            <div className="flex justify-between gap-2.5">
                              <button
                                onClick={resetUssdSession}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex-1 transition-colors cursor-pointer"
                              >
                                {ussdMenuLanguage === 'EN' ? 'Restart USSD' : 'Anza Upya'}
                              </button>
                              
                              {['shelter_detail', 'language_feedback'].includes(ussdSessionState) && (
                                <button
                                  onClick={() => setUssdSessionState('menu')}
                                  className="px-4 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex-1 transition-colors cursor-pointer"
                                >
                                  {ussdMenuLanguage === 'EN' ? 'Back to Menu' : 'Nyuma'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- TAB 2: SMS ANONYMOUS REPORT --- */}
                  {ussdActiveTab === 'sms' && (
                    <div className="space-y-4 text-left">
                      {smsTransmissionStage === 0 ? (
                        <>
                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                              Emergency Incident Category
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'fgm_threat', label: 'FGM Threat' },
                                { id: 'flood_warning', label: 'Flood Risk' },
                                { id: 'sos_assistance', label: 'SOS Call' }
                              ].map(item => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setSmsIncidentType(item.id)}
                                  className={`py-2 px-2.5 rounded-xl border text-[10.5px] font-bold text-center transition-colors cursor-pointer ${
                                    smsIncidentType === item.id
                                      ? 'border-[#4F46E5] bg-indigo-50/70 text-[#4F46E5]'
                                      : 'border-slate-150 hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                                Location Description or GPS Coordinates
                              </label>
                              <button
                                type="button"
                                onClick={() => setSmsLocation('Merti Sanctuary Node, Core 14B')}
                                className="text-[9.5px] text-[#4F46E5] font-black uppercase hover:underline cursor-pointer"
                              >
                                SIMULATE GPS
                              </button>
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Near Merti Primary School / coordinate"
                              value={smsLocation}
                              onChange={(e) => setSmsLocation(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-205 focus:border-[#4F46E5] rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                              Report details and comments
                            </label>
                            <textarea
                              rows={3}
                              required
                              placeholder="Describe the case details offline. The system will automatically split and compress into text slices..."
                              value={smsDetails}
                              onChange={(e) => setSmsDetails(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-205 focus:border-[#4F46E5] rounded-xl text-xs font-semibold placeholder:text-slate-400 focus:outline-hidden"
                            />
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={handleSmsTransmit}
                              className="w-full py-3 bg-[#4F46E5] hover:bg-[#3F37C9] text-white font-extrabold text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 shadow-md transition-opacity cursor-pointer"
                            >
                              <Send size={12} />
                              <span>Draft & Send Offline SMS</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        /* TRANSMISSION ANIMATION WORKFLOW */
                        <div className="space-y-4">
                          <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                            Zero-Data Analog Transmission Console
                          </p>

                          <div className="bg-[#121824] border-2 border-slate-800 rounded-2xl p-4 font-mono text-[10.5px] text-[#10B981] space-y-2 relative min-h-[160px] flex flex-col justify-between">
                            <div className="space-y-1.5 flex-1 select-text">
                              <p className="border-b border-slate-800 pb-1 text-slate-400 text-[8.5px]">TRANSMITTER CORE V.3.1 - STANDBY</p>
                              
                              {/* Progressive Log display */}
                              {smsLogs.map((log, index) => (
                                <p key={index} className="text-[#34D399]">{log}</p>
                              ))}
                              
                              {smsTransmissionStage > 0 && smsTransmissionStage < 5 && (
                                <p className="animate-pulse text-[#60A5FA]">
                                  &gt;&gt; {smsStatusText}
                                </p>
                              )}

                              {smsTransmissionStage === 5 && (
                                <div className="text-center py-2 text-emerald-400">
                                  <p className="font-bold text-white uppercase text-[11px]">GSM DISPATCH SUCCESSFULLY HANDSHAKED</p>
                                </div>
                              )}
                            </div>

                            {/* Indicator bar */}
                            <div className="border-t border-slate-800 pt-2.5 mt-2">
                              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700 flex items-center">
                                <motion.div 
                                  animate={{ width: `${(Math.min(smsTransmissionStage, 5) / 5) * 100}%` }}
                                  className="h-full bg-[#10B981] transition-all duration-300"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            {smsTransmissionStage === 5 ? (
                              <button
                                onClick={resetSmsForm}
                                className="px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs cursor-pointer transition-colors"
                              >
                                Draft Another SMS
                              </button>
                            ) : (
                              <button
                                disabled
                                className="px-5 py-2.5 bg-slate-150 text-slate-400 font-extrabold rounded-xl text-xs cursor-not-allowed"
                              >
                                Transmitting...
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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

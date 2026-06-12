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
  MessageSquare, 
  Signal, 
  WifiOff, 
  Sparkles, 
  Copy, 
  Check, 
  BookOpen, 
  User, 
  X, 
  UserCheck,
  HeartHandshake,
  Landmark,
  Coins,
  Bell,
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

  // Initial loading state for premium feel
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  const triggerHaptic = (type: 'light' | 'success' | 'warning' | 'error') => {
    window.dispatchEvent(new CustomEvent('bonga_trigger_haptic', { detail: { type } }));
  };

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
  const [smsTransmissionStage, setSmsTransmissionStage] = useState<number>(0); 
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
      setUssdError(ussdMenuLanguage === 'EN' ? 'Invalid gateway code. Dial *123# for Bonga Box.' : 'Msimbo batili. Piga *123# kwa Bonga Box.');
      triggerHaptic('error');
      return;
    }
    setUssdError('');
    setUssdDialing(true);
    triggerHaptic('success');
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
        triggerHaptic('light');
      } else if (choice === '2') {
        setUssdSessionState('shelter_list');
        triggerHaptic('light');
      } else if (choice === '3') {
        setUssdSessionState('responder_list');
        triggerHaptic('light');
      } else if (choice === '4') {
        const nextLang = ussdMenuLanguage === 'EN' ? 'SW' : 'EN';
        setUssdMenuLanguage(nextLang);
        setUssdSessionState('language_feedback');
        triggerHaptic('light');
      } else {
        setUssdError(ussdMenuLanguage === 'EN' ? 'Select 1, 2, 3, or 4.' : 'Chagua 1, 2, 3, au 4.');
        triggerHaptic('error');
      }
    } else if (ussdSessionState === 'fgm_location') {
      if (['1', '2', '3', '4'].includes(choice)) {
        setUssdSessionState('fgm_minors');
        triggerHaptic('light');
      } else {
        setUssdError(ussdMenuLanguage === 'EN' ? 'Select options 1-4.' : 'Chagua 1-4.');
        triggerHaptic('error');
      }
    } else if (ussdSessionState === 'fgm_minors') {
      if (['1', '2', '3'].includes(choice)) {
        setUssdSessionState('fgm_success');
        triggerHaptic('success');
        const localReportIds = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
        localReportIds.push('anon_' + Math.floor(Math.random() * 90000 + 10000));
        localStorage.setItem('bonga_anonymous_reports', JSON.stringify(localReportIds));
      } else {
        setUssdError(ussdMenuLanguage === 'EN' ? 'Select options 1-3.' : 'Chagua 1-3.');
        triggerHaptic('error');
      }
    } else if (ussdSessionState === 'shelter_list') {
      if (['1', '2', '3'].includes(choice)) {
        const shelters = [
          'Merti Central Sanctuary (Safe and dry, altitude 340m)',
          'Isiolo High School Center (Staffed by Red Cross volunteers)',
          'Garba Tulla Sanctuary (Secure food and hygiene repository)'
        ];
        setUssdSelectedShelter(shelters[parseInt(choice) - 1]);
        setUssdSessionState('shelter_detail');
        triggerHaptic('light');
      } else {
        setUssdError(ussdMenuLanguage === 'EN' ? 'Select 1, 2, or 3.' : 'Chagua 1, 2, au 3.');
        triggerHaptic('error');
      }
    } else if (ussdSessionState === 'responder_list') {
      if (['1', '2'].includes(choice)) {
        setUssdSessionState('responder_success');
        triggerHaptic('success');
      } else {
        setUssdError(ussdMenuLanguage === 'EN' ? 'Select 1 or 2.' : 'Chagua 1 au 2.');
        triggerHaptic('error');
      }
    }
    setUssdInputValue('');
  };

  const handleSmsTransmit = () => {
    if (!smsLocation.trim() || !smsDetails.trim()) {
      alert("Please provide location and description before sending.");
      return;
    }

    setSmsTransmissionStage(1);
    setSmsStatusText("Establishing secure radio link...");
    setSmsLogs([]);
    triggerHaptic('success');
    
    const steps = [
      { t: "Extracting cell tower triangulation parameters...", log: "[Cellular] Triangulation mapped at 37.69E, 0.58N" },
      { t: "Encoding message using metadata protection...", log: "[Protocol] Safe packet hash: " + Math.random().toString(36).substring(2, 10).toUpperCase() },
      { t: "Spreading GSM block transmission packets offline...", log: "[Radio] Dispatched GSM cluster to county nodes" },
      { t: "Verifying secure dispatch response...", log: "[Success] Dispatch has acknowledged receipt" },
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        const stepText = steps[current].t;
        const stepLog = steps[current].log;
        setSmsStatusText(stepText);
        setSmsLogs(prev => [...prev, stepLog]);
        setSmsTransmissionStage(current + 2);
        triggerHaptic('light');
        current++;
      } else {
        clearInterval(interval);
        setSmsTransmissionStage(5);
        setSmsStatusText("Message securely sent");
        triggerHaptic('success');
        
        const localReportIds = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
        localReportIds.push('sms_' + Math.floor(Math.random() * 90000 + 10000));
        localStorage.setItem('bonga_anonymous_reports', JSON.stringify(localReportIds));
        
        setTimeout(() => {
          const newNotif = {
            id: Date.now().toString(),
            sender: "Bonga automated SMS responder",
            text: `Delivery confirmed. Zero-data incident registered at ${smsLocation}. Emergency dispatch units notified.`
          };
          setIncomingNotifications(prev => [newNotif, ...prev]);
          triggerHaptic('warning');
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

  const [nickname] = useState(() => {
    return localStorage.getItem('bonga_user_nickname') || 'Theo';
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState<string>('02:44 PM');

  const handleRunCheck = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep(0);

    const steps = [
      'Establishing connection parameters...',
      'Mapping safe regional shelter grids...',
      'Assessing local storm reports...',
      'Check finished. No emergency active.'
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

  const displayName = user?.displayName 
    ? user.displayName.split(' ')[0] 
    : (user?.email ? user.email.split('@')[0] : nickname);

  return (
    <div className="font-sans max-w-4xl mx-auto py-1 px-3 relative select-none">
      
      {/* Interactive Simulated SMS Toast Notification */}
      <div className="fixed top-4 right-4 z-200 pointer-events-none flex flex-col gap-2 max-w-sm w-full">
        <AnimatePresence>
          {incomingNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-slate-900/95 backdrop-blur-md border border-slate-705 p-4 rounded-xl shadow-xl pointer-events-auto flex items-start gap-3 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
              <div className="w-8 h-8 rounded-full bg-amber-550/10 text-amber-400 flex items-center justify-center shrink-0">
                <Bell size={16} className="animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-amber-400 font-semibold">{notif.sender}</p>
                <p className="text-xs text-slate-100 font-normal mt-0.5 leading-relaxed">{notif.text}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-slate-400 font-normal">Cellular mesh · Just now</span>
                  <button 
                    onClick={() => {
                      setIncomingNotifications(prev => prev.filter(n => n.id !== notif.id));
                    }}
                    className="ml-auto text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold bg-slate-800 px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* Top Interactive Connectivity Switch */}
      <div className="flex justify-between items-center bg-white border border-slate-150 rounded-2xl px-4 py-2 mb-4 shadow-xs max-w-xs ml-auto">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-2">
          {isOnline ? (
            <>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" /> Live connection
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 bg-purple-primary rounded-full animate-pulse shrink-0" /> Offline crisis mode
            </>
          )}
        </span>
        <button
          onClick={() => {
            setIsOnline(!isOnline);
            triggerHaptic('success');
          }}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
            isOnline 
              ? 'bg-purple-primary/5 hover:bg-purple-primary/10 text-purple-primary' 
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {isOnline ? (
            <>
              <Zap size={11} />
              <span>Go offline</span>
            </>
          ) : (
            <>
              <Globe size={11} />
              <span>Go online</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="home-skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 animate-pulse"
          >
            {/* Header Profile placeholder */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-full bg-slate-200/75 shrink-0" />
                <div className="space-y-1.5 flex-1 max-w-[200px]">
                  <div className="h-4 bg-slate-200/75 rounded w-5/6" />
                  <div className="h-3 bg-slate-200/75 rounded w-2/3" />
                </div>
              </div>
              <div className="w-28 h-8 bg-slate-200/75 rounded-xl shrink-0" />
            </div>

            {/* Status cards placeholders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 h-16 flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-slate-200/75 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-slate-200/75 rounded w-20" />
                  <div className="h-3.5 bg-slate-200/75 rounded w-28" />
                </div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 h-16 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-slate-200/75 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-slate-200/75 rounded w-20" />
                    <div className="h-3.5 bg-slate-200/75 rounded w-24" />
                  </div>
                </div>
                <div className="w-16 h-7 bg-slate-200/75 rounded-lg" />
              </div>
            </div>

            {/* Grid option placeholders */}
            <div className="space-y-3">
              <div className="h-3.5 bg-slate-200/75 rounded w-44 ml-1" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 h-28 space-y-3 shadow-xs animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-slate-200/75" />
                    <div className="space-y-2">
                      <div className="h-3.5 bg-slate-200/75 rounded w-1/2" />
                      <div className="space-y-1.5">
                        <div className="h-2.5 bg-slate-200/75 rounded w-full" />
                        <div className="h-2.5 bg-slate-200/75 rounded w-5/6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : isOnline ? (
          /* ==================================================================== */
          /* 2. PREMIUM HOME (ONLINE MAIN DASHBOARD)                             */
          /* ==================================================================== */
          <motion.div
            key="online-home"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            {/* Header: Profile & protection status */}
            <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full border border-slate-205 shrink-0 flex items-center justify-center bg-indigo-50/70 text-[#4F46E5] overflow-hidden">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={displayName} 
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 text-purple-primary font-semibold text-xs rounded-full">
                      {displayName ? displayName.substring(0, 2).toUpperCase() : <User size={13} />}
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-white">
                    <Check size={8} strokeWidth={4} />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-base font-semibold text-slate-900 leading-tight">
                      Welcome, {displayName}
                    </h1>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-medium rounded">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                      <span>Protected</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <p className="text-xs text-slate-500 font-normal">
                      Safe support portal
                    </p>
                    <span className="text-slate-300 text-xs">•</span>
                    <button 
                      onClick={() => {
                        window.dispatchEvent(new Event('bonga_trigger_onboarding_carousel'));
                      }}
                      className="inline-flex items-center gap-1 text-xs text-purple-primary hover:text-purple-dark font-medium transition-all cursor-pointer"
                      title="Launch interactive guidelines"
                    >
                      <Sparkles size={11} className="text-amber-400" />
                      <span>Take tour</span>
                    </button>
                  </div>
                </div>
              </div>
 
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-1.5 flex items-center gap-2.5 max-w-xs md:shrink-0 text-left">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                  <UserCheck size={12} />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-800 font-semibold text-xs">All secure</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal mt-0.5">County node verified</p>
                </div>
              </div>
            </div>
 
            {/* Status cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-xs flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-primary/5 flex items-center justify-center text-purple-primary shrink-0">
                  <Signal size={15} />
                </div>
                <div>
                  <p className="text-xs font-normal text-slate-500">Operational status</p>
                  <p className="text-xs font-semibold text-purple-primary mt-0.5">Active secure space</p>
                </div>
              </div>
  
              <div className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-primary/5 flex items-center justify-center text-purple-primary shrink-0">
                    <RefreshCw size={13} className={isScanning ? 'animate-spin' : ''} />
                  </div>
                  <div>
                    <p className="text-xs font-normal text-slate-500">Last sync time</p>
                    <p className="text-xs font-semibold text-purple-primary mt-0.5">{lastCheckTime}</p>
                  </div>
                </div>
                <button
                  onClick={handleRunCheck}
                  disabled={isScanning}
                  className="px-2.5 py-1 hover:bg-slate-50 border border-slate-150 rounded-lg text-xs font-medium text-slate-650 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Sync now
                </button>
              </div>
            </div>

            {/* Scanning animation */}
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-indigo-55/20 border border-indigo-100/60 p-3 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-purple-primary rounded-full animate-spin" />
                  <span className="font-semibold text-purple-primary">Syncing diagnostics...</span>
                </div>
                <p className="text-slate-500 font-normal pl-5.5">
                  {[
                    'Mapping secure connection lines...',
                    'Tracing cell relay towers...',
                    'Refreshed local safe maps...',
                    'Diagnostics finished successfully.'
                  ][scanStep]}
                </p>
              </motion.div>
            )}

            {/* Grid options */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 pl-1">
                Active safeguarding services
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Emergency USSD fallback code */}
                <motion.div 
                  onClick={() => {
                    setIsUSSDOpen(true);
                    triggerHaptic('light');
                  }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="bg-indigo-50/20 border border-indigo-100/40 hover:border-indigo-200/60 hover:shadow-xs rounded-2xl p-4 cursor-pointer shadow-xs group text-left relative overflow-hidden select-none"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-8 -mt-8" />
                  <div className="w-8 h-8 rounded-lg bg-indigo-55 text-purple-primary flex items-center justify-center mb-2.5 transition-transform group-hover:scale-102">
                    <AlertCircle size={16} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-semibold text-purple-primary group-hover:text-indigo-805 transition-colors">
                      Emergency fallback support
                    </h3>
                    <ChevronRight size={14} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-indigo-700/80 leading-normal font-normal">
                    Anonymously alert emergency responders without mobile data. Dial integrated USSD menus for local guidance.
                  </p>
                </motion.div>

                <motion.div 
                  onClick={() => {
                    navigate('/report');
                    triggerHaptic('light');
                  }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-xs cursor-pointer shadow-xs group text-left select-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-purple-primary flex items-center justify-center mb-2.5 transition-transform group-hover:scale-102">
                    <FileText size={16} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-semibold text-slate-900 group-hover:text-purple-primary transition-colors">
                      Submit anonymous report
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal font-normal">
                    Send highly secure protection alerts. All metadata and digital signals are cleaned to maintain complete user confidentiality.
                  </p>
                </motion.div>

                <motion.div 
                  onClick={() => {
                    navigate('/support');
                    triggerHaptic('light');
                  }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-xs cursor-pointer shadow-xs group text-left select-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-purple-primary flex items-center justify-center mb-2.5 transition-transform group-hover:scale-102">
                    <HeartHandshake size={16} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-semibold text-slate-900 group-hover:text-purple-primary transition-colors">
                      Speak with caseworker
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal font-normal">
                    Connect instantly with dedicated protection officers and community counselors. Chat logs or records are never stored.
                  </p>
                </motion.div>

                <motion.div 
                  onClick={() => {
                    navigate('/alerts');
                    triggerHaptic('light');
                  }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-xs cursor-pointer shadow-xs group text-left select-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-purple-primary flex items-center justify-center mb-2.5 transition-transform group-hover:scale-102">
                    <Landmark size={16} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-semibold text-slate-900 group-hover:text-purple-primary transition-colors">
                      View nearest safe house
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal font-normal">
                    Find nearest girls sanctuaries and crisis shelter spaces. Get offline layout maps and access support nodes easily.
                  </p>
                </motion.div>

                <motion.div 
                  onClick={() => {
                    navigate('/alerts');
                    triggerHaptic('light');
                  }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-xs cursor-pointer shadow-xs group text-left select-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-purple-primary flex items-center justify-center mb-2.5 transition-transform group-hover:scale-102">
                    <AlertTriangle size={16} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-semibold text-slate-900 group-hover:text-purple-primary transition-colors">
                      Flood diagnostics and alerts
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal font-normal">
                    Track regional river flows and high ground sanctuaries. Configure offline flood warnings with nearby paths.
                  </p>
                </motion.div>

                <motion.div 
                  onClick={() => {
                    navigate('/resources');
                    triggerHaptic('light');
                  }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-xs cursor-pointer shadow-xs group text-left select-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-purple-primary flex items-center justify-center mb-2.5 transition-transform group-hover:scale-102">
                    <BookOpen size={16} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-semibold text-slate-900 group-hover:text-purple-primary transition-colors">
                      Educational resources
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal font-normal">
                    Access local laws, medical support factsheets, human rights circulars, and offline safety booklets.
                  </p>
                </motion.div>

                <motion.div 
                  onClick={() => {
                    navigate('/donate');
                    triggerHaptic('light');
                  }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-xs cursor-pointer shadow-xs group text-left select-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-purple-primary flex items-center justify-center mb-2.5 transition-transform group-hover:scale-102">
                    <Coins size={16} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-semibold text-slate-900 group-hover:text-purple-primary transition-colors">
                      Safe sanctuary funding
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal font-normal">
                    Help fund local shelters, secure immediate safe navigation, and purchase sanitization supply packs for girls in need.
                  </p>
                </motion.div>

                <motion.div 
                  onClick={() => {
                    alert("County coordinators are updating details: New rescue node schedules being compiled.");
                    triggerHaptic('warning');
                  }}
                  whileHover={{ scale: 1.015, y: -2 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="bg-white border border-slate-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-xs cursor-pointer shadow-xs group text-left select-none"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-55/70 text-purple-primary flex items-center justify-center mb-2.5 transition-transform group-hover:scale-102">
                    <Sparkles size={16} />
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-semibold text-slate-900 group-hover:text-purple-primary transition-colors">
                      Coordinated updates
                    </h3>
                    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal font-normal">
                    Read updates directly from local MSF, unicef, or county health officers in the Isiolo emergency sector.
                  </p>
                </motion.div>

              </div>
            </div>

            {/* Offline gateway button */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800 relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                <div>
                  <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-400/25 text-indigo-400 text-[10px] font-medium rounded">
                    Offline access node
                  </span>
                  <h3 className="text-base font-semibold text-white mt-1 mb-0.5">
                    No active cellular data connection?
                  </h3>
                  <p className="text-xs text-slate-450 leading-normal font-normal max-w-md">
                    You can still file safety reports. Bonga Box can pack and push lightweight compressed SMS and cell signals completely offline.
                  </p>
                </div>
                 <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setUssdActiveTab('ussd');
                      setIsUSSDOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-transform active:scale-95 cursor-pointer"
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
                    className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-semibold rounded-xl text-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <MessageSquare size={12} className="text-cyan-420" />
                    <span>Send SMS report</span>
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
            className="bg-white border border-slate-105 rounded-2xl p-6 shadow-xs text-center flex flex-col items-center max-w-sm mx-auto my-4"
          >
            <div className="w-12 h-12 bg-purple-primary/5 text-purple-primary rounded-full flex items-center justify-center mb-3.5 border border-purple-primary/10">
              <WifiOff size={24} className="animate-pulse" />
            </div>

            <h2 className="text-base font-semibold text-purple-primary leading-none mb-1">
              You're offline
            </h2>
            
            <p className="text-xs text-slate-500 leading-normal font-normal mb-4 max-w-xs mx-auto">
              Internet connection is unavailable. Bonga Box has automatically deployed SMS and USSD emergency fallback transmitters.
            </p>

            <div className="w-full space-y-2">
              <button
                onClick={() => {
                  setUssdActiveTab('sms');
                  setIsUSSDOpen(true);
                  resetSmsForm();
                }}
                className="w-full py-2.5 bg-purple-primary hover:bg-purple-dark text-white font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.99] shadow-xs cursor-pointer"
              >
                <MessageSquare size={13} className="text-purple-100" />
                <span>Send SMS report</span>
              </button>

              <button
                onClick={() => {
                  setUssdActiveTab('ussd');
                  setIsUSSDOpen(true);
                  resetUssdSession();
                }}
                className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition-all active:scale-[0.99] cursor-pointer"
              >
                <Smartphone size={13} className="text-purple-primary" />
                <span>Dial *123#</span>
              </button>
            </div>

            <button
               onClick={() => setIsOnline(true)}
               className="text-xs font-semibold text-slate-400 hover:text-purple-primary transition-colors mt-5 cursor-pointer"
            >
              Back to online interface
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUSSDOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-150 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                onClick={(e) => e.stopPropagation()} 
                className="w-full max-w-md bg-white border border-slate-205 rounded-2xl shadow-xl relative flex flex-col overflow-hidden text-left"
              >
                {/* Modal Header */}
                <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-semibold text-purple-primary tracking-wide">
                      Bonga secure offline gateway
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsUSSDOpen(false)}
                    className="p-1 hover:bg-slate-150 rounded-lg text-slate-450 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Tab Selector buttons */}
                <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/50 p-1.5 gap-1">
                  <button
                    onClick={() => {
                      setUssdActiveTab('ussd');
                      resetUssdSession();
                    }}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      ussdActiveTab === 'ussd'
                        ? 'bg-white text-[#4F46E5] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Smartphone size={13} />
                    <span>Dial USSD menu</span>
                  </button>

                  <button
                    onClick={() => {
                      setUssdActiveTab('sms');
                      resetSmsForm();
                    }}
                    className={`py-1.5 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      ussdActiveTab === 'sms'
                        ? 'bg-white text-[#4F46E5] shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>Draft SMS report</span>
                  </button>
                </div>

                {/* Main Tab Content */}
                <div className="p-4.5">
                  {/* --- TAB 1: USSD INTERACTIVE CELLULAR --- */}
                  {ussdActiveTab === 'ussd' && (
                    <div className="space-y-4">
                      {ussdSessionState === 'dialpad' ? (
                        <div className="text-center py-3">
                          <p className="text-[10px] font-semibold text-slate-400 tracking-wide mb-2">
                            Cellular carrier link
                          </p>
                          <div className="bg-slate-50 border border-slate-100 py-3.5 px-2 rounded-xl mb-3 text-center">
                            <span className="text-2xl font-semibold text-purple-primary tracking-tight font-mono">
                              *123#
                            </span>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                              Bonga emergency USSD address
                            </p>
                          </div>

                          <p className="text-xs text-slate-500 leading-normal font-normal mb-4 max-w-xs mx-auto">
                            Dial standard codes offline to view dry high-ground shelter coordinates, trigger location triangulation, or record secure FGM threats.
                          </p>

                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                setUssdInputValue('*123#');
                                handleUssdDial();
                              }}
                              disabled={ussdDialing}
                              className="w-full py-2.5 bg-purple-primary hover:bg-purple-dark text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-opacity cursor-pointer disabled:opacity-50"
                            >
                              {ussdDialing ? (
                                <span className="animate-pulse flex items-center gap-1">Starting secure analog channel...</span>
                              ) : (
                                <>
                                  <Smartphone size={14} />
                                  <span>Simulate call *123#</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={handleCopyCode}
                              className="w-full py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-205 shadow-xs font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              {copiedCode ? (
                                <>
                                  <Check size={13} className="text-emerald-500" />
                                  <span className="text-emerald-600 font-semibold">Code copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} className="text-slate-500" />
                                  <span>Copy gateway code</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* MONOSPACED PHONE SCREEN SIMULATION */
                        <div className="space-y-4">
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 leading-relaxed shadow-inner overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full transform rotate-45" />
                            
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-normal border-b border-slate-800 pb-1.5 mb-2">
                              <span>Bonga offline responder</span>
                              <span className="text-emerald-555 flex items-center gap-1 animate-pulse">
                                <span>● Secure node</span>
                              </span>
                            </div>

                            {/* Content based on dynamic menu steps */}
                            {ussdSessionState === 'menu' && (
                              <div className="space-y-1 text-left">
                                <p className="font-semibold text-white">
                                  {ussdMenuLanguage === 'EN' ? 'Bonga active hub:' : 'Mfumo wa Bonga box:'}
                                </p>
                                <p>1. Confide FGM incident report</p>
                                <p>2. Interactive safe shelter coordinates</p>
                                <p>3. Dispatch community responder SOS</p>
                                <p>4. Language ({ussdMenuLanguage})</p>
                                <p className="text-emerald-500/60 mt-2 text-[10px] border-t border-slate-850 pt-1.5">
                                  {ussdMenuLanguage === 'EN' ? 'Type option number:' : 'Ingiza namba ya chaguo:'}
                                </p>
                              </div>
                            )}

                            {ussdSessionState === 'fgm_location' && (
                              <div className="space-y-1 text-left">
                                <p className="font-semibold text-white">USSD step 1: Choose location</p>
                                <p>1. Isiolo Central sub-county</p>
                                <p>2. Merti Sanctuary compound</p>
                                <p>3. Garba Tulla county area</p>
                                <p>4. Kinna / Sericho border</p>
                                <p className="text-slate-400 text-[10px] mt-2">Enter option (1-4):</p>
                              </div>
                            )}

                            {ussdSessionState === 'fgm_minors' && (
                              <div className="space-y-1 text-left">
                                <p className="font-semibold text-white">USSD step 2: Girls under risk</p>
                                <p>1. 1 - 2 girls</p>
                                <p>2. 3 - 5 girls surrounded</p>
                                <p>3. Active multi-family risk</p>
                                <p className="text-slate-400 text-[10px] mt-2">Enter option (1-3):</p>
                              </div>
                            )}

                            {ussdSessionState === 'fgm_success' && (
                              <div className="space-y-2 text-left">
                                <div className="text-center py-1.5 text-emerald-450 border-b border-slate-850 pb-1">
                                  <p className="font-semibold text-white text-xs">Submission accepted</p>
                                </div>
                                <p className="text-[11px] leading-normal text-slate-300">
                                  Your anonymous coordinates were securely dispatched over GSM networks to authorized local officers. High safety alert flagged.
                                </p>
                                <p className="text-[10px] text-slate-400 italic">Thank you for defending Isiolo girls.</p>
                              </div>
                            )}

                            {ussdSessionState === 'shelter_list' && (
                              <div className="space-y-1 text-left">
                                <p className="font-semibold text-white">USSD: Evacuation sanctuaries</p>
                                <p>1. Merti Sanctuary High Grid</p>
                                <p>2. Isiolo High Safe Center</p>
                                <p>3. Garba Tulla Sanctuary Depot</p>
                                <p className="text-slate-400 text-[10px] mt-2">Enter option (1-3):</p>
                              </div>
                            )}

                            {ussdSessionState === 'shelter_detail' && (
                              <div className="space-y-2 text-left">
                                <p className="font-semibold text-white">USSD: Shelter details</p>
                                <p className="text-slate-100">{ussdSelectedShelter}</p>
                                <div className="text-teal-400 text-[11px] py-1 border-t border-b border-slate-800">
                                  ● High altitude protection zone<br/>
                                  ● Fully stocked with food & medical packs
                                </div>
                                <p className="text-slate-400 text-[10px]">Type 0 to return to list</p>
                              </div>
                            )}

                            {ussdSessionState === 'responder_list' && (
                              <div className="space-y-1 text-left">
                                <p className="font-semibold text-white">USSD: Dispatch responder</p>
                                <p>1. Local Security Council desk</p>
                                <p>2. Volunteer Guardian network</p>
                                <p className="text-slate-400 text-[10px] mt-2">Enter option (1-2):</p>
                              </div>
                            )}

                            {ussdSessionState === 'responder_success' && (
                              <div className="space-y-2 text-left">
                                <p className="font-semibold text-white text-xs">SOS alert registered</p>
                                <p className="text-slate-300">
                                  Your cellular tower coordinates were processed. Safeguard guardians have been put on stand-by inside Isiolo dispatcher nodes.
                                </p>
                                <p className="text-slate-400 text-[10px]">Check your emergency SMS notifications soon.</p>
                              </div>
                            )}

                            {ussdSessionState === 'language_feedback' && (
                              <div className="space-y-1.5 text-center py-2">
                                <p className="font-semibold text-white">Lugha imebadilishwa!</p>
                                <p className="text-slate-300 text-xs">
                                  Mfumo sasa utatumia lugha ya Kiswahili kwa miamala yote ya dharura ya USSD.
                                </p>
                                <p className="text-emerald-500 text-[10px] mt-2">Andika 0 au piga nyuma ili kurejea</p>
                              </div>
                            )}

                            {ussdError && (
                              <p className="text-red-400 font-semibold border-t border-red-900/50 pt-1 mt-1.5">
                                Error: {ussdError}
                              </p>
                            )}
                          </div>

                          {/* Quick selector buttons */}
                          <div className="space-y-2">
                            {['menu', 'fgm_location', 'fgm_minors', 'shelter_list', 'responder_list'].includes(ussdSessionState) && (
                              <div className="flex flex-wrap items-center justify-center gap-1.5 py-1.5 bg-slate-50 border border-slate-150 p-2 rounded-xl">
                                <span className="text-[10px] font-semibold text-slate-400 mr-1.5">Quick select:</span>
                                {ussdSessionState === 'menu' && ['1', '2', '3', '4'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleUssdSubmitInput(val)}
                                    className="w-7 h-7 rounded bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-semibold text-xs transition-colors cursor-pointer"
                                  >
                                    {val}
                                  </button>
                                ))}
                                {ussdSessionState === 'fgm_location' && ['1', '2', '3', '4'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleUssdSubmitInput(val)}
                                    className="w-7 h-7 rounded bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-semibold text-xs transition-colors cursor-pointer"
                                  >
                                    {val}
                                  </button>
                                ))}
                                {ussdSessionState === 'fgm_minors' && ['1', '2', '3'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleUssdSubmitInput(val)}
                                    className="w-7 h-7 rounded bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-semibold text-xs transition-colors cursor-pointer"
                                  >
                                    {val}
                                  </button>
                                ))}
                                {ussdSessionState === 'shelter_list' && ['1', '2', '3'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleUssdSubmitInput(val)}
                                    className="w-7 h-7 rounded bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-semibold text-xs transition-colors cursor-pointer"
                                  >
                                    {val}
                                  </button>
                                ))}
                                {ussdSessionState === 'responder_list' && ['1', '2'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => handleUssdSubmitInput(val)}
                                    className="w-7 h-7 rounded bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-semibold text-xs transition-colors cursor-pointer"
                                  >
                                    {val}
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="flex justify-between gap-1.5">
                              <button
                                onClick={resetUssdSession}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex-1 transition-colors cursor-pointer"
                              >
                                {ussdMenuLanguage === 'EN' ? 'Restart USSD' : 'Anza upya'}
                              </button>
                              
                              {['shelter_detail', 'language_feedback'].includes(ussdSessionState) && (
                                <button
                                  onClick={() => setUssdSessionState('menu')}
                                  className="px-3 py-2 bg-purple-primary hover:bg-purple-dark text-white font-semibold rounded-lg text-xs flex-1 transition-colors cursor-pointer"
                                >
                                  {ussdMenuLanguage === 'EN' ? 'Back to menu' : 'Nyuma'}
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
                    <div className="space-y-3.5 text-left">
                      {smsTransmissionStage === 0 ? (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                              Emergency incident category
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { id: 'fgm_threat', label: 'Fgm threat' },
                                { id: 'flood_warning', label: 'Flood risk' },
                                { id: 'sos_assistance', label: 'Sos call' }
                              ].map(item => (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setSmsIncidentType(item.id)}
                                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold text-center transition-colors cursor-pointer ${
                                    smsIncidentType === item.id
                                      ? 'border-[#4F46E5] bg-indigo-50/70 text-[#4F46E5]'
                                      : 'border-slate-150 hover:bg-slate-50 text-slate-650'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-semibold text-slate-500">
                                Location or GPS tower details
                              </label>
                              <button
                                type="button"
                                onClick={() => setSmsLocation('Merti Sanctuary Node, High Zone 12')}
                                className="text-[11px] text-[#4F46E5] font-semibold hover:underline cursor-pointer"
                              >
                                Simulate coordinates
                              </button>
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="e.g., near Garba Tulla clinic"
                              value={smsLocation}
                              onChange={(e) => setSmsLocation(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 focus:border-purple-primary rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">
                              Incident details
                            </label>
                            <textarea
                              rows={3}
                              required
                              placeholder="Share incident descriptors safely. Report gets compressed offline instantly."
                              value={smsDetails}
                              onChange={(e) => setSmsDetails(e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 focus:border-purple-primary rounded-xl text-xs font-medium placeholder:text-slate-400 focus:outline-none resize-none"
                            />
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={handleSmsTransmit}
                              className="w-full py-2.5 bg-purple-primary hover:bg-purple-dark text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-opacity cursor-pointer"
                            >
                              <Send size={11} />
                              <span>Draft and send offline SMS</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        /* TRANSMISSION PROGRESS WORKFLOW */
                        <div className="space-y-4">
                          <p className="text-xs font-semibold text-slate-800">
                            Sending report offline via SMS
                          </p>

                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3.5">
                            <div className="space-y-2.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${smsTransmissionStage >= 2 ? 'bg-[#4F46E5]' : 'bg-slate-300'}`} />
                                <span className={`text-xs ${smsTransmissionStage >= 2 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                                  Checking available offline radio routes...
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${smsTransmissionStage >= 3 ? 'bg-[#4F46E5]' : 'bg-slate-300'}`} />
                                <span className={`text-xs ${smsTransmissionStage >= 3 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                                  Compiling secure tower coordinates...
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${smsTransmissionStage >= 4 ? 'bg-[#4F46E5]' : 'bg-slate-300'}`} />
                                <span className={`text-xs ${smsTransmissionStage >= 4 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                                  Compressing packet data fragments...
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className={`w-1.5 h-1.5 rounded-full ${smsTransmissionStage >= 5 ? 'bg-emerald-500' : 'bg-slate-300 animate-pulse'}`} />
                                <span className={`text-xs ${smsTransmissionStage >= 5 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                                  {smsTransmissionStage >= 5 ? 'Dispatch confirmation complete' : 'Dispatched over analog relays...'}
                                </span>
                              </div>
                            </div>

                            <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                              <motion.div 
                                animate={{ width: `${(Math.min(smsTransmissionStage, 5) / 5) * 100}%` }}
                                className="h-full bg-purple-primary transition-all duration-300"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            {smsTransmissionStage === 5 ? (
                              <button
                                onClick={resetSmsForm}
                                className="px-4 py-2 bg-purple-primary hover:bg-purple-dark text-white font-semibold rounded-lg text-xs cursor-pointer transition-colors animate-fadeIn"
                              >
                                Send another report
                              </button>
                            ) : (
                              <button
                                disabled
                                className="px-4 py-2 bg-slate-100 text-slate-400 font-medium rounded-lg text-xs cursor-not-allowed"
                              >
                                Packaging cells...
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
        <p className="text-[11px] text-slate-400 leading-relaxed max-w-md mx-auto">
          Standard telecom safety regulations apply. Analog cells log data hashes under secure county dispatch authorities.
        </p>
      </footer>

    </div>
  );
};

export default Home;

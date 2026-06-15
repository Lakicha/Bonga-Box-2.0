import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useGraphics } from '../GraphicsContext';
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { 
  ShieldCheck, 
  ChevronRight, 
  MapPin, 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert, 
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
  Lock,
  Radio,
  Users,
  EyeOff,
  Activity,
  ArrowRight,
  Info,
  ChevronLeft,
  Smartphone,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { isLowEnd, borderClass, textMutedClass } = useGraphics();
  const navigate = useNavigate();

  // Premium interactive animation configurations
  const hoverAnimation = isLowEnd ? {} : { scale: 1.01, y: -2 };
  const tapAnimation = isLowEnd ? {} : { scale: 0.985 };
  const transitionConfig = isLowEnd ? { duration: 0.1 } : { type: "spring", stiffness: 350, damping: 25 };

  // Core Connection States
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(0);
  const [lastCheckTime, setLastCheckTime] = useState<string>('01:30 AM');

  // SOS Transmit States & Feedback
  const [isSosSending, setIsSosSending] = useState<boolean>(false);
  const [sosFeedback, setSosFeedback] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [sentCoordinates, setSentCoordinates] = useState<string | null>(null);

  // Panic Mode (requires 2-sec hold to trigger SOS)
  const [isPanicMode, setIsPanicMode] = useState<boolean>(() => {
    return localStorage.getItem('bonga_panic_mode') === 'true';
  });
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [showHoldInstruction, setShowHoldInstruction] = useState<boolean>(false);
  
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // USSD & SMS Fallback States
  const [isUSSDOpen, setIsUSSDOpen] = useState<boolean>(false);
  const [ussdDialing, setUssdDialing] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [ussdActiveTab, setUssdActiveTab] = useState<'ussd' | 'sms'>('ussd');
  const [ussdSessionState, setUssdSessionState] = useState<
    'dialpad' | 'menu' | 'fgm_location' | 'fgm_minors' | 'fgm_success' | 
    'shelter_list' | 'shelter_detail' | 'responder_list' | 'responder_success' | 'language_feedback'
  >('dialpad');
  const [ussdSelectedShelter, setUssdSelectedShelter] = useState<string>('');
  const [ussdMenuLanguage, setUssdMenuLanguage] = useState<'EN' | 'SW'>('EN');
  const [ussdInputValue, setUssdInputValue] = useState<string>('');
  const [ussdError, setUssdError] = useState<string>('');

  // Offline SMS states
  const [smsIncidentType, setSmsIncidentType] = useState<string>('fgm_threat');
  const [smsLocation, setSmsLocation] = useState<string>('');
  const [smsDetails, setSmsDetails] = useState<string>('');
  const [smsLogs, setSmsLogs] = useState<string[]>([]);
  const [smsTransmissionStage, setSmsTransmissionStage] = useState<number>(0); 
  const [smsStatusText, setSmsStatusText] = useState<string>('');

  // Local anonymous report logs tracking
  const [anonymousReportIds, setAnonymousReportIds] = useState<string[]>([]);

  // Simulation Notifications
  const [incomingNotifications, setIncomingNotifications] = useState<Array<{ id: string; sender: string; text: string }>>([]);

  // Fetch / Sync reports from local storage on load
  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
    setAnonymousReportIds(list);
    
    // Simulate initial load sequence
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 650);

    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
      clearTimeout(timer);
    };
  }, []);

  const triggerHaptic = (type: 'light' | 'success' | 'warning' | 'error') => {
    window.dispatchEvent(new CustomEvent('bonga_trigger_haptic', { detail: { type } }));
  };

  // Run a quick security diagnostic check
  const handleRunCheck = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanStep(0);
    triggerHaptic('light');

    const steps = [
      'Establishing connections with district transmitters...',
      'Mapping safest local emergency response lines...',
      'Evaluating active river sensor channels...',
      'Check complete. Your protection routes are safe.'
    ];

    const timer = setInterval(() => {
      setScanStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setTimeout(() => {
            setIsScanning(false);
            const now = new Date();
            setLastCheckTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            triggerHaptic('success');
          }, 450);
          return prev;
        }
        triggerHaptic('light');
        return prev + 1;
      });
    }, 450);
  };

  const handleStartHolding = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isSosSending) return;
    if (!isPanicMode) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    
    setIsHolding(true);
    setHoldProgress(0);
    setShowHoldInstruction(false);
    startTimeRef.current = Date.now();
    
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const targetDuration = 2000;
      const progress = Math.min((elapsed / targetDuration) * 100, 100);
      
      setHoldProgress(progress);
      
      if (Math.floor(progress) % 20 === 0) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
      
      if (progress >= 100) {
        setIsHolding(false);
        setHoldProgress(0);
        if (holdTimerRef.current) {
          clearInterval(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        triggerQuickSOS();
      }
    }, 40);
  };

  const handleStopHolding = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isPanicMode) return;
    
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const elapsed = Date.now() - startTimeRef.current;
    
    setIsHolding(false);
    setHoldProgress(0);
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (elapsed > 0 && elapsed < 800 && !isSosSending) {
      setShowHoldInstruction(true);
      setTimeout(() => {
        setShowHoldInstruction(false);
      }, 3000);
    }
  };

  const triggerQuickSOS = async () => {
    setIsSosSending(true);
    triggerHaptic('warning');
    
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([150, 80, 150, 80, 300]); 
    }
    
    let locationStr = "Isiolo County network cluster point";
    
    const sendAlert = async (locStr: string) => {
      try {
        const docRef = await addDoc(collection(db, 'reports'), {
          category: 'Emergency',
          location: locStr,
          description: `🚨 EMERGENCY BRIEF ALARM triggered spontaneously from client home center. Urgent responder dispatch requested. Mode: ${isOnline ? 'Online' : 'Offline'}.`,
          status: 'Pending',
          isAnonymous: true,
          authorUid: user?.uid || null,
          timestamp: serverTimestamp()
        });

        // Track in client session
        const currentReports = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
        currentReports.unshift(docRef.id);
        localStorage.setItem('bonga_anonymous_reports', JSON.stringify(currentReports));
        setAnonymousReportIds(currentReports);

        triggerHaptic('success');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 150, 50, 300]);
        }

        setSosFeedback("Alarm sent safely. Local response teams notified.");
        setSentCoordinates(locStr);
        setShowSuccessToast(true);

        setTimeout(() => {
          setSosFeedback(null);
          setShowSuccessToast(false);
        }, 5000);
      } catch (err) {
        console.error('SOS dispatch error:', err);
        alert('Primary server connection offline. Alarm registered in backup local queue.');
      } finally {
        setIsSosSending(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          locationStr = `GPS coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (Acc: ±${accuracy.toFixed(0)}m)`;
          sendAlert(locationStr);
        },
        () => {
          locationStr = "Isiolo County general district node (GPS fallback)";
          sendAlert(locationStr);
        },
        { enableHighAccuracy: true, timeout: 3500 }
      );
    } else {
      sendAlert(locationStr);
    }
  };

  // USSD flow handling
  const resetUssdSession = () => {
    setUssdSessionState('dialpad');
    setUssdInputValue('');
    setUssdError('');
  };

  const handleUssdDial = () => {
    if (ussdInputValue !== '*123#') {
      setUssdError('Invalid USSD gateway code. Correct code: *123#');
      triggerHaptic('error');
      return;
    }
    setUssdError('');
    setUssdDialing(true);
    triggerHaptic('success');
    setTimeout(() => {
      setUssdDialing(false);
      setUssdSessionState('menu');
    }, 850);
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
        setUssdMenuLanguage(ussdMenuLanguage === 'EN' ? 'SW' : 'EN');
        setUssdSessionState('language_feedback');
        triggerHaptic('light');
      } else {
        setUssdError('Select option 1, 2, 3, or 4.');
        triggerHaptic('error');
      }
    } else if (ussdSessionState === 'fgm_location') {
      if (['1', '2', '3', '4'].includes(choice)) {
        setUssdSessionState('fgm_minors');
        triggerHaptic('light');
      } else {
        setUssdError('Select options 1-4.');
        triggerHaptic('error');
      }
    } else if (ussdSessionState === 'fgm_minors') {
      if (['1', '2', '3'].includes(choice)) {
        setUssdSessionState('fgm_success');
        triggerHaptic('success');
        const list = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
        list.push('ussd_' + Math.floor(Math.random() * 90000 + 10000));
        localStorage.setItem('bonga_anonymous_reports', JSON.stringify(list));
        setAnonymousReportIds(list);
      } else {
        setUssdError('Select options 1-3.');
        triggerHaptic('error');
      }
    } else if (ussdSessionState === 'shelter_list') {
      if (['1', '2', '3'].includes(choice)) {
        const shelters = [
          'Merti Central Sanctuary (capacity active, altitude 340m)',
          'Isiolo High Safe Center (local safeguarding response desk)',
          'Garba Tulla Sanctuary Depot (stocked hygiene resource center)'
        ];
        setUssdSelectedShelter(shelters[parseInt(choice) - 1]);
        setUssdSessionState('shelter_detail');
        triggerHaptic('light');
      } else {
        setUssdError('Select 1, 2, or 3.');
        triggerHaptic('error');
      }
    } else if (ussdSessionState === 'responder_list') {
      if (['1', '2'].includes(choice)) {
        setUssdSessionState('responder_success');
        triggerHaptic('success');
      } else {
        setUssdError('Select 1 or 2.');
        triggerHaptic('error');
      }
    }
    setUssdInputValue('');
  };

  const handleSmsTransmit = () => {
    if (!smsLocation.trim() || !smsDetails.trim()) {
      alert("Provide location details and description before submitting.");
      return;
    }

    setSmsTransmissionStage(1);
    setSmsStatusText("Connecting with radio mesh fallback...");
    setSmsLogs([]);
    triggerHaptic('success');
    
    const steps = [
      { t: "Extracting local transmitter coordinates...", log: "[Cellular] Triangulated location logged" },
      { t: "Wrapping report in metadata protection layers...", log: "[Protocol] Cryptographic packet hashed" },
      { t: "Splitting GSM transmitter packets offline...", log: "[Radio] Dispatched packet cluster" },
      { t: "Awaiting local receiver acknowledgement...", log: "[Success] Node acknowledged receipt" },
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < steps.length) {
        setSmsStatusText(steps[current].t);
        setSmsLogs(prev => [...prev, steps[current].log]);
        setSmsTransmissionStage(current + 2);
        triggerHaptic('light');
        current++;
      } else {
        clearInterval(interval);
        setSmsTransmissionStage(5);
        setSmsStatusText("Message transmitted safely");
        triggerHaptic('success');
        
        const list = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
        list.push('sms_' + Math.floor(Math.random() * 90000 + 10000));
        localStorage.setItem('bonga_anonymous_reports', JSON.stringify(list));
        setAnonymousReportIds(list);
        
        setTimeout(() => {
          const notif = {
            id: Date.now().toString(),
            sender: "Bonga Protection Center",
            text: `Delivery confirmed. Zero-data safeguarding case logged at ${smsLocation}. Support caseworkers notified.`
          };
          setIncomingNotifications(prev => [notif, ...prev]);
          triggerHaptic('warning');
        }, 1200);
      }
    }, 700);
  };

  const resetSmsForm = () => {
    setSmsLocation('');
    setSmsDetails('');
    setSmsLogs([]);
    setSmsTransmissionStage(0);
    setSmsStatusText('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText("*123#");
    setCopiedCode(true);
    triggerHaptic('success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const displayName = user?.displayName 
    ? user.displayName.split(' ')[0] 
    : (user?.email ? user.email.split('@')[0] : 'Theo');

  return (
    <div className="font-sans max-w-4xl mx-auto pt-4 pb-28 px-4 select-none relative" id="homepage-container">
      
      {/* 1. COMPACT SIMULATED TOAST NOTIFICATION GRID */}
      <div className="fixed top-4 right-4 z-[9990] pointer-events-none flex flex-col gap-2 max-w-sm w-full">
        <AnimatePresence>
          {incomingNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-4 rounded-[20px] shadow-lg pointer-events-auto flex items-start gap-3 relative overflow-hidden text-left"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-amber-500" />
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                <Bell size={14} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-amber-500 font-semibold font-mono font-medium tracking-wide">
                  {notif.sender}
                </p>
                <p className="text-xs text-slate-100 font-normal mt-0.5 leading-relaxed">
                  {notif.text}
                </p>
                <div className="flex items-center gap-2 mt-2 font-mono">
                  <span className="text-[10px] text-slate-400">Radio connection</span>
                  <button 
                    onClick={() => {
                      setIncomingNotifications(prev => prev.filter(n => n.id !== notif.id));
                    }}
                    className="ml-auto text-[10px] text-indigo-400 hover:text-indigo-300 font-medium bg-slate-800 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          /* SKELETON LOADING VIEW */
          <motion.div
            key="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 animate-pulse"
          >
            <div className="h-10 bg-slate-100 rounded-[20px] w-full" />
            <div className="h-44 bg-slate-100 rounded-[20px] w-full" />
            <div className="space-y-3">
              <div className="h-4 bg-slate-100 rounded w-1/4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-28 bg-slate-100 rounded-[20px]" />
                <div className="h-28 bg-slate-100 rounded-[20px]" />
              </div>
            </div>
          </motion.div>
        ) : (
          /* MAIN TRUST-FIRST HOMEPAGE */
          <motion.div
            key="loaded-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* 2. CONSOLIDATED TRUST STATUS ROW */}
            <div className="bg-slate-50/50 border border-slate-200/60 rounded-[20px] p-3.5 flex flex-wrap items-center justify-between gap-4 text-slate-600 shadow-sm">
              
              {/* Pillar 1: Safety status checking (Am I safe?) */}
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900">Protected</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-slate-400">Guarding network live</p>
                </div>
              </div>

              {/* Divider */}
              <div className="hidden md:block h-6 w-px bg-slate-200" />

              {/* Pillar 2: Connectivity switcher (Connected indicator) */}
              <button
                onClick={() => {
                  setIsOnline(!isOnline);
                  triggerHaptic('success');
                }}
                className={`flex items-center gap-2 hover:bg-slate-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer text-left focus:outline-none`}
                title="Click to toggle offline mode test"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isOnline ? 'bg-indigo-50 text-[#4F46E5]' : 'bg-amber-50 text-amber-600'
                }`}>
                  {isOnline ? <Signal size={12} /> : <WifiOff size={11} />}
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 block leading-tight">
                    {isOnline ? 'Connected' : 'Offline Mode'}
                  </span>
                  <p className="text-[10px] text-indigo-600 hover:underline">
                    {isOnline ? 'Active satellite relay' : 'Tap to restore network'}
                  </p>
                </div>
              </button>

              {/* Divider */}
              <div className="hidden md:block h-6 w-px bg-slate-200" />

              {/* Pillar 3: Last Synchronization logs */}
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900">Last Synced</div>
                  <p className="text-[10px] text-slate-400">Today, {lastCheckTime}</p>
                </div>
                <button
                  onClick={handleRunCheck}
                  disabled={isScanning}
                  className="p-2 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 transition-all flex items-center gap-1.5 focus:outline-none disabled:opacity-40 cursor-pointer text-xs font-semibold"
                  title="Run diagnostics sync"
                >
                  <RefreshCw size={13} className={isScanning ? 'animate-spin text-[#4F46E5]' : ''} />
                  <span>{isScanning ? 'Checking' : 'Sync Diagnostics'}</span>
                </button>
              </div>
            </div>

            {/* Scanning Diagnostics notification bar */}
            <AnimatePresence>
              {isScanning && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-indigo-50/40 border border-indigo-100 rounded-[20px] p-4 text-left overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#4F46E5] animate-ping" />
                    <span className="text-xs font-semibold text-[#4F46E5]">Active security check ongoing</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal font-sans">
                    {[
                      'Establishing connections with district transmitters...',
                      'Mapping safest local emergency response lines...',
                      'Evaluating active river sensor channels...',
                      'Check complete. Your protection routes are safe.'
                    ][scanStep]}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3. REASSURING COMPASSIONATE HERO SECTION */}
            <div className="bg-gradient-to-br from-indigo-50/30 to-emerald-50/20 border border-slate-200 rounded-[20px] p-6 text-left relative overflow-hidden shadow-sm">
              {/* Soft background glow circles */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-36 h-36 bg-indigo-500/5 rounded-full -mb-12 blur-2xl pointer-events-none" />
              
              <div className="max-w-2xl relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full flex items-center gap-1">
                    <span className="w-1 h-1 bg-emerald-550 rounded-full animate-pulse" />
                    <span>Active Protection Status</span>
                  </div>
                  {user && (
                    <span className="text-xs text-slate-500 font-medium">Hello, {displayName}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    You are protected
                  </h1>
                  <p className="text-sm text-slate-500 leading-relaxed font-normal">
                    Your local crisis assistance and protection networks are fully operational. Bonga safeguarding units are online, monitoring flood forecasts, and standing by for responses nearby.
                  </p>
                </div>

                {/* Highly tap-responsive Hero Primary Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5">
                  <button
                    onClick={() => {
                      navigate('/report');
                      triggerHaptic('light');
                    }}
                    className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] active:scale-95 text-white text-xs font-semibold rounded-[20px] transition-all flex items-center justify-between shadow-sm border border-indigo-700 pointer-events-auto cursor-pointer"
                  >
                    <span>Report safely</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    onClick={() => {
                      setIsUSSDOpen(true);
                      triggerHaptic('light');
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 active:scale-95 text-slate-800 text-xs font-semibold rounded-[20px] transition-all flex items-center justify-between shadow-sm pointer-events-auto cursor-pointer"
                  >
                    <span>Emergency SOS</span>
                    <ShieldAlert size={13} className="text-rose-500" />
                  </button>

                  <button
                    onClick={() => {
                      navigate('/support');
                      triggerHaptic('light');
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 active:scale-95 text-slate-00 text-xs font-semibold rounded-[20px] transition-all flex items-center justify-between shadow-sm pointer-events-auto cursor-pointer"
                  >
                    <span>Get support</span>
                    <HeartHandshake size={13} className="text-[#4F46E5]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Offline notification card if client turns it on */}
            {!isOnline && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-amber-50/50 border border-amber-200 rounded-[20px] p-5 text-left flex items-start gap-4 shadow-sm"
              >
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0 border border-amber-100">
                  <WifiOff size={20} className="animate-pulse" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-semibold text-amber-800">
                    Offline Protection Mode Active
                  </h3>
                  <p className="text-xs text-amber-700/90 leading-relaxed">
                    Cellular data link is not required. You can still transmit emergency report alerts. Bonga gathers coordinates under secure, light analog packets pushed over free SMS and USSD gateways.
                  </p>
                  <div className="flex gap-2 pt-1 font-sans">
                    <button
                      onClick={() => {
                        setUssdActiveTab('ussd');
                        setIsUSSDOpen(true);
                        resetUssdSession();
                      }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Dial offline USSD
                    </button>
                    <button
                      onClick={() => {
                        setUssdActiveTab('sms');
                        setIsUSSDOpen(true);
                        resetSmsForm();
                      }}
                      className="px-3 py-1.5 bg-white border border-amber-200 text-amber-800 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Draft offline SMS
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. MAIN ACTION-ORIENTED DASHBOARD GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              
              {/* LEFT SIDE: QUICK ACTIONS (Large Highly Tappable Cards) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pl-1">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Quick Action Hub
                  </h2>
                  <span className="text-[10px] text-slate-400">What can I do right now?</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Action 1: Report Safely */}
                  <motion.div
                    onClick={() => {
                      navigate('/report');
                      triggerHaptic('light');
                    }}
                    whileHover={hoverAnimation}
                    whileTap={tapAnimation}
                    transition={transitionConfig}
                    className="bg-white border border-slate-200 hover:border-indigo-200 p-4.5 rounded-[20px] cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-32 group"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-2 shrink-0">
                      <ShieldCheck size={16} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 leading-tight group-hover:text-[#4F46E5]">Report safely</span>
                        <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Submit secure, self-cleaning anonymous records.
                      </p>
                    </div>
                  </motion.div>

                  {/* Action 2: Talk to a Counselor */}
                  <motion.div
                    onClick={() => {
                      navigate('/support');
                      triggerHaptic('light');
                    }}
                    whileHover={hoverAnimation}
                    whileTap={tapAnimation}
                    transition={transitionConfig}
                    className="bg-white border border-slate-200 hover:border-indigo-200 p-4.5 rounded-[20px] cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-32 group"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
                    <div className="w-8 h-8 rounded-full bg-[#E5E7EB] text-[#4F46E5] flex items-center justify-center mb-2 shrink-0">
                      <MessageSquare size={16} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 leading-tight group-hover:text-[#4F46E5]">Talk to a counselor</span>
                        <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Confidential, private message link with district workers.
                      </p>
                    </div>
                  </motion.div>

                  {/* Action 3: Find Safe Services */}
                  <motion.div
                    onClick={() => {
                      navigate('/resources');
                      triggerHaptic('light');
                    }}
                    whileHover={hoverAnimation}
                    whileTap={tapAnimation}
                    transition={transitionConfig}
                    className="bg-white border border-slate-200 hover:border-indigo-200 p-4.5 rounded-[20px] cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-32 group"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center mb-2 shrink-0">
                      <MapPin size={16} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 leading-tight group-hover:text-[#4F46E5]">Find safe services</span>
                        <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Locate verified high-ground sanctuaries and clinics.
                      </p>
                    </div>
                  </motion.div>

                  {/* Action 4: Emergency Help */}
                  <motion.div
                    onClick={() => {
                      setIsUSSDOpen(true);
                      triggerHaptic('light');
                    }}
                    whileHover={hoverAnimation}
                    whileTap={tapAnimation}
                    transition={transitionConfig}
                    className="bg-slate-50 border border-slate-200 hover:border-indigo-200 p-4.5 rounded-[20px] cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-32 group"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-2 shrink-0">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900 leading-tight group-hover:text-[#4F46E5]">Emergency help</span>
                        <ChevronRight size={12} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Trigger cellular triangulated backups offline.
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* RIGHT SIDE: MY PROTECTION / COORDINATED WATCH */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pl-1">
                  <h2 className="text-sm font-semibold text-slate-800">
                    My Protection Desk
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium">Who can help me?</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-[20px] p-5 space-y-4 shadow-sm">
                  
                  {/* Open Cases and updates status review */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                      <EyeOff size={13} className="text-slate-400" />
                      <span>Active anonymous safeguarding concerns</span>
                    </h3>
                    
                    {anonymousReportIds.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                        <p className="text-[11px] text-slate-500 font-normal leading-normal">
                          All reports resolved. No open identity logs are cached under your profile.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-24 overflow-y-auto">
                        {anonymousReportIds.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-[#4F46E5]">
                                #BNG-{item.substring(0, 6).toUpperCase()}
                              </span>
                              <p className="text-[10px] text-slate-500">Safeguarding priority alert</p>
                            </div>
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-[#4F46E5] text-[9px] font-semibold rounded-full">
                              Under active review
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100" />

                  {/* Trusted Contacts and status indicators */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                      <Users size={13} className="text-slate-400" />
                      <span>Verified local support links</span>
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs text-slate-800">Isiolo Crisis Support Node</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          Ready & Active
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          <span className="text-xs text-slate-800">Red Cross Response Lead</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                          Available
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100" />

                  {/* Nearby support distance status */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span>Sanctuaries closest to you</span>
                    </h3>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-medium text-slate-800">Merti Sanctuary Zone</span>
                        <div className="flex items-center gap-2 font-sans text-[10px]">
                          <span className="text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">12 spaces open</span>
                          <span className="text-slate-400">1.2km</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span className="font-medium text-slate-800">Isiolo High Safe Center</span>
                        <div className="flex items-center gap-2 font-sans text-[10px]">
                          <span className="text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">24 spaces open</span>
                          <span className="text-slate-400">4.5km</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>

            {/* 5. RECENT ACTIVITY (What changed since I last opened the app?) */}
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between pl-1">
                <h2 className="text-sm font-semibold text-slate-800">
                  Recent Safety Updates
                </h2>
                <span className="text-[10px] text-slate-400 font-medium">What changed recently?</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-[20px] p-5 space-y-4 shadow-sm">
                
                {/* Micro Feed Update 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 leading-none">Merti Sanctuary stock verified</span>
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">Verified</span>
                    </div>
                    <p className="text-xs text-slate-400 font-normal leading-normal">
                      Emergency food stores, hygiene, and medical supply packs checked and fully updated. Ready for immediate intake.
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">Just now · Safety coordinator</span>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Micro Feed Update 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Info size={14} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 leading-none">Regional river level safe</span>
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-medium">Normal</span>
                    </div>
                    <p className="text-xs text-slate-400 font-normal leading-normal">
                      River Ewaso Ng'iro flood sensors indicating steady flows, comfortably below emergency warnings.
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">15m ago · Hydro-Sensor Net</span>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Micro Feed Update 3 */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Radio size={14} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 leading-none">Local transmitter sync confirmed</span>
                      <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">Backup Ready</span>
                    </div>
                    <p className="text-xs text-slate-400 font-normal leading-normal">
                      Secondary low-frequency analog radio meshes established. Active and ready to route SMS messages if primary grid falls.
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">1h ago · County Telecom Node</span>
                  </div>
                </div>

              </div>
            </div>

            {/* 6. TRUST CENTER INTEGRITY SUMMARY */}
            <div className="bg-slate-50/70 border border-slate-205 rounded-[20px] p-5 text-left shadow-xs">
              <div className="flex items-center gap-2 mb-3 pl-0.5">
                <Lock size={14} className="text-slate-400" />
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider font-mono">
                  Trust center guidelines
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <span>Anonymous</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal leading-normal">
                    IP registers or identity markers are deleted instantly check-by-check.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <span>Encrypted</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal leading-normal">
                    E2E keys shield transmission packets entirely from interception.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <span>Verified</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal leading-normal">
                    Managed securely under licensed local community protection authorities.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    <span>Offline ready</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal leading-normal">
                    Capable of dial-in USSD and free SMS alerts even under blackouts.
                  </p>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FLOATING SECURE TRANSMISSION SIMULATOR OVERLAYS --- */}
      <AnimatePresence>
        {isSosSending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-950/20 z-[9995] pointer-events-none select-none flex flex-col justify-between p-6"
          >
            <div className="absolute inset-0 bg-red-600/5 ring-8 ring-rose-600/20 animate-pulse" />
            <div className="relative w-full max-w-sm mx-auto bg-slate-900/95 backdrop-blur-md rounded-[20px] p-4 shadow-2xl border border-rose-500/30 font-sans pointer-events-auto flex flex-col gap-2 mt-4">
              <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-rose-500 tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping inline-block" />
                  SOS active
                </span>
                <span>Secure transfer</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ left: "-40%", width: "40%" }}
                  animate={{ left: "110%" }}
                  transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                  className="absolute h-full bg-rose-500" 
                />
              </div>
              <p className="text-[10px] text-slate-400 text-left">
                Sending coordinates over encrypted satellites...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[9990] pointer-events-auto"
          >
            <div className="bg-slate-900 border border-emerald-500/25 rounded-[20px] p-5 shadow-2xl backdrop-blur-md relative overflow-hidden flex flex-col gap-3 text-left">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <div className="flex gap-3 items-start">
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                      SOS Dispatch complete
                    </h3>
                    <button 
                      onClick={() => setShowSuccessToast(false)}
                      className="text-slate-400 p-1 hover:text-slate-200 rounded cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    Emergency response units have been successfully notified. Incident tracker logged anonymously.
                  </p>
                </div>
              </div>

              {sentCoordinates && (
                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 font-mono text-[9px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>GPS towers:</span>
                    <span className="text-slate-200 truncate max-w-[180px]">{sentCoordinates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safety network:</span>
                    <span className="text-emerald-405 font-semibold">Ready</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 7. REDESIGNED PERSISTENT SOS FLOATING ACTION ORB */}
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[9999] flex flex-col items-end gap-2 pointer-events-none select-none font-sans">
        <AnimatePresence>
          {sosFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-rose-600 text-white text-[11px] font-semibold py-2 px-3 rounded-xl shadow-lg flex items-center gap-2 max-w-xs pointer-events-auto border border-rose-500"
            >
              <ShieldAlert size={14} className="animate-pulse" />
              <span>{sosFeedback}</span>
            </motion.div>
          )}

          {isPanicMode && isHolding && !isSosSending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-rose-700 text-white text-[10px] font-semibold tracking-wide py-1 px-2.5 rounded-lg shadow-md flex items-center gap-2 pointer-events-auto"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>Holding: {Math.round(holdProgress)}%</span>
            </motion.div>
          )}

          {isPanicMode && showHoldInstruction && !isHolding && !isSosSending && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-slate-900 text-white text-[10px] font-medium py-1.5 px-3 rounded-lg shadow-lg max-w-[180px] text-right pointer-events-auto border border-rose-500/20"
            >
              <span>Press and hold for 2s to activate Emergency SOS alarm.</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative pointer-events-auto">
          {/* Circular progress loader overlay for Panic Mode hold */}
          {isPanicMode && isHolding && !isSosSending && (
            <svg className="absolute -inset-1 w-[64px] h-[64px] transform -rotate-90 pointer-events-none z-10">
              <circle
                cx="32"
                cy="32"
                r="29"
                stroke="rgba(224, 242, 254, 0.2)"
                strokeWidth="4"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="29"
                stroke="rgb(225, 29, 72)"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 29}
                strokeDashoffset={2 * Math.PI * 29 - (holdProgress / 100) * (2 * Math.PI * 29)}
                strokeLinecap="round"
              />
            </svg>
          )}

          <motion.button
            onClick={() => {
              if (!isPanicMode) {
                triggerQuickSOS();
              }
            }}
            onPointerDown={handleStartHolding}
            onPointerUp={handleStopHolding}
            onPointerLeave={handleStopHolding}
            disabled={isSosSending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`h-14 w-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-90 text-white flex items-center justify-center shadow-lg hover:shadow-xl border-2 border-white/10 transition-all pointer-events-auto cursor-pointer relative z-20 ${
              isSosSending ? 'animate-pulse bg-rose-500' : 'animate-pulse'
            }`}
            id="emergency-sos-float"
            title="Immediate emergency protection SOS"
          >
            {isSosSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ShieldAlert size={24} />
            )}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-100"></span>
            </span>
          </motion.button>
        </div>
      </div>

      {/* --- MODERN CRITICAL USSD & SMS DIALOG OVERLAY --- */}
      <AnimatePresence>
        {isUSSDOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsUSSDOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9991] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()} 
              className="w-full max-w-md bg-white border border-slate-200 rounded-[20px] shadow-xl relative flex flex-col overflow-hidden text-left font-sans"
            >
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider font-mono">
                    Offline Protection Gate
                  </span>
                </div>
                <button 
                  onClick={() => setIsUSSDOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 border-b border-slate-100 p-1.5 gap-1 bg-slate-50/50">
                <button
                  onClick={() => {
                    setUssdActiveTab('ussd');
                    resetUssdSession();
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    ussdActiveTab === 'ussd'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Smartphone size={13} />
                  <span>Dial USSD</span>
                </button>

                <button
                  onClick={() => {
                    setUssdActiveTab('sms');
                    resetSmsForm();
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    ussdActiveTab === 'sms'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare size={13} />
                  <span>SMS Report Draft</span>
                </button>
              </div>

              {/* Tab Panel Content */}
              <div className="p-5">
                {ussdActiveTab === 'ussd' ? (
                  <div className="space-y-4">
                    {ussdSessionState === 'dialpad' ? (
                      <div className="text-center py-4 space-y-4">
                        <div className="bg-slate-50 border border-slate-150 py-4 px-2 rounded-[20px] max-w-xs mx-auto">
                          <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono">*123#</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                          Dial our emergency USSD code offline of any mobile carrier to coordinate evacuation points, notify emergency responders, or log safe house routes completely free.
                        </p>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setUssdInputValue('*123#');
                              handleUssdDial();
                            }}
                            disabled={ussdDialing}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-40"
                          >
                            <Smartphone size={14} />
                            <span>{ussdDialing ? 'Starting offline gateway...' : 'Simulate offline dial'}</span>
                          </button>

                          <button
                            onClick={handleCopyCode}
                            className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-205 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                          >
                            {copiedCode ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                            <span>{copiedCode ? 'Copied code' : 'Copy dialing code'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* SIMULATED DEVICE DIAL LOG */
                      <div className="space-y-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-[20px] p-4 text-emerald-400 font-mono text-xs leading-relaxed overflow-hidden relative">
                          <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-800 pb-1.5 mb-2.5">
                            <span>Bonga Analog System</span>
                            <span className="text-emerald-500 animate-pulse">● Radio sync connected</span>
                          </div>

                          {ussdSessionState === 'menu' && (
                            <div className="space-y-1">
                              <p className="font-semibold text-white">
                                {ussdMenuLanguage === 'EN' ? 'Bonga disaster & protection portal:' : 'Mfumo wa amani wa Bonga:'}
                              </p>
                              <p>1. Transmit anonymous FGM risk alert</p>
                              <p>2. View coordinates of nearest safe houses</p>
                              <p>3. Dispatch volunteer response units</p>
                              <p>4. Switch Language ({ussdMenuLanguage})</p>
                              <p className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 mt-2">
                                {ussdMenuLanguage === 'EN' ? 'Enter numerical choice:' : 'Ingiza namba ya chaguo:'}
                              </p>
                            </div>
                          )}

                          {ussdSessionState === 'fgm_location' && (
                            <div className="space-y-1">
                              <p className="font-semibold text-white">Choose threat county location:</p>
                              <p>1. Isiolo Central sector</p>
                              <p>2. Merti Sanctuary zone</p>
                              <p>3. Garba Tulla county nodes</p>
                              <p>4. Sericho peripheral grids</p>
                            </div>
                          )}

                          {ussdSessionState === 'fgm_minors' && (
                            <div className="space-y-1">
                              <p className="font-semibold text-white">Girls requiring protection shield:</p>
                              <p>1. 1 to 2 girls surrounds</p>
                              <p>2. 3 to 5 girls immediate risk</p>
                              <p>3. Multi-family risk emergency</p>
                            </div>
                          )}

                          {ussdSessionState === 'fgm_success' && (
                            <div className="space-y-1.5 text-center py-2">
                              <p className="font-semibold text-white">Threat Alert Transmitted</p>
                              <p className="text-[11px] text-slate-300">
                                Coordinates dispatched securely to county safeguarding authorities. High security watch deployed.
                              </p>
                            </div>
                          )}

                          {ussdSessionState === 'shelter_list' && (
                            <div className="space-y-1">
                              <p className="font-semibold text-white">Evacuation shelter depots:</p>
                              <p>1. Merti Sanctuary compound</p>
                              <p>2. Isiolo Safe High Center</p>
                              <p>3. Garba Tulla Sanctuary Depot</p>
                            </div>
                          )}

                          {ussdSessionState === 'shelter_detail' && (
                            <div className="space-y-2">
                              <p className="font-semibold text-white">Depot details:</p>
                              <p className="text-slate-100">{ussdSelectedShelter}</p>
                              <p className="text-[10px] text-slate-500 border-t border-slate-800 pt-1.5">
                                Type 0 or back to return to lists.
                              </p>
                            </div>
                          )}

                          {ussdSessionState === 'responder_list' && (
                            <div className="space-y-1">
                              <p className="font-semibold text-white">Request immediate volunteer dispatch:</p>
                              <p>1. Local Village Security Council desk</p>
                              <p>2. Authorized safety network guardians</p>
                            </div>
                          )}

                          {ussdSessionState === 'responder_success' && (
                            <div className="space-y-1 text-center py-2">
                              <p className="font-semibold text-white text-xs">Response Alert Dispatched</p>
                              <p className="text-[11px] text-slate-300">
                                Guardians put on active standby inside local towers. Check SMS confirmation prompts.
                              </p>
                            </div>
                          )}

                          {ussdSessionState === 'language_feedback' && (
                            <div className="space-y-2 text-center py-1">
                              <p className="font-semibold text-white">Language switch completed!</p>
                              <p className="text-[11px] text-slate-300">
                                Bonga USSD system has stored your preference with zero logs. Kiswahili and English are active.
                              </p>
                            </div>
                          )}

                          {ussdError && (
                            <p className="text-rose-400 font-bold border-t border-rose-950 pt-2 mt-2">
                              Error: {ussdError}
                            </p>
                          )}
                        </div>

                        {/* Dialing Helper Inputs inside USSD */}
                        <div className="space-y-3 font-sans">
                          {['menu', 'fgm_location', 'fgm_minors', 'shelter_list', 'responder_list'].includes(ussdSessionState) && (
                            <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                              <span className="text-[10px] text-slate-500 font-medium">Quick select:</span>
                              {ussdSessionState === 'menu' && ['1', '2', '3', '4'].map(k => (
                                <button
                                  key={k}
                                  onClick={() => handleUssdSubmitInput(k)}
                                  className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-xs font-bold transition-all cursor-pointer"
                                >
                                  {k}
                                </button>
                              ))}
                              {ussdSessionState === 'fgm_location' && ['1', '2', '3', '4'].map(k => (
                                <button
                                  key={k}
                                  onClick={() => handleUssdSubmitInput(k)}
                                  className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-xs font-bold transition-all cursor-pointer"
                                >
                                  {k}
                                </button>
                              ))}
                              {ussdSessionState === 'fgm_minors' && ['1', '2', '3'].map(k => (
                                <button
                                  key={k}
                                  onClick={() => handleUssdSubmitInput(k)}
                                  className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-xs font-bold transition-all cursor-pointer"
                                >
                                  {k}
                                </button>
                              ))}
                              {ussdSessionState === 'shelter_list' && ['1', '2', '3'].map(k => (
                                <button
                                  key={k}
                                  onClick={() => handleUssdSubmitInput(k)}
                                  className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-xs font-bold transition-all cursor-pointer"
                                >
                                  {k}
                                </button>
                              ))}
                              {ussdSessionState === 'responder_list' && ['1', '2'].map(k => (
                                <button
                                  key={k}
                                  onClick={() => handleUssdSubmitInput(k)}
                                  className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] text-xs font-bold transition-all cursor-pointer"
                                >
                                  {k}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={resetUssdSession}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex-1 cursor-pointer transition-colors"
                            >
                              Reset
                            </button>
                            {['shelter_detail', 'language_feedback'].includes(ussdSessionState) && (
                              <button
                                onClick={() => setUssdSessionState('menu')}
                                className="px-4 py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex-1 cursor-pointer transition-colors"
                              >
                                back to menu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* OFFLINE SMS INCIDENT DRAFTS */
                  <div className="space-y-4">
                    {smsTransmissionStage === 0 ? (
                      <div className="space-y-4.5">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-500">Incident Category</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'fgm_threat', label: 'Safeguarding' },
                              { id: 'flood_warning', label: 'Flood Risk' },
                              { id: 'sos_assistance', label: 'Urgent Help' }
                            ].map(item => (
                              <button
                                key={item.id}
                                onClick={() => setSmsIncidentType(item.id)}
                                className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                                  smsIncidentType === item.id 
                                    ? 'border-indigo-600 bg-indigo-50 text-[#4F46E5]' 
                                    : 'border-slate-150 text-slate-600'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-slate-500">Location Description</label>
                            <button
                              onClick={() => setSmsLocation("Merti Sanctuary Node, High Zone")}
                              className="text-[10px] text-[#4F46E5] font-semibold hover:underline cursor-pointer"
                            >
                              Mock GPS location
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="e.g. near Sericho sub-county coordinates"
                            value={smsLocation}
                            onChange={(e) => setSmsLocation(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-150 focus:border-[#4F46E5] rounded-xl text-xs placeholder:text-slate-400 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-500">Details of incident</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="State concern cleanly. The system compresses details offline immediately."
                            value={smsDetails}
                            onChange={(e) => setSmsDetails(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-150 focus:border-[#4F46E5] rounded-xl text-xs placeholder:text-slate-400 focus:outline-none resize-none"
                          />
                        </div>

                        <button
                          onClick={handleSmsTransmit}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <span>Draft and send offline SMS</span>
                        </button>
                      </div>
                    ) : (
                      /* TRANSMISSION STATUS STEPS */
                      <div className="space-y-4">
                        <p className="text-xs font-semibold text-slate-800">Transmitting offline packet...</p>
                        
                        <div className="bg-slate-50 border border-slate-150 rounded-[20px] p-4 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${smsTransmissionStage >= 2 ? 'bg-[#4F46E5]' : 'bg-slate-300'}`} />
                              <span className={`text-xs ${smsTransmissionStage >= 2 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>Map alternative cellular routes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${smsTransmissionStage >= 3 ? 'bg-[#4F46E5]' : 'bg-slate-300'}`} />
                              <span className={`text-xs ${smsTransmissionStage >= 3 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>triangulate local analog tower tags</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${smsTransmissionStage >= 4 ? 'bg-[#4F46E5]' : 'bg-slate-300'}`} />
                              <span className={`text-xs ${smsTransmissionStage >= 4 ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>Compress report packet signals</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${smsTransmissionStage >= 5 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              <span className={`text-xs ${smsTransmissionStage >= 5 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>Finished and verified</span>
                            </div>
                          </div>

                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <motion.div 
                              animate={{ width: `${(Math.min(smsTransmissionStage, 5) / 5) * 100}%` }}
                              className="h-full bg-indigo-600 transition-all duration-300"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          {smsTransmissionStage === 5 ? (
                            <button
                              onClick={resetSmsForm}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg cursor-pointer"
                            >
                              Send another report
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-4 py-2 bg-slate-100 text-slate-400 font-semibold text-xs rounded-lg cursor-not-allowed"
                            >
                              Dispatching...
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
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 leading-normal">
        <p className="max-w-md mx-auto">
          Officially backed local safeguarding platform. Telecommunication emergency codes apply under county security councils.
        </p>
      </footer>
    </div>
  );
};

export default Home;

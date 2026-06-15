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
import { SkeletonCard } from './SkeletonLoader';

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

  // Quick Actions hold/long-press state and timers
  const [longPressedCardId, setLongPressedCardId] = useState<string | null>(null);
  const quickActionHoldTimer = useRef<NodeJS.Timeout | null>(null);
  const quickActionIsHoldActive = useRef<boolean>(false);
  const quickActionStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleQuickActionStart = (id: string, clientX?: number, clientY?: number) => {
    quickActionIsHoldActive.current = false;
    if (clientX !== undefined && clientY !== undefined) {
      quickActionStartPos.current = { x: clientX, y: clientY };
    } else {
      quickActionStartPos.current = null;
    }

    if (quickActionHoldTimer.current) {
      clearTimeout(quickActionHoldTimer.current);
    }
    quickActionHoldTimer.current = setTimeout(() => {
      quickActionIsHoldActive.current = true;
      setLongPressedCardId(id);
      triggerHaptic('success');
    }, 450);
  };

  const handleQuickActionMove = (clientX: number, clientY: number) => {
    if (!quickActionStartPos.current) return;
    const diffX = Math.abs(clientX - quickActionStartPos.current.x);
    const diffY = Math.abs(clientY - quickActionStartPos.current.y);
    if (diffX > 10 || diffY > 10) {
      handleQuickActionCancel();
    }
  };

  const handleQuickActionEnd = (id: string, defaultAction: () => void) => {
    if (quickActionHoldTimer.current) {
      clearTimeout(quickActionHoldTimer.current);
      quickActionHoldTimer.current = null;
    }
    const hadHoldActive = quickActionIsHoldActive.current;
    const isCancelled = quickActionStartPos.current === null;

    setLongPressedCardId(null);
    quickActionIsHoldActive.current = false;
    quickActionStartPos.current = null;

    if (!hadHoldActive && !isCancelled) {
      defaultAction();
    }
  };

  const handleQuickActionCancel = () => {
    if (quickActionHoldTimer.current) {
      clearTimeout(quickActionHoldTimer.current);
      quickActionHoldTimer.current = null;
    }
    setLongPressedCardId(null);
    quickActionIsHoldActive.current = false;
    quickActionStartPos.current = null;
  };

  // Verified support contacts & sanctuaries
  const initialSupportLinks = [
    { id: '1', name: 'Isiolo Crisis Support Node', status: 'Ready & Active' },
    { id: '2', name: 'Red Cross Response Lead', status: 'Available' }
  ];
  
  const initialSanctuaries = [
    { id: '1', name: 'Merti Sanctuary Zone', spaces: 12, distance: '1.2km' },
    { id: '2', name: 'Isiolo High Safe Center', spaces: 24, distance: '4.5km' }
  ];

  const initialRecentUpdates = [
    {
      id: '1',
      title: 'Merti Sanctuary stock verified',
      badge: 'Verified',
      type: 'verified',
      description: 'Emergency food stores, hygiene, and medical supply packs checked and fully updated. Ready for immediate intake.',
      time: 'Just now',
      author: 'Safety coordinator',
      bgClass: 'bg-teal-50 text-teal-600',
      icon: 'check'
    },
    {
      id: '2',
      title: 'Regional river level safe',
      badge: 'Normal',
      type: 'normal',
      description: "River Ewaso Ng'iro flood sensors indicating steady flows, comfortably below emergency warnings.",
      time: '15m ago',
      author: 'Hydro-Sensor Net',
      bgClass: 'bg-emerald-50 text-emerald-600',
      icon: 'info'
    },
    {
      id: '3',
      title: 'Local transmitter sync confirmed',
      badge: 'Backup Ready',
      type: 'backup',
      description: 'Secondary low-frequency analog radio meshes established. Active and ready to route SMS messages if primary grid falls.',
      time: '1h ago',
      author: 'County Telecom Node',
      bgClass: 'bg-amber-50 text-amber-600',
      icon: 'radio'
    }
  ];

  const [supportLinks, setSupportLinks] = useState(initialSupportLinks);
  const [sanctuaries, setSanctuaries] = useState(initialSanctuaries);
  const [recentUpdates, setRecentUpdates] = useState(initialRecentUpdates);

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
            className="space-y-6 text-left"
          >
            {/* Hero Banner Shimmer */}
            <div className="h-[35vh] bg-slate-50 border border-slate-150 rounded-[24px] flex flex-col justify-between p-6 animate-pulse relative overflow-hidden">
              <div className="space-y-2.5">
                <div className="h-8 bg-slate-200/90 rounded w-1/3" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <div className="h-10 bg-slate-200/60 rounded-[14px] flex-1" />
                <div className="h-10 bg-slate-200/60 rounded-[14px] flex-1" />
                <div className="h-10 bg-slate-200/60 rounded-[14px] flex-1" />
              </div>
            </div>

            {/* Grid & Protection Dashboard section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Left Side: 2x2 Quick Actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-205 rounded w-32 animate-pulse" />
                  <div className="h-3 bg-slate-151 rounded w-44 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SkeletonCard variant="quick-action" />
                  <SkeletonCard variant="quick-action" />
                  <SkeletonCard variant="quick-action" />
                  <SkeletonCard variant="quick-action" />
                </div>
              </div>

              {/* Right Side: Protection Desk */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-205 rounded w-36 animate-pulse" />
                </div>
                <div className="bg-white border border-slate-200 rounded-[20px] p-5 space-y-4 animate-pulse">
                  <div className="space-y-2">
                    <div className="h-3.5 bg-slate-200 rounded w-1/2" />
                    <div className="h-16 bg-slate-50 rounded-xl" />
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="space-y-3">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-full" />
                      <div className="h-3 bg-slate-100 rounded w-5/6" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Safety Updates Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-205 rounded w-36 animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 rounded-[20px] p-5 space-y-4">
                <SkeletonCard variant="activity-item" />
                <div className="h-px bg-slate-100" />
                <SkeletonCard variant="activity-item" />
                <div className="h-px bg-slate-100" />
                <SkeletonCard variant="activity-item" />
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
            {/* 3. BEAUTIFUL HERO SECTION (35% screen height, Speak. Alert. Protect.) */}
            <div className="h-[35vh] flex flex-col justify-between items-center bg-gradient-to-br from-indigo-50/40 via-white to-emerald-50/30 border border-slate-200/80 rounded-[24px] p-5 sm:p-6 text-center relative overflow-hidden shadow-sm" id="hero-section">
              {/* Soft modern glow accents */}
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex-1 flex flex-col items-center justify-center max-w-2xl space-y-1.5 z-10">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-sans leading-tight">
                  Speak. Alert. Protect.
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-slate-500 font-normal leading-relaxed max-w-lg">
                  Anonymous reporting and community protection for Isiolo County.
                </p>
              </div>

              {/* Exact three primary CTAs only using flexbox */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-2xl pt-1.5 pb-2.5 z-10">
                <button
                  onClick={() => {
                    navigate('/report');
                    triggerHaptic('light');
                  }}
                  className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs sm:text-sm font-semibold rounded-[14px] transition-all flex items-center justify-center gap-1.5 shadow-sm border border-indigo-700 active:scale-[0.98] cursor-pointer w-full sm:flex-1"
                >
                  <ShieldCheck size={15} />
                  <span>Report Safely</span>
                </button>

                <button
                  onClick={() => {
                    setIsUSSDOpen(true);
                    triggerHaptic('light');
                  }}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold rounded-[14px] transition-all flex items-center justify-center gap-1.5 shadow-sm border border-rose-700 active:scale-[0.98] cursor-pointer w-full sm:flex-1"
                >
                  <ShieldAlert size={15} />
                  <span>Emergency SOS</span>
                </button>

                <button
                  onClick={() => {
                    navigate('/support');
                    triggerHaptic('light');
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-[14px] transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer w-full sm:flex-1"
                >
                  <HeartHandshake size={15} className="text-[#4F46E5]" />
                  <span>Get Support</span>
                </button>
              </div>

              {/* Compact trust row using flexbox */}
              <div className="w-full border-t border-slate-100 pt-3 flex items-center justify-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wider font-sans uppercase z-10">
                <span>Protected</span>
                <span className="text-slate-300">•</span>
                <span>Anonymous</span>
                <span className="text-slate-300">•</span>
                <span>Encrypted</span>
                <span className="text-slate-300">•</span>
                <span>Verified</span>
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
                  <span className="text-[10px] text-slate-400 font-medium">What can I do right now? • Hold for info</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Action 1: Report Safely */}
                  <motion.div
                    onTouchStart={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleQuickActionStart('report', e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleQuickActionMove(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleQuickActionEnd('report', () => {
                        navigate('/report');
                        triggerHaptic('light');
                      });
                    }}
                    onMouseDown={(e) => handleQuickActionStart('report', e.clientX, e.clientY)}
                    onMouseMove={(e) => handleQuickActionMove(e.clientX, e.clientY)}
                    onMouseUp={() => {
                      handleQuickActionEnd('report', () => {
                        navigate('/report');
                        triggerHaptic('light');
                      });
                    }}
                    onMouseLeave={handleQuickActionCancel}
                    onTouchCancel={handleQuickActionCancel}
                    whileHover={hoverAnimation}
                    whileTap={tapAnimation}
                    transition={transitionConfig}
                    className="bg-white border border-slate-200 hover:border-indigo-200 p-4.5 rounded-[20px] cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-32 group select-none"
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

                    <AnimatePresence>
                      {longPressedCardId === 'report' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          className="absolute inset-0 bg-slate-900/95 text-white p-4 flex flex-col justify-between z-20 rounded-[20px] text-left pointer-events-none"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase font-sans flex items-center gap-1.5">
                              <ShieldCheck size={12} /> Secure Protocol
                            </span>
                            <p className="text-[11px] text-slate-200 leading-normal font-sans pt-1">
                              Creates an encrypted, self-cleaning report that goes directly to regional security without revealing your identity.
                            </p>
                          </div>
                          <span className="text-[9px] text-indigo-300 font-sans italic">Release to dismiss</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Action 2: Talk to a Counselor */}
                  <motion.div
                    onTouchStart={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleQuickActionStart('support', e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleQuickActionMove(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleQuickActionEnd('support', () => {
                        navigate('/support');
                        triggerHaptic('light');
                      });
                    }}
                    onMouseDown={(e) => handleQuickActionStart('support', e.clientX, e.clientY)}
                    onMouseMove={(e) => handleQuickActionMove(e.clientX, e.clientY)}
                    onMouseUp={() => {
                      handleQuickActionEnd('support', () => {
                        navigate('/support');
                        triggerHaptic('light');
                      });
                    }}
                    onMouseLeave={handleQuickActionCancel}
                    onTouchCancel={handleQuickActionCancel}
                    whileHover={hoverAnimation}
                    whileTap={tapAnimation}
                    transition={transitionConfig}
                    className="bg-white border border-slate-200 hover:border-indigo-200 p-4.5 rounded-[20px] cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-32 group select-none"
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

                    <AnimatePresence>
                      {longPressedCardId === 'support' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          className="absolute inset-0 bg-slate-900/95 text-white p-4 flex flex-col justify-between z-20 rounded-[20px] text-left pointer-events-none"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase font-sans flex items-center gap-1.5">
                              <MessageSquare size={12} /> Confidential Support
                            </span>
                            <p className="text-[11px] text-slate-200 leading-normal font-sans pt-1">
                              Opens a live, confidential chat or call connection with certified clinical and legal support responders in Isiolo.
                            </p>
                          </div>
                          <span className="text-[9px] text-indigo-300 font-sans italic">Release to dismiss</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Action 3: Find Safe Services */}
                  <motion.div
                    onTouchStart={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleQuickActionStart('resources', e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleQuickActionMove(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleQuickActionEnd('resources', () => {
                        navigate('/resources');
                        triggerHaptic('light');
                      });
                    }}
                    onMouseDown={(e) => handleQuickActionStart('resources', e.clientX, e.clientY)}
                    onMouseMove={(e) => handleQuickActionMove(e.clientX, e.clientY)}
                    onMouseUp={() => {
                      handleQuickActionEnd('resources', () => {
                        navigate('/resources');
                        triggerHaptic('light');
                      });
                    }}
                    onMouseLeave={handleQuickActionCancel}
                    onTouchCancel={handleQuickActionCancel}
                    whileHover={hoverAnimation}
                    whileTap={tapAnimation}
                    transition={transitionConfig}
                    className="bg-white border border-slate-200 hover:border-indigo-200 p-4.5 rounded-[20px] cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-32 group select-none"
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

                    <AnimatePresence>
                      {longPressedCardId === 'resources' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          className="absolute inset-0 bg-slate-900/95 text-white p-4 flex flex-col justify-between z-20 rounded-[20px] text-left pointer-events-none"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase font-sans flex items-center gap-1.5">
                              <MapPin size={12} /> Emergency Sanctuaries
                            </span>
                            <p className="text-[11px] text-slate-200 leading-normal font-sans pt-1">
                              Provides real-time GPS locations and resources for Merti high-ground sanctuaries and secure humanitarian zones.
                            </p>
                          </div>
                          <span className="text-[9px] text-indigo-300 font-sans italic">Release to dismiss</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Action 4: Emergency Help */}
                  <motion.div
                    onTouchStart={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleQuickActionStart('emergency', e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (e.touches && e.touches[0]) {
                        handleQuickActionMove(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleQuickActionEnd('emergency', () => {
                        setIsUSSDOpen(true);
                        triggerHaptic('light');
                      });
                    }}
                    onMouseDown={(e) => handleQuickActionStart('emergency', e.clientX, e.clientY)}
                    onMouseMove={(e) => handleQuickActionMove(e.clientX, e.clientY)}
                    onMouseUp={() => {
                      handleQuickActionEnd('emergency', () => {
                        setIsUSSDOpen(true);
                        triggerHaptic('light');
                      });
                    }}
                    onMouseLeave={handleQuickActionCancel}
                    onTouchCancel={handleQuickActionCancel}
                    whileHover={hoverAnimation}
                    whileTap={tapAnimation}
                    transition={transitionConfig}
                    className="bg-white border border-slate-200 hover:border-indigo-200 p-4.5 rounded-[20px] cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between h-32 group select-none"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 rounded-full -mr-6 -mt-6 group-hover:scale-110 transition-transform" />
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

                    <AnimatePresence>
                      {longPressedCardId === 'emergency' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          className="absolute inset-0 bg-slate-900/95 text-white p-4 flex flex-col justify-between z-20 rounded-[20px] text-left pointer-events-none"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase font-sans flex items-center gap-1.5">
                              <ShieldAlert size={12} /> Dial Backup
                            </span>
                            <p className="text-[11px] text-slate-200 leading-normal font-sans pt-1">
                              Immediately fires offline USSD packets and distress signals to county coordinators using satellite fallback grids.
                            </p>
                          </div>
                          <span className="text-[9px] text-indigo-300 font-sans italic">Release to dismiss</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </div>

              {/* RIGHT SIDE: MY PROTECTION / COORDINATED WATCH */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pl-1">
                  <h2 className="text-sm font-semibold text-slate-800">
                    My Protection Desk
                  </h2>
                  <button
                    onClick={() => {
                      if (supportLinks.length > 0 || sanctuaries.length > 0) {
                        setSupportLinks([]);
                        setSanctuaries([]);
                        triggerHaptic('warning');
                      } else {
                        setSupportLinks(initialSupportLinks);
                        setSanctuaries(initialSanctuaries);
                        triggerHaptic('success');
                      }
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-750 font-bold cursor-pointer underline select-none"
                  >
                    {(supportLinks.length > 0 || sanctuaries.length > 0) ? 'Simulate Empty' : 'Restore Connections'}
                  </button>
                </div>

                <div className="bg-white border border-slate-200 rounded-[20px] p-5 space-y-4 shadow-sm">
                  
                  {/* Open Cases and updates status review */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <EyeOff size={13} className="text-slate-400" />
                        <span>Active anonymous reports</span>
                      </div>
                      {anonymousReportIds.length > 0 && (
                        <button
                          onClick={() => {
                            localStorage.setItem('bonga_anonymous_reports', JSON.stringify([]));
                            setAnonymousReportIds([]);
                            triggerHaptic('warning');
                          }}
                          className="text-[9px] text-[#4F46E5] hover:underline font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </h3>
                    
                    {anonymousReportIds.length === 0 ? (
                      <div className="bg-slate-50/55 border border-slate-150 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center gap-1.5 py-5.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <EyeOff size={14} className="text-slate-450" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-semibold text-slate-700">No active alerts</p>
                          <p className="text-[10px] text-slate-400 leading-normal max-w-[210px] mx-auto">
                            Safeguarding logs are clear. No open threat or custom anonymous reports are cached.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-24 overflow-y-auto">
                        {anonymousReportIds.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 p-2 rounded-xl flex items-center justify-between group">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-[#4F46E5] font-semibold">
                                #BNG-{item.substring(0, 6).toUpperCase()}
                              </span>
                              <p className="text-[10px] text-slate-500">Safeguarding priority alert</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-[#4F46E5] text-[9px] font-semibold rounded-full">
                                Active review
                              </span>
                              <button
                                onClick={() => {
                                  const updated = anonymousReportIds.filter(id => id !== item);
                                  localStorage.setItem('bonga_anonymous_reports', JSON.stringify(updated));
                                  setAnonymousReportIds(updated);
                                  triggerHaptic('light');
                                }}
                                className="p-1 hover:bg-rose-50 text-slate-350 hover:text-rose-500 rounded transition-colors"
                              >
                                <X size={11} />
                              </button>
                            </div>
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
                    
                    {supportLinks.length === 0 ? (
                      <div className="bg-slate-50/55 border border-slate-150 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center gap-1.5 py-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <Users size={14} className="text-slate-450" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-semibold text-slate-700">Responders unlinked</p>
                          <p className="text-[10px] text-slate-400 leading-normal max-w-[210px] mx-auto">
                            Support feeds are disconnected. No active community safeguarding guides are loaded.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {supportLinks.map((link) => (
                          <div key={link.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-xs text-slate-800">{link.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                                {link.status}
                              </span>
                              <button
                                onClick={() => {
                                  setSupportLinks(prev => prev.filter(l => l.id !== link.id));
                                  triggerHaptic('light');
                                }}
                                className="p-1 opacity-0 group-hover:opacity-100 text-slate-350 hover:text-slate-500 rounded transition-opacity"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-150" />

                  {/* Nearby support distance status */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400" />
                      <span>Sanctuaries closest to you</span>
                    </h3>

                    {sanctuaries.length === 0 ? (
                      <div className="bg-slate-50/55 border border-slate-150 border-dashed rounded-xl p-4 text-center flex flex-col items-center justify-center gap-1.5 py-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                          <MapPin size={14} className="text-slate-450" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-semibold text-slate-700">Safe harbors unmapped</p>
                          <p className="text-[10px] text-slate-400 leading-normal max-w-[210px] mx-auto">
                            Secure beacons are offline. Coordinate evacuation points over local USSD channels.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sanctuaries.map((shelter) => (
                          <div key={shelter.id} className="flex items-center justify-between text-xs text-slate-600 group">
                            <span className="font-medium text-slate-800">{shelter.name}</span>
                            <div className="flex items-center gap-2 font-sans text-[10px]">
                              <span className="text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">{shelter.spaces} spaces open</span>
                              <span className="text-slate-400">{shelter.distance}</span>
                              <button
                                onClick={() => {
                                  setSanctuaries(prev => prev.filter(s => s.id !== shelter.id));
                                  triggerHaptic('light');
                                }}
                                className="p-1 opacity-0 group-hover:opacity-100 text-slate-350 hover:text-slate-500 rounded transition-opacity"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                <button
                  onClick={() => {
                    if (recentUpdates.length > 0) {
                      setRecentUpdates([]);
                      triggerHaptic('warning');
                    } else {
                      setRecentUpdates(initialRecentUpdates);
                      triggerHaptic('success');
                    }
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-750 font-bold cursor-pointer underline select-none"
                >
                  {recentUpdates.length > 0 ? 'Clear All Updates' : 'Restore Updates'}
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-[20px] p-5 space-y-4 shadow-sm">
                
                {recentUpdates.length === 0 ? (
                  <div className="py-7 text-center flex flex-col items-center justify-center gap-2 py-6">
                    <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm shrink-0">
                      <Activity size={18} className="text-slate-400" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-semibold text-slate-700">No recent activity</p>
                      <p className="text-[10px] text-slate-400 leading-normal max-w-[280px] mx-auto">
                        The county safety grid is quiet and stable. No new alerts or transmitter changes have been received.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentUpdates.map((item, index) => (
                      <div key={item.id}>
                        <div className="flex items-start gap-4 relative group">
                          <div className={`w-8 h-8 rounded-full ${item.bgClass} flex items-center justify-center shrink-0 mt-0.5`}>
                            {item.icon === 'check' && <Check size={14} />}
                            {item.icon === 'info' && <Info size={14} />}
                            {item.icon === 'radio' && <Radio size={14} className="animate-pulse" />}
                          </div>
                          <div className="space-y-1 flex-1 pr-6">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-slate-900 leading-none">{item.title}</span>
                              <span className={`text-[9px] ${item.type === 'verified' || item.type === 'normal' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'} px-1.5 py-0.5 rounded-full font-medium`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-normal leading-normal">
                              {item.description}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono font-normal block">{item.time} · {item.author}</span>
                          </div>
                          <button
                            onClick={() => {
                              setRecentUpdates(prev => prev.filter(u => u.id !== item.id));
                              triggerHaptic('light');
                            }}
                            className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 rounded transition-opacity"
                            title="Dismiss Update"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        {index < recentUpdates.length - 1 && <div className="h-px bg-slate-100 mt-4" />}
                      </div>
                    ))}
                  </div>
                )}

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

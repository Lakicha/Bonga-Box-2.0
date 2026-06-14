import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useGraphics } from '../GraphicsContext';
import { 
  Home, 
  History, 
  BookOpen, 
  User, 
  Clock, 
  Bell, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  HeartHandshake,
  Search,
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
  AlertCircle,
  Monitor,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signOut, db, collection, query, orderBy, limit, onSnapshot } from '../firebase';
import Onboarding from './Onboarding';
import Logo from './Logo';
import { AlertTicker } from './AlertTicker';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, profile } = useAuth();
  const { 
    graphicsMode, 
    setGraphicsMode, 
    toggleGraphicsMode, 
    isLowEnd, 
    autoDetected, 
    contrastEnhanced, 
    toggleContrast,
    blurClass,
    glowClass,
    borderClass,
    textMutedClass,
    springConfig
  } = useGraphics();

  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');

  const rawCommands = [
    { label: 'Secure Report Portal', desc: 'File a discrete case under our encrypted support stream.', path: '/report', keywords: 'report abuse gbv fgm child support file', group: 'Actions' },
    { label: 'Rural Hydrological Portal', desc: 'Submit and view flood warnings and bridge damage alerts.', path: '/alerts', keywords: 'flood bridge water rain hazard', group: 'Actions' },
    { label: 'Crisis Resource Guide', desc: 'Consult regional NGO phone sheets, legal guides, and safe house rules.', path: '/resources', keywords: 'resources shelters numbers guidance helper', group: 'Directory' },
    { label: 'Receipt and Intake History', desc: 'Verify submission tracking hashes and review resolution status.', path: '/history', keywords: 'case codes audit history receipt tracking', group: 'User Profile' },
    { label: 'Help and Helpline dialers', desc: 'Connect with county helpline representatives or medical facilities.', path: '/support', keywords: 'phone call advisor chat support', group: 'Sensory Help' },
    { label: 'Donate to isiolo protection centers', desc: 'Contribute secure resources to support safe shelter expansions.', path: '/donate', keywords: 'donate money feed resource care', group: 'Support' },
    { label: 'Offline cellular safety suite', desc: 'Activate panic buttons, SMS templates, and sensory alarms.', path: '/safety', keywords: 'safety cell panic sirens offline ussd', group: 'Sensory Help' },
    { label: 'My Profile Desk', desc: 'Update support badges and configure localized area warning settings.', path: '/profile', keywords: 'account sign avatar county preferences', group: 'User Profile' },
  ];

  if (profile?.role === 'Admin') {
    rawCommands.push({ label: 'System Master Dashboard', desc: 'Oversee and audit platform-wide case indicators.', path: '/admin-dashboard', keywords: 'admin kpi user config metrics logs', group: 'Role Access' });
  }
  if (profile?.role === 'Protection Officer' || profile?.role === 'Admin') {
    rawCommands.push({ label: 'Protection Cases Desk', desc: 'Review, triage, and execute care responses.', path: '/protection-dashboard', keywords: 'abuse trauma case follow rescue list', group: 'Role Access' });
  }
  if (profile?.role === 'Disaster Management Officer' || profile?.role === 'Admin') {
    rawCommands.push({ label: 'Disaster Coordination Desk', desc: 'Monitor rising rivers, blockages, and trigger regional SOS bulletins.', path: '/disaster-dashboard', keywords: 'river telemetry emergency map high ground', group: 'Role Access' });
  }
  if (['Mentor/Teacher', 'Mentor', 'Teacher', 'Admin'].includes(profile?.role || '')) {
    rawCommands.push({ label: 'School Mentor Coordinator', desc: 'Track safe-school attendance metrics and local dormitory spaces.', path: '/school-dashboard', keywords: 'school girls classroom dorm checkin', group: 'Role Access' });
  }

  const filteredCommands = rawCommands.filter(cmd => 
    cmd.label.toLowerCase().includes(commandSearch.toLowerCase()) || 
    cmd.desc.toLowerCase().includes(commandSearch.toLowerCase()) || 
    cmd.keywords.toLowerCase().includes(commandSearch.toLowerCase())
  );
  const [showGraphicsDropdown, setShowGraphicsDropdown] = useState(false);
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

      // Store cleanup on osc node
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

  const triggerHaptic = (type: 'light' | 'success' | 'warning' | 'error') => {
    if (!('vibrate' in navigator)) return;
    try {
      if (type === 'light') {
        navigator.vibrate(12);
      } else if (type === 'success') {
        navigator.vibrate([15, 30, 20]);
      } else if (type === 'warning') {
        navigator.vibrate([40, 60, 45]);
      } else if (type === 'error') {
        navigator.vibrate([60, 50, 60, 50, 80]);
      }
    } catch (e) {
      console.warn("Haptic blocked or unsupported:", e);
    }
  };

  useEffect(() => {
    const handleHapticEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const type = customEvent.detail?.type || 'light';
      triggerHaptic(type);
    };
    window.addEventListener('bonga_trigger_haptic', handleHapticEvent);
    return () => window.removeEventListener('bonga_trigger_haptic', handleHapticEvent);
  }, []);

  // Global premium micro-interactions: click ripple generator & subtle haptic feedback
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('button, a, .cursor-pointer, [role="button"]') as HTMLElement | null;
      if (!target) return;

      // 1. Subtle haptic feedback whenever tapping any button or interactive element
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch (_) {}
      }

      // 2. Ripple generation
      // Enforce relative positioning & hidden overflow for beautiful ripples
      target.classList.add('ripple-container');

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      // Prepend or append to render underneath child items
      target.appendChild(ripple);

      // Clean up after animation finishes (500ms)
      setTimeout(() => {
        ripple.remove();
      }, 500);
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, []);

  // Premium hotkey listener: Shift + S for emergency panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const keyUpper = e.key.toUpperCase();
      if (e.shiftKey && keyUpper === 'S') {
        e.preventDefault();
        triggerClickHaptic();
        setIsSOSOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && keyUpper === 'K') {
        e.preventDefault();
        triggerClickHaptic();
        setIsCommandPaletteOpen(prev => !prev);
        setCommandSearch('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Browser-native background notifications query subscriptions
  useEffect(() => {
    // Only subscribe if the user is logged in
    if (!user) return;

    // Fast check for notification support
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    // Use page mount/boot-up time to distinguish existing database records from newly dispatched alerts
    const appLoadTime = Date.now();

    // 1. Subscription to "reports" collection
    const qReports = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(15));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      // Look at document changes rather than whole collection to pinpoint freshly arrived elements
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (!data) return;

          // Enforce local check for active subscription configs
          const isNotificationEnabled = localStorage.getItem('bonga_notification_enabled') === 'true';
          const isPermissionGranted = Notification.permission === 'granted';
          if (!isNotificationEnabled || !isPermissionGranted) return;

          // Check if it is a high-priority flood or protection (FGM) category
          const isHighPriorityType = data.category === 'FGM Risk' || data.category === 'Flood Alert' || data.category === 'Emergency';
          if (!isHighPriorityType) return;

          // Extract standard date structure
          const docTime = data.timestamp?.toDate ? data.timestamp.toDate().getTime() : (data.timestamp ? new Date(data.timestamp).getTime() : 0);
          
          // Only push alert if the report was recorded AFTER this current app tab loaded
          if (docTime && docTime > appLoadTime - 8000) {
            // Determine if the report location matches the user's filtered region / "their area"
            const userArea = localStorage.getItem('bonga_notification_area') || 'All';
            const areaNormalized = userArea.trim().toLowerCase();
            const reportLocation = (data.location || '').trim().toLowerCase();

            const isMatchingArea = 
              areaNormalized === 'all' || 
              areaNormalized === '' || 
              reportLocation.includes(areaNormalized) || 
              areaNormalized.includes(reportLocation);

            if (isMatchingArea) {
              const categoryTitle = data.category === 'FGM Risk' ? '🚨 PROTECTION REPORT' : '⚠️ FLOOD DISPATCH';
              try {
                new Notification(`Bonga Safeguard: ${categoryTitle}`, {
                  body: `Inside ${data.location || 'Your Area'}: ${data.description || 'New high-priority incident raised.'}`,
                  icon: '/icon.png',
                  silent: false
                });
                
                // Trigger audible feedback
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate([100, 50, 100]);
                }
              } catch (err) {
                console.error('Error triggering push notification:', err);
              }
            }
          }
        }
      });
    }, (error) => {
      console.error('Safeguard notifications listener error:', error);
    });

    // 2. Subscription to "alerts" collection
    const qAlerts = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(15));
    const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (!data) return;

          const isNotificationEnabled = localStorage.getItem('bonga_notification_enabled') === 'true';
          const isPermissionGranted = Notification.permission === 'granted';
          if (!isNotificationEnabled || !isPermissionGranted) return;

          // Severity must be High or Critical for emergency push, and type matches flood or protection
          const isHighSeverity = data.severity === 'High' || data.severity === 'Critical';
          const lowercaseType = (data.type || '').toLowerCase();
          const isRelevantIssue = lowercaseType.includes('flood') || lowercaseType.includes('protection') || lowercaseType.includes('fgm') || lowercaseType.includes('emergency');

          if (!isHighSeverity || !isRelevantIssue) return;

          const docTime = data.timestamp?.toDate ? data.timestamp.toDate().getTime() : (data.timestamp ? new Date(data.timestamp).getTime() : 0);
          
          if (docTime && docTime > appLoadTime - 8000) {
            const userArea = localStorage.getItem('bonga_notification_area') || 'All';
            const areaNormalized = userArea.trim().toLowerCase();
            const alertLocation = (data.location || '').trim().toLowerCase();

            const isMatchingArea = 
              areaNormalized === 'all' || 
              areaNormalized === '' || 
              alertLocation.includes(areaNormalized) || 
              areaNormalized.includes(alertLocation);

            if (isMatchingArea) {
              try {
                new Notification(`Bonga Alert: ${data.severity.toUpperCase()} SEVERITY ALERT`, {
                  body: `Area: ${data.location || 'Your Region'}\nIncident: ${data.message || 'New high-priority alert received.'}`,
                  icon: '/icon.png',
                  silent: false
                });

                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                  navigator.vibrate([200, 100, 200]);
                }
              } catch (err) {
                console.error('Error triggering push notification:', err);
              }
            }
          }
        }
      });
    }, (error) => {
      console.error('Safeguard emergency alerts listener error:', error);
    });

    return () => {
      unsubscribeReports();
      unsubscribeAlerts();
    };
  }, [user]);

  // Check if current path is an admin / operator full-screen dashboard
  const isOperatorDashboard = location.pathname.includes('-dashboard');

  if (isOperatorDashboard) {
    return (
      <div className="bg-slate-50 flex flex-col font-sans min-h-screen">
        <header className="bg-white border-b border-slate-200 py-3 px-5 flex justify-between items-center shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800 text-base tracking-tight">Bonga admin control</span>
            <span className="px-2 py-0.5 bg-indigo-50 text-purple-primary text-[10px] font-medium rounded border border-indigo-200/50">
              {profile?.role || 'Operator'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-medium text-slate-700 hover:text-purple-primary transition-colors py-1.5 px-3 bg-slate-100 rounded-lg"
            >
              ← Back to app view
            </button>
            <button
              onClick={() => {
                signOut(auth);
                navigate('/');
              }}
              className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors flex items-center gap-1.5"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

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
    <div className={`bg-bg-dark flex flex-col font-sans transition-colors duration-250 min-h-screen relative overflow-x-hidden ${contrastEnhanced ? 'text-slate-900 bg-slate-100' : 'text-slate-800 bg-[#F8FAFC]'}`}>
      {/* Dynamic global ambient blur graphics - Disabled on low-end screens to prevent CPU rendering passes */}
      {!isLowEnd && (
        <>
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-100/15 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-50/20 rounded-full blur-[140px] pointer-events-none" />
        </>
      )}

      {/* Top Global Responsive Header & Navbar */}
      <header className={`sticky top-0 z-50 transition-all duration-200 select-none ${blurClass('bg-white border-b border-slate-205 shadow-sm')} ${borderClass('light')}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo Brand Brandmark */}
          <Link to="/" className="flex items-center gap-2 group">
            <Logo size={42} />
          </Link>

          {/* Center Links (Visible on Desktop / Tablet) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-150 p-1 rounded-xl">
            <Link 
              to="/" 
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === 'home' 
                  ? 'bg-white text-purple-primary shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/report" 
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === 'report' 
                  ? 'bg-white text-purple-primary shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Report
            </Link>
            <Link 
              to="/support" 
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === 'support' 
                  ? 'bg-white text-purple-primary shadow-xs' 
                  : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100/40'
              }`}
            >
              Support
            </Link>
            <Link 
              to="/resources" 
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                activeTab === 'alerts' 
                  ? 'bg-white text-purple-primary shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/40'
              }`}
            >
              Alerts
            </Link>
          </nav>

          {/* Right Session / Operator Menu Button */}
          <div className="flex items-center gap-2.5 relative">
            {profile && profile.role !== 'User' && (
              <span className="hidden lg:inline-block px-2 py-0.5 bg-indigo-50 text-purple-primary text-[10px] font-medium rounded border border-indigo-200/50">
                {profile.role.replace('/Teacher', '')}
              </span>
            )}

            {/* 🔴 Top Integrated Header SOS Trigger */}
            <motion.button
              id="header-sos-btn"
              onClick={() => {
                triggerClickHaptic();
                setIsSOSOpen(true);
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-red-50 hover:bg-red-100 border border-red-200/50 rounded-xl text-red-650 font-medium text-[10px] sm:text-xs relative overflow-hidden transition-all shadow-xs cursor-pointer select-none"
              title="Urgent emergency SOS panel"
            >
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping shrink-0" />
              <span>Siren SOS</span>
            </motion.button>
            
            {/* 🔍 Global Command Palette Shortcut */}
            <button
              onClick={() => {
                triggerClickHaptic();
                setIsCommandPaletteOpen(true);
                setCommandSearch('');
              }}
              className="w-8 h-8 hover:bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Search and Navigation Commands (Ctrl+K)"
            >
              <Search size={16} />
            </button>

            {/* 🔔 Notifications Button and Simulator */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-8 h-8 hover:bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 transition-colors relative"
                title="Notifications"
                id="header-bell-btn"
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-primary rounded-full animate-pulse" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                   <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-2 w-64 bg-white border border-slate-150 rounded-xl shadow-md p-3.5 z-50 space-y-2 text-left"
                    id="notifications-dropdown"
                  >
                    <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">Active safeguards</span>
                      <span className="text-xxs px-1.5 py-0.5 bg-indigo-50 text-purple-primary font-medium rounded">Live status</span>
                    </div>
                    <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-none">
                      <div className="p-2 bg-slate-50/50 rounded-lg text-xs font-normal text-slate-700 leading-relaxed border border-slate-100 flex items-start gap-2">
                        <ShieldAlert size={14} className="text-purple-primary shrink-0 mt-0.5" />
                        <span>
                          <span className="font-semibold text-purple-primary">Encrypted connection active</span>. All incident packages are fully anonymous.
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50/50 rounded-lg text-xs font-normal text-slate-700 leading-relaxed border border-slate-100 flex items-start gap-2">
                        <MapPin size={14} className="text-purple-primary shrink-0 mt-0.5" />
                        <span>
                          Merti Sanctuary and County Office telemetry layers configured.
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-center text-xxs text-purple-primary font-medium pt-1.5 border-t border-slate-100 hover:text-purple-dark text-slate-400"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>



            {/* 👤 Profile with User Avatar */}
            <Link 
              to="/profile"
              className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center text-slate-650 hover:border-purple-primary transition-colors shrink-0"
              title="Your profile"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={15} />
              )}
            </Link>

            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-8 h-8 hover:bg-slate-50 rounded-lg flex items-center justify-center text-slate-800 transition-colors relative"
              title="Navigation options"
            >
              <Menu size={18} />
              {profile && profile.role !== 'User' && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-primary rounded-full animate-pulse" />
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
              className="fixed top-0 right-0 bottom-0 w-[270px] bg-white border-l border-slate-200 shadow-xl z-[110] flex flex-col p-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 shrink-0">
                <Logo size={38} />
                <button onClick={() => setIsMenuOpen(false)} className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-50 transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 flex-grow overflow-y-auto pr-1">
                <div>
                  <p className="text-xs font-semibold text-slate-550 mb-2 px-1">More options</p>
                  <div className="space-y-0.5">
                    <Link 
                      to="/alerts" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                    >
                      <Landmark size={14} className="text-emerald-500" />
                      <span>Safe houses</span>
                      <ChevronRight size={12} className="text-slate-400 ml-auto" />
                    </Link>

                    <Link 
                      to="/donate" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                    >
                      <Coins size={14} className="text-indigo-500" />
                      <span>Donate</span>
                      <ChevronRight size={12} className="text-slate-400 ml-auto" />
                    </Link>

                    <Link 
                      to="/resources" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                    >
                      <BookOpen size={14} className="text-purple-primary" />
                      <span>Learning hub</span>
                      <ChevronRight size={12} className="text-slate-400 ml-auto" />
                    </Link>

                    <Link 
                      to="/history" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
                    >
                      <History size={14} className="text-slate-500" />
                      <span>My cases</span>
                      <ChevronRight size={12} className="text-slate-400 ml-auto" />
                    </Link>

                    {/* Interactive Simulated Language Action Selector */}
                    <button 
                      onClick={() => {
                        const nextLang = currentLanguage === 'EN' ? 'SW' : 'EN';
                        setCurrentLanguage(nextLang);
                        alert(`Language switched to ${nextLang === 'EN' ? 'English' : 'Kiswahili'}.`);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors text-left"
                    >
                      <Globe size={14} className="text-blue-500" />
                      <span>Language: {currentLanguage === 'EN' ? 'English (EN)' : 'Kiswahili (SW)'}</span>
                      <span className="text-xxs font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded ml-auto">Swap</span>
                    </button>

                    {/* Interactive Simulated Security Level Indicator */}
                    <button 
                      onClick={() => {
                        alert("Safeguards configuration: Multi-hop encryption routing is enabled by default to protect children coordinates.");
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors text-left font-sans"
                    >
                      <Settings size={14} className="text-slate-500" />
                      <span>Box settings</span>
                      <span className="text-xxs font-medium bg-emerald-50 text-emerald-650 px-1.5 py-0.5 rounded ml-auto">Secure</span>
                    </button>

                    {/* Visual Performance/Display Adjuster in Slide Drawer */}
                    <button 
                      onClick={() => {
                        toggleGraphicsMode();
                        triggerClickHaptic();
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors text-left cursor-pointer font-sans"
                    >
                      <Monitor size={14} className="text-purple-primary" />
                      <span>Graphics: {graphicsMode === 'high-end' ? 'High Quality' : 'Performance'}</span>
                      <span className={`text-xxs font-semibold px-1.5 py-0.5 rounded ml-auto ${isLowEnd ? 'bg-indigo-50 text-purple-primary border border-indigo-200' : 'bg-slate-50 text-slate-500'}`}>
                        {isLowEnd ? 'Performance' : 'Edit'}
                      </span>
                    </button>

                    <button 
                      onClick={() => {
                        toggleContrast();
                        triggerClickHaptic();
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors text-left cursor-pointer font-sans"
                    >
                      <Cpu size={14} className="text-emerald-500" />
                      <span>High Contrast Mode</span>
                      <span className={`text-xxs font-semibold px-1.5 py-0.5 rounded ml-auto ${contrastEnhanced ? 'bg-emerald-50 text-emerald-750 border border-emerald-200' : 'bg-slate-50 text-slate-500'}`}>
                        {contrastEnhanced ? 'Active' : 'Off'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* If operator roles exist */}
                {profile && profile.role !== 'User' && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-550 mb-2 px-1">Operator portals</p>
                    <div className="space-y-1">
                      {profile.role === 'Admin' && (
                        <Link 
                          to="/admin-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2 rounded-xl bg-orange-50 text-orange-950 border border-orange-200/40 text-xs font-medium hover:bg-orange-100/60"
                        >
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck size={13} /> Admin panel
                          </span>
                          <ChevronRight size={14} />
                        </Link>
                      )}

                      {(profile.role === 'Mentor/Teacher' || profile.role === 'Admin') && (
                        <Link 
                          to="/school-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2 rounded-xl bg-purple-50 text-purple-950 border border-purple-200/40 text-xs font-medium hover:bg-purple-100/60"
                        >
                          <span>School club hub</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}

                      {(profile.role === 'Protection Officer' || profile.role === 'Admin') && (
                        <Link 
                          to="/protection-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2 rounded-xl bg-blue-50 text-blue-950 border border-blue-200/40 text-xs font-medium hover:bg-blue-100/60"
                        >
                          <span>Protection desk</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}

                      {(profile.role === 'Disaster Management Officer' || profile.role === 'Admin') && (
                        <Link 
                          to="/disaster-dashboard" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between p-2 rounded-xl bg-amber-50 text-amber-950 border border-amber-200/40 text-xs font-medium hover:bg-amber-100/60"
                        >
                          <span>Disaster dispatch</span>
                          <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3">
                {user ? (
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-red-50 text-red-650 hover:bg-red-105 border border-red-200/40 font-medium text-xs transition-colors"
                  >
                    <LogOut size={14} /> Log out
                  </button>
                ) : (
                  <Link 
                    to="/auth" 
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-purple-primary text-white font-medium text-xs transition-colors text-center shadow-xs hover:bg-[#3F37C9]"
                  >
                    Log in
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Spacious Content Body Container */}
      <main className="flex-1 min-h-0 overflow-y-auto w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-16 md:pb-6 relative z-10">
        {(location.pathname.includes('dashboard') || location.pathname === '/alerts') && (
          <AlertTicker />
        )}
        {children}
      </main>

      {/* Floating bottom Navigation bar ONLY visible on Mobile standard screen ports */}
      <div className="md:hidden fixed bottom-3 inset-x-4 bg-white/95 backdrop-blur-md border border-slate-200/60 py-2 px-2 flex justify-around items-center rounded-2xl shadow-md z-40 select-none">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center gap-0.5 w-14 transition-all ${
            activeTab === 'home' ? 'text-purple-primary font-medium scale-102' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home size={16} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link 
          to="/report" 
          className={`flex flex-col items-center justify-center gap-0.5 w-14 transition-all ${
            activeTab === 'report' ? 'text-purple-primary font-medium scale-102' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText size={16} />
          <span className="text-[10px] font-medium">Report</span>
        </Link>

        <Link 
          to="/support" 
          className={`flex flex-col items-center justify-center gap-0.5 w-14 transition-all ${
            activeTab === 'support' ? 'text-purple-primary font-medium scale-102' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <HeartHandshake size={16} />
          <span className="text-[10px] font-medium">Support</span>
        </Link>

        <Link 
          to="/resources" 
          className={`flex flex-col items-center justify-center gap-0.5 w-14 transition-all ${
            activeTab === 'alerts' ? 'text-purple-primary font-medium scale-102' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <AlertTriangle size={16} />
          <span className="text-[10px] font-medium">Alerts</span>
        </Link>

        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center gap-0.5 w-14 transition-all ${
            activeTab === 'profile' ? 'text-purple-primary font-medium scale-102' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={16} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>

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
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4 select-none"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-4.5 relative flex flex-col text-left overflow-hidden"
              >
                {/* Red alert label indicator */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-red-600" />

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 leading-tight">
                      Emergency response panel
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Immediate local safety tools
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

                <div className="space-y-2.5">
                  {/* Option 1: Acoustic Sirens deterrent */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    isSirenActive 
                      ? 'bg-red-50/70 border-red-200 animate-pulse' 
                      : 'bg-slate-50 border-slate-150'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isSirenActive ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isSirenActive ? <Volume2 size={16} className="animate-bounce" /> : <VolumeX size={16} />}
                        </div>
                        <div>
                          <h3 className={`text-xs font-semibold ${isSirenActive ? 'text-red-950' : 'text-slate-800'}`}>
                            Sound defensive siren
                          </h3>
                          <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                            Play loud warning audio to deter physical threats
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
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isSirenActive 
                            ? 'bg-red-600 text-white' 
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
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
                    className="p-3 rounded-xl bg-slate-50 border border-slate-150 hover:border-indigo-400 cursor-pointer transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-purple-primary flex items-center justify-center shrink-0">
                        <ShieldAlert size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">
                          Offline SMS dispatcher
                        </h4>
                        <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                          Compile safe GPS and cell tower packages to transmit offline
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
                    className="p-3 rounded-xl bg-slate-50 border border-slate-150 hover:border-indigo-400 cursor-pointer transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-purple-primary flex items-center justify-center shrink-0">
                        <Phone size={14} />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-800">
                          Call child protection helpline (116)
                        </h4>
                        <p className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5">
                          Toll-free 24/7 child rescue helpline
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </div>

                <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-150 text-[11px] text-slate-500 font-normal leading-relaxed text-center">
                  All transmissions are metadata-stripped. If you are in immediate physical danger, alert those around you and head to the nearest high-elevation safe house.
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Onboarding />

      {/* 🔍 COMPREHENSIVE COMMAND PALETTE SEARCH ENGINE */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <>
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandPaletteOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] pointer-events-auto"
            />

            {/* Floating Palette Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed inset-x-4 top-[10%] max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl shadow-2xl z-[1000] overflow-hidden flex flex-col font-sans pointer-events-auto max-h-[480px]"
            >
              <div className="p-4 border-b border-slate-150 flex items-center gap-3">
                <Search size={18} className="text-purple-primary shrink-0 animate-pulse" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Type an actions keyword (e.g. 'rescue', 'alert', 'school' or 'USSD')..."
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                />
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-155 bg-slate-50 px-1.5 font-mono text-[9px] font-bold text-slate-400 shadow-3xs shrink-0">
                  ESC
                </kbd>
                <button
                  onClick={() => setIsCommandPaletteOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Scrolling results container */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredCommands.length > 0 ? (
                  <div className="space-y-1">
                    {/* Render grouped items */}
                    {Array.from(new Set(filteredCommands.map(c => c.group))).map(groupName => (
                      <div key={groupName} className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 pl-3.5 pt-1.5 block">
                          {groupName}
                        </span>
                        {filteredCommands.filter(c => c.group === groupName).map((cmd) => (
                          <button
                            key={cmd.label}
                            onClick={() => {
                              triggerClickHaptic();
                              setIsCommandPaletteOpen(false);
                              navigate(cmd.path);
                            }}
                            className="w-full p-2.5 rounded-2xl hover:bg-indigo-50/30 text-left flex items-start gap-3 transition-all border border-transparent hover:border-indigo-100/40 cursor-pointer group"
                          >
                            <div className="w-8 h-8 rounded-xl bg-slate-50 text-purple-primary flex items-center justify-center shrink-0 border border-slate-100 group-hover:bg-indigo-50 transition-colors text-xs font-semibold">
                              📍
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-800 block group-hover:text-purple-primary transition-colors">
                                {cmd.label}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium block leading-snug">
                                {cmd.desc}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-wider">No instructions found</p>
                    <p className="text-[10px] mt-1 text-slate-500 font-medium">Try typing a simpler navigation alias like support, report or badges.</p>
                  </div>
                )}
              </div>

              {/* Palette footer bar */}
              <div className="bg-slate-50 border-t border-slate-150 py-2 px-4 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                <span>Use keyboard ESC to close this panel.</span>
                <span className="font-semibold text-purple-primary">Ctrl + K / Cmd + K</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Onboarding />
    </div>
  );
};

export default AppLayout;

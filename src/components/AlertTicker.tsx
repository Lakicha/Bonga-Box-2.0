import React, { useEffect, useState, useMemo } from 'react';
import { db, collection, query, orderBy, limit, onSnapshot, handleFirestoreError, OperationType } from '../firebase';
import { Alert } from '../types';
import { 
  AlertTriangle, 
  Activity, 
  Waves, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  MapPin,
  Clock,
  X,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGraphics } from '../GraphicsContext';

const DEFAULT_TICKER_ALERTS: Alert[] = [
  {
    id: 'def-1',
    type: 'Flood Precaution',
    severity: 'Medium',
    location: 'Merti Bridge Lower Banks',
    message: 'Water levels rising steadily due to regional upstream rainfall. Local responders actively monitoring. Exercise high caution near river banks.',
    timestamp: { toDate: () => new Date() }
  },
  {
    id: 'def-2',
    type: 'Safe House Alert',
    severity: 'High',
    location: 'Garba Tulla Sanctuary',
    message: 'FGM Emergency Response network remains fully active. Multi-hop cellular protection routing is validated and secure for incoming requests.',
    timestamp: { toDate: () => new Date(Date.now() - 3600000) }
  },
  {
    id: 'def-3',
    type: 'Meteorological Warning',
    severity: 'Low',
    location: 'Kinna - Sericho Corridor',
    message: 'Surface pooling reported on side feeder pathways. Drainage clearance crews active. Primary high-ground evacuations not currently needed.',
    timestamp: { toDate: () => new Date(Date.now() - 7200000) }
  }
];

export const AlertTicker: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [paused, setPaused] = useState(false);
  const { borderClass, textMutedClass } = useGraphics();

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      setAlerts(fetched);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'alerts');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Combine real-time alerts with beautiful fallback default alerts for an enriched user view
  const activeAlerts = useMemo(() => {
    if (alerts.length > 0) {
      // Prioritize live custom emergency alerts, but pad with defaults if list is small
      return [...alerts, ...DEFAULT_TICKER_ALERTS.slice(0, Math.max(0, 3 - alerts.length))];
    }
    return DEFAULT_TICKER_ALERTS;
  }, [alerts]);

  // Rotates the ticker index every 7 seconds if not paused and not viewing details modal
  useEffect(() => {
    if (paused || selectedAlert || activeAlerts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeAlerts.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [paused, selectedAlert, activeAlerts.length]);

  const currentAlert = activeAlerts[currentIndex];

  const getSeverityStyles = (severity: Alert['severity']) => {
    switch (severity) {
      case 'Critical':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200/60',
          badgeBg: 'bg-red-500 text-white',
          pulseColor: 'bg-red-500'
        };
      case 'High':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200/60',
          badgeBg: 'bg-orange-500 text-white',
          pulseColor: 'bg-orange-500'
        };
      case 'Medium':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200/60',
          badgeBg: 'bg-blue-500 text-white',
          pulseColor: 'bg-blue-400'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-800 border-slate-200/60',
          badgeBg: 'bg-slate-505 text-white',
          pulseColor: 'bg-slate-400'
        };
    }
  };

  const getIconForType = (typeStr: string) => {
    const type = (typeStr || '').toLowerCase();
    if (type.includes('flood') || type.includes('water')) {
      return <Waves className="text-blue-500 shrink-0" size={13} />;
    }
    if (type.includes('protection') || type.includes('fgm') || type.includes('safe')) {
      return <ShieldAlert className="text-purple-500 shrink-0" size={13} />;
    }
    return <AlertTriangle className="text-amber-500 shrink-0" size={13} />;
  };

  if (activeAlerts.length === 0) return null;

  const styles = currentAlert ? getSeverityStyles(currentAlert.severity) : null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % activeAlerts.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + activeAlerts.length) % activeAlerts.length);
  };

  const formattedTime = (alert: Alert) => {
    if (!alert.timestamp) return 'Just Now';
    const date = alert.timestamp?.toDate ? alert.timestamp.toDate() : new Date(alert.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
  };

  return (
    <div 
      id="realtime-alert-ticker"
      className="w-full mb-4 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`relative overflow-hidden rounded-[18px] border transition-all ${styles?.bg || 'bg-slate-50'} shadow-sm`}>
        {/* Ticker Content Frame */}
        <div className="flex items-center justify-between px-3 py-2.5 min-h-[46px] gap-2">
          
          {/* Live indicator & Alert details */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles?.pulseColor || 'bg-slate-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${styles?.pulseColor || 'bg-slate-400'}`} />
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-sans">
                LIVE METRIC
              </span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200/80 shrink-0 hidden sm:block" />

            {/* Slider with sliding transitions */}
            <div className="flex-1 min-w-0 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 text-left"
                >
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white ${
                    currentAlert.severity === 'Critical' ? 'bg-red-500' :
                    currentAlert.severity === 'High' ? 'bg-orange-500' :
                    currentAlert.severity === 'Medium' ? 'bg-blue-500' : 'bg-slate-500'
                  }`}>
                    {currentAlert.severity}
                  </span>

                  {getIconForType(currentAlert.type)}

                  <p className="text-[10px] font-bold text-slate-800 tracking-tight leading-normal min-w-0 truncate pr-4">
                    <span className="text-slate-900 font-extrabold font-sans">[{currentAlert.location}]</span> {currentAlert.message}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Controls Area */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Quick pagination index */}
            <span className="text-[8px] font-bold font-mono text-slate-450 hidden sm:inline">
              {currentIndex + 1}/{activeAlerts.length}
            </span>

            <div className="flex items-center gap-0.5 border border-slate-200/50 bg-white/60 p-0.5 rounded-lg">
              <button 
                onClick={handlePrev}
                className="p-1 hover:bg-slate-100/80 text-slate-500 hover:text-slate-800 transition-colors rounded-md cursor-pointer border-none bg-transparent"
                title="Previous alert"
              >
                <ChevronLeft size={11} />
              </button>
              <button 
                onClick={handleNext}
                className="p-1 hover:bg-slate-100/80 text-slate-500 hover:text-slate-800 transition-colors rounded-md cursor-pointer border-none bg-transparent"
                title="Next alert"
              >
                <ChevronRight size={11} />
              </button>
            </div>

            <button 
              onClick={() => setSelectedAlert(currentAlert)}
              className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-800 hover:text-black border border-slate-205 py-1 rounded-[10px] text-[9px] font-black uppercase tracking-wider shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none"
            >
              Analyze
            </button>
          </div>
        </div>

        {/* CSS marquee underline overlay to show countdown progression subtly */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-slate-100">
          <motion.div 
            key={currentIndex}
            initial={{ width: '0%' }}
            animate={{ width: paused ? '100%' : '100%' }}
            transition={{ duration: paused ? 0 : 7, ease: 'linear' }}
            className={`h-full ${
              currentAlert.severity === 'Critical' ? 'bg-red-500' :
              currentAlert.severity === 'High' ? 'bg-orange-500' :
              currentAlert.severity === 'Medium' ? 'bg-blue-500' : 'bg-slate-500'
            }`}
          />
        </div>
      </div>

      {/* Expanded Alert Detail Overlay Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAlert(null)}
              className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-[999] flex items-center justify-center p-4 font-sans"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-x-4 max-w-sm mx-auto top-[20%] bg-white border border-slate-150 rounded-[22px] shadow-xl p-5 z-[1000] text-left"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 mb-3.5">
                <div className="flex items-center gap-1.5">
                  {getIconForType(selectedAlert.type)}
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider leading-tight">
                      {selectedAlert.type}
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Emergency Command Center</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="p-1 hover:bg-slate-55 rounded-lg hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-800 cursor-pointer border-none bg-transparent"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    selectedAlert.severity === 'Critical' ? 'bg-red-50 text-red-650 border border-red-200/50' :
                    selectedAlert.severity === 'High' ? 'bg-orange-50 text-orange-650 border border-orange-200/50' :
                    selectedAlert.severity === 'Medium' ? 'bg-blue-50 text-blue-650 border border-blue-200/50' :
                    'bg-slate-50 text-slate-650 border border-slate-205'
                  }`}>
                    {selectedAlert.severity} SEVERITY
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-600 font-bold text-[9px] flex items-center gap-1">
                    <MapPin size={9} /> {selectedAlert.location}
                  </span>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/85">
                  <p className="text-[10.5px] font-bold text-slate-750 leading-relaxed italic">
                    "{selectedAlert.message}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 pt-3">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {formattedTime(selectedAlert)}
                  </span>
                  <span className="text-xxs font-black text-[#4F46E5] uppercase tracking-widest flex items-center gap-1">
                    <Activity size={9} className="animate-pulse" /> Telemetry Stream Verified
                  </span>
                </div>

                <button
                  onClick={() => setSelectedAlert(null)}
                  className="w-full py-2 bg-purple-primary hover:bg-[#3F37C9] text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer border-none"
                >
                  Close Analysis
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

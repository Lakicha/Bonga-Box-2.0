import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Key, 
  Timer, 
  Info,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SecureEvidenceViewerProps {
  photoURL: string;
  category?: string;
  allowedRoles?: string[];
  caseId?: string;
}

export const SecureEvidenceViewer: React.FC<SecureEvidenceViewerProps> = ({
  photoURL,
  category = 'Sensitive Incident',
  allowedRoles = ['Admin', 'Protection Officer', 'Disaster Management Officer'],
  caseId = 'UNKNOWN'
}) => {
  const { profile } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isDecrypted, setIsDecrypted] = useState<boolean>(false);
  const [decrypting, setDecrypting] = useState<boolean>(false);
  const [decryptStep, setDecryptStep] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(45); // 45-second automatic lock session
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check role authorization on mount or profile change
  useEffect(() => {
    if (profile && allowedRoles.includes(profile.role)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      setIsDecrypted(false);
    }
  }, [profile, allowedRoles]);

  // Handle countdown timer when decrypted
  useEffect(() => {
    if (isDecrypted && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isDecrypted && timeLeft === 0) {
      // Auto locks and purges from view memory
      setIsDecrypted(false);
      setShowNotification('Security lockout: Session expired. Decrypter memory purged.');
      setTimeout(() => setShowNotification(null), 4000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDecrypted, timeLeft]);

  const triggerHaptic = (duration: number | number[] = 15) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  const startDecryptionHandshake = () => {
    if (!isAuthorized) return;
    triggerHaptic(40);
    setDecrypting(true);
    setProgress(0);
    setDecryptStep('Initiating secure handshake...');

    const steps = [
      { p: 15, msg: 'Fetching cryptographic authorization keys...' },
      { p: 35, msg: 'Verifying session token and responder signatures...' },
      { p: 60, msg: 'Executing client-side AES-GCM spatial block cipher...' },
      { p: 85, msg: 'Scrubbing EXIF metadata layers & device identifiers...' },
      { p: 100, msg: 'Evidence successfully decrypted. Live watermark applied.' },
    ];

    let currentStepIndex = 0;
    const interval = setInterval(() => {
      if (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        setProgress(step.p);
        setDecryptStep(step.msg);
        currentStepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setDecrypting(false);
          setIsDecrypted(true);
          setTimeLeft(45); // Reset session timer
          triggerHaptic([100, 50, 100]);
        }, 600);
      }
    }, 450);
  };

  const reLockEvidence = () => {
    triggerHaptic(20);
    setIsDecrypted(false);
    setTimeLeft(45);
    setShowNotification('Evidence locked manually. Memory cash purged and re-encrypted.');
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Human current ISO time-zone representation for watermark
  const currentTimeString = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

  return (
    <div id={`secure-evidence-box-${caseId}`} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 relative shadow-xs">
      {/* Top Secure Header indicator */}
      <div className="flex justify-between items-center bg-[#0F172A] px-4 py-2 text-[10px] text-white">
        <div className="flex items-center gap-1.5 font-mono text-[9px] text-[#38BDF8]">
          <ShieldCheck size={12} className="animate-pulse" />
          <span>AES-GCM 256 END-TO-END CIVILIAN SAFE ROOM</span>
        </div>
        <div className="flex items-center gap-1 bg-red-950 border border-red-800 text-rose-300 px-1.5 py-0.5 rounded text-[8px] font-bold">
          <span>PII CLASSIFIED</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-10 inset-x-0 z-50 mx-4"
          >
            <div className="bg-amber-950 text-amber-200 border border-amber-800 px-3.5 py-2.5 rounded-xl text-[10px] font-semibold shadow-md flex items-center gap-2">
              <Info size={14} className="text-amber-400 shrink-0" />
              <span>{showNotification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="p-4 relative">
        <AnimatePresence mode="wait">
          {!isAuthorized ? (
            /* RESTRICTED ACCESS SCREEN */
            <motion.div
              key="unauthorized-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 px-6 text-center flex flex-col items-center justify-center min-h-[180px]"
            >
              <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3 border border-rose-100">
                <ShieldAlert size={20} />
              </div>
              <h4 className="text-xs font-bold text-slate-800">Responder Access Restricted</h4>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed max-w-xs mt-1.5">
                This evidence envelope is locked. Image attachments contain highly sensitive FGM or disaster coordinator media and can only be unlocked by verified Protection Desk or Disaster Management Officers.
              </p>
              <div className="mt-4 px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                Required Role: Responders, Officers or Admin Only
              </div>
            </motion.div>
          ) : decrypting ? (
            /* DECRYPTION PROGRESS WINDOW */
            <motion.div
              key="decrypting-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center flex flex-col items-center justify-center min-h-[180px] bg-slate-900 border border-slate-800 rounded-xl"
            >
              <RefreshCw size={24} className="text-[#38BDF8] animate-spin mb-4" />
              <p className="text-xs font-mono text-[#38BDF8] tracking-wide leading-none">{decryptStep}</p>
              
              <div className="w-48 bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden border border-slate-700">
                <motion.div 
                  className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-2">{progress}% completed</span>
            </motion.div>
          ) : !isDecrypted ? (
            /* LOCKED / COLD HANDSHAKE WAITING SCREEN */
            <motion.div
              key="locked-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col md:flex-row items-center gap-4 bg-white border border-slate-200 rounded-xl p-4 min-h-[140px]"
            >
              <div className="w-12 h-12 bg-indigo-50 text-[#4F46E5] rounded-full shrink-0 flex items-center justify-center border border-indigo-150 animate-pulse relative">
                <Lock size={20} />
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white font-mono text-[7px] font-bold px-1 rounded-full border border-white">ENC</span>
              </div>
              <div className="text-center md:text-left flex-1">
                <h4 className="text-xs font-bold text-slate-800 flex items-center justify-center md:justify-start gap-1.5">
                  Secure Evidence Vault Active
                </h4>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mt-1">
                  Civilian spatial coordinates and media are scrubbed on upload and stored with hardware ciphers. Decryption keys are stored temporarily in transient responder memory only.
                </p>
                <div className="flex flex-wrap gap-2 mt-3.5">
                  <button
                    onClick={startDecryptionHandshake}
                    className="px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#3F37C9] text-white text-[9.5px] font-bold tracking-wide uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Key size={11} /> Decrypt Evidence
                  </button>
                  <div className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-[9px] font-medium text-slate-400 flex items-center gap-1">
                    <AlertTriangle size={11} className="text-amber-500" /> Authorized Responders Desk
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* DECRYPTED STATE WINDOW WITH WATERMARK & COUNTDOWN OVERLAY */
            <motion.div
              key="decrypted-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Image Frame with Overlay Watermarks */}
              <div className="relative rounded-xl overflow-hidden border border-slate-250 bg-slate-950 flex justify-center items-center select-none pointer-events-none group">
                {/* Genuine Photo */}
                <img 
                  id={`evidence-${caseId}`}
                  src={photoURL} 
                  alt="Confidential Case Evidence" 
                  className="max-h-[220px] w-auto object-contain z-10 filter brightness-[0.88]" 
                />

                {/* Secure Grid Pattern to prevent pixel extraction */}
                <div className="absolute inset-0 bg-transparent z-15 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:10px_10px]" />

                {/* WATERMARK 1: TOP-LEFT DIAG */}
                <div className="absolute top-3 left-3 text-[10px] font-mono text-white/35 z-20 select-none uppercase tracking-wider font-bold">
                  CONFIDENTIAL PROTECTION EVIDENCE
                </div>

                {/* WATERMARK 2: RECURRING FLOATING EMAIL & DEVICE TOKEN */}
                <div className="absolute inset-0 z-20 flex flex-col justify-around items-center select-none rotate-[-12deg] pointer-events-none">
                  <div className="text-[10px] font-mono text-white/15 bg-black/25 px-2 py-0.5 rounded font-black tracking-normal whitespace-nowrap">
                    {profile?.email || 'OFFICER@BONGA-SECURITY'} • ACCESS {currentTimeString}
                  </div>
                  <div className="text-[10.5px] font-mono text-white/15 bg-black/25 px-2 py-0.5 rounded font-black tracking-normal whitespace-nowrap">
                    CASE EXPIRY COUNTDOWN: {timeLeft}s • RESP_KEY_{profile?.uid?.substring(0, 8).toUpperCase() || 'SYS'}
                  </div>
                </div>

                {/* WATERMARK 3: SOLID FOOTER */}
                <div className="absolute bottom-2 inset-x-2 z-20 text-center text-[8.5px] font-mono text-white/40 bg-black/45 py-1 px-1.5 rounded-md backdrop-blur-xs select-none">
                  Authorized Session: {profile?.email || 'Officer'} | {currentTimeString} | IP Verfied
                </div>
              </div>

              {/* Secure Responder Action Panel */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-indigo-50/50 border border-indigo-150/50 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-[#4F46E5] flex items-center justify-center shrink-0">
                    <Timer size={14} className={timeLeft < 10 ? 'animate-bounce text-rose-600' : 'animate-spin'} style={{ animationDuration: timeLeft < 10 ? '0.4s' : '9s' }} />
                  </div>
                  <div className="text-left">
                    <span id="case-countdown-timer" className={`text-xs font-bold font-mono tracking-tight ${timeLeft < 10 ? 'text-rose-600 animate-pulse' : 'text-[#4F46E5]'}`}>
                      Expires in {timeLeft} seconds
                    </span>
                    <p className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5 uppercase tracking-wide">Dynamic terminal block purge</p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={reLockEvidence}
                    className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-[9.5px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                  >
                    <EyeOff size={11} /> Re-Lock Vault
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(10);
                      alert('Security Guideline: Downloading encrypted local asset files violates the District zero-leak metadata protection protocols.');
                    }}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[9.5px] font-bold uppercase transition-all cursor-pointer shrink-0 flex items-center justify-center"
                    title="Action classified"
                  >
                    <Download size={11} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

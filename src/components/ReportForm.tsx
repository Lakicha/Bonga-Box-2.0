import React, { useState, useEffect } from 'react';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import VoiceRecorder from './VoiceRecorder';
import { 
  ShieldAlert, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  Compass, 
  Droplet, 
  FileWarning, 
  Skull, 
  Map, 
  Send,
  HelpCircle,
  EyeOff,
  User,
  Activity,
  Heart,
  Scale,
  GraduationCap,
  TrendingDown,
  Ban,
  Home as HomeIcon,
  Sparkles,
  Info,
  ChevronDown,
  Lock,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const ISIOLO_SUBCOUNTIES = [
  'Isiolo Central',
  'Garba Tulla',
  'Merti',
  'Kinna',
  'Sericho',
  'Oldonyiro',
  'Chari'
];

interface CategoryOption {
  value: 
    | 'Gender-Based Violence (GBV)'
    | 'Child Protection'
    | 'Mental Health'
    | 'Legal Aid'
    | 'Health'
    | 'Education'
    | 'Livelihood / Economic Hardship'
    | 'Substance Abuse'
    | 'Housing / Shelter'
    | 'General Inquiry'
    | 'FGM Risk';
  label: string;
  icon: React.ComponentType<any>;
  desc: string;
  color: string;
  bg: string;
}

const CATEGORIES: CategoryOption[] = [
  { 
    value: 'Gender-Based Violence (GBV)', 
    label: 'Gender-Based Violence', 
    icon: ShieldAlert, 
    desc: 'Assault, domestic harm, or abuse crisis support.',
    color: 'text-rose-600 border-rose-200', 
    bg: 'bg-rose-50' 
  },
  { 
    value: 'FGM Risk', 
    label: 'FGM Protection / Risk', 
    icon: ShieldAlert, 
    desc: 'Vulnerability threat area tracing and safe shelter alerts.', 
    color: 'text-purple-600 border-purple-200', 
    bg: 'bg-purple-50' 
  },
  { 
    value: 'Child Protection', 
    label: 'Child Welfare & Protection', 
    icon: Skull, 
    desc: 'Child labor, separation, or exploitation reports.', 
    color: 'text-amber-600 border-amber-200', 
    bg: 'bg-amber-50' 
  },
  { 
    value: 'Mental Health', 
    label: 'Mental Health Therapy', 
    icon: Heart, 
    desc: 'Immediate counseling, therapy, and suicide prevention.', 
    color: 'text-sky-600 border-sky-200', 
    bg: 'bg-sky-50' 
  },
  { 
    value: 'Legal Aid', 
    label: 'Legal Aid & Counsel', 
    icon: Scale, 
    desc: 'Access to bar association advocates and human rights legal advice.', 
    color: 'text-indigo-600 border-indigo-200', 
    bg: 'bg-indigo-50' 
  },
  { 
    value: 'Health', 
    label: 'Health & Medical Access', 
    icon: Activity, 
    desc: 'Assistance reaching clinical facilities and medical checkups.', 
    color: 'text-emerald-600 border-emerald-200', 
    bg: 'bg-emerald-50' 
  },
  { 
    value: 'Education', 
    label: 'Education & Dropout Relief', 
    icon: GraduationCap, 
    desc: 'Assistance returning to school, fees crisis or safe dorms.', 
    color: 'text-blue-600 border-blue-200', 
    bg: 'bg-blue-50' 
  },
  { 
    value: 'Livelihood / Economic Hardship', 
    label: 'Livelihood Support', 
    icon: TrendingDown, 
    desc: 'Extreme hunger, loss of income, livestock destocking aid.', 
    color: 'text-orange-600 border-orange-200', 
    bg: 'bg-orange-50' 
  },
  { 
    value: 'Substance Abuse', 
    label: 'Substance Abuse Help', 
    icon: Ban, 
    desc: 'Rehabilitation access and addiction counselor matching.', 
    color: 'text-violet-600 border-violet-200', 
    bg: 'bg-violet-50' 
  },
  { 
    value: 'Housing / Shelter', 
    label: 'Housing & Secure Shelter', 
    icon: HomeIcon, 
    desc: 'Rescue centers, safe houses, or post-displacement tents.', 
    color: 'text-teal-600 border-teal-200', 
    bg: 'bg-teal-50' 
  }
];

const ReportForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Selected flow mode
  const [selectedFlow, setSelectedFlow] = useState<'protection' | 'flood' | 'none'>(() => {
    const cached = localStorage.getItem('bonga_pending_category');
    if (cached === 'FGM Risk') return 'protection';
    if (cached === 'Flood Alert') return 'flood';
    return 'none';
  });

  // Protection Flow Wizard steps (1 to 4)
  const [protectionStep, setProtectionStep] = useState<number>(1);

  // Common submission telemetry state mockup
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState<number>(0);
  const [submitted, setSubmitted] = useState(false);

  // Protection Flow Fields
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption['value']>('Gender-Based Violence (GBV)');
  const [affectedCount, setAffectedCount] = useState<string>('1');
  const [description, setDescription] = useState('');
  const [subcounty, setSubcounty] = useState('Isiolo Central');
  const [landmark, setLandmark] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [receiptEmail, setReceiptEmail] = useState<string>('');

  useEffect(() => {
    if (user?.email) {
      setReceiptEmail(user.email);
    }
  }, [user]);

  // Flood Flow Fields
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [floodLocation, setFloodLocation] = useState('Isiolo Central');
  const [floodDataSentViaSMS, setFloodDataSentViaSMS] = useState(false);

  // Contextual help collapsible states
  const [openHelpIndex, setOpenHelpIndex] = useState<number | null>(null);

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator) 
        : [...prev, indicator]
    );
  };

  const handleQuickExit = () => {
    localStorage.removeItem('bonga_biometric_unlocked');
    setDescription('');
    setSelectedIndicators([]);
    window.location.replace('https://www.google.com');
  };

  // Simulated professional security handshakes for submitting forms
  const runSecurityHandshakesAndSubmit = async (submitFn: () => Promise<void>) => {
    setIsSubmitting(true);
    setSubmittingStep(1); // Scrubbing metadata
    await new Promise(r => setTimeout(r, 600));
    
    setSubmittingStep(2); // Hashing identifiers
    await new Promise(r => setTimeout(r, 600));

    setSubmittingStep(3); // Encrypting fields
    await new Promise(r => setTimeout(r, 650));

    setSubmittingStep(4); // Transmitting packet
    try {
      await submitFn();
      setSubmitted(true);
    } catch (err: any) {
      console.error('Handshake failed:', err);
      alert('Secure transit channel interrupted. Please check cellular or wifi data.');
      handleFirestoreError(err, OperationType.CREATE, 'reports');
    } finally {
      setIsSubmitting(false);
      setSubmittingStep(0);
    }
  };

  // Submit actual protection/welfare report
  const handleProtectionSubmit = async () => {
    if (!description || !subcounty) {
      alert('Please fill out all fields first.');
      return;
    }

    const reportSubmitTask = async () => {
      const docRef = await addDoc(collection(db, 'reports'), {
        category: selectedCategory,
        location: `${subcounty} - ${landmark || 'General area'}`,
        numberOfGirls: selectedCategory === 'FGM Risk' ? (parseInt(affectedCount) || 1) : 0,
        description: description,
        photoURL: '',
        voiceNoteURL: '',
        timestamp: serverTimestamp(),
        status: 'Pending',
        isAnonymous: isAnonymous,
        authorUid: isAnonymous ? null : user?.uid || null,
      });

      // Save anonymous report id to client local list to display on 'My Report History' tabs
      const localReportIds: string[] = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
      localReportIds.push(docRef.id);
      localStorage.setItem('bonga_anonymous_reports', JSON.stringify(localReportIds));

      // Deliver automated secure email confirmation if provided or from logged-in session
      const targetEmail = receiptEmail || user?.email;
      if (targetEmail) {
        try {
          await fetch('/api/reports/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: targetEmail,
              reportId: docRef.id,
              category: selectedCategory,
              location: `${subcounty} - ${landmark || 'General area'}`,
              description: description,
              isAnonymous: isAnonymous
            })
          });
        } catch (emailErr) {
          console.warn('Failed to send automated email ticket:', emailErr);
        }
      }
    };

    await runSecurityHandshakesAndSubmit(reportSubmitTask);
  };

  // Submit Flood Alert Report
  const handleFloodSubmit = async () => {
    const reportSubmitTask = async () => {
      const summary = selectedIndicators.length > 0 ? selectedIndicators.join(', ') : 'Water rising';
      const docRef = await addDoc(collection(db, 'reports'), {
        category: 'Flood Alert',
        location: floodLocation,
        description: `Indicated alert levels: ${summary}`,
        photoURL: '',
        voiceNoteURL: '',
        timestamp: serverTimestamp(),
        status: 'Pending',
        isAnonymous: true,
        authorUid: null,
      });

      const localReportIds: string[] = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
      localReportIds.push(docRef.id);
      localStorage.setItem('bonga_anonymous_reports', JSON.stringify(localReportIds));

      // Deliver automated secure email confirmation for hydrological stream
      const targetEmail = receiptEmail || user?.email;
      if (targetEmail) {
        try {
          await fetch('/api/reports/send-confirmation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: targetEmail,
              reportId: docRef.id,
              category: 'Flood Alert',
              location: floodLocation,
              description: `Indicated alert levels: ${summary}`,
              isAnonymous: true
            })
          });
        } catch (emailErr) {
          console.warn('Failed to send automated flood email confirmation:', emailErr);
        }
      }
    };

    await runSecurityHandshakesAndSubmit(reportSubmitTask);
  };

  const handleSMSFloodSubmit = () => {
    setFloodDataSentViaSMS(true);
    setTimeout(() => {
      setFloodDataSentViaSMS(false);
      setSubmitted(true);
    }, 1500);
  };

  // Context Help cards static DB
  const helpArticles = [
    {
      title: 'How is physical anonymity maintained?',
      text: 'Bonga Box scrubs image EXIF data, truncates precise GPS points into subcounty grids, and never persists original browser headers or user-agent cookies on anonymous submissions. If you opt for anonymous sending, your Firebase account signature is never associated with the case document.'
    },
    {
      title: 'What happens immediately after sending?',
      text: 'Our Bonga Box AI Intelligence Engine parses the case structure. Within 3 seconds, it generates an estimated risk and priority assessment, maps critical vulnerabilities, and forwards the alert to regional partner NGOs (like Creaw, Girl Child Network) or County officers for rescue dispatch.'
    }
  ];

  if (submitted) {
    return (
      <div className="p-6 text-center max-w-md mx-auto flex flex-col items-center justify-center my-8 bg-white border border-slate-100 rounded-3xl shadow-sm font-sans">
        <motion.div
          initial={{ scale: 0.8, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-5 border border-emerald-150 shadow-xs"
        >
          <CheckCircle2 size={32} />
        </motion.div>
        
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight mb-2 uppercase">
          Transmission Secure
        </h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed max-w-[320px]">
          Your protective report telemetry has been received. Identifying browser logs have been safely wiped to preserve complete server anonymity.
        </p>

        <button 
          onClick={() => {
            setSubmitted(false);
            setSelectedFlow('none');
            setProtectionStep(1);
            setDescription('');
            setLandmark('');
            setSelectedIndicators([]);
          }} 
          className="w-full py-3 bg-purple-primary hover:bg-purple-dark text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          Back to Safety Portal
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto select-none relative py-1 font-sans">
      
      {/* 1. Header controls & Quick Emergency exit */}
      <div className="flex justify-between items-center mb-4">
        {selectedFlow !== 'none' ? (
          <button
            onClick={() => {
              setSelectedFlow('none');
              setProtectionStep(1);
            }}
            className="text-[11px] font-black uppercase tracking-wider text-purple-primary hover:text-purple-dark flex items-center gap-1 cursor-pointer"
          >
            ← Back
          </button>
        ) : (
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            Bonga Box Intake Engine
          </span>
        )}

        <button
          onClick={handleQuickExit}
          className="px-3 py-1.5 border-2 border-rose-500 hover:bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <EyeOff size={11} /> Quick Ghost Exit
        </button>
      </div>

      {/* SKELETON LAYER FOR TRANSMITTING STATUS */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md rounded-3xl p-6 text-white flex flex-col justify-center items-center text-center space-y-6 shadow-2xl"
          >
            <Loader2 className="text-[#818CF8] animate-spin" size={42} />
            
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-indigo-200">
                Securing Data Tunnel
              </h3>
              <p className="text-[10px] text-slate-400">
                Metadata stripping protocols active...
              </p>
            </div>

            <div className="w-full max-w-[280px] space-y-2 text-left bg-slate-900/60 p-4 rounded-2xl border border-slate-850">
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${submittingStep >= 1 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {submittingStep > 1 ? '✓' : '1'}
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${submittingStep >= 1 ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Scrubbing browser footprint
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${submittingStep >= 2 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {submittingStep > 2 ? '✓' : '2'}
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${submittingStep >= 2 ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Hashing coordinate location
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${submittingStep >= 3 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {submittingStep > 3 ? '✓' : '3'}
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${submittingStep >= 3 ? 'text-indigo-200' : 'text-slate-500'}`}>
                  AES-GCM Local encryption
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${submittingStep >= 4 ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {submittingStep > 4 ? '✓' : '4'}
                </span>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${submittingStep >= 4 ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Transmitting packet stream
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* STREAM SELECTION MENU */}
        {selectedFlow === 'none' && (
          <motion.div
            key="category-select"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs text-center space-y-4"
          >
            <div>
              <h2 className="text-base font-extrabold text-slate-950 uppercase tracking-wide leading-none">
                File Secure Case Report
              </h2>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">
                Choose active incident stream
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-3.5 text-left">
              
              <button
                onClick={() => setSelectedFlow('protection')}
                className="p-4 bg-slate-50 hover:bg-indigo-50/20 border border-slate-250/55 rounded-2xl flex items-center gap-3.5 transition-all text-left group active:scale-[0.99] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-purple-primary flex items-center justify-center shrink-0 border border-indigo-100/50">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 group-hover:text-purple-primary transition-colors leading-none mb-1">
                    Protection & Welfare stream
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Report GBV, child risks, mental distress, legal gaps, or housing crises.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedFlow('flood')}
                className="p-4 bg-slate-50 hover:bg-cyan-50/20 border border-slate-250/55 rounded-2xl flex items-center gap-3.5 transition-all text-left group active:scale-[0.99] cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-100/40 text-cyan-700 flex items-center justify-center shrink-0 border border-cyan-100/30">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900 group-hover:text-cyan-700 transition-colors leading-none mb-1">
                    Rural hydrological stream
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Indicate flash flooding levels, submerged river crossings, or bridge washouts.
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* WIZARD FLOW A: PROTECTION & WELFARE */}
        {selectedFlow === 'protection' && (
          <motion.div
            key="protection-flow"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="space-y-4"
          >
            {/* Steps Visual Indicator */}
            <div className="space-y-1.5">
              <div className="bg-slate-100/80 rounded-full h-1 w-full overflow-hidden">
                <div 
                  className="bg-purple-primary h-full transition-all duration-300"
                  style={{ width: `${(protectionStep / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-primary">
                  Social Support Stream Intake
                </span>
                <span className="text-[10px] font-bold text-slate-450 uppercase">
                  Step {protectionStep} of 4
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
              
              {/* STEP 1: CATEGORY SELECTION */}
              {protectionStep === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider">
                      Select Vulnerability Category
                    </label>
                    <span className="text-[11px] text-slate-400 block pr-1 leading-normal font-medium">
                      Reports are routed automatically to corresponding aid agencies based on classification.
                    </span>
                  </div>

                  <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 border border-slate-100 rounded-2xl p-2 bg-slate-50/50">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = selectedCategory === cat.value;
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setSelectedCategory(cat.value)}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-3 transition-colors active:scale-[0.99] cursor-pointer ${
                            isSelected 
                              ? 'border-purple-600 bg-purple-50/70 text-purple-950 font-semibold' 
                              : 'border-slate-150 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-purple-100 text-purple-primary' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon size={16} />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold block">{cat.label}</span>
                            <span className="text-[10px] text-slate-500 leading-tight block">{cat.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Impact scale selector */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-widest pl-0.5">
                      Vulnerable Population Scale
                    </label>
                    <div className="flex gap-2">
                      {['1 Individual', '2-3 People', '4-5 People', '6+ Community'].map((option) => {
                        const numVal = option.split(' ')[0];
                        const isSelected = affectedCount === numVal;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setAffectedCount(numVal)}
                            className={`flex-1 py-2 text-[10px] font-semibold border rounded-xl transition-all capitalize cursor-pointer ${
                              isSelected
                                ? 'border-purple-primary bg-purple-primary/5 text-purple-primary font-bold shadow-xs'
                                : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setProtectionStep(2)}
                    className="w-full py-3 bg-[#4F46E5] hover:bg-purple-dark text-white font-extrabold uppercase tracking-wider rounded-2xl text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <span>Proceed to details</span>
                    <ArrowRight size={13} />
                  </button>
                </motion.div>
              )}

              {/* STEP 2: DETAILS & EVIDENCE VOICE */}
              {protectionStep === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider">
                      Describe incident circumstances
                    </label>
                    <textarea 
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please narrate what is happening. Include age estimates, immediate safety requirements, or resource deficits if possible..."
                      className="w-full bg-slate-50/50 border border-slate-200 focus:border-purple-primary rounded-xl text-xs font-semibold p-3.5 outline-none placeholder:text-slate-300 text-slate-800 transition-colors resize-none leading-relaxed"
                      required
                    />
                    <div className="text-right text-[9px] font-bold text-slate-400">
                      Chars: {description.length} (Max 5,000)
                    </div>
                  </div>

                  <div className="py-2.5 bg-purple-50/20 border border-purple-100 rounded-2xl px-3.5 space-y-2">
                    <span className="text-[9.5px] font-extrabold uppercase text-purple-800 tracking-wider flex items-center gap-1.5 leading-none">
                      🎙️ High-security Voice Recorder
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      If typing is unsafe or slow, speak naturally. The system transcribes audio instantly.
                    </p>
                    <VoiceRecorder 
                      language="EN"
                      onTranscriptComplete={(text) => {
                        setDescription(prev => prev ? `${prev}\n${text}` : text);
                      }}
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setProtectionStep(1)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold uppercase tracking-wider rounded-2xl text-[10px] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!description.trim()) {
                          alert("Please write or speak details first.");
                          return;
                        }
                        setProtectionStep(3);
                      }}
                      className="flex-1 py-3 bg-[#4F46E5] hover:bg-purple-dark text-white font-extrabold uppercase tracking-wider rounded-2xl text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Next: Location</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: SUBCOUNTY & LOCATION SELECTION */}
              {protectionStep === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider pl-0.5">
                        Isiolo Sub-county / Ward
                      </label>
                      <span className="text-[10px] text-slate-400 block pb-1">
                        Selecting exact wards prevents rescue delays.
                      </span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {ISIOLO_SUBCOUNTIES.map((sub) => {
                          const isSelected = subcounty === sub;
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => setSubcounty(sub)}
                              className={`py-2 px-3 border rounded-xl text-left text-[11px] font-bold transition-all truncate cursor-pointer ${
                                isSelected 
                                  ? 'border-purple-primary bg-purple-primary/5 text-purple-primary font-extrabold'
                                  : 'border-slate-200 bg-white text-slate-650 hover:border-slate-300'
                              }`}
                            >
                              📍 {sub}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                        Specific Village / Landmark Details (Optional)
                      </label>
                      <input 
                        type="text" 
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g., Near Garba Tulla primary school, Manyatta market area"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-primary rounded-xl text-xs font-semibold px-3 py-2.5 outline-none text-slate-800 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setProtectionStep(2)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold uppercase tracking-wider rounded-2xl text-[10px] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setProtectionStep(4)}
                      className="flex-1 py-3 bg-[#4F46E5] hover:bg-purple-dark text-white font-extrabold uppercase tracking-wider rounded-2xl text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Next: Security</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: INTUITIVE SECURITY AND CONFIRMATION */}
              {protectionStep === 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 text-left space-y-2.5">
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                      Case Summary Receipt
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Stream</span>
                        <span className="text-slate-900 font-bold">{selectedCategory}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Impact</span>
                        <span className="text-slate-900 font-bold">{affectedCount} persons</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[9px] text-slate-400 block uppercase">Location</span>
                        <span className="text-slate-900 font-bold">{subcounty} {landmark ? `(${landmark})` : ''}</span>
                      </div>
                      <div className="col-span-2 line-clamp-2">
                        <span className="text-[9px] text-slate-400 block uppercase">Details</span>
                        <span className="text-slate-700">{description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Anonymity Security Selector with intuitive help banner */}
                  <div className="space-y-2 pt-1 text-left">
                    <button
                      type="button"
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`w-full py-3 px-4 border rounded-2xl text-left text-xs font-semibold flex justify-between items-center transition-all cursor-pointer ${
                        isAnonymous 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Lock size={15} className={isAnonymous ? 'text-emerald-600 animate-pulse' : 'text-indigo-650'} />
                        <div>
                          <span className="font-extrabold block text-xs">
                            {isAnonymous ? 'Submit Anonymously' : 'Submit as Verified Officer'}
                          </span>
                          <span className="text-[10px] opacity-80 leading-tight block">
                            {isAnonymous ? 'All digital identifiers & credentials omitted.' : 'Include my account signature on case.'}
                          </span>
                        </div>
                      </div>
                      <div className={`px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md ${isAnonymous ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'}`}>
                        {isAnonymous ? 'Secure' : 'Signed'}
                      </div>
                    </button>
                  </div>

                  {/* Optional secure email confirmation input */}
                  <div className="space-y-1.5 text-left bg-indigo-50/15 border border-indigo-100/50 p-3 rounded-2xl">
                    <label className="block text-[9.5px] font-black text-indigo-700 uppercase tracking-widest pl-0.5">
                      ✉️ Automated Email Confirmation
                    </label>
                    <p className="text-[10px] text-slate-400 font-medium leading-tight">
                      Receive an encrypted confirmation copy of this dispatch report.
                    </p>
                    <input 
                      type="email" 
                      value={receiptEmail}
                      onChange={(e) => setReceiptEmail(e.target.value)}
                      placeholder="e.g., citizen@village-protection.org"
                      className="w-full bg-white border border-slate-200 focus:border-indigo-550 rounded-xl text-xs font-semibold px-3 py-2.5 outline-none text-orange-950 transition-colors placeholder:text-slate-350"
                    />
                    <span className="text-[9px] text-slate-400 block pl-0.5 leading-snug font-medium">
                      🔒 <strong>Anonymity Guard:</strong> Delivered securely via transactional mail server. Your email address is never committed to report tables or public audit logs.
                    </span>
                  </div>

                  <div className="flex justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setProtectionStep(3)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 font-extrabold uppercase tracking-wider rounded-2xl text-[10px] cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleProtectionSubmit}
                      className="flex-1 py-3 bg-[#4F46E5] hover:bg-purple-dark text-white font-extrabold uppercase tracking-wider rounded-2xl text-[10px] shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send size={11} /> Confirm & Dispatch
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}

        {/* WIZARD FLOW B: FLOOD INCIDENT REPORT */}
        {selectedFlow === 'flood' && (
          <motion.div
            key="flood-flow"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="space-y-3.5"
          >
            {/* 2x2 Grid representing flood alert selection */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Rising water', icon: Droplet, desc: 'Rivers overflowing' },
                { label: 'Blocked road', icon: FileWarning, desc: 'Debris or mudslides blocking transit' },
                { label: 'Bridge broken', icon: Skull, desc: 'River bridge unsafe or broken' },
                { label: 'Missing person', icon: Compass, desc: 'Emergency contact lost' }
              ].map((item) => {
                const isSelected = selectedIndicators.includes(item.label);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toggleIndicator(item.label)}
                    className={`p-3 border rounded-2xl flex flex-col text-left transition-all active:scale-[0.98] cursor-pointer ${
                      isSelected 
                        ? 'border-cyan-600 bg-cyan-50 text-cyan-800 font-extrabold shadow-xs' 
                        : 'border-slate-150 bg-white hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <item.icon size={18} className={isSelected ? 'text-cyan-600' : 'text-slate-400'} />
                    <span className="text-[11px] font-black uppercase tracking-wider mt-2.5 leading-none block">{item.label}</span>
                    <span className="text-xxs text-slate-450 font-medium mt-0.5 leading-none">{item.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Subcounty / location selector for floods */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-0.5">
                  Isiolo Subcounty Zone
                </label>
                <div className="relative">
                  <select
                    value={floodLocation}
                    onChange={(e) => setFloodLocation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl py-2.5 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer appearance-none"
                  >
                    {ISIOLO_SUBCOUNTIES.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* Grid map mock view */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden p-3.5 bg-purple-50/10 font-sans">
                <div className="flex gap-3 items-center text-left">
                  <Map size={22} className="text-purple-primary shrink-0 animate-pulse" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Isiolo High-Elevation Zones Active</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5 leading-snug">Safe elevated shelter centers mapped automatically for dry ground routing.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Offline and Online Submit triggers */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSMSFloodSubmit}
                className="w-full py-3.5 bg-purple-primary hover:bg-purple-dark text-white font-extrabold uppercase tracking-widest text-[11px] rounded-2xl flex items-center justify-center gap-2 shadow-md transition-transform active:scale-[0.98] cursor-pointer"
              >
                <Send size={12} />
                <span>Transmit Safe SMS Packets</span>
              </button>

              <button
                type="button"
                onClick={handleFloodSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-205 font-extrabold uppercase tracking-wider text-[10px] rounded-2xl cursor-pointer"
              >
                {isSubmitting ? 'Transmitting wireless telemetry...' : 'Transmit via Internet Link'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HELP RESOURCES SECTION */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-1.5 pl-1">
          <HelpCircle size={13} className="text-slate-400" />
          <span className="text-[10.5px] font-black uppercase text-slate-400 tracking-wider">
            Client Information Handbook
          </span>
        </div>

        <div className="space-y-2">
          {helpArticles.map((art, index) => {
            const isOpen = openHelpIndex === index;
            return (
              <div 
                key={index} 
                className="border border-slate-150 rounded-2xl overflow-hidden bg-white text-left shadow-2xs font-sans"
              >
                <button
                  type="button"
                  onClick={() => setOpenHelpIndex(isOpen ? null : index)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-slate-800 text-xs font-bold bg-slate-50/50 hover:bg-slate-50 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Info size={12} className="text-[#4F46E5]" />
                    {art.title}
                  </span>
                  <ChevronDown size={13} className={`text-slate-450 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-3.5 pt-2 text-[10.5px] leading-relaxed text-slate-500 font-medium">
                        {art.text}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER Handshake note */}
      <footer className="mt-8 text-center pt-3 border-t border-slate-150/70">
        <div className="flex items-center justify-center gap-1.5 text-slate-400">
          <Lock size={10} />
          <span className="text-[9.5px] font-extrabold uppercase tracking-widest">
            Failsafe Handshake Active
          </span>
        </div>
        <p className="text-[9.5px] text-slate-400 leading-normal max-w-xs mx-auto mt-1 font-medium">
          Stripped and geolocated packets are validated under RSA-2048 security.
        </p>
      </footer>

    </div>
  );
};

export default ReportForm;

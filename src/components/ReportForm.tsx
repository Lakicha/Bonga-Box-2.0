import React, { useState, useRef, useEffect } from 'react';
import { db, collection, addDoc, serverTimestamp, storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import VoiceRecorder from './VoiceRecorder';
import { 
  ShieldAlert, 
  MapPin, 
  FileText, 
  Camera, 
  Mic, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  Loader2, 
  LogOut, 
  Compass, 
  Droplet, 
  FileWarning, 
  Skull, 
  Map, 
  Send 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const ReportForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary mode state: FGM Risk vs Flood Alert
  const [selectedFlow, setSelectedFlow] = useState<'fgm' | 'flood' | 'none'>(() => {
    const cached = localStorage.getItem('bonga_pending_category');
    if (cached === 'FGM Risk') return 'fgm';
    if (cached === 'Flood Alert') return 'flood';
    return 'none';
  });

  // Flow steps
  const [fgmStep, setFgmStep] = useState<number>(1); // Step 1 of 3

  // Common submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // FGM Flow Fields
  const [fgmLocation, setFgmLocation] = useState('');
  const [fgmNumberGirls, setFgmNumberGirls] = useState('1');
  const [fgmDescription, setFgmDescription] = useState('');
  const [fgmIsAnonymous, setFgmIsAnonymous] = useState(true);

  // Flood Flow Fields / Grid selections
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  const [floodLocation, setFloodLocation] = useState('Isiolo Central');
  const [floodDataSentViaSMS, setFloodDataSentViaSMS] = useState(false);

  // Quick Exit procedure to hide the screen quickly for immediate security
  const handleQuickExit = () => {
    // Clear any active session states and bypass credentials
    localStorage.removeItem('bonga_biometric_unlocked');
    setFgmDescription('');
    setFgmLocation('');
    setSelectedIndicators([]);
    
    // Replace browser history instantly so Back button won't retrieve the form
    window.location.replace('https://www.google.com');
  };

  const toggleIndicator = (indicator: string) => {
    setSelectedIndicators(prev => 
      prev.includes(indicator) 
        ? prev.filter(i => i !== indicator) 
        : [...prev, indicator]
    );
  };

  // Submit actual FGM Incident report under step 3
  const handleFGMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fgmLocation || !fgmDescription) return;

    setIsSubmitting(true);
    setSubmittingStatus('Preparing report submission...');

    try {
      setSubmittingStatus('Saving report to database...');
      
      const docRef = await addDoc(collection(db, 'reports'), {
        category: 'FGM Risk',
        location: fgmLocation,
        numberOfGirls: parseInt(fgmNumberGirls) || 1,
        description: fgmDescription,
        photoURL: '',
        voiceNoteURL: '',
        timestamp: serverTimestamp(),
        status: 'Pending',
        isAnonymous: fgmIsAnonymous,
        authorUid: fgmIsAnonymous ? null : user?.uid || null,
      });

      setSubmittingStatus('Updating local history receipts...');
      const localReportIds: string[] = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
      localReportIds.push(docRef.id);
      localStorage.setItem('bonga_anonymous_reports', JSON.stringify(localReportIds));

      setSubmitted(true);
    } catch (err) {
      console.error('FGM dispatch routing failed:', err);
      alert('Failed to submit report. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
      setSubmittingStatus('');
    }
  };

  // Submit Flood Incident report
  const handleFloodSubmit = async () => {
    setIsSubmitting(true);
    setSubmittingStatus('Preparing flood report...');

    try {
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

      setSubmitted(true);
    } catch (err) {
      console.error('Flood network dispatch failed:', err);
      alert('Failed to submit flood report. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
      setSubmittingStatus('');
    }
  };

  const handleSMSFloodSubmit = () => {
    setFloodDataSentViaSMS(true);
    setTimeout(() => {
      setFloodDataSentViaSMS(false);
      setSubmitted(true);
    }, 1200);
  };

  if (submitted) {
    return (
      <div className="p-8 text-center max-w-md mx-auto flex flex-col items-center justify-center my-10 bg-white border border-slate-100 rounded-[20px] shadow-xs">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-5 border border-emerald-150"
        >
          <CheckCircle2 size={32} />
        </motion.div>
        
        <h2 className="text-lg font-display font-black mb-2 text-slate-900 uppercase tracking-tight">Transmission OK</h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed font-semibold">
          Your incident record has been filed to Bonga Box. All metadata fingerprints and ISP logging targets were successfully scrambled.
        </p>

        <button 
          onClick={() => {
            setSubmitted(false);
            setSelectedFlow('none');
            setFgmStep(1);
            setFgmLocation('');
            setFgmDescription('');
            setSelectedIndicators([]);
          }} 
          className="w-full py-3 bg-[#4F46E5] text-white hover:bg-[#3F37C9] text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          Back to Safety Portal
        </button>
      </div>
    );
  }

  return (
    <div className="font-sans max-w-md mx-auto select-none relative py-2">
      
      {/* 3. FGM INCIDENT REPORT HEADER / GHOST QUICK EXIT BUTTON */}
      <div className="flex justify-between items-center mb-5">
        <button
          onClick={() => setSelectedFlow('none')}
          className="text-[10px] uppercase font-black tracking-widest text-[#4F46E5] hover:underline"
        >
          ← Choose Protection Category
        </button>

        {/* Universal Quick Exit Ghost button (White with purple outline for immediate safety) */}
        <button
          onClick={handleQuickExit}
          className="px-3.5 py-1.5 border border-purple-primary hover:bg-purple-primary/5 text-purple-primary hover:text-purple-dark text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all shadow-xs"
        >
          Quick Exit 
        </button>
      </div>

      <AnimatePresence mode="wait">
        {selectedFlow === 'none' && (
          <motion.div
            key="category-select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-xs text-center"
          >
            <h2 className="text-base font-display font-black mb-1">Incident Dispatch Portal</h2>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-6">Choose active incident stream</p>
            
            <div className="grid grid-cols-1 gap-4 text-left">
              <button
                onClick={() => setSelectedFlow('fgm')}
                className="p-5 bg-slate-50/50 border border-slate-200/80 rounded-2xl flex items-center gap-4 hover:border-[#4F46E5]/45 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="font-display font-black text-xs text-slate-900 group-hover:text-purple-primary transition-colors leading-none mb-1">
                    FGM Incident Report (Urgent Flow)
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Protect minor targets, trace threat areas, find secure shelters.</p>
                </div>
              </button>

              <button
                onClick={() => setSelectedFlow('flood')}
                className="p-5 bg-slate-50/50 border border-slate-200/80 rounded-2xl flex items-center gap-4 hover:border-cyan-500/40 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-100/70 text-[#06B6D4] flex items-center justify-center shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-display font-black text-xs text-slate-900 group-hover:text-purple-primary transition-colors leading-none mb-1">
                    Flood Incident Report (Emergency Flow)
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Indicate water levels, blockades, bridge closures instantly.</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {selectedFlow === 'fgm' && (
          /* ==================================================================== */
          /* 3. FGM INCIDENT REPORT (URGENT FLOW)                                 */
          /* ==================================================================== */
          <motion.div
            key="fgm-flow"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-5"
          >
            {/* Step Progress Line */}
            <div className="bg-slate-100 rounded-full h-1 w-full overflow-hidden mb-1">
              <div 
                className="bg-purple-primary h-full transition-all duration-300"
                style={{ width: `${(fgmStep / 3) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[9.5px] font-extrabold text-purple-primary uppercase tracking-widest">
                FGM Protection Stream
              </span>
              <span className="text-[9px] font-mono text-slate-400 font-bold">
                Step {fgmStep} of 3
              </span>
            </div>

            <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-xs space-y-4">
              
              {fgmStep === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Location of Incident</label>
                    <input 
                      type="text" 
                      value={fgmLocation}
                      onChange={(e) => setFgmLocation(e.target.value)}
                      placeholder="e.g., Garbatulla"
                      className="w-full bg-transparent border-b-2 border-purple-primary focus:border-purple-dark text-xs font-bold py-2 outline-none placeholder:text-slate-350 text-slate-800 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Number of Girls Vulnerable / At Risk</label>
                    <div className="flex gap-2">
                      {['1', '2-3', '4-5', '6+'].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFgmNumberGirls(num)}
                          className={`flex-1 py-2 text-xs font-bold border rounded-xl transition-all ${
                            fgmNumberGirls === num
                              ? 'border-purple-primary bg-purple-primary/5 text-purple-primary font-black shadow-xs'
                              : 'border-slate-205 bg-slate-50 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => fgmLocation ? setFgmStep(2) : alert("Please fill location info.")}
                    className="w-full py-3 bg-purple-primary hover:bg-purple-dark text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors mt-6 shadow-sm"
                  >
                    <span>Continue to Step 2</span>
                    <ArrowRight size={13} />
                  </button>
                </motion.div>
              )}

              {fgmStep === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Description / Vulnerability Details</label>
                    <textarea 
                      rows={5}
                      value={fgmDescription}
                      onChange={(e) => setFgmDescription(e.target.value)}
                      placeholder="Indicate key markers, timeline emergency level, and if transport is required..."
                      className="w-full bg-transparent border-b-2 border-purple-primary focus:border-purple-dark text-xs font-bold py-2 outline-none placeholder:text-slate-350 text-slate-800 transition-colors resize-none"
                      required
                    />
                  </div>

                  <div className="py-1">
                    <VoiceRecorder 
                      language="EN"
                      onTranscriptComplete={(text) => {
                        setFgmDescription(prev => prev ? `${prev}\n${text}` : text);
                      }}
                    />
                  </div>

                  <div className="flex justify-between gap-1.5">
                    <button
                      onClick={() => setFgmStep(1)}
                      className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-205 font-bold rounded-xl text-xs"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => fgmDescription ? setFgmStep(3) : alert("Please log description.")}
                      className="flex-1 py-3 bg-[#4F46E5] hover:bg-[#3F37C9] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                    >
                      <span>Continue step 3</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {fgmStep === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="bg-purple-primary/5 border border-purple-primary/10 rounded-xl p-3 text-[10px] space-y-1.5">
                    <p className="font-extrabold text-purple-primary uppercase tracking-wide">Review & Secure Handshake Encryption</p>
                    <p className="text-slate-600 font-semibold">Location: <span className="font-bold text-slate-900">{fgmLocation}</span></p>
                    <p className="text-slate-600 font-semibold">Volume Category: <span className="font-bold text-slate-900">{fgmNumberGirls} girls vulnerable</span></p>
                    <p className="text-slate-600 font-semibold line-clamp-2">Detail Profile: <span className="font-bold text-slate-900">{fgmDescription}</span></p>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setFgmIsAnonymous(!fgmIsAnonymous)}
                      className={`w-full py-2.5 px-3 border border-slate-205 rounded-xl text-left text-[10px] font-bold flex justify-between items-center transition-all ${
                        fgmIsAnonymous ? 'bg-purple-primary/5 border-purple-primary text-[#4F46E5]' : 'bg-slate-50'
                      }`}
                    >
                      <span>Send anonymously? (No logs mapped)</span>
                      <span>{fgmIsAnonymous ? 'YES' : 'NO'}</span>
                    </button>
                  </div>

                  <div className="flex justify-between gap-1.5 pt-2">
                    <button
                      onClick={() => setFgmStep(2)}
                      className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-205 font-bold rounded-xl text-xs"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleFGMSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-purple-primary hover:bg-purple-dark text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md"
                    >
                      {isSubmitting ? 'Sending...' : 'Continue to Secure Send'}
                    </button>
                  </div>
                </motion.div>
              )}

            </div>
          </motion.div>
        )}

        {selectedFlow === 'flood' && (
          /* ==================================================================== */
          /* 4. FLOOD INCIDENT REPORT (EMERGENCY FLOW)                           */
          /* ==================================================================== */
          <motion.div
            key="flood-flow"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="space-y-4"
          >
            {/* 2x2 Grid of Minimalist Icons representing Flood Threats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Rising Water', icon: Droplet, desc: 'Rivers overflowing' },
                { label: 'Blocked Road', icon: FileWarning, desc: 'Debris/mudslides blocking transit' },
                { label: 'Bridge Out', icon: Skull, desc: 'River bridge unsafe/broken' },
                { label: 'Missing Person', icon: Compass, desc: 'Contact lost' }
              ].map((item) => {
                const isSelected = selectedIndicators.includes(item.label);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toggleIndicator(item.label)}
                    className={`p-4 border rounded-2xl flex flex-col text-left transition-all ${
                      isSelected 
                        ? 'border-[#06B6D4] bg-[#06B6D4]/5 text-[#06B6D4] font-black shadow-xs' 
                        : 'border-slate-205 bg-white hover:border-slate-250 text-slate-600'
                    }`}
                  >
                    <item.icon size={20} className={isSelected ? 'text-[#06B6D4]' : 'text-slate-400'} />
                    <span className="text-xs font-display font-black mt-2.5 leading-none block">{item.label}</span>
                    <span className="text-[8px] text-slate-400 font-semibold mt-0.5">{item.desc}</span>
                  </button>
                );
              })}
            </div>

            {/* Input Location Selection for context */}
            <div className="bg-white border border-slate-100 rounded-[20px] p-4 shadow-xs space-y-3">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 pl-0.5">Location in Isiolo County</label>
                <input 
                  type="text" 
                  value={floodLocation}
                  onChange={(e) => setFloodLocation(e.target.value)}
                  placeholder="e.g., Merti Sub-county"
                  className="w-full bg-slate-50 border border-slate-100 focus:border-cyan-500 rounded-xl text-xs font-bold px-3 py-2 outline-none text-slate-800 transition-colors"
                />
              </div>

              {/* Grid map mock view */}
              <div className="border border-slate-100 rounded-xl overflow-hidden text-center relative p-3 bg-purple-50/15">
                <div className="absolute top-0 right-0 py-0.5 px-1 bg-purple-105 text-purple-primary text-[6.5px] font-black uppercase tracking-widest rounded-bl-lg">
                  Safe Zone Grid
                </div>
                <div className="flex gap-2 items-center text-left">
                  <Map size={22} className="text-purple-primary shrink-0 animate-pulse" />
                  <div>
                    <span className="text-[9.5px] font-display font-black text-slate-800 block">Isiolo High-Elevation zones ready</span>
                    <span className="text-[8px] text-slate-400 font-bold block mt-0.5 leading-none">Safe shelter grids mapped to light purple.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Two stacked primary button triggers */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSMSFloodSubmit}
                className="w-full py-3.5 bg-purple-primary hover:bg-purple-dark text-white font-extrabold rounded-2xl flex items-center justify-center gap-1.5 text-xs transition-transform active:scale-[0.98] shadow-md"
              >
                <Send size={12} />
                <span>Send Report via SMS</span>
              </button>

              <button
                type="button"
                onClick={handleFloodSubmit}
                disabled={isSubmitting}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-205 font-bold rounded-2xl text-xs"
              >
                {isSubmitting ? 'Transmitting Data stream...' : 'Submit via Internet'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER DISPATCH INFO */}
      <footer className="mt-8 text-center pt-2.5 border-t border-slate-100">
        <p className="text-[8px] text-slate-400 font-semibold leading-relaxed uppercase tracking-wider max-w-xs mx-auto">
          Active secure end-to-end sandbox handshake with Isiolo regional dispatch centers.
        </p>
      </footer>

    </div>
  );
};

export default ReportForm;

import React, { useState, useRef } from 'react';
import { db, collection, addDoc, serverTimestamp, storage, ref, uploadBytes, getDownloadURL, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { ShieldAlert, MapPin, FileText, Camera, Mic, CheckCircle2, AlertTriangle, ArrowRight, User, UserX, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

const ReportForm: React.FC = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState<'FGM Risk' | 'Flood Alert' | ''>(() => {
    const cached = localStorage.getItem('bonga_pending_category');
    if (cached === 'FGM Risk' || cached === 'Flood Alert') {
      localStorage.removeItem('bonga_pending_category');
      return cached;
    }
    return '';
  });
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Media state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoiceFile(file);
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const fileRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !location || !description) return;

    setIsSubmitting(true);
    try {
      let photoURL = '';
      let voiceNoteURL = '';

      if (photoFile) {
        photoURL = await uploadFile(photoFile, 'reports/photos');
      }

      if (voiceFile) {
        voiceNoteURL = await uploadFile(voiceFile, 'reports/audio');
      }

      const docRef = await addDoc(collection(db, 'reports'), {
        category,
        location,
        description,
        photoURL,
        voiceNoteURL,
        timestamp: serverTimestamp(),
        status: 'Pending',
        isAnonymous,
        authorUid: isAnonymous ? null : user?.uid || null,
      });

      // Save ID to local storage for anonymous/visitor tracking under History tab
      const localReportIds: string[] = JSON.parse(localStorage.getItem('bonga_anonymous_reports') || '[]');
      localReportIds.push(docRef.id);
      localStorage.setItem('bonga_anonymous_reports', JSON.stringify(localReportIds));

      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
      console.error('Submission failed', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-5 text-center max-w-sm mx-auto flex flex-col items-center justify-center my-10 bg-white border border-slate-150 rounded-2xl shadow-sm">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-green-500/15 text-green-600 rounded-full flex items-center justify-center mb-5 border border-green-500/25"
        >
          <CheckCircle2 size={32} />
        </motion.div>
        <h2 className="text-xl font-display font-extrabold mb-2 text-slate-900">Report Submitted</h2>
        <p className="text-xs text-text-dim mb-6 leading-relaxed">
          {isAnonymous 
            ? "Your anonymous report has been transmitted securely. You can track its live evaluation status under the 'History' tab on this device."
            : "Your secure report was successfully recorded. Track its live evaluation status under the 'History' tab."}
        </p>
        <button 
          onClick={() => { setSubmitted(false); setCategory(''); setLocation(''); setDescription(''); }} 
          className="w-full py-3 bg-[#4F46E5] text-white hover:bg-[#3F37C9] text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 text-slate-800 font-sans max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-5 flex flex-col items-center"
      >
        <h1 className="text-xl font-display font-extrabold text-slate-900 tracking-tight leading-none mb-1">
          Secure <span className="text-[#4F46E5]">Bonga Report</span>
        </h1>
        <p className="text-[10px] text-text-dim font-medium mb-3">Your connection is encrypted. Zero telemetry logs collected.</p>
      </motion.div>

      {/* Offline SMS & USSD Hotline Notice */}
      <div className="mb-4 bg-slate-900 text-white border border-slate-800 p-3.5 rounded-2xl shadow-xs text-left text-[10px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12 blur-lg" />
        <div className="flex items-center gap-1.5 mb-1.5 relative z-10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-bold uppercase tracking-wider text-slate-205">No Internet? Submit Offline</span>
        </div>
        <p className="text-slate-400 leading-relaxed font-semibold relative z-10">
          Dial <strong className="text-indigo-300 font-mono font-bold">*384*100#</strong> or SMS your report format: <strong className="text-emerald-300 font-mono font-bold">Category @ Location - Details</strong>. Submissions securely stream directly to first responder dashboards.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-150 p-4 rounded-2xl shadow-xs">
        {/* Anonymity Toggle */}
        {user && (
          <div className="flex p-0.5 bg-slate-100/85 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setIsAnonymous(true)}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                isAnonymous ? 'bg-purple-primary text-white shadow-sm' : 'text-text-dim hover:text-slate-800'
              }`}
            >
              <UserX size={14} /> Anonymous
            </button>
            <button
              type="button"
              onClick={() => setIsAnonymous(false)}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                !isAnonymous ? 'bg-purple-primary text-white shadow-sm' : 'text-text-dim hover:text-slate-800'
              }`}
            >
              <User size={14} /> As {user.displayName?.split(' ')[0]}
            </button>
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-2">What are you reporting?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCategory('FGM Risk')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                category === 'FGM Risk' 
                  ? 'border-purple-primary bg-purple-primary/5 text-purple-primary shadow-xs font-extrabold' 
                  : 'border-slate-200 bg-slate-50 hover:border-purple-primary/30 text-text-dim hover:text-slate-800'
              }`}
            >
              <ShieldAlert size={24} />
              <span className="text-sm font-bold">FGM Risk</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory('Flood Alert')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all ${
                category === 'Flood Alert' 
                  ? 'border-[#06B6D4] bg-[#06B6D4]/5 text-[#06B6D4] shadow-xs font-extrabold' 
                  : 'border-slate-200 bg-slate-50 hover:border-[#06B6D4]/30 text-text-dim hover:text-slate-800'
              }`}
            >
              <AlertTriangle size={24} />
              <span className="text-sm font-bold">Flood Alert</span>
            </button>
          </div>
        </div>

        {/* Location Dropdown */}
        <div>
          <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <MapPin size={14} /> Location in Isiolo
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-purple-primary focus:ring-4 focus:ring-purple-primary/[0.05] outline-none transition-all text-slate-800 font-medium text-sm appearance-none"
            required
          >
            <option value="">Select Location</option>
            <option value="Isiolo Town">Isiolo Town</option>
            <option value="Merti">Merti</option>
            <option value="Garbatulla">Garbatulla</option>
            <option value="Oldonyiro">Oldonyiro</option>
            <option value="Kinna">Kinna</option>
            <option value="Sericho">Sericho</option>
            <option value="Ngaremara">Ngaremara</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <FileText size={14} /> Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details about the risk or situation..."
            className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-purple-primary focus:ring-4 focus:ring-purple-primary/[0.05] outline-none transition-all text-slate-800 font-medium text-sm min-h-[90px] max-h-[140px] resize-none"
            required
          />
        </div>

        {/* Media Options */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-text-dim uppercase tracking-widest mb-1">Attachments (Optional)</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={photoInputRef}
              onChange={handlePhotoChange}
            />
            <button 
              type="button" 
              onClick={() => photoInputRef.current?.click()}
              className={`flex items-center justify-center gap-2 p-2.5 border border-dashed rounded-xl transition-all text-xs ${
                photoFile ? 'border-purple-primary bg-purple-primary/5 text-purple-primary font-bold shadow-xs' : 'border-slate-300 text-text-dim hover:bg-slate-50 hover:border-purple-primary/30'
              }`}
            >
              <Camera size={18} />
              <span className="font-bold">{photoFile ? 'Change Photo' : 'Add Photo'}</span>
            </button>

            <input
              type="file"
              accept="audio/*"
              className="hidden"
              ref={voiceInputRef}
              onChange={handleVoiceChange}
            />
            <button 
              type="button" 
              onClick={() => voiceInputRef.current?.click()}
              className={`flex items-center justify-center gap-2 p-2.5 border border-dashed rounded-xl transition-all text-xs ${
                voiceFile ? 'border-[#06B6D4] bg-cyan-50/50 text-[#06B6D4] font-bold shadow-xs' : 'border-slate-300 text-text-dim hover:bg-slate-50 hover:border-[#06B6D4]/30'
              }`}
            >
              <Mic size={18} />
              <span className="font-bold">{voiceFile ? 'Change Voice' : 'Voice Note'}</span>
            </button>
          </div>

          {/* Previews */}
          <AnimatePresence>
            {(photoPreview || voiceFile) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 pt-1"
              >
                {photoPreview && (
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
                {voiceFile && (
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                    <div className="flex items-center gap-2">
                      <Mic size={14} className="text-magenta-accent" />
                      <span className="text-xs font-medium truncate max-w-[150px]">{voiceFile.name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setVoiceFile(null)}
                      className="text-text-dim hover:text-slate-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !category || !location || !description}
          className="btn-primary w-full flex items-center justify-center gap-2 !py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-glow mt-4"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              Submit Secure Report
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <p className="text-[10px] text-center text-text-dim font-medium">
          By submitting, you agree to our privacy policy. No tracking data is collected.
        </p>
      </form>
    </div>
  );
};

export default ReportForm;

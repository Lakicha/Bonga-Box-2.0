import React, { useState } from 'react';
import { db, collection, addDoc, serverTimestamp, storage, ref, uploadBytes, getDownloadURL } from '../firebase';
import { useAuth } from '../AuthContext';
import { useToast } from './Toast';
import { useMediaHandler } from '../hooks/useMediaHandler';
import { validateReport, validateFile } from '../utils/validation';
import { logError } from '../utils/firebaseErrors';
import { ShieldAlert, MapPin, FileText, Camera, Mic, CheckCircle2, AlertTriangle, ArrowRight, User, UserX, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import ReportSuccessModal from './ReportSuccessModal';

const ReportForm: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { 
    photoFile, 
    voiceFile, 
    photoPreview, 
    photoInputRef, 
    voiceInputRef, 
    handlePhotoChange, 
    handleVoiceChange, 
    clearPhoto, 
    clearVoice,
    clearAll 
  } = useMediaHandler();

  const [category, setCategory] = useState<'FGM Risk' | 'Flood Alert' | ''>('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(Object.values(validation.errors)[0]);
    }

    const fileRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateReport(category, location, description);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      addToast(firstError, 'error');
      return;
    }

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

      await addDoc(collection(db, 'reports'), {
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

      addToast('Report submitted successfully!', 'success');
      setSubmitted(true);
      clearAll();
    } catch (error) {
      logError('ReportForm.handleSubmit', error);
      addToast('Failed to submit report. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <ReportSuccessModal isAnonymous={isAnonymous} onSubmitAnother={() => setSubmitted(false)} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-32 text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 flex flex-col items-center"
      >
        <Logo size={64} className="mb-6" />
        <h1 className="text-4xl font-bold mb-4">Secure <span className="gradient-text">Reporting</span></h1>
        <p className="text-text-dim">Your safety and privacy are our priority. Choose how you want to report.</p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8 card p-8 md:p-12">
        {/* Anonymity Toggle */}
        {user && (
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setIsAnonymous(true)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isAnonymous ? 'bg-purple-primary text-white shadow-glow' : 'text-text-dim hover:text-white'
              }`}
            >
              <UserX size={18} /> Anonymous
            </button>
            <button
              type="button"
              onClick={() => setIsAnonymous(false)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                !isAnonymous ? 'bg-purple-primary text-white shadow-glow' : 'text-text-dim hover:text-white'
              }`}
            >
              <User size={18} /> As {user.displayName?.split(' ')[0]}
            </button>
          </div>
        )}

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-bold text-text-dim uppercase tracking-widest mb-4">What are you reporting?</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setCategory('FGM Risk')}
              className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${
                category === 'FGM Risk' 
                  ? 'border-purple-primary bg-purple-primary/10 text-white shadow-glow' 
                  : 'border-white/5 bg-white/5 hover:border-purple-primary/30 text-text-dim hover:text-white'
              }`}
            >
              <ShieldAlert size={32} />
              <span className="font-bold">FGM Risk</span>
            </button>
            <button
              type="button"
              onClick={() => setCategory('Flood Alert')}
              className={`p-6 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all ${
                category === 'Flood Alert' 
                  ? 'border-magenta-accent bg-magenta-accent/10 text-white shadow-glow' 
                  : 'border-white/5 bg-white/5 hover:border-magenta-accent/30 text-text-dim hover:text-white'
              }`}
            >
              <AlertTriangle size={32} />
              <span className="font-bold">Flood Alert</span>
            </button>
          </div>
        </div>

        {/* Location Dropdown */}
        <div>
          <label className="block text-sm font-bold text-text-dim uppercase tracking-widest mb-4 flex items-center gap-2">
            <MapPin size={16} /> Location in Isiolo
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input-field appearance-none bg-bg-dark"
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
          <label className="block text-sm font-bold text-text-dim uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileText size={16} /> Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide details about the risk or situation..."
            className="input-field min-h-[150px] resize-none"
            required
          />
        </div>

        {/* Media Options */}
        <div className="space-y-4">
          <label className="block text-sm font-bold text-text-dim uppercase tracking-widest mb-2">Attachments (Optional)</label>
          <div className="grid grid-cols-2 gap-4">
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
              className={`flex items-center justify-center gap-3 p-4 border border-dashed rounded-2xl transition-all ${
                photoFile ? 'border-purple-primary bg-purple-primary/10 text-white' : 'border-white/10 text-text-dim hover:bg-white/5 hover:border-purple-primary/30'
              }`}
            >
              <Camera size={24} />
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
              className={`flex items-center justify-center gap-3 p-4 border border-dashed rounded-2xl transition-all ${
                voiceFile ? 'border-magenta-accent bg-magenta-accent/10 text-white' : 'border-white/10 text-text-dim hover:bg-white/5 hover:border-magenta-accent/30'
              }`}
            >
              <Mic size={24} />
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
                className="space-y-3 pt-2"
              >
                {photoPreview && (
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-white/10 shadow-glow group">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={clearPhoto}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                {voiceFile && (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <Mic size={16} className="text-magenta-accent" />
                      <span className="text-xs font-medium truncate max-w-[200px]">{voiceFile.name}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={clearVoice}
                      className="text-text-dim hover:text-white"
                    >
                      <X size={16} />
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
          className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
        >
          {isSubmitting ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              Submit Secure Report
              <ArrowRight size={20} />
            </>
          )}
        </button>

        <p className="text-xs text-center text-text-dim font-medium">
          By submitting, you agree to our privacy policy. No tracking data is collected.
        </p>
      </form>
    </div>
  );
};

export default ReportForm;

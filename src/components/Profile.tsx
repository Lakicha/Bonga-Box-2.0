import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { db, collection, query, where, onSnapshot, orderBy, auth, signOut, updateProfile, ref, uploadBytes, getDownloadURL, storage, doc, updateDoc, handleFirestoreError, OperationType } from '../firebase';
import { Report } from '../types';
import { User, Mail, Shield, MapPin, Calendar, Clock, ChevronRight, AlertCircle, LogOut, Settings, Camera, Loader2, CheckCircle2, FileText, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'settings'>('details');
  
  // Settings state
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setNewDisplayName(user.displayName || '');
      setPhotoPreview(user.photoURL || null);
      setLoading(false);
    }
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
    navigate('/');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    setUpdateMessage(null);

    try {
      let photoURL = user.photoURL || '';

      if (newPhotoFile) {
        const photoRef = ref(storage, `profiles/${user.uid}/${Date.now()}_${newPhotoFile.name}`);
        await uploadBytes(photoRef, newPhotoFile);
        photoURL = await getDownloadURL(photoRef);
      }

      // Update Firebase Auth
      await updateProfile(user, {
        displayName: newDisplayName,
        photoURL: photoURL
      });

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: newDisplayName,
        photoURL: photoURL
      });

      await refreshProfile();

      setUpdateMessage({ type: 'success', text: 'Display updated!' });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error) {
      if (user) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
      console.error('Error:', error);
      setUpdateMessage({ type: 'error', text: 'Failed to update.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="p-5 text-center max-w-sm mx-auto flex flex-col items-center justify-center my-10 bg-white border border-slate-150 rounded-2xl shadow-sm">
        <AlertCircle size={32} className="text-[#4F46E5] mb-2" />
        <h2 className="text-sm font-extrabold text-slate-900 uppercase">Verification Required</h2>
        <p className="text-xs text-text-dim mt-1.5 mb-4 leading-relaxed">
          Accessing your profile dashboard requires authentication. Please sign in.
        </p>
        <Link to="/auth" className="w-full py-2 bg-[#4F46E5] text-white hover:bg-[#3F37C9] text-xs font-bold rounded-xl shadow-sm">
          Login / Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="p-5 text-slate-800 font-sans max-w-md mx-auto">
      {/* Mini Profile Header Avatar Card */}
      <div className="bg-white border border-slate-150 rounded-3xl p-5 mb-5 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-16 bg-linear-to-b from-[#4F46E5]/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col items-center text-center relative z-10 pt-2">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-[#4F46E5] to-[#06B6D4] p-0.5 shadow-sm mb-3">
            <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-150">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={36} className="text-[#4F46E5]/40" />
              )}
            </div>
          </div>
          
          <h2 className="text-base font-display font-extrabold text-slate-950 leading-none mb-1">
            {user.displayName || 'Bonga Ally'}
          </h2>
          <p className="text-[10px] text-text-dim font-medium mb-3">{user.email}</p>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-[#4F46E5] rounded-full border border-indigo-200/50 text-[9px] font-bold uppercase tracking-widest">
            <Shield size={12} />
            <span>{profile?.role || 'County Friend'}</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-0.5 bg-slate-100 rounded-xl mb-4 text-xs font-bold border border-slate-150">
        <button 
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
            activeTab === 'details' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-550 hover:text-slate-950'
          }`}
        >
          Details
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all ${
            activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-550 hover:text-slate-950'
          }`}
        >
          Settings
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'details' ? (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="space-y-3"
          >
            {/* Account Info list */}
            <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs space-y-3 text-xs font-semibold text-slate-700">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                <span className="text-text-dim uppercase tracking-wider text-[9px]">Account Created</span>
                <span className="text-slate-950 font-bold">
                  {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-50">
                <span className="text-text-dim uppercase tracking-wider text-[9px]">School Code / ID</span>
                <span className="text-[#4F46E5] font-bold">
                  {profile?.schoolId || 'Local Access'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-dim uppercase tracking-wider text-[9px]">Anonymity proxy</span>
                <span className="text-green-600 font-bold uppercase text-[10px]">Active Routing</span>
              </div>
            </div>

            {/* If Operator has admin/officer access options */}
            {profile && profile.role !== 'User' && (
              <div className="bg-slate-50 border-2 border-indigo-200/50 rounded-2xl p-4 shadow-xs">
                <h4 className="font-display font-extrabold text-xs text-indigo-950 uppercase tracking-widest mb-1">
                  County Administration Office
                </h4>
                <p className="text-[10px] text-slate-600 mb-3 font-medium">
                  Your designated authorization role allows view, edit, action and dispatch metrics on safety reports.
                </p>
                
                <div className="space-y-2">
                  {(profile.role === 'Admin' || profile.role === 'Mentor/Teacher') && (
                    <button 
                      onClick={() => navigate('/school-dashboard')}
                      className="w-full flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 hover:border-slate-350"
                    >
                      <span className="flex items-center gap-1.5"><LayoutDashboard size={14} className="text-[#4F46E5]" /> School Club Board</span>
                      <ChevronRight size={14} />
                    </button>
                  )}

                  {(profile.role === 'Admin' || profile.role === 'Protection Officer') && (
                    <button 
                      onClick={() => navigate('/protection-dashboard')}
                      className="w-full flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 hover:border-slate-350"
                    >
                      <span className="flex items-center gap-1.5"><LayoutDashboard size={14} className="text-indigo-650" /> Protection Desk</span>
                      <ChevronRight size={14} />
                    </button>
                  )}

                  {(profile.role === 'Admin' || profile.role === 'Disaster Management Officer') && (
                    <button 
                      onClick={() => navigate('/disaster-dashboard')}
                      className="w-full flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 hover:border-slate-350"
                    >
                      <span className="flex items-center gap-1.5"><LayoutDashboard size={14} className="text-cyan-650" /> Disaster Dispatch</span>
                      <ChevronRight size={14} />
                    </button>
                  )}

                  {profile.role === 'Admin' && (
                    <button 
                      onClick={() => navigate('/admin-dashboard')}
                      className="w-full flex justify-between items-center p-2.5 bg-[#4F46E5] text-white border border-transparent rounded-xl font-bold text-xs hover:bg-[#3F37C9]"
                    >
                      <span className="flex items-center gap-1.5"><LayoutDashboard size={14} /> County Admin Room</span>
                      <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Logout button */}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-650 hover:bg-red-100 font-bold transition-all border border-red-200/55 rounded-xl uppercase tracking-widest text-[10px]"
            >
              <LogOut size={14} /> Close Account Session
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs"
          >
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Photo upload view */}
              <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-slate-400" />
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1 bg-[#4F46E5] text-white rounded-full border border-white"
                  >
                    <Camera size={10} />
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-none">Avatar Photo</h4>
                  <p className="text-[9px] text-text-dim mt-1 font-medium">JPEG, PNG. Max 1MB.</p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              {/* Form Input name */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider pl-1">Display Name</label>
                <input 
                  type="text" 
                  value={newDisplayName} 
                  onChange={(e) => setNewDisplayName(e.target.value)} 
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200 focus:border-[#4F46E5] outline-none"
                  placeholder="Enter name"
                  required
                />
              </div>

              {/* Email disabled */}
              <div className="space-y-1 opacity-60">
                <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider pl-1">Email Address (Registered)</label>
                <input 
                  type="email" 
                  value={user.email || ''} 
                  disabled 
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 border border-slate-200 cursor-not-allowed"
                />
              </div>

              {/* Response banner message */}
              {updateMessage && (
                <div className={`p-2 rounded-xl text-[10px] font-bold flex items-center gap-1 border ${
                  updateMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <CheckCircle2 size={12} />
                  <span>{updateMessage.text}</span>
                </div>
              )}

              {/* Controls save */}
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="w-full py-2.5 bg-[#4F46E5] text-white hover:bg-[#3F37C9] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  {isUpdating ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;

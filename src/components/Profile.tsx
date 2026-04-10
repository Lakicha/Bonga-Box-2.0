import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../AuthContext';
import { db, collection, query, where, onSnapshot, orderBy, auth, signOut, updateProfile, ref, uploadBytes, getDownloadURL, storage, doc, updateDoc } from '../firebase';
import { Report } from '../types';
import { User, Mail, Shield, MapPin, Calendar, Clock, ChevronRight, AlertCircle, LogOut, Settings, Camera, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'settings'>('reports');
  
  // Settings state
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || '');
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user?.photoURL || null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reports'), 
      where('authorUid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMyReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching reports:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => signOut(auth);

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

      setUpdateMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setUpdateMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profile Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card p-8 text-center relative overflow-hidden border-white/5">
            <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-br from-purple-primary/10 to-magenta-accent/10 blur-xl" />
            <div className="relative z-10">
              <div className="w-32 h-32 rounded-full bg-linear-to-br from-purple-primary to-magenta-accent mx-auto mb-6 p-1 shadow-glow overflow-hidden">
                <div className="w-full h-full rounded-full bg-bg-dark flex items-center justify-center overflow-hidden border border-white/10">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={64} className="text-purple-primary/50" />
                  )}
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2 tracking-tight">{user.displayName}</h2>
              <div className="flex items-center justify-center gap-2 text-text-dim mb-6">
                <Mail size={16} className="text-purple-primary/50" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-purple-primary/10 text-purple-primary rounded-full border border-purple-primary/20 shadow-glow">
                <Shield size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{profile?.role || 'User'}</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 space-y-6 border-white/5">
            <h3 className="text-xl font-bold border-b border-white/5 pb-4 tracking-tight">Account Details</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-dim text-xs font-bold uppercase tracking-widest">Member Since</span>
                <span className="font-bold text-sm">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-dim text-xs font-bold uppercase tracking-widest">School/Club</span>
                <span className="font-bold text-sm text-purple-primary">{profile?.schoolId || 'Not Assigned'}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 py-4 mt-6 text-red-400 hover:text-white hover:bg-red-500/20 font-bold transition-all border border-red-400/20 rounded-2xl bg-red-400/5 uppercase tracking-widest text-xs"
              >
                <LogOut size={18} /> Logout Account
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 w-fit">
            <button 
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'reports' ? 'bg-purple-primary text-white shadow-glow' : 'text-text-dim hover:text-white'
              }`}
            >
              <FileText size={16} /> My Reports
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'settings' ? 'bg-purple-primary text-white shadow-glow' : 'text-text-dim hover:text-white'
              }`}
            >
              <Settings size={16} /> Profile Settings
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'reports' ? (
              <motion.div
                key="reports"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold tracking-tight">My <span className="gradient-text">Reports</span></h2>
                  <span className="px-5 py-1.5 bg-white/5 rounded-full text-[10px] font-bold text-text-dim border border-white/10 uppercase tracking-widest">
                    {myReports.length} Total Reports
                  </span>
                </div>

                {loading ? (
                  <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-purple-primary/10 border-t-purple-primary rounded-full animate-spin shadow-glow" />
                  </div>
                ) : myReports.length === 0 ? (
                  <div className="glass-card p-20 text-center border-dashed border-white/10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-glow">
                      <AlertCircle size={40} className="text-text-dim opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 tracking-tight">No reports yet</h3>
                    <p className="text-text-dim mb-10 max-w-sm mx-auto">You haven't submitted any reports with your account yet. Your voice matters.</p>
                    <Link to="/report" className="btn-primary !py-4 !px-12 shadow-glow">Submit a Report</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myReports.map((report) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-purple-primary/30 transition-all group border-white/5"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              report.category === 'FGM Risk' ? 'bg-magenta-accent/10 text-magenta-accent' : 'bg-purple-primary/10 text-purple-primary'
                            }`}>
                              {report.category}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                report.status === 'Pending' ? 'bg-yellow-accent animate-pulse' :
                                report.status === 'In Progress' ? 'bg-purple-primary' : 'bg-green-500'
                              }`} />
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                report.status === 'Pending' ? 'text-yellow-accent' :
                                report.status === 'In Progress' ? 'text-purple-primary' : 'text-green-500'
                              }`}>
                                {report.status}
                              </span>
                            </div>
                          </div>
                          <h4 className="text-xl font-bold group-hover:text-purple-primary transition-colors tracking-tight">{report.location}</h4>
                          <div className="flex items-center gap-6 text-[10px] text-text-dim font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-purple-primary/50" />
                              {report.timestamp?.toDate ? new Date(report.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-purple-primary/50" />
                              {report.timestamp?.toDate ? new Date(report.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        </div>
                        <button className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center hover:bg-purple-primary transition-all group-hover:shadow-glow border border-white/5">
                          <ChevronRight size={20} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-bold tracking-tight">Profile <span className="gradient-text">Settings</span></h2>
                </div>

                <div className="glass-card p-10 border-white/5">
                  <form onSubmit={handleUpdateProfile} className="space-y-10">
                    {/* Photo Upload */}
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative group">
                        <div className="w-40 h-40 rounded-full bg-linear-to-br from-purple-primary to-magenta-accent p-1 shadow-glow overflow-hidden">
                          <div className="w-full h-full rounded-full bg-bg-dark flex items-center justify-center overflow-hidden border border-white/10">
                            {photoPreview ? (
                              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={80} className="text-purple-primary/50" />
                            )}
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-2 right-2 w-12 h-12 bg-purple-primary rounded-full flex items-center justify-center border-4 border-bg-dark shadow-glow hover:scale-110 transition-transform"
                        >
                          <Camera size={20} />
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handlePhotoChange} 
                          className="hidden" 
                          accept="image/*"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white mb-1">Profile Photo</p>
                        <p className="text-[10px] text-text-dim uppercase tracking-widest">JPG, PNG or GIF. Max 2MB.</p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Display Name</label>
                        <div className="relative group">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-primary/50 group-focus-within:text-purple-primary transition-colors" size={20} />
                          <input 
                            type="text"
                            value={newDisplayName}
                            onChange={(e) => setNewDisplayName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-purple-primary/50 focus:bg-white/10 transition-all font-medium"
                            placeholder="Enter your name"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-3 opacity-50 cursor-not-allowed">
                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-widest ml-1">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim" size={20} />
                          <input 
                            type="email"
                            value={user.email || ''}
                            disabled
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 font-medium cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    {updateMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl flex items-center gap-3 border ${
                          updateMessage.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}
                      >
                        {updateMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="text-sm font-bold">{updateMessage.text}</span>
                      </motion.div>
                    )}

                    {/* Submit */}
                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit"
                        disabled={isUpdating}
                        className="btn-primary !py-4 !px-12 flex items-center gap-3 min-w-[200px] justify-center shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={20} />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;

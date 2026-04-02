import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { db, collection, query, where, onSnapshot, orderBy } from '../firebase';
import { Report } from '../types';
import { User, Mail, Shield, MapPin, Calendar, Clock, ChevronRight, AlertCircle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, signOut } from '../firebase';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, profile } = useAuth();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

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

        {/* My Reports */}
        <div className="lg:col-span-2 space-y-8">
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
        </div>
      </div>
    </div>
  );
};

export default Profile;

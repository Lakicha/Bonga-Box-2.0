import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, where, updateDoc, doc } from '../firebase';
import { Report } from '../types';
import { useAuth } from '../AuthContext';
import { ClipboardList, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';

const SchoolDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<string>('All');

  useEffect(() => {
    if (!profile?.schoolId) return;

    const q = query(collection(db, 'reports'), where('schoolId', '==', profile.schoolId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
    });

    return () => unsubscribe();
  }, [profile]);

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: newStatus });
    } catch (error) {
      console.error('Update failed', error);
    }
  };

  const filteredReports = filter === 'All' ? reports : reports.filter(r => r.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex items-center gap-6">
          <Logo size={64} />
          <div>
            <h1 className="text-4xl font-bold mb-2">School Club <span className="gradient-text">Dashboard</span></h1>
            <p className="text-text-dim">Manage reports and track cases for {profile?.schoolId || 'your school'}.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 glass-card !p-2 !pr-6">
          <div className="w-12 h-12 bg-purple-primary/10 rounded-2xl flex items-center justify-center text-purple-primary border border-purple-primary/20 shadow-glow">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">School ID</p>
            <p className="font-bold text-sm">{profile?.schoolId || 'Isiolo Girls High'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
        {[
          { icon: Clock, label: "Pending Cases", value: reports.filter(r => r.status === 'Pending').length, color: "border-yellow-accent", bg: "bg-yellow-accent/10", text: "text-yellow-accent" },
          { icon: AlertCircle, label: "In Progress", value: reports.filter(r => r.status === 'In Progress').length, color: "border-purple-primary", bg: "bg-purple-primary/10", text: "text-purple-primary" },
          { icon: CheckCircle, label: "Resolved Cases", value: reports.filter(r => r.status === 'Resolved').length, color: "border-green-500", bg: "bg-green-500/10", text: "text-green-500" }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`glass-card p-8 border-l-[6px] ${stat.color} transition-all duration-300 cursor-default`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 ${stat.bg} ${stat.text} rounded-2xl flex items-center justify-center border border-white/5 shadow-glow`}>
                <stat.icon size={28} />
              </div>
              <span className="text-4xl font-bold tracking-tighter">{stat.value}</span>
            </div>
            <p className="text-xs font-bold text-text-dim uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-6 mb-10 overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex items-center gap-3 text-text-dim shrink-0">
          <Filter size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Filter Status:</span>
        </div>
        <div className="flex gap-3">
          {['All', 'Pending', 'In Progress', 'Resolved'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-8 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 uppercase tracking-widest ${
                filter === f 
                  ? 'bg-purple-primary text-white shadow-glow' 
                  : 'bg-white/5 text-text-dim border border-white/10 hover:border-purple-primary/30'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold text-text-dim uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-[10px] font-bold text-text-dim uppercase tracking-widest">Location</th>
                <th className="px-8 py-5 text-[10px] font-bold text-text-dim uppercase tracking-widest">Description</th>
                <th className="px-8 py-5 text-[10px] font-bold text-text-dim uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-text-dim uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-text-dim font-medium italic">
                    No reports found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        report.category === 'FGM Risk' ? 'bg-magenta-accent/10 text-magenta-accent' : 'bg-purple-primary/10 text-purple-primary'
                      }`}>
                        {report.category}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-white group-hover:text-purple-primary transition-colors">{report.location}</td>
                    <td className="px-8 py-6 text-sm text-text-dim max-w-xs truncate">{report.description}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
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
                    </td>
                    <td className="px-8 py-6">
                      <select
                        value={report.status}
                        onChange={(e) => updateStatus(report.id!, e.target.value)}
                        className="text-[10px] font-bold bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-purple-primary focus:outline-none cursor-pointer hover:bg-white/10 transition-all uppercase tracking-widest"
                      >
                        <option value="Pending" className="bg-bg-dark">Pending</option>
                        <option value="In Progress" className="bg-bg-dark">In Progress</option>
                        <option value="Resolved" className="bg-bg-dark">Resolved</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchoolDashboard;

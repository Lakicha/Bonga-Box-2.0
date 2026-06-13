import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, where, updateDoc, doc, handleFirestoreError, OperationType } from '../firebase';
import { Report } from '../types';
import { useAuth } from '../AuthContext';
import { ClipboardList, CheckCircle, Clock, AlertCircle, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import Logo from './Logo';
import { SkeletonDashboardScreen } from './SkeletonLoader';

const SchoolDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!profile?.schoolId) return;

    const q = query(collection(db, 'reports'), where('schoolId', '==', profile.schoolId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const updateStatus = async (reportId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
      console.error('Update failed', error);
    }
  };

  const filteredReports = filter === 'All' ? reports : reports.filter(r => r.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Logo size={64} />
          <div>
            <h1 className="text-2xl font-bold mb-1">School Club <span className="gradient-text">Dashboard</span></h1>
            <p className="text-xs text-text-dim">Manage reports and track cases for {profile?.schoolId || 'your school'}.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2 pr-4 shadow-sm">
          <div className="w-8 h-8 bg-purple-primary/10 rounded-lg flex items-center justify-center text-purple-primary border border-purple-primary/20 shadow-xs">
            <ClipboardList size={16} />
          </div>
          <div>
            <p className="text-xxs font-bold text-text-dim uppercase tracking-widest leading-none mb-0.5">School ID</p>
            <p className="font-bold text-xs">{profile?.schoolId || 'Isiolo Girls High'}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <SkeletonDashboardScreen listCount={5} showStats={true} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Clock, label: "Pending Cases", value: reports.filter(r => r.status === 'Pending').length, color: "border-yellow-500", bg: "bg-yellow-50 text-yellow-600", border: "border-yellow-250/50" },
              { icon: AlertCircle, label: "In Progress", value: reports.filter(r => r.status === 'In Progress').length, color: "border-purple-primary", bg: "bg-purple-50 text-purple-primary", border: "border-purple-200/50" },
              { icon: CheckCircle, label: "Resolved Cases", value: reports.filter(r => r.status === 'Resolved').length, color: "border-green-500", bg: "bg-green-50 text-green-600", border: "border-green-200/50" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -2, scale: 1.01 }}
                className={`bg-white p-4 rounded-2xl border-l-[4px] ${stat.color} border border-slate-200/60 shadow-xs flex items-center justify-between transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center border ${stat.border} shadow-xs`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-xs font-bold text-text-dim uppercase tracking-widest">{stat.label}</p>
                </div>
                <span className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</span>
              </motion.div>
            ))}
          </div>

          {/* Filter and Content Card container */}
          <div className="bg-white border border-slate-100 rounded-[20px] shadow-xs p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 flex-wrap gap-2 font-sans">
              <div className="flex items-center gap-2 text-text-dim">
                <Filter size={16} />
                <span className="text-xxs font-bold uppercase tracking-widest">Filter Status:</span>
              </div>
              <div className="flex gap-1.5">
                {['All', 'Pending', 'In Progress', 'Resolved'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1 rounded-lg text-xxs font-bold transition-all uppercase tracking-widest ${
                      filter === f 
                        ? 'bg-purple-primary text-white shadow-xs' 
                        : 'bg-slate-50 text-text-dim border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable table container */}
            <div className="overflow-x-auto overflow-y-auto max-h-[350px]">
              <table className="w-full text-left border-collapse font-sans">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2.5 text-xxs font-bold text-text-dim uppercase tracking-widest">Category</th>
                    <th className="px-4 py-2.5 text-xxs font-bold text-text-dim uppercase tracking-widest">Location</th>
                    <th className="px-4 py-2.5 text-xxs font-bold text-text-dim uppercase tracking-widest">Description</th>
                    <th className="px-4 py-2.5 text-xxs font-bold text-text-dim uppercase tracking-widest">Status</th>
                    <th className="px-4 py-2.5 text-xxs font-bold text-text-dim uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-text-dim text-xs font-semibold italic">
                        No reports found matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xxs font-bold uppercase tracking-widest ${
                            report.category === 'FGM Risk' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-purple-100 text-purple-primary border border-purple-250'
                          }`}>
                            {report.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800 group-hover:text-purple-primary transition-colors">{report.location}</td>
                        <td className="px-4 py-3 text-xs text-text-dim max-w-xs truncate">{report.description}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              report.status === 'Pending' ? 'bg-yellow-500 animate-pulse' :
                              report.status === 'In Progress' ? 'bg-purple-primary' : 'bg-green-500'
                            }`} />
                            <span className={`text-xxs font-bold uppercase tracking-widest ${
                              report.status === 'Pending' ? 'text-yellow-600' :
                              report.status === 'In Progress' ? 'text-purple-primary' : 'text-green-600'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={report.status}
                            onChange={(e) => updateStatus(report.id!, e.target.value)}
                            className="text-xxs font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer hover:bg-slate-100 transition-all uppercase tracking-widest"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SchoolDashboard;

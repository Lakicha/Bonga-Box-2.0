import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { Report } from '../types';
import { useAuth } from '../AuthContext';
import { Shield, CheckCircle, Clock, AlertCircle, Filter, Eye, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { SecureEvidenceViewer } from './SecureEvidenceViewer';
import { SkeletonDashboardScreen } from './SkeletonLoader';

const ProtectionDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Protection Officer deals with FGM Risks primarily
    const q = query(collection(db, 'reports'), where('category', '==', 'FGM Risk'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (reportId: string, newStatus: Report['status']) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'Resolved') {
        updateData.resolvedAt = serverTimestamp();
      }
      await updateDoc(doc(db, 'reports', reportId), updateData);
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, ...updateData } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
      console.error('Update status failed:', error);
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
            <h1 className="text-2xl font-bold mb-1">Protection <span className="gradient-text">Dashboard</span></h1>
            <p className="text-xs text-text-dim">Case management system for FGM and Child Protection cases.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2 pr-4 shadow-sm">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 border border-indigo-250/30 shadow-xs">
            <Shield size={16} />
          </div>
          <div>
            <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest leading-none mb-0.5">Operator Role</p>
            <p className="font-bold text-xs">Protection Officer</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <SkeletonDashboardScreen />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Clock, label: "Pending Issues", value: reports.filter(r => r.status === 'Pending').length, color: "border-yellow-500", bg: "bg-yellow-50 text-yellow-600", border: "border-yellow-250/40" },
              { icon: AlertCircle, label: "Active Safe-keeping", value: reports.filter(r => r.status === 'In Progress').length, color: "border-purple-primary", bg: "bg-purple-50 text-purple-primary", border: "border-purple-200/50" },
              { icon: CheckCircle, label: "Resolved Protections", value: reports.filter(r => r.status === 'Resolved').length, color: "border-green-500", bg: "bg-green-50 text-green-600", border: "border-green-200/40" }
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

          {/* Main Layout containing list and preview details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column: filtered list of cases - 7 cols */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-text-dim">
                  <Filter size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Filter FGM Cases:</span>
                </div>
                <div className="flex gap-1.5">
                  {['All', 'Pending', 'In Progress', 'Resolved'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-bold transition-all uppercase tracking-widest ${
                        filter === f 
                          ? 'bg-purple-primary text-white shadow-xs' 
                          : 'bg-white text-text-dim border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cases List with set scroll height */}
              <div className="overflow-y-auto max-h-[400px] pr-1 space-y-3">
                {filteredReports.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border-dashed border-slate-200 border-2">
                    <Shield size={36} className="mx-auto mb-2 text-text-dim opacity-40 animate-pulse" />
                    <p className="text-text-dim text-xs font-semibold italic">No FGM protection reports found.</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <motion.div
                      key={report.id}
                      whileHover={{ scale: 1.005 }}
                      onClick={() => setSelectedReport(report)}
                      className={`bg-white rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border cursor-pointer transition-all shadow-xs ${
                        selectedReport?.id === report.id ? 'border-purple-primary ring-2 ring-purple-primary/5 bg-purple-50/10' : 'border-slate-200/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1 w-full sm:w-auto">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200/50 rounded-full text-[8.5px] font-bold uppercase tracking-widest">
                            {report.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              report.status === 'Pending' ? 'bg-yellow-500 animate-pulse' :
                              report.status === 'In Progress' ? 'bg-purple-primary' : 'bg-green-500'
                            }`} />
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${
                              report.status === 'Pending' ? 'text-yellow-600' :
                              report.status === 'In Progress' ? 'text-purple-primary' : 'text-green-600'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight">{report.location}</h4>
                        <p className="text-xs text-text-dim truncate max-w-sm">{report.description}</p>
                      </div>
                      <button className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3.5 rounded-xl text-[10px] font-bold hover:bg-slate-100 transition-all flex items-center gap-1 w-full sm:w-auto justify-center uppercase tracking-wider shrink-0">
                        <Eye size={12} /> Handle
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Case Preview Sidebar - 5 cols */}
            <div className="lg:col-span-5">
              <AnimatePresence mode="wait">
                {selectedReport ? (
                  <motion.div
                    key={selectedReport.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-bold text-slate-800">Case Overview</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        selectedReport.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border border-yellow-250/50' :
                        selectedReport.status === 'In Progress' ? 'bg-purple-50 text-purple-primary border border-purple-200/50' : 'bg-green-50 text-green-600 border border-green-250/50'
                      }`}>
                        {selectedReport.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Location</span>
                        <p className="font-bold text-xs text-slate-900">{selectedReport.location}</p>
                      </div>
                      <div>
                        <span className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Time submitted</span>
                        <p className="text-[11px] text-text-dim">
                          {selectedReport.timestamp?.toDate ? new Date(selectedReport.timestamp.toDate()).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Incident Description</span>
                        <p className="text-xs text-text-dim leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-150 max-h-[140px] overflow-y-auto">
                          {selectedReport.description}
                        </p>
                      </div>

                      {selectedReport.photoURL && (
                        <div className="space-y-1">
                          <span className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Confidential Evidence File</span>
                          <SecureEvidenceViewer 
                            photoURL={selectedReport.photoURL} 
                            category={selectedReport.category}
                            caseId={selectedReport.id}
                          />
                        </div>
                      )}

                      {selectedReport.voiceNoteURL && (
                        <div>
                          <span className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block mb-1">Attached Voice Note</span>
                          <audio src={selectedReport.voiceNoteURL} controls className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-1 text-slate-800" />
                        </div>
                      )}
                    </div>

                    {/* Status Update Dropdown */}
                    <div className="pt-3 border-t border-slate-100 space-y-1.5 animate-pulse-once">
                      <label className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Update Case Action</label>
                      <select
                        value={selectedReport.status}
                        onChange={(e) => updateStatus(selectedReport.id!, e.target.value as Report['status'])}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-purple-primary focus:outline-none focus:border-purple-primary transition-all cursor-pointer"
                      >
                        <option value="Pending">Pending Action</option>
                        <option value="In Progress">Mark In Progress</option>
                        <option value="Resolved">Mark as Resolved</option>
                      </select>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-2xl p-6 text-center border-dashed border-slate-200 border-2 flex flex-col justify-center items-center py-16">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200 shadow-xs">
                      <FileText size={20} className="text-text-dim opacity-40 animate-pulse" />
                    </div>
                    <h4 className="font-bold text-sm mb-1 text-slate-800">Select a Case</h4>
                    <p className="text-text-dim text-xs leading-relaxed max-w-[200px]">
                      Pick an incident from the list to view media attachments and take administrative resolution actions.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProtectionDashboard;

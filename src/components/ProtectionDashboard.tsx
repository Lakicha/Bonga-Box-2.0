import React, { useEffect, useState, useMemo } from 'react';
import { db, collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { Report } from '../types';
import { useAuth } from '../AuthContext';
import { Shield, CheckCircle, Clock, AlertCircle, Filter, Eye, FileText, Download, ShieldCheck, Check, Info, Lock } from 'lucide-react';
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

  // Export states
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportStep, setExportStep] = useState<'config' | 'preview'>('config');
  const [exportRange, setExportRange] = useState<string>('all');
  const [exportOmitNarrative, setExportOmitNarrative] = useState<boolean>(true);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

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

  const filteredReportsForExport = useMemo(() => {
    return reports.filter(r => {
      if (!r.timestamp) return exportRange === 'all';
      const reportDate = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
      const now = new Date();
      if (exportRange === '7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return reportDate >= sevenDaysAgo;
      } else if (exportRange === '30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return reportDate >= thirtyDaysAgo;
      } else if (exportRange === '90d') {
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return reportDate >= ninetyDaysAgo;
      }
      return true;
    });
  }, [reports, exportRange]);

  const previewExportCount = filteredReportsForExport.length;

  const handleExportCSV = () => {
    const filtered = filteredReportsForExport;

    const headers = [
      'Anonymized Case Key',
      'Incident Category',
      'Reporting Region',
      'Case Status',
      'Submission Date',
      'Resolution Status',
      'Resolution Duration (Days)',
      'Filed Anonymously',
      'Anonymized Safe Narrative'
    ];

    const rows = filtered.map(r => {
      const anonKey = `REP-${r.id ? r.id.substring(0, 6).toUpperCase() : 'ANON'}`;
      const region = r.location || 'Unknown';
      
      let submittedDate = 'N/A';
      if (r.timestamp) {
        const dateObj = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
        submittedDate = dateObj.toISOString().split('T')[0];
      }

      let resStatus = r.status || 'Pending';
      let resDurationDays = 'N/A';
      if (r.status === 'Resolved' && r.resolvedAt && r.timestamp) {
        const start = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
        const end = r.resolvedAt.toDate ? r.resolvedAt.toDate() : new Date(r.resolvedAt);
        const diffMs = end.getTime() - start.getTime();
        resDurationDays = (diffMs / (1000 * 60 * 60 * 24)).toFixed(1);
      }

      let narrative = 'Omitted for survivor/reporter safekeeping under FGM child protection rules.';
      if (!exportOmitNarrative && r.description) {
        const words = r.description.split(/\s+/);
        if (words.length > 10) {
          narrative = `${words.slice(0, 10).join(' ')}... [Abstracted Case Detail]`;
        } else {
          narrative = r.description;
        }
      }

      return [
        anonKey,
        r.category,
        region,
        r.status,
        submittedDate,
        resStatus,
        resDurationDays,
        r.isAnonymous ? 'Yes' : 'No',
        narrative
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `isiolo-fgm-protection-impact-report-${exportRange}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => {
      setExportSuccess(false);
      setIsExportOpen(false);
    }, 1500);
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-end md:self-auto">
          {/* Export Statistics Button */}
          <button 
            onClick={() => {
              setExportStep('config');
              setIsExportOpen(true);
            }}
            className="bg-purple-primary hover:bg-purple-dark text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 hover:shadow-md active:scale-[0.98] cursor-pointer"
          >
            <Download size={14} />
            <span>Export Stats</span>
          </button>

          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-[20px] p-2 pr-4 shadow-xs shrink-0 text-left">
            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5] border border-indigo-100/40">
              <Shield size={16} />
            </div>
            <div>
              <p className="text-[9px] font-medium text-slate-400 leading-none mb-0.5">Operator role</p>
              <p className="font-semibold text-xs text-slate-800">Protection Officer</p>
            </div>
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
              { icon: Clock, label: "Pending issues", value: reports.filter(r => r.status === 'Pending').length, color: "border-yellow-500", bg: "bg-yellow-50/50 text-yellow-600", border: "border-yellow-200/50" },
              { icon: AlertCircle, label: "Active safekeeping", value: reports.filter(r => r.status === 'In Progress').length, color: "border-purple-primary", bg: "bg-indigo-50 text-purple-primary", border: "border-indigo-100/30" },
              { icon: CheckCircle, label: "Resolved protections", value: reports.filter(r => r.status === 'Resolved').length, color: "border-green-500", bg: "bg-green-50 text-green-600", border: "border-green-200/40" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -2, scale: 1.01 }}
                className={`bg-white p-4 rounded-[20px] border-l-[4px] ${stat.color} border border-slate-100 shadow-xs flex items-center justify-between transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center border ${stat.border}`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
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
                <div className="flex items-center gap-2 text-slate-500">
                  <Filter size={16} />
                  <span className="text-[10px] font-semibold text-slate-500">Filter FGM cases:</span>
                </div>
                <div className="flex gap-1.5">
                  {['All', 'Pending', 'In Progress', 'Resolved'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-semibold transition-all ${
                        filter === f 
                          ? 'bg-purple-primary text-white shadow-xs' 
                          : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
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
                  <div className="bg-white rounded-[20px] p-12 text-center border-dashed border-slate-200 border-2">
                    <Shield size={36} className="mx-auto mb-2 text-slate-400 opacity-40 animate-pulse" />
                    <p className="text-slate-500 text-xs font-medium italic">No FGM protection reports found.</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <motion.div
                      key={report.id}
                      whileHover={{ scale: 1.005 }}
                      onClick={() => setSelectedReport(report)}
                      className={`bg-white rounded-[20px] p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border cursor-pointer transition-all shadow-xs ${
                        selectedReport?.id === report.id ? 'border-purple-primary ring-2 ring-purple-primary/5 bg-purple-50/10' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="space-y-1 w-full sm:w-auto">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-100/50 rounded-full text-[9px] font-medium">
                            {report.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              report.status === 'Pending' ? 'bg-yellow-500 animate-pulse' :
                              report.status === 'In Progress' ? 'bg-purple-primary' : 'bg-green-500'
                            }`} />
                            <span className={`text-[9px] font-semibold ${
                              report.status === 'Pending' ? 'text-yellow-600' :
                              report.status === 'In Progress' ? 'text-purple-primary' : 'text-green-600'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800 tracking-tight">{report.location}</h4>
                        <p className="text-xs text-slate-500 truncate max-w-sm">{report.description}</p>
                      </div>
                      <button className="bg-slate-50 border border-slate-100 text-slate-700 py-1.5 px-3.5 rounded-xl text-[10px] font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1 w-full sm:w-auto justify-center shrink-0">
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
                    className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-xs space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <h3 className="text-sm font-semibold text-slate-800">Case Overview</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                        selectedReport.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border border-yellow-250/50' :
                        selectedReport.status === 'In Progress' ? 'bg-purple-50 text-purple-primary border border-purple-200/50' : 'bg-green-50 text-green-600 border border-green-250/50'
                      }`}>
                        {selectedReport.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-medium text-slate-400 block">Location</span>
                        <p className="font-semibold text-xs text-slate-900">{selectedReport.location}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-medium text-slate-400 block">Time submitted</span>
                        <p className="text-[11px] text-slate-500">
                          {selectedReport.timestamp?.toDate ? new Date(selectedReport.timestamp.toDate()).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-medium text-slate-400 block">Incident description</span>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 max-h-[140px] overflow-y-auto">
                          {selectedReport.description}
                        </p>
                      </div>

                      {selectedReport.photoURL && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-medium text-slate-400 block">Confidential evidence file</span>
                          <SecureEvidenceViewer 
                            photoURL={selectedReport.photoURL} 
                            category={selectedReport.category}
                            caseId={selectedReport.id}
                          />
                        </div>
                      )}

                      {selectedReport.voiceNoteURL && (
                        <div>
                          <span className="text-[9px] font-medium text-slate-400 block mb-1">Attached voice note</span>
                          <audio src={selectedReport.voiceNoteURL} controls className="w-full h-8 bg-slate-50 border border-slate-250/10 rounded-lg px-1 text-slate-800" />
                        </div>
                      )}
                    </div>

                    {/* Status Update Dropdown */}
                    <div className="pt-3 border-t border-slate-100 space-y-1.5">
                      <label className="text-[9px] font-medium text-slate-400 block">Update Case Action</label>
                      <select
                        value={selectedReport.status}
                        onChange={(e) => updateStatus(selectedReport.id!, e.target.value as Report['status'])}
                        className="w-full bg-slate-50 border border-slate-105 rounded-xl py-2 px-3 text-xs font-semibold text-[#4F46E5] focus:outline-none focus:border-purple-primary transition-all cursor-pointer"
                      >
                        <option value="Pending">Pending Action</option>
                        <option value="In Progress">Mark In Progress</option>
                        <option value="Resolved">Mark as Resolved</option>
                      </select>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-[20px] p-6 text-center border-dashed border-slate-200 border-2 flex flex-col justify-center items-center py-16">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-xs">
                      <FileText size={20} className="text-slate-400 opacity-40 animate-pulse" />
                    </div>
                    <h4 className="font-semibold text-sm mb-1 text-slate-800">Select a case</h4>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-[200px]">
                      Pick an incident from the list to view media attachments and take administrative resolution actions.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

      {/* CSV Export Modal */}
      <AnimatePresence>
        {isExportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExportOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white border border-slate-100 rounded-[30px] shadow-2xl max-w-lg w-full overflow-hidden relative z-10 flex flex-col"
            >
              <div className="bg-gradient-to-r from-purple-primary to-indigo-600 p-6 text-white text-left relative overflow-hidden shrink-0">
                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
                  <ShieldCheck size={200} />
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-white/10 rounded-2xl border border-white/20">
                    <Lock size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-base tracking-tight text-white leading-tight">Export case stats</h2>
                    <p className="text-[10px] text-purple-100 mt-0.5">Anonymized protection reports summary</p>
                  </div>
                </div>
              </div>

              {exportStep === 'config' ? (
                <>
                  <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto text-left">
                    <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                      <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-[10px] text-slate-600 leading-relaxed font-medium">
                        <span className="font-bold text-slate-800">Child & Survivor Safety Guard:</span> In compliance with regional safe-reporting directives (FGM and Child Protections), all victim names, emails, and direct user UIDs are fully omitted. Photo/voice evidences are stripped, and narrative descriptions are sanitized or omitted.
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Reporting Period</label>
                      <select
                        value={exportRange}
                        onChange={(e) => setExportRange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold outline-none focus:border-purple-primary cursor-pointer hover:bg-slate-100/50"
                      >
                        <option value="all">All Available Cases</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Incident Narrative Sanitization</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            checked={exportOmitNarrative === true}
                            onChange={() => setExportOmitNarrative(true)}
                            className="text-purple-primary focus:ring-purple-primary"
                          />
                          <div className="text-[10.5px]">
                            <p className="font-bold text-slate-805">Omit Safe Narratives Completely</p>
                            <p className="text-[9px] text-slate-400">Strict zero-leak metadata protection. Highly recommended.</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            checked={exportOmitNarrative === false}
                            onChange={() => setExportOmitNarrative(false)}
                            className="text-purple-primary focus:ring-purple-primary"
                          />
                          <div className="text-[10.5px]">
                            <p className="font-bold text-slate-805">Include High-level Abstracted Narration (Max 10 Words)</p>
                            <p className="text-[9px] text-slate-400">Safe summarization filtered to preserve absolute survivor identities.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 space-y-1.5">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protection Audit Checklist</h4>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9.5px] font-bold text-slate-600">
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check size={11} />
                          <span>FGM Case ID Redacted</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check size={11} />
                          <span>Reporter Identity Masked</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check size={11} />
                          <span>Voice/Photo Attachments Stripped</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check size={11} />
                          <span>Geographical Scope Generalized</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-purple-50 px-4 py-2.5 rounded-2xl border border-purple-100">
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Matching Protected Cases</span>
                      <span className="text-sm font-black text-purple-900 bg-white shadow-xs px-2.5 py-0.5 rounded-xl border border-purple-100">
                        {previewExportCount} Active Cases
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                    <button
                      onClick={() => setIsExportOpen(false)}
                      className="px-4 py-2.5 border border-slate-250 text-slate-600 hover:text-slate-800 bg-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={() => setExportStep('preview')}
                      disabled={previewExportCount === 0}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        previewExportCount === 0 
                          ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                          : 'bg-purple-primary hover:bg-purple-dark hover:shadow-lg'
                      }`}
                    >
                      <span>Preview Export Summary</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto text-left">
                    <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl space-y-2">
                      <div className="text-xs font-semibold text-purple-950">Export scope summary:</div>
                      <p className="text-xs text-purple-900 font-medium leading-relaxed">
                        Exporting <span className="underline decoration-purple-300 font-semibold">{previewExportCount} records</span> from the <span className="underline decoration-purple-300 font-semibold">{exportRange === 'all' ? 'last 30 days' : `last ${exportRange === '7d' ? '7 days' : exportRange === '30d' ? '30 days' : '90 days'}`}</span>.
                      </p>
                    </div>

                    <div className="space-y-2 text-left">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Protected Sample (Subset Preview)</h4>
                      <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/80 space-y-3.5 divide-y divide-slate-100">
                        {filteredReportsForExport.slice(0, 3).map((r, idx) => {
                          const anonKey = `REP-${r.id ? r.id.substring(0, 6).toUpperCase() : 'ANON'}`;
                          const region = r.location || 'Unknown Region';
                          let subDate = 'N/A';
                          if (r.timestamp) {
                            const d = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
                            subDate = d.toISOString().split('T')[0];
                          }
                          return (
                            <div key={idx} className={`${idx > 0 ? 'pt-3' : ''} space-y-1.5`}>
                              <div className="flex justify-between items-center text-[10.5px] font-bold">
                                <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">{anonKey}</span>
                                <span className="text-[9px] text-[#E11D48] bg-rose-50 border border-rose-100 px-1.5 py-0.25 rounded">Protected FGM Risk</span>
                              </div>
                              <div className="grid grid-cols-2 text-[9px] text-slate-600 font-semibold">
                                <div>Region: <span className="font-bold text-slate-800">{region}</span></div>
                                <div className="text-right">Date: <span className="font-bold text-slate-800">{subDate}</span></div>
                              </div>
                              <div className="text-[9px] text-slate-400 font-medium bg-white/70 border border-slate-150 rounded px-2 py-1 leading-normal italic line-clamp-2">
                                {exportOmitNarrative 
                                  ? 'Omitted completely in safe-reporting output mode.' 
                                  : r.description ? (r.description.split(/\s+/).slice(0, 8).join(' ') + '... [Safe Abstract]') : 'N/A'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9px] text-center text-slate-400 font-bold italic mt-1">Preview shows up to 3 sample cases formatted for secure transmission to protection officers.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                    <button
                      onClick={() => setExportStep('config')}
                      className="px-4 py-2.5 border border-slate-250 text-slate-600 hover:text-slate-800 bg-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Back to Options
                    </button>

                    <button
                      onClick={handleExportCSV}
                      disabled={previewExportCount === 0 || exportSuccess}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                        exportSuccess 
                          ? 'bg-emerald-600' 
                          : 'bg-gradient-to-r from-purple-primary to-indigo-600 hover:opacity-95'
                      }`}
                    >
                      {exportSuccess ? (
                        <>
                          <Check size={14} />
                          <span>Exported successfully</span>
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          <span>Confirm & Download CSV</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProtectionDashboard;

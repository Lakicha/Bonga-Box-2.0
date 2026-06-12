import React, { useEffect, useState, useMemo } from 'react';
import { db, collection, onSnapshot, query, orderBy, updateDoc, doc, setDoc, where, handleFirestoreError, OperationType, limit } from '../firebase';
import { Report, UserProfile, Alert } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Download, Users, ShieldAlert, AlertTriangle, FileText, ArrowRight, UserCog, Filter, Clock, BarChart2, ShieldCheck, Check, Info, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { SkeletonDashboardScreen } from './SkeletonLoader';

const COLORS = ['#F59E0B', '#4F46E5', '#10B981', '#64748B'];

const AdminDashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reportsLoading, setReportsLoading] = useState<boolean>(true);
  const [usersLoading, setUsersLoading] = useState<boolean>(true);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab ] = useState<'analytics' | 'activity' | 'users'>('analytics');

  // Export states
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportStep, setExportStep] = useState<'config' | 'preview'>('config');
  const [exportRange, setExportRange] = useState<string>('all');
  const [exportCategory, setExportCategory] = useState<string>('All');
  const [exportOmitNarrative, setExportOmitNarrative] = useState<boolean>(true);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // Manual pre-onboarding form states
  const [onboardEmail, setOnboardEmail] = useState('');
  const [onboardName, setOnboardName] = useState('');
  const [onboardRole, setOnboardRole] = useState<UserProfile['role']>('Mentor/Teacher');
  const [onboardSchool, setOnboardSchool] = useState('');
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardMessage, setOnboardMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleOnboardUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardEmail.trim() || !onboardName.trim()) {
      setOnboardMessage({ type: 'error', text: 'Please fill in email and name.' });
      return;
    }

    setIsOnboarding(true);
    setOnboardMessage(null);

    try {
      // Check if user already exists
      const existingUser = users.find(u => u.email.toLowerCase() === onboardEmail.trim().toLowerCase());
      
      if (existingUser) {
        await updateDoc(doc(db, 'users', existingUser.uid), {
          role: onboardRole,
          displayName: onboardName.trim(),
          ...(onboardRole === 'Mentor/Teacher' ? { schoolId: onboardSchool.trim() || 'Isiolo Girls High' } : {})
        });
        setOnboardMessage({ type: 'success', text: `Successfully updated role of pre-registered user "${onboardName}" to ${onboardRole}.` });
      } else {
        const tempUid = 'pre_' + Math.random().toString(36).substring(2, 10);
        const preProfile: UserProfile = {
          uid: tempUid,
          email: onboardEmail.trim().toLowerCase(),
          displayName: onboardName.trim(),
          role: onboardRole,
          ...(onboardRole === 'Mentor/Teacher' ? { schoolId: onboardSchool.trim() || 'Isiolo Girls High' } : {})
        };
        await setDoc(doc(db, 'users', tempUid), preProfile);
        setOnboardMessage({ type: 'success', text: `Onboarded "${onboardName}" pre-emptively. They will claim the role of ${onboardRole} when they register.` });
      }

      setOnboardEmail('');
      setOnboardName('');
      setOnboardSchool('');
    } catch (error) {
      console.error('Failed to onboard user', error);
      setOnboardMessage({ type: 'error', text: 'Failed to onboard user. Please check permissions.' });
    } finally {
      setIsOnboarding(false);
    }
  };

  useEffect(() => {
    const qReports = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
      setReportsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
      setReportsLoading(false);
    });

    const qRecentReports = query(collection(db, 'reports'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribeRecentReports = onSnapshot(qRecentReports, (snapshot) => {
      setRecentReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
      setUsersLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setUsersLoading(false);
    });

    const qAlerts = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'), limit(100));
    const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
      setAlertsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'alerts');
      setAlertsLoading(false);
    });

    return () => {
      unsubscribeReports();
      unsubscribeRecentReports();
      unsubscribeUsers();
      unsubscribeAlerts();
    };
  }, []);

  const handleRoleUpdate = async (uid: string, newRole: UserProfile['role']) => {
    setIsUpdating(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      console.error('Failed to update role', error);
      alert('Failed to update role. Please check permissions.');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredUsers = roleFilter === 'All' 
    ? users 
    : users.filter(u => u.role === roleFilter);

  const filteredReportsForExport = useMemo(() => {
    return reports.filter(r => {
      if (exportCategory !== 'All' && r.category !== exportCategory) return false;
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
  }, [reports, exportRange, exportCategory]);

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

      let narrative = 'Omitted for survivor/reporter safekeeping under ISIOLO-SAFE protection protocols.';
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
    link.setAttribute('download', `isiolo-anonymized-impact-report-${exportCategory.toLowerCase().replace(/\s+/g, '-')}-${exportRange}-${new Date().toISOString().split('T')[0]}.csv`);
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

  // Data for Category Chart
  const categoryData = useMemo(() => [
    { name: 'FGM Risk', value: reports.filter(r => r.category === 'FGM Risk').length },
    { name: 'Flood Alert', value: reports.filter(r => r.category === 'Flood Alert').length },
    { name: 'Emergency', value: reports.filter(r => r.category === 'Emergency').length },
    { name: 'Other', value: reports.filter(r => r.category === 'Other').length }
  ], [reports]);

  // Data for Location Chart
  const locationData = useMemo(() => {
    const locationCounts: Record<string, number> = {};
    reports.forEach(r => {
      locationCounts[r.location] = (locationCounts[r.location] || 0) + 1;
    });
    return Object.entries(locationCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [reports]);

  // Data for Status Chart
  const statusData = useMemo(() => [
    { name: 'Pending', value: reports.filter(r => r.status === 'Pending').length },
    { name: 'In Progress', value: reports.filter(r => r.status === 'In Progress').length },
    { name: 'Resolved', value: reports.filter(r => r.status === 'Resolved').length }
  ], [reports]);

  // Data for Resolution Time Chart (Average days to resolve by category)
  const resolutionData = useMemo(() => {
    const resolutionTimesByCategory: Record<string, { total: number, count: number }> = {};
    reports.forEach(r => {
      if (r.status === 'Resolved' && r.resolvedAt && r.timestamp) {
        const start = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
        const end = r.resolvedAt.toDate ? r.resolvedAt.toDate() : new Date(r.resolvedAt);
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        
        if (!resolutionTimesByCategory[r.category]) {
          resolutionTimesByCategory[r.category] = { total: 0, count: 0 };
        }
        resolutionTimesByCategory[r.category].total += diffDays;
        resolutionTimesByCategory[r.category].count += 1;
      }
    });

    return Object.entries(resolutionTimesByCategory).map(([name, data]) => ({
      name,
      avgDays: parseFloat((data.total / data.count).toFixed(1))
    }));
  }, [reports]);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-8 text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Logo size={64} />
          <div>
            <h1 className="text-2xl font-bold mb-1">Admin <span className="gradient-text">Dashboard</span></h1>
            <p className="text-xs text-text-dim">Aggregated reports and analytics for Isiolo County.</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setExportStep('config');
            setIsExportOpen(true);
          }}
          className="bg-purple-primary hover:bg-purple-dark text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-end"
        >
          <Download size={14} />
          <span>Export Stats</span>
        </button>
      </div>

      {reportsLoading || usersLoading || alertsLoading ? (
        <SkeletonDashboardScreen listCount={7} showStats={true} />
      ) : (
        <>
          {/* Overview Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: FileText, label: "Total Reports", value: reports.length, color: "border-purple-primary", bg: "bg-purple-50", text: "text-purple-primary" },
          { icon: ShieldAlert, label: "FGM Risks", value: reports.filter(r => r.category === 'FGM Risk').length, color: "border-orange-500", bg: "bg-orange-50", text: "text-orange-500" },
          { icon: AlertTriangle, label: "Active Alerts", value: alerts.length, color: "border-amber-550", bg: "bg-amber-50", text: "text-amber-600" },
          { icon: Users, label: "Total Users", value: users.length, color: "border-green-500", bg: "bg-green-50", text: "text-green-600" }
        ].map((stat, i) => (
          <div 
            key={i}
            className={`bg-white p-3 rounded-2xl border-l-[4px] ${stat.color} border border-slate-200 shadow-xs flex items-center justify-between`}
          >
            <div>
              <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-0.5">{stat.label}</p>
              <span className="text-xl font-bold tracking-tight text-slate-900">{stat.value}</span>
            </div>
            <div className={`w-8 h-8 ${stat.bg} ${stat.text} rounded-lg flex items-center justify-center border border-slate-100 shadow-xs hidden sm:flex`}>
              <stat.icon size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Menu Navigation */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 mb-4 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 uppercase tracking-wider transition-all shadow-xs ${
            activeTab === 'analytics'
              ? 'bg-purple-primary text-white border-b-2 border-purple-primary'
              : 'bg-white border border-slate-200 text-text-dim hover:bg-slate-50'
          }`}
        >
          <BarChart2 size={14} />
          <span>📊 Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 uppercase tracking-wider transition-all shadow-xs ${
            activeTab === 'activity'
              ? 'bg-purple-primary text-white border-b-2 border-purple-primary'
              : 'bg-white border border-slate-200 text-text-dim hover:bg-slate-50'
          }`}
        >
          <Clock size={14} />
          <span>📋 Recent Activity</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 uppercase tracking-wider transition-all shadow-xs ${
            activeTab === 'users'
              ? 'bg-purple-primary text-white border-b-2 border-purple-primary'
              : 'bg-white border border-slate-200 text-text-dim hover:bg-slate-50'
          }`}
        >
          <UserCog size={14} />
          <span>👥 User Roles</span>
        </button>
      </div>

      {/* tabbed container panel */}
      <div className="bg-white border border-slate-100 rounded-[20px] shadow-xs p-4 overflow-hidden mb-6 min-h-[300px]">
        {/* TAB 1: Analytics and Overview */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-slate-100 rounded-[20px] p-4 shadow-xs bg-slate-50/20">
              <h3 className="text-xs font-bold mb-4 uppercase tracking-widest text-text-dim">Reports by Category</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '11px' }} />
                    <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={34} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-slate-100 rounded-[20px] p-4 shadow-xs bg-slate-50/20">
              <h3 className="text-xs font-bold mb-4 uppercase tracking-widest text-text-dim">Recent Location Intensity</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '11px' }} />
                    <Bar dataKey="value" fill="#06B6D4" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Recent Incident Activities */}
        {activeTab === 'activity' && (
          <div className="overflow-x-auto overflow-y-auto max-h-[350px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-2 text-[9px] font-bold text-text-dim uppercase tracking-widest">Date</th>
                  <th className="px-5 py-2 text-[9px] font-bold text-text-dim uppercase tracking-widest">Category</th>
                  <th className="px-5 py-2 text-[9px] font-bold text-text-dim uppercase tracking-widest">Location</th>
                  <th className="px-5 py-2 text-[9px] font-bold text-text-dim uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-xs text-text-dim">
                      {report.timestamp?.toDate ? new Date(report.timestamp.toDate()).toLocaleDateString() : 'Just now'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        report.category === 'FGM Risk' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-purple-100 text-purple-primary border border-purple-200'
                      }`}>
                        {report.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs font-bold text-slate-800">{report.location}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        report.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                        report.status === 'In Progress' ? 'bg-indigo-100 text-purple-primary' : 'bg-green-100 text-green-600'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: User Role Managers */}
        {activeTab === 'users' && (
          <div>
            {/* Pre-onboard Form */}
            <form onSubmit={handleOnboardUser} className="bg-slate-50/50 border border-slate-100 p-4 rounded-[20px] mb-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0">
                  <UserCog size={13} />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800">Onboard & Assign New Staff/Officer</h4>
              </div>

              {onboardMessage && (
                <div className={`p-2.5 text-[10px] font-bold rounded-xl border text-center ${
                  onboardMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {onboardMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Full Name</label>
                  <input
                    type="text"
                    value={onboardName}
                    onChange={(e) => setOnboardName(e.target.value)}
                    placeholder="e.g. Theo"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-[#4F46E5] outline-none transition-colors hover:border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    value={onboardEmail}
                    onChange={(e) => setOnboardEmail(e.target.value)}
                    placeholder="e.g. officer@isiolo.org"
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-[#4F46E5] outline-none transition-colors hover:border-slate-300"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Designated Role</label>
                  <select
                    value={onboardRole}
                    onChange={(e) => setOnboardRole(e.target.value as UserProfile['role'])}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-[#4F46E5] outline-none transition-colors font-bold cursor-pointer hover:bg-slate-50"
                  >
                    <option value="User">User / Child</option>
                    <option value="Mentor/Teacher">Mentor / Teacher</option>
                    <option value="Protection Officer">Protection Officer</option>
                    <option value="Disaster Management Officer">Disaster Officer</option>
                    <option value="Admin">Admin Portal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">
                    {onboardRole === 'Mentor/Teacher' ? 'School ID / Affiliation' : 'Location (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={onboardSchool}
                    onChange={(e) => setOnboardSchool(e.target.value)}
                    placeholder={onboardRole === 'Mentor/Teacher' ? 'Isiolo Girls High' : 'e.g. Garbatulla'}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:border-[#4F46E5] outline-none transition-colors hover:border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isOnboarding}
                  className="bg-[#4F46E5] hover:bg-purple-dark text-white text-[10px] font-bold uppercase tracking-wider py-2 px-5 rounded-xl shadow-xs transition-transform active:scale-[0.98] disabled:opacity-55 cursor-pointer"
                >
                  {isOnboarding ? 'Onboarding...' : 'Onboard & Assign Role'}
                </button>
              </div>
            </form>

            <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">Search Operator Filter:</span>
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Mentor/Teacher">Mentor/Teacher</option>
                <option value="Protection Officer">Protection Officer</option>
                <option value="Disaster Management Officer">Disaster Mgmt Officer</option>
                <option value="User">User</option>
              </select>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[350px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-2 text-[9px] font-bold text-text-dim uppercase tracking-widest">User</th>
                    <th className="px-4 py-2 text-[9px] font-bold text-text-dim uppercase tracking-widest">Current Role</th>
                    <th className="px-4 py-2 text-[9px] font-bold text-text-dim uppercase tracking-widest">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 overflow-hidden border border-slate-200 shrink-0">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt={u.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Users size={12} className="text-text-dim" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-none">{u.displayName || 'Anonymous'}</p>
                            <p className="text-[10px] text-text-dim leading-none">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-widest leading-none ${
                          u.role === 'Admin' ? 'bg-orange-100 text-orange-600' :
                          u.role === 'Mentor/Teacher' ? 'bg-purple-100 text-purple-primary' :
                          u.role === 'Protection Officer' ? 'bg-blue-100 text-blue-600' :
                          u.role === 'Disaster Management Officer' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-text-dim'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <div className="flex flex-wrap gap-1">
                          {['User', 'Mentor/Teacher', 'Protection Officer', 'Disaster Management Officer', 'Admin'].map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleUpdate(u.uid, role as UserProfile['role'])}
                              disabled={u.role === role || isUpdating === u.uid}
                              className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-widest transition-all ${
                                u.role === role 
                                  ? 'bg-purple-primary text-white shadow-xs' 
                                  : 'bg-slate-50 text-text-dim hover:bg-slate-100 hover:text-slate-800'
                              } disabled:opacity-50`}
                            >
                              {isUpdating === u.uid && u.role !== role ? '...' : role}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                    <h2 className="font-bold text-base tracking-tight text-white leading-tight">Export Impact CSV</h2>
                    <p className="text-[10px] text-purple-100 uppercase tracking-widest font-black mt-0.5">Anonymized Impact Statistics Utility</p>
                  </div>
                </div>
                           {exportStep === 'config' ? (
                <>
                  <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto text-left">
                    <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                      <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-[10px] text-slate-600 leading-relaxed font-medium">
                        <span className="font-bold text-slate-800">Zero-Leak Guard Activated:</span> All direct identifiers like profile IDs, usernames, and media URLs are fully stripped. Location is generalized and incident narratives are either fully omitted or safe-abstracted to prevent survivor trace of FGM or disaster protection details.
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Date Range</label>
                        <select
                          value={exportRange}
                          onChange={(e) => setExportRange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold outline-none focus:border-purple-primary cursor-pointer hover:bg-slate-100/50"
                        >
                          <option value="all">All Time</option>
                          <option value="7d">Last 7 Days</option>
                          <option value="30d">Last 30 Days</option>
                          <option value="90d">Last 90 Days</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Category Scope</label>
                        <select
                          value={exportCategory}
                          onChange={(e) => setExportCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold outline-none focus:border-purple-primary cursor-pointer hover:bg-slate-100/50"
                        >
                          <option value="All">All Categories</option>
                          <option value="FGM Risk">FGM Risk</option>
                          <option value="Flood Alert">Flood Alert</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Description/Narrative Safekeeping</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            checked={exportOmitNarrative === true}
                            onChange={() => setExportOmitNarrative(true)}
                            className="text-purple-primary focus:ring-purple-primary"
                          />
                          <div className="text-[10.5px]">
                            <p className="font-bold text-slate-805">Omit Narration Entirely</p>
                            <p className="text-[9px] text-slate-400">Perfect for public and county community presentations.</p>
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
                            <p className="font-bold text-slate-805">Safe Abstracted Narrative</p>
                            <p className="text-[9px] text-slate-400">First 10 words maximum. Useful for verified institutional review.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 space-y-1.5">
                      <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Self-Audit Verification checklist</h4>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9.5px] font-bold text-slate-600">
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check size={11} />
                          <span>Reporter UID Removed</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check size={11} />
                          <span>Media Evidence Cleared</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check size={11} />
                          <span>Telemetry Excluded</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <Check size={11} />
                          <span>Case Keys Obfuscated</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-purple-50 px-4 py-2.5 rounded-2xl border border-purple-100">
                      <span className="text-[10px] font-bold text-purple-700 uppercase tracking-widest">Matching Data points</span>
                      <span className="text-sm font-black text-purple-900 bg-white shadow-xs px-2.5 py-0.5 rounded-xl border border-purple-100">
                        {previewExportCount} Cases
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
                      <div className="text-xs font-bold text-purple-950">Export Scope Summary:</div>
                      <p className="text-xs text-purple-900 font-semibold leading-relaxed">
                        Exporting <span className="underline decoration-purple-400 font-extrabold">{previewExportCount} records</span> of category <span className="underline decoration-purple-400 font-extrabold">{exportCategory}</span> from the <span className="underline decoration-purple-400 font-extrabold">{exportRange === 'all' ? 'beginning of time (All)' : `last ${exportRange === '7d' ? '7 days' : exportRange === '30d' ? '30 days' : '90 days'}`}</span>.
                      </p>
                    </div>

                    <div className="space-y-2 text-left">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Anonymized Sample (Subset Preview)</h4>
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
                                <span className="text-[9px] text-slate-500">{r.category}</span>
                              </div>
                              <div className="grid grid-cols-2 text-[9px] text-slate-600 font-semibold">
                                <div>Region: <span className="font-bold text-slate-800">{region}</span></div>
                                <div className="text-right">Date: <span className="font-bold text-slate-800">{subDate}</span></div>
                              </div>
                              <div className="text-[9px] text-slate-400 font-medium bg-white/70 border border-slate-150 rounded px-2 py-1 leading-normal italic line-clamp-2">
                                {exportOmitNarrative 
                                  ? 'Omitted for survivor/reporter safekeeping under ISIOLO-SAFE protection protocols.' 
                                  : r.description ? (r.description.split(/\s+/).slice(0, 8).join(' ') + '... [Safe Abstract]') : 'N/A'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9px] text-center text-slate-400 font-bold italic mt-1">Preview shows up to 3 sample cases formatted for secure transmission.</p>
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
                          : 'bg-purple-primary hover:bg-purple-dark hover:shadow-lg'
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
              )}   </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
</div>
  );
};

export default AdminDashboard;

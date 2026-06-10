import React, { useEffect, useState, useMemo } from 'react';
import { db, collection, onSnapshot, query, orderBy, updateDoc, doc, setDoc, where, handleFirestoreError, OperationType, limit } from '../firebase';
import { Report, UserProfile, Alert } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Download, Users, ShieldAlert, AlertTriangle, FileText, ArrowRight, UserCog, Filter, Clock, BarChart2 } from 'lucide-react';
import { motion } from 'motion/react';
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
        <button className="bg-purple-primary hover:bg-purple-dark text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-end">
          <Download size={14} />
          <span>Export Data</span>
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
            className={`bg-white p-3 rounded-2xl border-l-[4px] ${stat.color} border border-slate-205 shadow-xs flex items-center justify-between`}
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden mb-6 min-h-[300px]">
        {/* TAB 1: Analytics and Overview */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-slate-150 rounded-2xl p-4">
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

            <div className="border border-slate-150 rounded-2xl p-4">
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
                <tr className="bg-slate-50 border-b border-slate-205">
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
            <form onSubmit={handleOnboardUser} className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl mb-5 space-y-4">
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
</div>
  );
};

export default AdminDashboard;

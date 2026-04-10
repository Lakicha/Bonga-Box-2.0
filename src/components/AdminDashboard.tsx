import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, orderBy, updateDoc, doc } from '../firebase';
import { Report, UserProfile, Alert } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { Download, TrendingUp, Users, ShieldAlert, AlertTriangle, FileText, ArrowRight, UserCog, Filter, CheckCircle, MapPin, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

const AdminDashboard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    const qReports = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
    });

    const qAlerts = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
    const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    });

    return () => {
      unsubscribeReports();
      unsubscribeUsers();
      unsubscribeAlerts();
    };
  }, []);

  const handleRoleUpdate = async (uid: string, newRole: UserProfile['role']) => {
    setIsUpdating(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
    } catch (error) {
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
  const categoryData = [
    { name: 'FGM Risk', value: reports.filter(r => r.category === 'FGM Risk').length },
    { name: 'Flood Alert', value: reports.filter(r => r.category === 'Flood Alert').length },
    { name: 'Emergency', value: reports.filter(r => r.category === 'Emergency').length },
    { name: 'Other', value: reports.filter(r => r.category === 'Other').length }
  ];

  // Data for Location Chart
  const locationCounts: Record<string, number> = {};
  reports.forEach(r => {
    locationCounts[r.location] = (locationCounts[r.location] || 0) + 1;
  });
  const locationData = Object.entries(locationCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Data for Status Chart
  const statusData = [
    { name: 'Pending', value: reports.filter(r => r.status === 'Pending').length },
    { name: 'In Progress', value: reports.filter(r => r.status === 'In Progress').length },
    { name: 'Resolved', value: reports.filter(r => r.status === 'Resolved').length }
  ];

  // Data for Resolution Time Chart (Average days to resolve by category)
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

  const resolutionData = Object.entries(resolutionTimesByCategory).map(([name, data]) => ({
    name,
    avgDays: parseFloat((data.total / data.count).toFixed(1))
  }));

  const COLORS = ['#A855F7', '#EC4899', '#EAB308', '#22C55E'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex items-center gap-6">
          <Logo size={64} />
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin <span className="gradient-text">Dashboard</span></h1>
            <p className="text-text-dim">Aggregated reports and analytics for Isiolo County.</p>
          </div>
        </div>
        <button className="btn-primary flex items-center gap-3 py-4 px-8 shadow-glow">
          <Download size={20} />
          <span className="font-bold">Export Data</span>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {[
          { icon: FileText, label: "Total Reports", value: reports.length, color: "border-purple-primary", bg: "bg-purple-primary/10", text: "text-purple-primary" },
          { icon: ShieldAlert, label: "FGM Risks", value: reports.filter(r => r.category === 'FGM Risk').length, color: "border-magenta-accent", bg: "bg-magenta-accent/10", text: "text-magenta-accent" },
          { icon: AlertTriangle, label: "Active Alerts", value: alerts.length, color: "border-yellow-accent", bg: "bg-yellow-accent/10", text: "text-yellow-accent" },
          { icon: Users, label: "Total Users", value: users.length, color: "border-green-500", bg: "bg-green-500/10", text: "text-green-500" }
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <TrendingUp size={24} className="text-purple-primary" /> Reports by Category
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8', textTransform: 'uppercase' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="value" fill="url(#purpleGradient)" radius={[10, 10, 0, 0]} barSize={50} />
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <MapPin size={24} className="text-magenta-accent" /> Reports by Location
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="value" fill="#EC4899" radius={[0, 10, 10, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <TrendingUp size={24} className="text-purple-primary" /> Case Status Distribution
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={120}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-6">
            {statusData.map((entry, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full shadow-glow" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <Clock size={24} className="text-yellow-accent" /> Avg Resolution Time (Days)
          </h2>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={resolutionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8', textTransform: 'uppercase' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                />
                <Area type="monotone" dataKey="avgDays" stroke="#EAB308" fill="url(#yellowGradient)" strokeWidth={3} />
                <defs>
                  <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EAB308" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#EAB308" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {resolutionData.length === 0 && (
            <div className="flex items-center justify-center h-full -mt-40 text-text-dim text-sm italic">
              No resolved cases with timestamps yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-card !p-0 overflow-hidden">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <button className="text-purple-primary text-xs font-bold hover:text-purple-light transition-all uppercase tracking-widest flex items-center gap-2">
            View All Reports <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Date</th>
                <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Category</th>
                <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Location</th>
                <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.slice(0, 5).map((report) => (
                <tr key={report.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6 text-sm font-medium text-text-dim">
                    {new Date(report.timestamp?.toDate()).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      report.category === 'FGM Risk' ? 'bg-magenta-accent/10 text-magenta-accent' : 'bg-purple-primary/10 text-purple-primary'
                    }`}>
                      {report.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-white">{report.location}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      report.status === 'Pending' ? 'bg-yellow-accent/10 text-yellow-accent' :
                      report.status === 'In Progress' ? 'bg-purple-primary/10 text-purple-primary' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* User Management Section */}
      <div className="glass-card !p-0 overflow-hidden mb-12">
        <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/[0.02] gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-primary/10 rounded-xl flex items-center justify-center text-purple-primary border border-purple-primary/20">
              <UserCog size={20} />
            </div>
            <h2 className="text-2xl font-bold">User Management</h2>
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Filter size={16} className="text-text-dim" />
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none focus:border-purple-primary transition-all flex-grow sm:flex-grow-0"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Mentor">Mentor</option>
              <option value="Teacher">Teacher</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5">
              <tr>
                <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">User</th>
                <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Current Role</th>
                <th className="px-8 py-4 text-[10px] font-bold text-text-dim uppercase tracking-widest">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white overflow-hidden border border-white/10">
                        {u.photoURL ? (
                          <img src={u.photoURL} alt={u.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Users size={20} className="text-text-dim" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{u.displayName || 'Anonymous'}</p>
                        <p className="text-xs text-text-dim">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      u.role === 'Admin' ? 'bg-magenta-accent/10 text-magenta-accent' :
                      u.role === 'Mentor' ? 'bg-purple-primary/10 text-purple-primary' :
                      u.role === 'Teacher' ? 'bg-blue-500/10 text-blue-500' : 'bg-white/10 text-text-dim'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      {['User', 'Mentor', 'Teacher', 'Admin'].map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleUpdate(u.uid, role as UserProfile['role'])}
                          disabled={u.role === role || isUpdating === u.uid}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            u.role === role 
                              ? 'bg-purple-primary text-white shadow-glow' 
                              : 'bg-white/5 text-text-dim hover:bg-white/10 hover:text-white'
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
    </div>
  );
};

export default AdminDashboard;

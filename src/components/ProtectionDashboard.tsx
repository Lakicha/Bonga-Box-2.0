import React, { useEffect, useState, useMemo } from 'react';
import { db, collection, onSnapshot, query, where, updateDoc, doc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { Report } from '../types';
import { useAuth } from '../AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Shield, CheckCircle, Clock, AlertCircle, Filter, Eye, FileText, Download, ShieldCheck, Check, Info, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { SecureEvidenceViewer } from './SecureEvidenceViewer';
import { SkeletonDashboardScreen } from './SkeletonLoader';

import L from 'leaflet';
import { MapContainer, TileLayer, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Isiolo Center Coord
const ISIOLO_CENTER: [number, number] = [0.3546, 37.5822];

// Custom Leaflet Icons using glowing SVG wrappers
const getMapFgmIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-fgm-pin-dash',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <span class="animate-pulse" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: #8b5cf6; opacity: 0.35;"></span>
        <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; background-color: #8b5cf6; color: #ffffff; font-size: 11px; font-weight: 950; font-family: ui-sans-serif, system-ui, sans-serif;">P</div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -10]
  });
};

const getMapFloodIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-flood-pin-dash',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <span class="animate-pulse" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: #3b82f6; opacity: 0.35;"></span>
        <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; background-color: #3b82f6; color: #ffffff; font-size: 11px; font-weight: 950; font-family: ui-sans-serif, system-ui, sans-serif;">F</div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -10]
  });
};

const getMapOtherIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-other-pin-dash',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <span class="animate-pulse" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: #10b981; opacity: 0.35;"></span>
        <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; background-color: #10b981; color: #ffffff; font-size: 11px; font-weight: 950; font-family: ui-sans-serif, system-ui, sans-serif;">O</div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -10]
  });
};

const getMarkerIcon = (category: string) => {
  if (category === 'FGM Risk') return getMapFgmIcon();
  if (category === 'Flood Alert') return getMapFloodIcon();
  return getMapOtherIcon();
};

const getCoordinatesForLoc = (locName: string, saltIndex?: number): [number, number] => {
  const name = (locName || '').toLowerCase();
  let baseCoords: [number, number] = [0.3546, 37.5822]; // Default Isiolo
  
  if (name.includes('merti')) baseCoords = [1.0494, 38.6659];
  else if (name.includes('garbatulla') || name.includes('garba tulla') || name.includes('garba')) baseCoords = [0.2520, 38.5218];
  else if (name.includes('kinna')) baseCoords = [0.1833, 38.2000];
  else if (name.includes('oldonyiro') || name.includes('oldon-yiro')) baseCoords = [0.5833, 37.2833];
  else if (name.includes('sericho')) baseCoords = [1.0333, 39.1167];
  else if (name.includes('ngaremara')) baseCoords = [0.4833, 37.6000];
  else if (name.includes('gotu')) baseCoords = [0.5512, 38.0123];
  else if (name.includes('samburu')) baseCoords = [1.2229, 36.9392];
  else if (name.includes('marsabit')) baseCoords = [2.3167, 37.9833];
  else if (name.includes('isiolo')) baseCoords = [0.3546, 37.5822];
  
  // Use saltIndex (different reports in the same town) to avoid exact overlaps
  if (saltIndex !== undefined) {
    const angle = (saltIndex * 2 * Math.PI) / 8; // spread out up to 8 points on a circle
    const distanceLat = 0.012 + (saltIndex * 0.002);
    const distanceLng = 0.012 + (saltIndex * 0.002);
    return [
      baseCoords[0] + Math.sin(angle) * distanceLat,
      baseCoords[1] + Math.cos(angle) * distanceLng
    ];
  }
  return baseCoords;
};

const CustomChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const fgmCount = data.fgmCount || 0;
    const floodCount = data.floodCount || 0;
    
    // Determine context or guidelines based on values and spikes
    let fgmGuideline = "";
    let fgmTitle = "";
    if (fgmCount >= 3) {
      fgmTitle = "⚠️ Critical Protection Peak";
      fgmGuideline = "Significant risk spike detected. Initiate emergency rescue protocol, dispatch school liaison officer, and alert nearby safe-housing coordinators immediately.";
    } else if (fgmCount > 0) {
      fgmTitle = "🛡️ Active Protection Check";
      fgmGuideline = "FGM risks identified in local sub-counties. Activate community mentor patrols and connect with local health safehouses.";
    }

    let floodGuideline = "";
    let floodTitle = "";
    if (floodCount >= 3) {
      floodTitle = "🚨 Severe Hydrological Threat";
      floodGuideline = "Dangerous flood levels detected. Coordinate active evacuation, sound community alerts, and close lower-elevation school yards.";
    } else if (floodCount > 0) {
      floodTitle = "🌊 Active Flood Precaution";
      floodGuideline = "Elevated surface water levels. Monitor main river pathways and maintain clear communication links with emergency responders.";
    }

    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 max-w-[290px] font-sans">
        <p className="font-black text-slate-800 mb-2 uppercase tracking-widest text-[10px] border-b border-slate-100 pb-1.5 flex justify-between items-center">
          <span>📅 {label || data.formattedDate || data.monthKey}</span>
          <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 font-bold">Trend Analysis</span>
        </p>
        
        <div className="space-y-1.5 py-1">
          {payload.map((p: any, idx: number) => {
            const isFgm = p.dataKey === 'fgmCount' || p.name === 'FGM Risks' || p.name === 'FGM Risk';
            const val = p.value;
            const strokeColor = p.color || (isFgm ? '#8b5cf6' : '#3b82f6');
            return (
              <div key={idx} className="flex justify-between items-center text-[11px] font-semibold">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: strokeColor }} />
                  {p.name}:
                </span>
                <span className="font-extrabold text-slate-900 bg-slate-50 border border-slate-150 rounded px-1.5 py-0.5">
                  {val} {val === 1 ? 'case' : 'cases'}
                </span>
              </div>
            );
          })}
        </div>

        {(fgmTitle || floodTitle) ? (
          <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200 space-y-2">
            {fgmTitle && (
              <div className="bg-orange-50/70 border border-orange-100 rounded-lg p-2 text-[9.5px] leading-relaxed text-orange-850">
                <p className="font-extrabold text-orange-900 mb-0.5 flex items-center gap-1">
                  {fgmTitle}
                </p>
                <p className="font-medium">{fgmGuideline}</p>
              </div>
            )}
            {floodTitle && (
              <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2 text-[9.5px] leading-relaxed text-blue-850">
                <p className="font-extrabold text-blue-900 mb-0.5 flex items-center gap-1">
                  {floodTitle}
                </p>
                <p className="font-medium">{floodGuideline}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2.5 pt-2 border-t border-dashed border-slate-150 text-[9px] text-slate-450 italic leading-snug">
            🛡️ Safe threshold. Keep routine tracking systems and weekly mentoring circles active.
          </div>
        )}
      </div>
    );
  }
  return null;
};

const ProtectionDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState<'7d' | '30d' | 'ytd' | 'all'>('30d');

  // Export states
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [exportStep, setExportStep] = useState<'config' | 'preview'>('config');
  const [exportRange, setExportRange] = useState<string>('all');
  const [exportOmitNarrative, setExportOmitNarrative] = useState<boolean>(true);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Protection Officer has visibility over FGM Risk and Flood Alert cases
    const q = query(collection(db, 'reports'), where('category', 'in', ['FGM Risk', 'Flood Alert']));
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

  const chartFilteredReports = useMemo(() => {
    const now = new Date();
    return reports.filter(r => {
      if (!r.timestamp) return false;
      const reportDate = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
      
      if (analyticsTimeRange === '7d') {
        const boundary = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        boundary.setHours(0, 0, 0, 0);
        return reportDate >= boundary;
      }
      if (analyticsTimeRange === '30d') {
        const boundary = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        boundary.setHours(0, 0, 0, 0);
        return reportDate >= boundary;
      }
      if (analyticsTimeRange === 'ytd') {
        const boundary = new Date(now.getFullYear(), 0, 1);
        boundary.setHours(0, 0, 0, 0);
        return reportDate >= boundary;
      }
      return true; // 'all'
    });
  }, [reports, analyticsTimeRange]);

  // Data for dynamic time-range incident trend (FGM and Flood incidents frequency over selected period)
  const incidentTrendData = useMemo(() => {
    const now = new Date();
    
    if (analyticsTimeRange === '7d' || analyticsTimeRange === '30d') {
      const trend: Record<string, { date: string; formattedDate: string; fgmCount: number; floodCount: number }> = {};
      const limitDays = analyticsTimeRange === '7d' ? 7 : 30;
      
      for (let i = limitDays - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trend[dateStr] = {
          date: dateStr,
          formattedDate,
          fgmCount: 0,
          floodCount: 0
        };
      }
      
      chartFilteredReports.forEach(r => {
        if (!r.timestamp) return;
        const rDate = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
        const rDateStr = rDate.toISOString().split('T')[0];
        if (trend[rDateStr]) {
          if (r.category === 'FGM Risk') {
            trend[rDateStr].fgmCount += 1;
          } else if (r.category === 'Flood Alert') {
            trend[rDateStr].floodCount += 1;
          }
        }
      });
      
      return Object.values(trend);
    } else if (analyticsTimeRange === 'ytd') {
      const trend: Record<string, { monthKey: string; formattedDate: string; fgmCount: number; floodCount: number }> = {};
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      for (let m = 0; m <= currentMonth; m++) {
        const d = new Date(currentYear, m, 1);
        const monthKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        const formattedDate = d.toLocaleDateString('en-US', { month: 'short' });
        trend[monthKey] = {
          monthKey,
          formattedDate,
          fgmCount: 0,
          floodCount: 0
        };
      }
      
      chartFilteredReports.forEach(r => {
        if (!r.timestamp) return;
        const rDate = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
        if (rDate.getFullYear() !== currentYear) return;
        const m = rDate.getMonth();
        const monthKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
        if (trend[monthKey]) {
          if (r.category === 'FGM Risk') {
            trend[monthKey].fgmCount += 1;
          } else if (r.category === 'Flood Alert') {
            trend[monthKey].floodCount += 1;
          }
        }
      });
      
      return Object.values(trend);
    } else { // 'all' - past 12 months
      const trend: Record<string, { monthKey: string; formattedDate: string; fgmCount: number; floodCount: number }> = {};
      
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const m = d.getMonth();
        const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
        const formattedDate = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        trend[monthKey] = {
          monthKey,
          formattedDate,
          fgmCount: 0,
          floodCount: 0
        };
      }
      
      chartFilteredReports.forEach(r => {
        if (!r.timestamp) return;
        const rDate = r.timestamp.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
        const year = rDate.getFullYear();
        const m = rDate.getMonth();
        const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
        if (trend[monthKey]) {
          if (r.category === 'FGM Risk') {
            trend[monthKey].fgmCount += 1;
          } else if (r.category === 'Flood Alert') {
            trend[monthKey].floodCount += 1;
          }
        }
      });
      
      return Object.values(trend);
    }
  }, [chartFilteredReports, analyticsTimeRange]);

  // Data for FGM vs Flood distribution pie chart
  const distributionData = useMemo(() => {
    const fgmCount = chartFilteredReports.filter(r => r.category === 'FGM Risk').length;
    const floodCount = chartFilteredReports.filter(r => r.category === 'Flood Alert').length;
    return [
      { name: 'FGM Risks', value: fgmCount, color: '#8b5cf6' },
      { name: 'Flood Alerts', value: floodCount, color: '#3b82f6' }
    ].filter(item => item.value > 0);
  }, [chartFilteredReports]);

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

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesStatus = filter === 'All' || r.status === filter;
      const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });
  }, [reports, filter, categoryFilter]);

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
              <p className="text-xxs font-medium text-slate-400 leading-none mb-0.5 font-sans">Operator role</p>
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

          {/* Dynamic Time-Range Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100 mb-6 font-sans">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 text-purple-primary rounded-lg border border-purple-100/50">
                <Filter size={14} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest leading-none">Protection Analysis Period</h3>
                <p className="text-[9.5px] font-semibold text-slate-400 mt-1 leading-none">Filters trend and proportion stats below by case date</p>
              </div>
            </div>
            <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs shrink-0 self-end sm:self-auto">
              {[
                { key: '7d', label: '7 Days' },
                { key: '30d', label: '30 Days' },
                { key: 'ytd', label: 'Year To Date' },
                { key: 'all', label: 'All Time' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setAnalyticsTimeRange(item.key as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                    analyticsTimeRange === item.key
                      ? 'bg-purple-primary text-white shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Incident Summary Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* dynamic Incident Frequency Trend Chart */}
            <div className="lg:col-span-8 bg-white border border-slate-101 rounded-[20px] shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-1.5 font-sans">
                    <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                    {analyticsTimeRange === '7d' ? '7-Day' : analyticsTimeRange === '30d' ? '30-Day' : analyticsTimeRange === 'ytd' ? 'Year-to-Date' : 'All-Time'} Case & Flood Trend
                  </h3>
                  <div className="flex gap-3.5 text-[9px] font-bold uppercase tracking-wider font-sans">
                    <span className="flex items-center gap-1.5 text-[#8B5CF6]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" />
                      FGM Risks
                    </span>
                    <span className="flex items-center gap-1.5 text-[#3B82F6]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6]" />
                      Flood Alerts
                    </span>
                  </div>
                </div>
                <div className="h-[210px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={incidentTrendData}>
                      <defs>
                        <linearGradient id="colorFgmProtection" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorFloodProtection" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748B' }} allowDecimals={false} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area type="monotone" dataKey="fgmCount" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFgmProtection)" name="FGM Risks" />
                      <Area type="monotone" dataKey="floodCount" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorFloodProtection)" name="Flood Alerts" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Distribution Charts panel */}
            <div className="lg:col-span-4 bg-white border border-slate-101 rounded-[20px] shadow-xs p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 font-sans text-left">
                  Incident Proportions
                </h3>
                {distributionData.length === 0 ? (
                  <div className="h-[210px] flex flex-col items-center justify-center text-center text-xs font-semibold text-slate-400 italic">
                    No active reports listed
                  </div>
                ) : (
                  <div className="h-[210px] w-full flex flex-col justify-center items-center">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={distributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={38}
                          outerRadius={52}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {distributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '11px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-2 mt-2 font-sans w-full max-w-[180px]">
                      {distributionData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span>{item.name}</span>
                          </span>
                          <span className="text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Geographic Risk Overview Map */}
          <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-xs mb-6 text-left">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-605 flex items-center gap-1.5 font-sans">
                  <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                  Geographic Risk Overview Map
                </h3>
                <p className="text-[9.5px] font-semibold text-slate-450 mt-1">Interactive spatial tracking of active reports inside local coordinates</p>
              </div>
              
              <div className="flex gap-4 text-[9px] font-bold uppercase tracking-wider font-sans">
                <span className="flex items-center gap-1.5 text-purple-primary">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-primary flex items-center justify-center text-white text-[7px] font-bold">P</span>
                  FGM Protection Cases ({chartFilteredReports.filter(r => r.category === 'FGM Risk').length})
                </span>
                <span className="flex items-center gap-1.5 text-blue-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[7px] font-bold">F</span>
                  Flood Alert Hazards ({chartFilteredReports.filter(r => r.category === 'Flood Alert').length})
                </span>
              </div>
            </div>
            
            <div className="relative w-full h-[360px] rounded-2xl overflow-hidden z-10 border border-slate-100 shadow-xs">
              <MapContainer 
                center={ISIOLO_CENTER} 
                zoom={8} 
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {chartFilteredReports.map((report, idx) => {
                  const coords = getCoordinatesForLoc(report.location || 'Isiolo', idx);
                  return (
                    <Marker 
                      key={report.id || idx} 
                      position={coords} 
                      icon={getMarkerIcon(report.category)}
                    >
                      <Popup minWidth={220}>
                        <div className="font-sans text-xs p-1 text-slate-800">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              report.category === 'FGM Risk'
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : 'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              {report.category}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                              report.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                              report.status === 'In Progress' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                              {report.status}
                            </span>
                          </div>
                          
                          <h4 className="font-extrabold text-slate-800 text-[11px] mb-1">
                            📍 {report.location || 'Unknown Location'}
                          </h4>
                          
                          <p className="text-slate-600 text-[10px] leading-relaxed mb-2.5 italic">
                            "{report.description?.length > 75 ? `${report.description.substring(0, 75)}...` : report.description}"
                          </p>
                          
                          <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[9px]">
                            <span className="text-slate-400 font-medium">
                              {report.assignedOfficer ? `👤 Officer: ${report.assignedOfficer}` : '👤 Unassigned'}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                const element = document.getElementById('details-section');
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className="text-purple-primary font-black uppercase hover:underline cursor-pointer flex items-center gap-0.5"
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* Main Layout containing list and preview details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left column: filtered list of cases - 7 cols */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Filter size={16} />
                    <span className="text-xxs font-extrabold uppercase tracking-widest text-slate-500">Filters</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto justify-end">
                  {/* Category Filter */}
                  <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
                    {['All', 'FGM Risk', 'Flood Alert'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          categoryFilter === cat
                            ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {cat === 'All' ? 'All categories' : cat === 'FGM Risk' ? 'FGM' : 'Flood'}
                      </button>
                    ))}
                  </div>

                  {/* Status Filter */}
                  <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
                    {['All', 'Pending', 'In Progress', 'Resolved'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          filter === f
                            ? 'bg-purple-primary text-white shadow-xs font-semibold'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
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
                        <div className="flex items-center gap-2 mb-1 font-sans">
                          <span className={`px-2 py-0.5 rounded-full text-xxs font-bold ${
                            report.category === 'FGM Risk'
                              ? 'bg-orange-50 text-orange-600 border border-orange-100/50'
                              : 'bg-blue-50 text-blue-600 border border-blue-100/50'
                          }`}>
                            {report.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              report.status === 'Pending' ? 'bg-yellow-500 animate-pulse' :
                              report.status === 'In Progress' ? 'bg-purple-primary' : 'bg-green-500'
                            }`} />
                            <span className={`text-xxs font-semibold ${
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
                      <button className="bg-slate-50 border border-slate-100 text-slate-700 py-1.5 px-3.5 rounded-xl text-xxs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1 w-full sm:w-auto justify-center shrink-0 uppercase tracking-widest font-sans">
                        <Eye size={12} /> Handle
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Case Preview Sidebar - 5 cols */}
            <div className="lg:col-span-5" id="details-section">
              <AnimatePresence mode="wait">
                {selectedReport ? (
                  <motion.div
                    key={selectedReport.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-white rounded-[20px] p-5 border border-slate-100 shadow-xs space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2 font-sans">
                      <h3 className="text-sm font-semibold text-slate-800">Case Overview</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xxs font-semibold ${
                        selectedReport.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border border-yellow-250/50' :
                        selectedReport.status === 'In Progress' ? 'bg-purple-50 text-purple-primary border border-purple-200/50' : 'bg-green-50 text-green-600 border border-green-250/50'
                      }`}>
                        {selectedReport.status}
                      </span>
                    </div>

                    <div className="space-y-3 font-sans">
                      <div>
                        <span className="text-xxs font-medium text-slate-400 block">Location</span>
                        <p className="font-semibold text-xs text-slate-900">{selectedReport.location}</p>
                      </div>
                      <div>
                        <span className="text-xxs font-medium text-slate-400 block">Time submitted</span>
                        <p className="text-xxs text-slate-500">
                          {selectedReport.timestamp?.toDate ? new Date(selectedReport.timestamp.toDate()).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xxs font-medium text-slate-400 block">Incident description</span>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 max-h-[140px] overflow-y-auto">
                          {selectedReport.description}
                        </p>
                      </div>

                      {selectedReport.photoURL && (
                        <div className="space-y-1">
                          <span className="text-xxs font-medium text-slate-400 block">Confidential evidence file</span>
                          <SecureEvidenceViewer 
                            photoURL={selectedReport.photoURL} 
                            category={selectedReport.category}
                            caseId={selectedReport.id}
                          />
                        </div>
                      )}

                      {selectedReport.voiceNoteURL && (
                        <div>
                          <span className="text-xxs font-medium text-slate-400 block mb-1">Attached voice note</span>
                          <audio src={selectedReport.voiceNoteURL} controls className="w-full h-8 bg-slate-50 border border-slate-250/10 rounded-lg px-1 text-slate-800" />
                        </div>
                      )}
                    </div>

                    {/* Status Update Dropdown */}
                    <div className="pt-3 border-t border-slate-100 space-y-1.5 font-sans">
                      <label className="text-xxs font-medium text-slate-400 block">Update Case Action</label>
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
                    <p className="text-xxs text-purple-100 mt-0.5 font-sans">Anonymized protection reports summary</p>
                  </div>
                </div>
              </div>

              {exportStep === 'config' ? (
                <>
                  <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto text-left font-sans">
                    <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-2xl flex items-start gap-2.5">
                      <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-xxs text-slate-600 leading-relaxed font-semibold">
                        <span className="font-bold text-slate-800">Child & Survivor Safety Guard:</span> In compliance with regional safe-reporting directives (FGM and Child Protections), all victim names, emails, and direct user UIDs are fully omitted. Photo/voice evidences are stripped, and narrative descriptions are sanitized or omitted.
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xxs font-black text-slate-500 uppercase tracking-wider block">Reporting Period</label>
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
                      <label className="text-xxs font-black text-slate-500 uppercase tracking-wider block">Incident Narrative Sanitization</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            checked={exportOmitNarrative === true}
                            onChange={() => setExportOmitNarrative(true)}
                            className="text-purple-primary focus:ring-purple-primary"
                          />
                          <div className="text-xxs">
                            <p className="font-bold text-slate-800">Omit Safe Narratives Completely</p>
                            <p className="text-xxs text-slate-400">Strict zero-leak metadata protection. Highly recommended.</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 cursor-pointer transition-colors">
                          <input
                            type="radio"
                            checked={exportOmitNarrative === false}
                            onChange={() => setExportOmitNarrative(false)}
                            className="text-purple-primary focus:ring-purple-primary"
                          />
                          <div className="text-xxs">
                            <p className="font-bold text-slate-800">Include High-level Abstracted Narration (Max 10 Words)</p>
                            <p className="text-xxs text-slate-400">Safe summarization filtered to preserve absolute survivor identities.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50/50 space-y-1.5">
                      <h4 className="text-xxs font-black text-slate-500 uppercase tracking-widest">Protection Audit Checklist</h4>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xxs font-bold text-slate-600">
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
                      <span className="text-xxs font-bold text-purple-700 uppercase tracking-widest">Matching Protected Cases</span>
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

                    <div className="space-y-2 text-left font-sans">
                      <h4 className="text-xxs font-black text-slate-500 uppercase tracking-wider">Protected Sample (Subset Preview)</h4>
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
                              <div className="flex justify-between items-center text-xxs font-bold">
                                <span className="font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">{anonKey}</span>
                                <span className="text-xxs text-[#E11D48] bg-rose-50 border border-rose-100 px-1.5 py-0.25 rounded">Protected FGM Risk</span>
                              </div>
                              <div className="grid grid-cols-2 text-xxs text-slate-600 font-semibold">
                                <div>Region: <span className="font-bold text-slate-800">{region}</span></div>
                                <div className="text-right">Date: <span className="font-bold text-slate-800">{subDate}</span></div>
                              </div>
                              <div className="text-xxs text-slate-400 font-medium bg-white/70 border border-slate-150 rounded px-2 py-1 leading-normal italic line-clamp-2">
                                {exportOmitNarrative 
                                  ? 'Omitted completely in safe-reporting output mode.' 
                                  : r.description ? (r.description.split(/\s+/).slice(0, 8).join(' ') + '... [Safe Abstract]') : 'N/A'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xxs text-center text-slate-400 font-bold italic mt-1">Preview shows up to 3 sample cases formatted for secure transmission to protection officers.</p>
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

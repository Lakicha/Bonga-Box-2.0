import React, { useEffect, useState, useMemo } from 'react';
import { db, collection, onSnapshot, query, where, addDoc, updateDoc, doc, serverTimestamp, orderBy, handleFirestoreError, OperationType, limit } from '../firebase';
import { Report, Alert } from '../types';
import { useAuth } from '../AuthContext';
import { 
  CloudRain, CheckCircle, Clock, AlertTriangle, Filter, Eye, FileText, Send, Sparkles, MapPin, 
  Waves, Activity, TrendingUp, TrendingDown, RefreshCw, Sliders, Play, RotateCcw, Crosshair, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';
import { DEFAULT_SENSORS } from '../config/telemetryConfig';
import { SecureEvidenceViewer } from './SecureEvidenceViewer';
import { SkeletonDashboardScreen } from './SkeletonLoader';

// Leaflet components
import L from 'leaflet';
import { MapContainer, TileLayer, Popup, Circle, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Isiolo Center Coord
const ISIOLO_CENTER: [number, number] = [0.3546, 37.5822];

interface SensorData {
  id: string;
  name: string;
  location: string;
  depth: number;
  thresholdWarning: number;
  thresholdCritical: number;
  status: 'Normal' | 'Warning' | 'Critical';
  coords: [number, number];
  flowRate: number; // m3/s
  trend: 'rising' | 'stable' | 'falling';
  lastUpdated: string;
}

// Utility to approximate coordinates for local reported towns to map citizen reports
const getCoordinatesForLocation = (locName: string): [number, number] => {
  const name = (locName || '').toLowerCase();
  if (name.includes('merti')) return [1.0494, 38.6659];
  if (name.includes('garbatulla')) return [0.2520, 38.5218];
  if (name.includes('kinna')) return [0.1833, 38.2000];
  if (name.includes('oldonyiro')) return [0.5833, 37.2833];
  if (name.includes('sericho')) return [1.0333, 39.1167];
  if (name.includes('ngaremara')) return [0.4833, 37.6000];
  if (name.includes('gotu')) return [0.5512, 38.0123];
  // Slightly fluctuate to prevent overlay collision
  const saltLat = (Math.random() - 0.5) * 0.05;
  const saltLng = (Math.random() - 0.5) * 0.05;
  return [0.3546 + saltLat, 37.5822 + saltLng];
};

// Custom Leaflet Icons using glowing SVG wrappers
const getSensorIcon = (status: 'Normal' | 'Warning' | 'Critical') => {
  const color = status === 'Critical' ? '#EF4444' : status === 'Warning' ? '#F59E0B' : '#10B981';
  const shadowColor = status === 'Critical' ? 'rgba(239, 68, 68, 0.45)' : status === 'Warning' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.35)';
  return L.divIcon({
    className: 'custom-leaflet-sensor-pin',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div class="animate-ping" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${shadowColor};"></div>
        <div style="position: relative; width: 20px; height: 20px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; background-color: ${color}; transition: background-color 0.4s ease;">
          <div style="width: 5px; height: 5px; border-radius: 50%; background-color: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -12]
  });
};

const getIncidentIcon = (category: string) => {
  const color = category === 'Flood Alert' ? '#06B6D4' : '#EF4444'; 
  return L.divIcon({
    className: 'custom-leaflet-incident-pin',
    html: `
      <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
        <span class="animate-pulse" style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${color}; opacity: 0.35;"></span>
        <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; background-color: ${color};">
          <div style="width: 4px; height: 4px; border-radius: 50%; background-color: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -8]
  });
};

// MapClick prefiller listener
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  let clickTimeout: any = null;
  useMapEvents({
    click(e) {
      if (clickTimeout) clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }, 150);
    },
  });
  return null;
};

const DisasterDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportsLoading, setReportsLoading] = useState<boolean>(true);
  const [alertsLoading, setAlertsLoading] = useState<boolean>(true);

  // Alert form parameters
  const [alertType, setAlertType] = useState<string>('Flood Alert');
  const [alertSeverity, setAlertSeverity] = useState<Alert['severity']>('Medium');
  const [alertLocation, setAlertLocation] = useState<string>('');
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [lat, setLat] = useState<string>('0.3546');
  const [lng, setLng] = useState<string>('37.5822');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Active Map telemetry sensors state
  const [sensors, setSensors] = useState<SensorData[]>(DEFAULT_SENSORS as any[]);

  // Hook telemetry updates: fluctuate depth slightly every 5 seconds to simulate telemetrics
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      setSensors(prev => prev.map(s => {
        const variance = (Math.random() - 0.45) * 0.14; // slight organic rise bias
        let finalDepth = parseFloat((s.depth + variance).toFixed(2));
        if (finalDepth < 0.4) finalDepth = 0.4;
        if (finalDepth > 5.5) finalDepth = 5.5;

        let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';
        if (finalDepth >= s.thresholdCritical) {
          status = 'Critical';
        } else if (finalDepth >= s.thresholdWarning) {
          status = 'Warning';
        }

        const trend = variance > 0.03 ? 'rising' : variance < -0.03 ? 'falling' : s.trend;
        const newFlow = Math.round(s.flowRate + variance * 30);

        return {
          ...s,
          depth: finalDepth,
          status,
          trend,
          flowRate: newFlow < 10 ? 10 : newFlow,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
      }));
    }, 5000);

    return () => clearInterval(telemetryInterval);
  }, []);

  // Set alert form coords on map click
  const handleMapClickPrefill = (clickLat: number, clickLng: number) => {
    setLat(clickLat.toFixed(4));
    setLng(clickLng.toFixed(4));
  };

  const handleSimulateSensorsStorm = () => {
    setSensors(prev => prev.map(s => {
      const surgeDepth = parseFloat((s.thresholdCritical + 0.35 + Math.random() * 0.4).toFixed(2));
      return {
        ...s,
        depth: surgeDepth,
        status: 'Critical',
        trend: 'rising',
        flowRate: s.flowRate + 160,
        lastUpdated: 'Storm Sim'
      };
    }));
  };

  const handleResetSensors = () => {
    setSensors(DEFAULT_SENSORS as any[]);
  };

  useEffect(() => {
    // Queries Flood alarms & Emergencies
    const qReports = query(collection(db, 'reports'), where('category', 'in', ['Flood Alert', 'Emergency']), limit(100));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
      setReportsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports');
      setReportsLoading(false);
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
      unsubscribeAlerts();
    };
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

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertLocation || !alertMessage) return;

    setIsBroadcasting(true);
    setBroadcastSuccess(false);

    try {
      const coordinates: [number, number] = [parseFloat(lat), parseFloat(lng)];
      const newAlert = {
        type: alertType,
        severity: alertSeverity,
        location: alertLocation,
        message: alertMessage,
        coordinates: coordinates,
        radius: alertSeverity === 'Critical' ? 6000 : alertSeverity === 'High' ? 4000 : 2000,
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'alerts'), newAlert);

      // Reset form
      setAlertLocation('');
      setAlertMessage('');
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 4000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'alerts');
      console.error('Failed to broadcast alert:', error);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredReports = useMemo(() => {
    return filter === 'All' ? reports : reports.filter(r => r.status === filter);
  }, [reports, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-20 pb-8 text-slate-800">
      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-150 pb-5">
        <div className="flex items-center gap-4">
          <Logo size={64} />
          <div>
            <h1 className="text-2xl font-black mb-1 flex items-center gap-2">
              Disaster <span className="gradient-text">Management Console</span>
            </h1>
            <p className="text-xs text-text-dim font-medium">Real-time telemetry feeds, flood warning map pins, and secure emergency dispatcher channels.</p>
          </div>
        </div>
        
        {/* Simulators */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-2 px-3 shadow-xs flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-505 bg-indigo-500"></span>
            </span>
            <span className="text-[10px] font-bold text-slate-700">Telemetry Feed</span>
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <button 
                onClick={handleSimulateSensorsStorm}
                className="p-1 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded transition-all text-[9.5px] font-black uppercase flex items-center gap-1"
                title="Trigger simulated rainfall surge"
              >
                <Sliders size={11} /> Simulate Rain Surge
              </button>
              <button 
                onClick={handleResetSensors}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-all"
                title="Restore nominal sensor telemetry"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Bento Workspace Grid */}
      {reportsLoading || alertsLoading ? (
        <SkeletonDashboardScreen listCount={4} showStats={false} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        {/* LEFT COLUMN: Map & Interactive Sensor Monitoring (Map takes prominence) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* MAP WRAPPER CARD */}
          <div className="bg-white border border-slate-200/90 rounded-[2rem] p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center px-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Activity size={15} className="text-indigo-500" /> Interactive Flood and Sensor Map
                </h3>
                <p className="text-[10px] text-text-dim leading-none mt-0.5">Click any place on map to auto-prefill latitude/longitude dispatch parameters.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200/50 rounded-full text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Map Loaded
                </span>
              </div>
            </div>

            {/* LEAFLET CONTAINER */}
            <div className="w-full h-[400px] border border-slate-200/70 rounded-[1.5rem] overflow-hidden relative shadow-inner">
              <MapContainer 
                center={ISIOLO_CENTER} 
                zoom={9} 
                className="w-full h-full z-10"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Event prefiller clicker */}
                <MapClickHandler onMapClick={handleMapClickPrefill} />

                {/* 1. RENDER RIVER TELEMETRY SENSOR PINS */}
                {sensors.map(sensor => (
                  <Marker 
                    key={sensor.id} 
                    position={sensor.coords}
                    icon={getSensorIcon(sensor.status)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px] font-sans">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 mb-2">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Hydro-Sensor</span>
                          <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded ${
                            sensor.status === 'Critical' ? 'bg-red-100 text-red-600' :
                            sensor.status === 'Warning' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {sensor.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 leading-tight">{sensor.name}</h4>
                        <p className="text-[10px] text-slate-500 leading-none mb-2">{sensor.location}</p>
                        
                        <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest block">Gauge Depth</span>
                            <span className="text-xs font-black text-slate-900">{sensor.depth}m</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest block">Current Flow</span>
                            <span className="text-xs font-black text-slate-900">{sensor.flowRate} m³/s</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-2.5 text-[8.5px] text-text-dim">
                          <span className="flex items-center gap-0.5">
                            {sensor.trend === 'rising' ? <TrendingUp size={10} className="text-red-500" /> :
                             sensor.trend === 'falling' ? <TrendingDown size={10} className="text-green-500" /> :
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />}
                            <span className="font-semibold uppercase tracking-wide">Trend: {sensor.trend}</span>
                          </span>
                          <span className="font-mono">Updated: {sensor.lastUpdated}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* 2. RENDER BROADCAST ALERTS (CIRCULAR RANGES) */}
                {alerts.map(alert => {
                  const alertCenter = alert.coordinates || getCoordinatesForLocation(alert.location);
                  return (
                    <Circle
                      key={alert.id}
                      center={alertCenter}
                      radius={alert.radius || 3500}
                      pathOptions={{
                        color: alert.severity === 'Critical' ? '#ef4444' : alert.severity === 'High' ? '#f59e0b' : '#4F46E5',
                        fillColor: alert.severity === 'Critical' ? '#ef4444' : alert.severity === 'High' ? '#f59e0b' : '#4F46E5',
                        fillOpacity: alert.severity === 'Critical' ? 0.35 : 0.22,
                        weight: 2,
                        dashArray: alert.severity === 'Critical' ? '6,6' : ''
                      }}
                    >
                      <Popup>
                        <div className="p-1.5 min-w-[150px] font-sans">
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-extrabold uppercase tracking-wide block mb-1 inline-block">
                            Warning Broadcast
                          </span>
                          <h4 className="font-bold text-xs text-slate-900">{alert.location}</h4>
                          <p className="text-[10px] text-slate-650 mt-1 leading-snug">{alert.message}</p>
                          <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-slate-100 text-[8px] text-slate-400">
                            <span className="font-bold uppercase text-red-500">Range: {((alert.radius || 3000)/1000).toFixed(1)}km</span>
                            <span>{alert.severity} Incident</span>
                          </div>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}

                {/* 3. RENDER CITIZEN FLOOD EMERGENCY REPORTS */}
                {reports.filter(r => r.status !== 'Resolved').map(report => {
                  const repCoords = getCoordinatesForLocation(report.location);
                  return (
                    <Marker
                      key={report.id}
                      position={repCoords}
                      icon={getIncidentIcon(report.category)}
                    >
                      <Popup>
                        <div className="p-1.5 min-w-[160px] font-sans">
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-500 rounded text-[7.5px] font-black uppercase tracking-wide inline-block mb-1">
                            LOGGED REPORT: {report.category}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-900">{report.location}</h4>
                          <p className="text-[10.5px] text-slate-600 leading-snug mt-1 italic">"{report.description}"</p>
                          <p className="text-[9px] mt-2 font-bold text-indigo-600">Status: {report.status}</p>
                          <button 
                            onClick={() => setSelectedReport(report)}
                            className="w-full mt-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[8.5px] font-bold rounded uppercase tracking-wide border border-slate-200 transition-all text-center block"
                          >
                            Open Action File
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Map Coordinate Indicator helper overlay */}
              <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 z-20 text-[9px] text-slate-700 shadow-sm flex items-center gap-1.5">
                <Crosshair size={11} className="text-slate-400" />
                <span>Geocenter: <strong className="font-mono text-slate-950 font-bold">0.3546°N, 37.5822°E</strong></span>
              </div>
            </div>
          </div>

          {/* ACTIVE DISASTER REPORTS AREA */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2 text-slate-900">
                  <AlertTriangle className="text-amber-500" size={17} /> Live Emergency Incident Reports
                </h2>
                <p className="text-[11px] text-text-dim">Citizen submittals filtered by high-impact flood and emergency markers.</p>
              </div>
              
              <div className="flex gap-1">
                {['All', 'Pending', 'In Progress', 'Resolved'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-xl text-[8.5px] font-extrabold transition-all uppercase tracking-widest ${
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
              {filteredReports.length === 0 ? (
                <div className="col-span-full bg-white rounded-3xl p-12 text-center border-dashed border-slate-200 border-2">
                  <CloudRain size={36} className="mx-auto mb-2 text-text-dim opacity-40 animate-pulse" />
                  <p className="text-text-dim text-xs font-semibold italic">No localized disaster reports are associated with this status filter.</p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <motion.div
                    key={report.id}
                    whileHover={{ scale: 1.006 }}
                    onClick={() => setSelectedReport(report)}
                    className={`bg-white rounded-2xl p-4 border cursor-pointer transition-all shadow-xs flex flex-col justify-between ${
                      selectedReport?.id === report.id ? 'border-purple-primary ring-2 ring-purple-primary/5 bg-purple-50/10' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200/50 rounded-full text-[8px] font-bold uppercase tracking-widest">
                          {report.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            report.status === 'Pending' ? 'bg-amber-500 animate-pulse' :
                            report.status === 'In Progress' ? 'bg-purple-primary' : 'bg-green-500'
                          }`} />
                          <span className={`text-[8px] font-bold uppercase tracking-widest ${
                            report.status === 'Pending' ? 'text-amber-550 text-amber-600' :
                            report.status === 'In Progress' ? 'text-purple-primary' : 'text-green-600'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                      </div>
                      
                      <h4 className="text-xs font-bold text-slate-900 tracking-tight mb-1">{report.location}</h4>
                      <p className="text-[11px] text-text-dim line-clamp-2 leading-relaxed mb-3">"{report.description}"</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                      <span className="text-[8.5px] font-bold text-slate-400">
                        {report.timestamp?.toDate ? new Date(report.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </span>
                      <button className="text-purple-primary hover:text-purple-dark text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <span>Inspect Incident</span>
                        <ArrowUpRight size={11} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Telemetry Monitors & Warning Broadcast form */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Hydro Telemetry Metrics Console */}
          <div className="bg-white rounded-[2rem] border border-slate-200/90 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2.5 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 leading-none">
                <Waves size={15} className="text-[#06B6D4]" /> Live Telemetry Sensors
              </h3>
              <span className="text-[8.5px] font-mono text-[#06B6D4] bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-100">3 Terminals</span>
            </div>

            <div className="space-y-3">
              {sensors.map(s => {
                const percent = Math.min(100, Math.round((s.depth / s.thresholdCritical) * 100));
                
                return (
                  <div 
                    key={s.id} 
                    className={`p-3 rounded-2xl border transition-all ${
                      s.status === 'Critical' ? 'bg-red-50/20 border-red-200' :
                      s.status === 'Warning' ? 'bg-amber-50/20 border-amber-200' : 'bg-slate-50/50 border-slate-150'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{s.name}</h4>
                        <span className="text-[8.5px] font-semibold text-text-dim">{s.location}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black font-mono text-slate-900">{s.depth}m</span>
                        <span className="text-[7.5px] font-bold text-text-dim block uppercase">Depth Level</span>
                      </div>
                    </div>

                    {/* Sensor Progress Gauge */}
                    <div className="w-full bg-slate-150 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          s.status === 'Critical' ? 'bg-red-500' :
                          s.status === 'Warning' ? 'bg-amber-500' : 'bg-[#06B6D4]'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-2 text-[8px] text-text-dim">
                      <span className="flex items-center gap-0.5 font-bold">
                        {s.trend === 'rising' ? <TrendingUp size={10} className="text-red-500" /> :
                         s.trend === 'falling' ? <TrendingDown size={10} className="text-green-500" /> :
                         <span className="w-1 h-1 rounded-full bg-slate-400 mr-0.5" />}
                        <span className="uppercase">Flow: {s.trend}</span>
                      </span>

                      <span className="font-mono text-slate-500">Flow Rate: {s.flowRate} m³/s</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BROADCAST ALERT INPUT FORM CARD */}
          <div className="bg-white rounded-[2rem] p-5 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-1.5 text-slate-900">
              <Sparkles size={16} className="text-amber-500" /> Dispatch Hazard Warning
            </h3>

            <p className="text-[10px] text-slate-500 leading-normal font-medium bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
              Click elements or sensors on the <strong>Left Map</strong> to automatically extract latitude and longitude coords! Custom alert overlays broadcast instantly to all logged-in accounts.
            </p>

            <form onSubmit={handleBroadcastAlert} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-text-dim uppercase tracking-widest block">Alert Type</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-primary"
                >
                  <option value="Flood Alert">Torrential Flood Alert</option>
                  <option value="Severe Drought">Drought Emergency</option>
                  <option value="Emergency Alert">Critical Emergency Dispatch</option>
                  <option value="Road Unpassable">Road Block / Damaged Infrastructure</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-text-dim uppercase tracking-widest block font-display">Severity</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Low', 'Medium', 'High', 'Critical'] as Alert['severity'][]).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setAlertSeverity(sev)}
                      className={`py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all ${
                        alertSeverity === sev 
                          ? sev === 'Critical' ? 'bg-red-500 text-white shadow-xs font-black' :
                            sev === 'High' ? 'bg-amber-500 text-white shadow-xs font-black' : 'bg-purple-primary text-white shadow-xs font-black'
                          : 'bg-slate-50 text-text-dim border border-slate-200'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-text-dim uppercase tracking-widest block font-display">Location Focal Area</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" size={13} strokeWidth={2.5} />
                  <input
                    type="text"
                    required
                    value={alertLocation}
                    onChange={(e) => setAlertLocation(e.target.value)}
                    placeholder="e.g., Merti Bridge Lowlands / Isiolo"
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-medium focus:outline-none focus:border-purple-primary bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-text-dim uppercase tracking-widest block font-display">Map Latitude</label>
                  <input
                    type="text"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-purple-primary bg-slate-50 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-text-dim uppercase tracking-widest block font-display">Map Longitude</label>
                  <input
                    type="text"
                    required
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full bg-slate-55 border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:outline-none focus:border-purple-primary bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8.5px] font-black text-text-dim uppercase tracking-widest block">Alert Message and Directive</label>
                <textarea
                  required
                  rows={2}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Direct citizens and herders to move livestock to higher dry grounds immediately..."
                  className="w-full bg-slate-55 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-medium focus:outline-none focus:border-purple-primary resize-none bg-slate-50 leading-relaxed"
                />
              </div>

              {broadcastSuccess && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-[10px] font-extrabold text-emerald-600">
                  Warning broadcast successfully plotted to live map!
                </div>
              )}

              <button
                type="submit"
                disabled={isBroadcasting}
                className="btn-primary w-full !py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider shadow-xs disabled:opacity-50"
              >
                <Send size={12} /> {isBroadcasting ? 'Publishing Map Pins...' : 'Publish Warnings Pin'}
              </button>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* DETAILED ACTION MODAL DRAWER OVERLAY */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-full max-w-md h-full bg-white border-l border-slate-200 text-slate-800 p-6 overflow-y-auto space-y-5 flex flex-col justify-between shadow-2xl rounded-l-3xl"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-950 font-display">Crisis Action Control</h3>
                  <button onClick={() => setSelectedReport(null)} className="text-text-dim hover:text-slate-800 font-bold text-xs">Close</button>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-200/50 rounded-full text-[8px] font-bold uppercase tracking-widest">
                      {selectedReport.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${
                      selectedReport.status === 'Pending' ? 'bg-amber-55 text-amber-600 border-amber-200/50 bg-amber-50' :
                      selectedReport.status === 'In Progress' ? 'bg-purple-100 text-purple-primary border-purple-200/50' : 'bg-green-50 text-green-600 border-green-200/50'
                    }`}>
                      {selectedReport.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block mb-0.5">Incident Region Mapping</span>
                    <p className="text-sm font-extrabold text-slate-900">{selectedReport.location}</p>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block mb-0.5">Timestamp Captured</span>
                    <p className="text-[11px] text-text-dim font-medium">
                      {selectedReport.timestamp?.toDate ? new Date(selectedReport.timestamp.toDate()).toLocaleString() : 'Just now'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block mb-0.5">Narrative & Citizen Testimonial</span>
                    <p className="text-xs text-text-dim leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-150 italic font-medium">
                      "{selectedReport.description}"
                    </p>
                  </div>

                  {selectedReport.photoURL && (
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block">Confidential Evidence File</span>
                      <SecureEvidenceViewer 
                        photoURL={selectedReport.photoURL} 
                        category={selectedReport.category}
                        caseId={selectedReport.id}
                      />
                    </div>
                  )}

                  {selectedReport.voiceNoteURL && (
                    <div>
                      <span className="text-[8px] font-bold text-text-dim uppercase tracking-widest block mb-1.5">Citizen Voice Recording</span>
                      <audio src={selectedReport.voiceNoteURL} controls className="w-full bg-slate-50 border border-slate-200 rounded-xl block h-9" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-150 space-y-2">
                <span className="text-[8px] font-extrabold text-text-dim uppercase tracking-widest block">Update Dispatch Level</span>
                <select
                  value={selectedReport.status}
                  onChange={(e) => updateStatus(selectedReport.id!, e.target.value as Report['status'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold text-purple-primary focus:outline-none focus:border-purple-primary transition-all cursor-pointer"
                >
                  <option value="Pending">Remains Pending Incident</option>
                  <option value="In Progress">Deploy Emergency Teams (In Progress)</option>
                  <option value="Resolved">Demobilize & Close (Resolved)</option>
                </select>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DisasterDashboard;

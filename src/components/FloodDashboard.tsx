import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType } from '../firebase';
import { Alert } from '../types';
import { MapContainer, TileLayer, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CloudRain, Thermometer, AlertTriangle, Users, Compass } from 'lucide-react';
import { motion } from 'motion/react';

// Isiolo Coordinates
const ISIOLO_CENTER: [number, number] = [0.3546, 37.5822];

const FloodDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [weather] = useState({ temp: 28, risk: 'Moderate' });

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'alerts');
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-5 text-slate-800 font-sans max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-display font-extrabold text-slate-900 tracking-tight leading-none mb-1">
            Safe <span className="text-[#4f46e5]">Telemetry Map</span>
          </h1>
          <p className="text-[10px] text-text-dim font-semibold uppercase tracking-wider">
            Live Meteorology & Safe Zones
          </p>
        </div>
        
        {/* Compact Weather Status cards */}
        <div className="flex gap-1.5 shrink-0">
          <div className="bg-white border border-slate-150 rounded-xl px-2 py-1 flex items-center gap-1 shadow-xs">
            <Thermometer size={11} className="text-amber-500" />
            <span className="text-[10px] font-bold text-slate-950">{weather.temp}°C</span>
          </div>
          <div className="bg-white border border-slate-150 rounded-xl px-2 py-1 flex items-center gap-1 shadow-xs">
            <CloudRain size={11} className="text-[#4F46E5]" />
            <span className="text-[10px] font-bold text-[#4F46E5]">{weather.risk}</span>
          </div>
        </div>
      </div>

      {/* Map Segment Container with physical map */}
      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden h-[180px] relative shadow-xs mb-4">
        <MapContainer center={ISIOLO_CENTER} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {/* Safe Town circle */}
          <Circle 
            center={ISIOLO_CENTER} 
            radius={2500} 
            pathOptions={{ 
              color: '#4F46E5', 
              fillColor: '#4F46E5',
              fillOpacity: 0.1,
              weight: 1.5
            }}
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-bold text-xs text-[#4F46E5]">Isiolo Town Center</h4>
                <p className="text-[9px] text-text-dim leading-none">Status: Safe Zone</p>
              </div>
            </Popup>
          </Circle>

          {alerts.map(alert => (
            <Circle 
              key={alert.id}
              center={alert.coordinates || ISIOLO_CENTER} 
              radius={alert.radius || 3000} 
              pathOptions={{ 
                color: alert.severity === 'Critical' ? '#ef4444' : '#f59e0b', 
                fillColor: alert.severity === 'Critical' ? '#ef4444' : '#f59e0b',
                fillOpacity: 0.25,
                weight: 2,
                dashArray: alert.severity === 'Critical' ? '5, 5' : ''
              }}
            >
              <Popup>
                <div className="p-1 min-w-[140px]">
                  <h4 className="font-bold text-slate-900 text-xs mb-0.5">{alert.location}</h4>
                  <p className="text-[9px] text-text-dim leading-snug">{alert.message}</p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      {/* Alerts listings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-extrabold text-text-dim uppercase tracking-widest pl-1 leading-none">
            Active Warning Logs
          </h2>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[8px] border border-slate-150">
            {alerts.length} Warnings
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-6 text-center text-text-dim bg-white rounded-2xl border border-dashed border-slate-200">
            <CloudRain size={20} className="mx-auto mb-2 text-slate-300" />
            <p className="text-[10px] font-semibold">Dry season telemetry. No active warnings found.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-white rounded-xl p-3 border border-slate-150 border-l-[3px] shadow-xs ${
                  alert.severity === 'Critical' ? 'border-l-red-500 bg-red-50/10' : 
                  alert.severity === 'High' ? 'border-l-amber-500 bg-amber-50/10' : 'border-l-purple-primary bg-purple-50/10'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-text-gray">{alert.type}</span>
                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    alert.severity === 'Critical' ? 'bg-red-50 text-red-650' : 'bg-amber-50 text-amber-650'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <h3 className="font-display font-bold text-xs text-slate-900 leading-tight mb-0.5">{alert.location}</h3>
                <p className="text-[10px] text-slate-500 leading-normal mb-1">{alert.message}</p>
                <span className="text-[8px] font-bold text-text-dim">
                  {alert.timestamp?.toDate ? new Date(alert.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently logged'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Community Assistance Note */}
        <div className="bg-indigo-50/40 border border-indigo-100/35 rounded-2xl p-3 flex gap-2.5 items-start">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] flex items-center justify-center shrink-0 border border-indigo-200/50">
            <Users size={14} />
          </div>
          <div>
            <h4 className="text-[10.5px] font-display font-extrabold text-slate-950 mb-0.5">Emergency Dispatch</h4>
            <p className="text-[9.5px] text-slate-655 leading-normal">
              Operators are monitoring telemetry streams 24/7. Use direct report routes to transmit sudden risk indicators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloodDashboard;

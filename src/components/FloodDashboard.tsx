import React, { useEffect, useState } from 'react';
import { db, collection, onSnapshot, query, orderBy } from '../firebase';
import { Alert } from '../types';
import { MapContainer, TileLayer, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CloudRain, Thermometer, AlertTriangle, Info, Users, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

// Isiolo Coordinates
const ISIOLO_CENTER: [number, number] = [0.3546, 37.5822];

const FloodDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [weather, setWeather] = useState({ temp: 28, risk: 'Moderate' });

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-32 text-white">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Flood Alert <span className="gradient-text">Dashboard</span></h1>
          <p className="text-text-dim">Live weather and flood risk data for Isiolo County.</p>
        </div>
        <div className="flex gap-4">
          <div className="card p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-accent/20 rounded-2xl flex items-center justify-center text-white border border-white/10">
              <Thermometer size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-dim uppercase tracking-widest">Temp</p>
              <p className="text-xl font-bold">{weather.temp}°C</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-primary/20 rounded-2xl flex items-center justify-center text-white border border-white/10">
              <CloudRain size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-dim uppercase tracking-widest">Risk</p>
              <p className="text-xl font-bold text-green-500">{weather.risk}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Map Section */}
        <div className="lg:col-span-2 glass-card !p-0 overflow-hidden h-[600px] relative group">
          <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
            <div className="bg-bg-dark/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-3 shadow-glow">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Live Alert Map</span>
            </div>
          </div>
          
          <MapContainer center={ISIOLO_CENTER} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* Safe Zone */}
            <Circle 
              center={ISIOLO_CENTER} 
              radius={3000} 
              pathOptions={{ 
                color: '#A855F7', 
                fillColor: '#A855F7',
                fillOpacity: 0.1,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold text-purple-primary mb-1">Isiolo Town</h4>
                  <p className="text-xs text-text-dim">Current Status: Safe Zone</p>
                </div>
              </Popup>
            </Circle>

            {alerts.map(alert => (
              <Circle 
                key={alert.id}
                center={alert.coordinates || ISIOLO_CENTER} 
                radius={alert.radius || 4000} 
                pathOptions={{ 
                  color: alert.severity === 'Critical' ? '#ef4444' : '#f59e0b', 
                  fillColor: alert.severity === 'Critical' ? '#ef4444' : '#f59e0b',
                  fillOpacity: 0.3,
                  weight: 3,
                  dashArray: alert.severity === 'Critical' ? '10, 10' : ''
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${alert.severity === 'Critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{alert.severity} Alert</span>
                    </div>
                    <h4 className="font-bold text-white mb-1">{alert.location}</h4>
                    <p className="text-xs text-text-dim leading-relaxed mb-3">{alert.message}</p>
                    <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[10px] text-text-dim font-bold uppercase tracking-tighter">
                        {alert.timestamp?.toDate ? new Date(alert.timestamp.toDate()).toLocaleTimeString() : 'Just now'}
                      </span>
                      <button className="text-[10px] text-purple-primary font-bold uppercase hover:underline">View Details</button>
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}
          </MapContainer>
        </div>

        {/* Alerts List */}
        <div className="space-y-6 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <AlertTriangle size={24} className="text-yellow-accent" /> Recent Alerts
            </h2>
            <span className="pill-tag">{alerts.length} Active</span>
          </div>

          {alerts.length === 0 ? (
            <div className="p-16 text-center text-text-dim glass-card border-dashed border-white/10">
              <CloudRain size={48} className="mx-auto mb-6 opacity-20" />
              <p className="font-medium">No active alerts at the moment.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className={`card !p-6 border-l-[6px] cursor-default transition-all ${
                  alert.severity === 'Critical' ? 'border-red-500 bg-red-500/[0.02]' : 
                  alert.severity === 'High' ? 'border-yellow-accent bg-yellow-accent/[0.02]' : 'border-purple-primary bg-purple-primary/[0.02]'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-dim">{alert.type}</span>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    alert.severity === 'Critical' ? 'bg-red-500/10 text-red-500' : 'bg-purple-primary/10 text-purple-primary'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${alert.severity === 'Critical' ? 'bg-red-500 animate-pulse' : 'bg-purple-primary'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{alert.severity}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-purple-primary transition-colors">{alert.location}</h3>
                <p className="text-sm text-text-dim leading-relaxed mb-4">{alert.message}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">
                    {alert.timestamp?.toDate ? new Date(alert.timestamp.toDate()).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                  <button className="text-purple-primary hover:text-purple-light transition-colors">
                    <Info size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
          
          <div className="p-8 glass-card flex gap-5 items-start">
            <div className="w-12 h-12 rounded-2xl bg-purple-primary/10 flex items-center justify-center shrink-0 border border-purple-primary/20">
              <Users size={24} className="text-purple-primary" />
            </div>
            <div>
              <h4 className="font-bold mb-1">Community Network</h4>
              <p className="text-sm text-text-dim leading-relaxed">
                Join our WhatsApp group for real-time alerts and community support in Isiolo County.
              </p>
              <button className="mt-4 text-xs font-bold text-purple-primary uppercase tracking-widest hover:text-purple-light transition-all flex items-center gap-2">
                Join Now <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloodDashboard;

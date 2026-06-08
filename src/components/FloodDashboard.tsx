import React, { useEffect, useState, useMemo } from 'react';
import { db, collection, onSnapshot, query, orderBy, handleFirestoreError, OperationType } from '../firebase';
import { Alert } from '../types';
import { MapContainer, TileLayer, Popup, Circle, ImageOverlay, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CloudRain, Thermometer, AlertTriangle, Users, Compass, MapPin, Landmark, Home, Check } from 'lucide-react';
import { motion } from 'motion/react';
import L from 'leaflet';

// Isiolo Coordinates
const ISIOLO_CENTER: [number, number] = [0.3546, 37.5822];

// High-fidelity historical flood zones in Isiolo county
const HISTORICAL_FLOOD_ZONES = [
  { lat: 0.5800, lng: 37.6800, intensity: 0.85, name: 'Ewaso Ng\'iro River Basin East', desc: 'Frequent seasonal flooding' },
  { lat: 0.4800, lng: 37.5200, intensity: 0.75, name: 'Ewaso Ng\'iro River Basin West', desc: 'Riverbanks overflow during long rains' },
  { lat: 0.3620, lng: 37.5900, intensity: 0.90, name: 'Bula Pesa Flash Flood Zone', desc: 'Local drainage depression prone to storm runoff' },
  { lat: 0.3450, lng: 37.6100, intensity: 0.80, name: 'Kulamawe Lowlands', desc: 'High risk of surface pooling' }
];

// High-end minimalist Safe Houses / Shelters in Isiolo for children and endangered youth
const SAFE_HOUSES = [
  { name: 'Isiolo Central Sanctuary', lat: 0.3580, lng: 37.5850, capacity: '25 beds', specialty: 'Endangered Minors Protection', contact: 'Club Mentor Mama Amina' },
  { name: 'Merti Girls Rescue Center', lat: 1.0750, lng: 38.6650, capacity: '40 beds', specialty: 'Urgent FGM Shelter & Legal Liaison', contact: 'Sister Cecilia' },
  { name: 'Garbatulla Regional Haven', lat: 0.2600, lng: 38.5200, capacity: '15 beds', specialty: 'Temporary Emergency Sanctuary', contact: 'Officer Joshua' },
  { name: 'Ewaso High Elevation Camp', lat: 0.5850, lng: 37.6950, capacity: '100 residents', specialty: 'Active High-Ground Flood Shelter', contact: 'Red Cross Dispatch' }
];

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

const ChangeView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const HeatmapLayer: React.FC<{ points: HeatmapPoint[]; radius: number; opacity: number }> = ({ points, radius, opacity }) => {
  const map = useMap();
  const [overlay, setOverlay] = useState<{ url: string; bounds: L.LatLngBounds } | null>(null);

  useEffect(() => {
    const updateHeatmap = () => {
      const bounds = map.getBounds();
      const size = map.getSize();
      
      if (size.x === 0 || size.y === 0) return;

      const canvas = document.createElement('canvas');
      canvas.width = size.x;
      canvas.height = size.y;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      points.forEach(p => {
        const pt = map.latLngToContainerPoint([p.lat, p.lng]);
        const padding = radius * 2;
        
        if (pt.x < -padding || pt.x > size.x + padding || pt.y < -padding || pt.y > size.y + padding) {
          return;
        }

        const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${p.intensity})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      const imgData = ctx.getImageData(0, 0, size.x, size.y);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          let r = 0, g = 0, b = 0;
          const a = Math.min(220, alpha * opacity * 1.2);
          
          if (alpha < 60) {
            r = 0; g = Math.floor(alpha * 4); b = 230;
          } else if (alpha < 130) {
            const ratio = (alpha - 60) / 70;
            r = Math.floor(ratio * 230); g = 240; b = Math.floor((1 - ratio) * 230);
          } else if (alpha < 200) {
            const ratio = (alpha - 130) / 70;
            r = 255; g = Math.floor((1 - ratio) * 180 + 70); b = 0;
          } else {
            r = 255; g = 0; b = 0;
          }

          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = a;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      try {
        const url = canvas.toDataURL();
        setOverlay({ url, bounds });
      } catch (err) {
        console.error('Heatmap layer generation issue:', err);
      }
    };

    updateHeatmap();
    map.on('moveend zoomend resize', updateHeatmap);
    return () => {
      map.off('moveend zoomend resize', updateHeatmap);
    };
  }, [map, points, radius, opacity]);

  if (!overlay) return null;

  return (
    <ImageOverlay
      url={overlay.url}
      bounds={[[overlay.bounds.getSouth(), overlay.bounds.getWest()], [overlay.bounds.getNorth(), overlay.bounds.getEast()]]}
      zIndex={350}
    />
  );
};

const FloodDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [weather] = useState({ temp: 29, risk: 'Moderate' });
  
  // Custom layer toggles
  const [heatmapMode, setHeatmapMode] = useState<'none' | 'historical' | 'active' | 'merged'>('active');
  const [showSafeHouses, setShowSafeHouses] = useState<boolean>(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>(ISIOLO_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [showCircles, setShowCircles] = useState<boolean>(true);

  useEffect(() => {
    const q = query(collection(db, 'alerts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'alerts');
    });

    return () => unsubscribe();
  }, []);

  const heatmapPoints = useMemo(() => {
    const pts: HeatmapPoint[] = [];

    if (heatmapMode === 'historical' || heatmapMode === 'merged') {
      HISTORICAL_FLOOD_ZONES.forEach(hz => {
        pts.push({ lat: hz.lat, lng: hz.lng, intensity: 0.7 });
      });
    }

    if (heatmapMode === 'active' || heatmapMode === 'merged') {
      alerts.forEach(alert => {
        if (alert.coordinates && Array.isArray(alert.coordinates) && alert.coordinates.length === 2) {
          const lat = alert.coordinates[0];
          const lng = alert.coordinates[1];
          pts.push({ lat, lng, intensity: alert.severity === 'Critical' ? 1.0 : 0.6 });
        }
      });
    }

    return pts;
  }, [heatmapMode, alerts]);

  return (
    <div className="font-sans max-w-md mx-auto select-none py-2 space-y-4">
      
      {/* Header telemetry info */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-xl font-display font-black text-slate-900 tracking-tight leading-none mb-1">
            Safe Telemetry Map
          </h1>
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">
            Isiolo Safe Haven Directory Nodes
          </p>
        </div>
        
        <div className="flex gap-1.5 shrink-0">
          <div className="bg-white border border-slate-150 rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-xs text-[10px] font-bold text-slate-800">
            <Thermometer size={12} className="text-amber-500" />
            <span>29°C</span>
          </div>
          <div className="bg-white border border-slate-150 rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-xs text-[10px] font-bold text-purple-primary">
            <CloudRain size={12} />
            <span>Dry Zone</span>
          </div>
        </div>
      </div>

      {/* Main Physical Leaflet map visualization */}
      <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden h-[240px] relative shadow-md">
        <MapContainer center={ISIOLO_CENTER} zoom={10} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ChangeView center={mapCenter} zoom={mapZoom} />
          
          {/* Custom Heatmap Layer */}
          {heatmapMode !== 'none' && (
            <HeatmapLayer points={heatmapPoints} radius={35} opacity={0.7} />
          )}
          
          {/* Default Isiolo Town Check Center */}
          <Circle 
            center={ISIOLO_CENTER} 
            radius={2000} 
            pathOptions={{ 
              color: '#4F46E5', 
              fillColor: '#4F46E5',
              fillOpacity: 0.05,
              weight: 1
            }}
          />

          {/* Standard explicit circles mapped to system alert status */}
          {showCircles && alerts.map(alert => (
            <Circle 
              key={alert.id}
              center={alert.coordinates || ISIOLO_CENTER} 
              radius={3500} 
              pathOptions={{ 
                color: alert.severity === 'Critical' ? '#ef4444' : '#f59e0b', 
                fillColor: alert.severity === 'Critical' ? '#ef4444' : '#f59e0b',
                fillOpacity: 0.12,
                weight: 1.5
              }}
            >
              <Popup>
                <div className="p-1 min-w-[130px]">
                  <h4 className="font-bold text-slate-900 text-xs mb-0.5">{alert.location}</h4>
                  <p className="text-[9px] text-slate-500 leading-snug">{alert.message}</p>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Redesigned Safe House Plot Overlays */}
          {showSafeHouses && SAFE_HOUSES.map((sh, idx) => (
            <Circle
              key={idx}
              center={[sh.lat, sh.lng]}
              radius={2400}
              pathOptions={{
                color: '#10B981', // Emerald green indicating absolute refuge
                fillColor: '#10B981',
                fillOpacity: 0.18,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-2 min-w-[160px] space-y-1">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
                    <Landmark size={12} className="text-emerald-500" />
                    <span className="font-display font-black text-xs text-emerald-700 uppercase">SAFE HOUSE</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs leading-tight">{sh.name}</h4>
                  <p className="text-[10px] text-slate-600 font-semibold mt-0.5">Specialty: <span className="text-[#4F46E5]">{sh.specialty}</span></p>
                  <p className="text-[9px] text-slate-400 font-bold">Capacity: {sh.capacity}</p>
                  <p className="text-[9px] text-slate-405 font-bold">Liaison: {sh.contact}</p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>

      {/* Map Control and Safe House Toggle Settings Panels */}
      <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs space-y-3.5">
        
        {/* Plot Selector Toggles */}
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Landmark size={13} className="text-emerald-500" /> Plot Safe Haven Shelters
          </span>

          <button
            onClick={() => setShowSafeHouses(!showSafeHouses)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
              showSafeHouses ? 'bg-emerald-500' : 'bg-slate-201'
            }`}
          >
            <span 
              className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                showSafeHouses ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Plot Selector warnings Toggles */}
        <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-2.5">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-500" /> Plot Active Warnings
          </span>

          <button
            onClick={() => setShowCircles(!showCircles)}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
              showCircles ? 'bg-[#4F46E5]' : 'bg-slate-201'
            }`}
          >
            <span 
              className={`w-4 h-4 rounded-full bg-white transition-transform transform ${
                showCircles ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* District Shortcuts Grid */}
        <div className="border-t border-slate-50 pt-3">
          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">
            Regional Telemetry Jumps
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setMapCenter(ISIOLO_CENTER); setMapZoom(11); }}
              className="p-2 border border-slate-205 rounded-xl text-center text-[10px] font-black bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
            >
              Isiolo Central Safelands
            </button>
            <button
              onClick={() => { setMapCenter([1.0750, 38.6650]); setMapZoom(11); }}
              className="p-2 border border-slate-205 rounded-xl text-center text-[10px] font-black bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
            >
              Merti Outpost Shelters
            </button>
          </div>
        </div>

      </div>

      {/* Safe Houses listings */}
      <div className="space-y-3">
        <span className="text-[9.5px] text-slate-400 font-extrabold uppercase tracking-widest pl-1 block">
          Endangered Haven Directories
        </span>

        <div className="space-y-2.5">
          {SAFE_HOUSES.map((sh, idx) => (
            <div 
              key={idx}
              onClick={() => {
                setMapCenter([sh.lat, sh.lng]);
                setMapZoom(12);
              }}
              className="bg-white border border-slate-150 p-3.5 rounded-xl flex items-start gap-3 shadow-xs hover:border-emerald-500/40 cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-605 flex items-center justify-center shrink-0 border border-emerald-201">
                <Landmark size={15} />
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-none mb-1">
                  {sh.name}
                </h4>
                <p className="text-[10px] text-[#4F46E5] font-semibold leading-relaxed">
                  Focus: {sh.specialty}
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5 font-bold">
                  Capacity: {sh.capacity} · Liaison: {sh.contact}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default FloodDashboard;

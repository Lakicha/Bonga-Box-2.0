// Technical County Configuration file for telemetry sensors, shelters, and geographical metadata

export interface WeatherTelemetry {
  temp: number;
  risk: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface HistoricalFloodZone {
  lat: number;
  lng: number;
  intensity: number;
  name: string;
  desc: string;
}

export interface SafeHouse {
  name: string;
  lat: number;
  lng: number;
  capacity: string;
  specialty: string;
  contact: string;
}

export interface SensorConfig {
  id: string;
  name: string;
  location: string;
  depth: number;
  thresholdWarning: number;
  thresholdCritical: number;
  status: 'Normal' | 'Warning' | 'Critical';
  coords: [number, number];
  flowRate: number;
  trend: 'rising' | 'stable' | 'falling';
  lastUpdated: string;
}

export const ISIOLO_CENTER: [number, number] = [0.3546, 37.5822];

export const HISTORICAL_FLOOD_ZONES: HistoricalFloodZone[] = [
  { lat: 0.5800, lng: 37.6800, intensity: 0.85, name: 'Ewaso Ng\'iro River Basin East', desc: 'Frequent seasonal flooding' },
  { lat: 0.4800, lng: 37.5200, intensity: 0.75, name: 'Ewaso Ng\'iro River Basin West', desc: 'Riverbanks overflow during long rains' },
  { lat: 0.3620, lng: 37.5900, intensity: 0.90, name: 'Bula Pesa Flash Flood Zone', desc: 'Local drainage depression prone to storm runoff' },
  { lat: 0.3450, lng: 37.6100, intensity: 0.80, name: 'Kulamawe Lowlands', desc: 'High risk of surface pooling' }
];

export const SAFE_HOUSES: SafeHouse[] = [
  { name: 'Isiolo Central Sanctuary', lat: 0.3580, lng: 37.5850, capacity: '25 beds', specialty: 'Endangered Minors Protection', contact: 'Club Mentor Mama Amina' },
  { name: 'Merti Girls Rescue Center', lat: 1.0750, lng: 38.6650, capacity: '40 beds', specialty: 'Urgent FGM Shelter & Legal Liaison', contact: 'Sister Cecilia' },
  { name: 'Garbatulla Regional Haven', lat: 0.2600, lng: 38.5200, capacity: '15 beds', specialty: 'Temporary Emergency Sanctuary', contact: 'Officer Joshua' },
  { name: 'Ewaso High Elevation Camp', lat: 0.5850, lng: 37.6950, capacity: '100 residents', specialty: 'Active High-Ground Flood Shelter', contact: 'Red Cross Dispatch' }
];

export const DEFAULT_SENSORS: SensorConfig[] = [
  {
    id: 'sensor-merti',
    name: "Ewaso Ng'iro Station",
    location: 'Merti Bridge Sector',
    depth: 2.85,
    thresholdWarning: 3.10,
    thresholdCritical: 3.60,
    status: 'Normal',
    coords: [1.0494, 38.6659],
    flowRate: 148,
    trend: 'rising',
    lastUpdated: 'Live'
  },
  {
    id: 'sensor-town',
    name: 'Isiolo River Station',
    location: 'Town Bridge Sector',
    depth: 1.35,
    thresholdWarning: 2.00,
    thresholdCritical: 2.50,
    status: 'Normal',
    coords: [0.3546, 37.5822],
    flowRate: 38,
    trend: 'stable',
    lastUpdated: 'Live'
  },
  {
    id: 'sensor-gotu',
    name: 'Uaso Nyiro Station',
    location: 'Gotu Bridge Sector',
    depth: 2.92,
    thresholdWarning: 2.80,
    thresholdCritical: 3.30,
    status: 'Warning',
    coords: [0.5512, 38.0123],
    flowRate: 195,
    trend: 'rising',
    lastUpdated: 'Live'
  }
];

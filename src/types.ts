export interface Report {
  id?: string;
  category: 'FGM Risk' | 'Flood Alert' | 'Emergency' | 'Other';
  location: string;
  description: string;
  photoURL?: string;
  voiceNoteURL?: string;
  timestamp: any;
  status: 'Pending' | 'In Progress' | 'Resolved';
  assignedOfficer?: string;
  schoolId?: string;
  authorUid?: string | null;
  isAnonymous?: boolean;
  resolvedAt?: any;
}

export interface Alert {
  id?: string;
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  location: string;
  message: string;
  timestamp: any;
  coordinates?: [number, number];
  radius?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'Admin' | 'Mentor/Teacher' | 'Protection Officer' | 'Disaster Management Officer' | 'User';
  schoolId?: string;
  displayName?: string;
  photoURL?: string;
}

export enum AppView {
  Landing = 'landing',
  EmployerDashboard = 'employer-dashboard',
  WorkerBrowse = 'worker-browse',
  WorkerReliability = 'worker-reliability'
}

export interface Gig {
  id: string;
  title: string;
  employer: string;
  locationName: string;
  distance: string;
  rate: string;
  period: string;
  category: 'Event' | 'F&B' | 'Logistics' | 'Cleaning';
  isInstant: boolean;
  duration?: string;
  description?: string;
  tags?: string[];
  imageUrl?: string;
  // FIX: coords now carries both visual map offsets (x/y %) AND real GPS coords (lat/lng)
  // lat/lng are required for Leaflet; x/y are kept for any legacy visual map pins
  coords: { x: number; y: number; lat: number; lng: number };
}

export interface Applicant {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  badge: 'Verified Student' | 'High-Tier Pro' | 'Emergency Quick-Response' | 'Student';
  noShowRate: string;
  distance: string;
  bio: string;
  status: 'Pending' | 'Hired' | 'Messaged';
}

export interface BackupWorker {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  gigsCount: string;
  isReady: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  authorSub: string;
  avatar: string;
}

export interface WorkHistoryItem {
  id: string;
  employer: string;
  quote: string;
  rating: number;
  date: string;
  category: string;
  duration: string;
}
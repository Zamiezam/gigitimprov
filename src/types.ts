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
  worker_id?: string;
  gig_id?: string;
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

export interface EmployerReview {
  id?: string;
  employer_name: string;
  worker_id?: string;
  is_anonymous: boolean;
  rating: number;
  payment_promptness: number;
  safety_rating: number;
  comment?: string;
  created_at?: string;
}

export interface Message {
  id?: string;
  sender_id: string;
  receiver_id: string;
  sender_name?: string;
  content: string;
  created_at?: string;
}

export interface Conversation {
  partner_id: string;
  partner_name: string;
  partner_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}
export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'worker' | 'employer' | 'both';
  is_verified?: boolean;
  university?: string;
  matric_id?: string;
  is_available?: boolean;
  reliability_score?: string;
  company_name?: string;
  ssm_number?: string;
  company_address?: string;
  phone_number?: string;
  industry?: string;
  company_size?: string;
  company_description?: string;
  website?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

// Additional Worker Profile Fields
export interface WorkerProfile extends Profile {
  bio?: string;
  education_level?: string;
  resume_url?: string;
  skills?: string[];
  languages?: string[];
  preferred_categories?: string[];
  bank_name?: string;
  bank_account_number?: string;
  expected_hourly_rate?: number;
  commitments_description?: string;
  google_calendar_id?: string;
  emergency_ready?: boolean;
  emergency_radius_km?: number;
}

// Additional Worker Profile Fields for Income Classification
export interface IncomeClassification {
  household_income?: number;
  income_group?: 'B40' | 'M40' | 'T20';
}

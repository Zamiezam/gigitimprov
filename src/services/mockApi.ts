// services/mockApi.ts - Mock data for MVP presentation
import { Gig, Applicant } from '../types';

// Mock gigs data
export const mockGigs: Gig[] = [
  {
    id: 'mock-1',
    title: 'Cafe Assistant - Weekend Shift',
    employer: 'KK Cafe',
    locationName: 'KK Town',
    distance: '0.5km away',
    rate: 'RM 12/hr',
    period: 'Hour',
    category: 'F&B',
    isInstant: false,
    duration: '6 Hours',
    description: 'Looking for a friendly assistant for weekend morning shifts. Training provided!',
    tags: ['Weekend', 'Student Friendly', 'Meals Provided'],
    coords: { x: 58, y: 55, lat: 5.9749, lng: 116.0724 }
  },
  {
    id: 'mock-2',
    title: 'Event Crew - Tech Expo',
    employer: 'SICC',
    locationName: 'SICC',
    distance: '1.2km away',
    rate: 'RM 15/hr',
    period: 'Hour',
    category: 'Event',
    isInstant: true,
    duration: '8 Hours',
    description: 'Need crew for registration desk and ushering. Great networking opportunity!',
    tags: ['Event', 'Weekend', 'No Experience Needed'],
    coords: { x: 67, y: 35, lat: 6.0400, lng: 116.1200 }
  },
  {
    id: 'mock-3',
    title: 'Warehouse Packer',
    employer: 'Logistika SB',
    locationName: 'Inanam',
    distance: '3.5km away',
    rate: 'RM 11/hr',
    period: 'Hour',
    category: 'Logistics',
    isInstant: false,
    duration: '8 Hours',
    description: 'Help pack and label parcels for delivery. Physical work required.',
    tags: ['Packing', 'Physical Work', 'Immediate Start'],
    coords: { x: 38, y: 25, lat: 6.0586, lng: 116.1254 }
  }
];

// Mock applicants data
export const mockApplicants: Applicant[] = [
  {
    id: 'mock-app-1',
    name: 'Ahmad Rosli',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 4.9,
    badge: 'Verified Student',
    noShowRate: '0%',
    distance: '1.2km away',
    bio: 'UMS Computer Science student. Experienced barista with 6 months cafe experience. Available weekends.',
    status: 'Pending'
  },
  {
    id: 'mock-app-2',
    name: 'Nurul Hidayah',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 5.0,
    badge: 'High-Tier Pro',
    noShowRate: '0%',
    distance: '0.8km away',
    bio: 'Part-time student at UMS. 12 successful gigs completed. Available for immediate start.',
    status: 'Pending'
  },
  {
    id: 'mock-app-3',
    name: 'Jason Tan',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    rating: 4.7,
    badge: 'Verified Student',
    noShowRate: '5%',
    distance: '2.3km away',
    bio: 'Logistics student. Previous warehouse experience. Can handle heavy lifting.',
    status: 'Pending'
  }
];
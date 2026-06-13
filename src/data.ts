import { Gig, Applicant, BackupWorker, Testimonial, WorkHistoryItem } from './types';

// FIX: All gigs now carry real KK GPS coordinates (lat/lng) for Leaflet map pins.
// x/y percentage offsets are preserved for any legacy visual map usage.
export const initialGigs: Gig[] = [
  {
    id: 'gig-1',
    title: 'Sabah Tech Expo - Crew',
    employer: 'SICC',
    locationName: 'SICC',
    distance: '1.2km away',
    rate: 'RM 15/hr',
    period: 'Hour',
    category: 'Event',
    isInstant: true,
    duration: '4 Hours',
    description: 'Assist in registration and ushering for the upcoming tech expo at SICC. Perfect for students looking for professional networking.',
    tags: ['Event Support', 'No Experience Required'],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzOE7QysQJGfgSgTO7HOCD5d32EYyRmijyiACpQC6CzT1r11LxRq4qwd6C3pvrrPXxNH1W5P3otXpzoAT7lHF8ZEx8CZ8DVRE4RW5fGSiYyBEID2lf7nbsCEv89OwAut2GC-DCNAnVUOAYPy23AWxfBWxOMqVW9tH5X19rTchBrU_9vkLHXefuCdSCqnYS53p60fi96QqIgtJtnuDYaxW0TaccDYm1V4zGRG8W_ZRGAc5p5N750pJQrAecvfodK_Zn6kHzgojSvt8',
    coords: { x: 67, y: 35, lat: 6.0400, lng: 116.1200 }, // SICC, Kota Kinabalu
  },
  {
    id: 'gig-2',
    title: 'Service Crew - Evening',
    employer: 'Borenos Fried Chicken',
    locationName: 'KK Town',
    distance: '3.0km away',
    rate: 'RM 10/hr',
    period: 'Hour',
    category: 'F&B',
    isInstant: false,
    duration: '6 Hours',
    description: 'Take orders, serve food, and help maintain clean dining areas. Fun team and free staff meals included!',
    tags: ['F&B Experience', 'Meals Provided'],
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAj-1BgYDZd9rj0cWlIQ8xhcdYL3G4CbjFlAOytGl0FguutZQ5V673dqYy-ty2tjxPd52fqRn7TC9_z3pY7Fg5cWzKJu0ME27RIYswSDtWxCzwVreBI0qiOZACJI81Yw0ckFoIPwAJa6QFvzCdz4bY0Ix6K1wmoxE7khRuXK6AA3Zat9BAsB6nYeW2nP1JiivG6fri7mbxdUWTUddo9kT2E_StPNeIxQbDLgHSlcDcGKkNos9ObO7myswq7ApjsEaNsBKP-7bb7TsI',
    coords: { x: 58, y: 55, lat: 5.9749, lng: 116.0724 }, // KK Town center
  },
  {
    id: 'gig-3',
    title: 'Warehouse Assistant',
    employer: 'Lazada Hub',
    locationName: 'Inanam',
    distance: '4.5km away',
    rate: 'RM 12/hr',
    period: 'Hour',
    category: 'Logistics',
    isInstant: false,
    duration: '8 Hours',
    description: 'Help scan, organize, and stack incoming holiday parcels. Requires quick feet and heavy lifting.',
    tags: ['Heavy Lifting', 'Logistics Support'],
    coords: { x: 38, y: 25, lat: 6.0586, lng: 116.1254 }, // Inanam industrial area
  },
  {
    id: 'gig-4',
    title: 'Promoter (Roadshow)',
    employer: 'Imago Shopping Mall',
    locationName: 'Imago Mall',
    distance: '2.0km away',
    rate: 'RM 80/day',
    period: 'Day',
    category: 'Event',
    isInstant: false,
    duration: 'Full Day',
    description: 'Introduce a new smartphone brand to shoppers at the central court helper booth. Exciting high commissions available!',
    tags: ['Sales Skills', 'Outgoing Personality'],
    coords: { x: 74, y: 65, lat: 5.9799, lng: 116.0727 }, // Imago Mall, Api-Api
  },
  {
    id: 'gig-5',
    title: 'Morning Cleaner',
    employer: 'UMS Library Cafe',
    locationName: 'UMS Campus',
    distance: '0.5km away',
    rate: 'RM 12/hr',
    period: 'Hour',
    category: 'Cleaning',
    isInstant: true,
    duration: '3 Hours',
    description: 'Wipe tables, sweep up floors, and refresh coffee counters before the library opens at 8:00 AM.',
    tags: ['No-nonsense', 'Early Shifts'],
    coords: { x: 44, y: 15, lat: 6.0367, lng: 116.1186 }, // UMS Campus
  }
];

export const initialApplicants: Applicant[] = [
  {
    id: 'app-1',
    name: 'Ariffin bin Ismail',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdjCBjvaVItg_x_e7623qziusBiV41RThNAUYeRiCmpMgFmvkUEerQvUBiUcKU6UFuVtRaKlJbPVQynMzV0zoNVqIR3mtB8Yx--p1VT1V0zDqBczgJWFfCvRKb4lz1ZgzXCR66BnwpFhsf_L4u8PJWOSmqGfbt2dZ9IprrG_JcVZMsosYQ00_Nr__JPz0uhykqn6xKffK0imX7cGzy5U2VqTe4OYW2SZYKenn-ND4xM0yvP2R3rmcaXHW1Iv-uR1dBBgQeHFvW4cw',
    rating: 4.9,
    badge: 'Verified Student',
    noShowRate: '0%',
    distance: '1.2km away',
    bio: 'Experienced with espresso machines and latte art. Fast learner and reliable for afternoon shifts.',
    status: 'Pending'
  },
  {
    id: 'app-2',
    name: 'Nurul Hidayah',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwo2kX9FjqavsI1hjJpmWThELIbrIoagJxD0pdZ7fLcq-_ngmGdYkFPGL32K6dcb424NlKNtGNBphmMin0plIBdAgNU0Jx-_cJricsvNaFI-j7VsJrou8uE5sUmbm9YC0XXAvHJV0wylkEftvXn9t1IvaviRe0dg-bf0HF_Kx9WNF3Kh_UPHJX5Vg2sbZeygr99nqVZ4KtoGXcXReevfZ1DzO0V2Zj-xF7MyeLsCkFuIMSx9KCSUrn_EY_mPIqLz1cGF1eu-P9bdE',
    rating: 5.0,
    badge: 'High-Tier Pro',
    noShowRate: '0%',
    distance: '0.8km away',
    bio: 'Part-time student at UMS. Available for weekend and evening cafe duties. 12 successful gigs completed.',
    status: 'Pending'
  }
];

export const initialBackupWorkers: BackupWorker[] = [
  {
    id: 'backup-1',
    name: 'Jason Tan',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHje_cwCVHzkawC5jdbTOqDFeBOaQx1LWCJ1PnypGJb06GpKv8Mjm62dxwzdyvUISa9S1GKMJMi5EOes0YrvKzAZQPGHFKmt1yFD1U_9iu87m5jvtLWFr8Wg4f4Lr40etZdAU82E3FcUZ8iBqrSKZoHDVD-9rqLh8_rMts3VIueIHJypTHCaT7SlTbn2SlBfCQi51PX6ifmDt_4uFk6mxCQcTFBEZKpgtmGN_ztyvbALm3m1xjLyOU3CroJzl2XP179rLL1bskTbg',
    rating: 4.8,
    gigsCount: '20+ Gigs',
    isReady: true
  },
  {
    id: 'backup-2',
    name: 'Sarah K.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBevvdz2UUk1jA6kYByl5V5v-uHZ2uYrGXPDdbYUGrGuy544D_3GIXaBF0GErL2pc54jusClqomSVaou-KNlOBYVIJbnnB9WUwyogXXOuX6fB5djk0jcqFshjYk78xNxywc3opUbAJm569MRygTE_vIqTJCmhQhpi03qrEwr0e91mKUzRSBEnCyfvaFtFm5Zz-tLemea7OLvvaFJ1ixSpGaG1H8ptw2KTPOMIPs1xgk_x_5vdT9eDTWFfPZr4ClWEO30ekfQggymFE',
    rating: 4.9,
    gigsCount: '5+ Gigs',
    isReady: true
  },
  {
    id: 'backup-3',
    name: 'Wilson Alvi',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9URRNVhi7njv6wupYTTXBEBPc93r5c9lyUpASIzmo1jzFPwKQ2fGYaQUdZAlLrn7xSvS1Vtt_BcQSe36pzTS6UGQrhuv7ahMTiBYDoEAY3g6Bv2w5lIlVyJGhateIg8WQMOZkAhjH0_9595Ac50va9zNMc0fV4D3Dxlu9erC9kcQ0pTRq81eSu3S9t8yE0BFzUYWuwjLUnODoQ17iOecZ8HK4NgwCLZTuKhTcd3snrIxtLEQVJiDCz94BrSNDNCVIZH4miHJ3N64',
    rating: 4.7,
    gigsCount: '15+ Gigs',
    isReady: true
  }
];

export const testimonials: Testimonial[] = [
  {
    id: 'test-1',
    quote: 'As a UMS student, GigIT changed how I earn. I can find weekend gigs in 1Borneo easily. The Reliability Score helps me prove my worth to employers even without a long CV.',
    author: 'Farhan Azmi',
    authorSub: 'Year 2, UMS student',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA68TnKokGOfVVl_9MKvJuICfDDNRWXQ0r8ak13d2-k2BiPnSEkZUJJcuG2e0zOyWM_oHP7ydWb9U80zyUAsdglSbnlbiFF-2DPgbSzfAeFilAA4oXBSd9t_GL_DWC2cvGcw71dPIKYyDYAM34ut9wJRdfd6RdpPjNqatwNWDpC2WdG5aP1sOcJ1MEwNtrPyoVkNh_7YK-S_5WU2y5e3Yzc__rkUjW0SA4YRxBiJ_qd8KpN-_3kjOqQ-dxymNneo1MG_yP9xDuyD_A'
  },
  {
    id: 'test-2',
    quote: "Running a cafe in Damai is hectic. GigIT's backup pool saved us when two staff fell ill during a holiday. The quality of students we get is professional and reliable.",
    author: 'Ken Wong',
    authorSub: 'Owner, The Daily Brew KK',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXu043A0fFLBy11Wp-ogt-r89wGe_xSwHjeHaGkC3Wi_kg08JSAjiNMbU0cX_kN5xefTADdphqq31L9BeoUnI8MnbpoL19AeQ0zJ9Ar3GGSuKi-zcT3Wx5Y-WLHo3041IqW302WCKPZbdohN_gi3Fvsfh_8HCXLb5b6gND4X9pSNpdcn7DCfhYLyY9L6xIeIGbRWhFHVZ3sq6UBLTGJSttWFh94qM6oZDWooVd_UOnQ4G1ZaYjea-Jt-wUUwQMoFtoCmyC2lDpTZqdY'
  }
];

export const workHistory: WorkHistoryItem[] = [
  {
    id: 'hist-1',
    employer: 'Kopi & Friends (Likas)',
    quote: 'Ahmad was incredibly fast at clearing tables during our Sunday rush. Showed up 10 mins early.',
    rating: 5,
    date: 'May 12, 2024',
    category: 'Event Support',
    duration: '4 Hours'
  },
  {
    id: 'hist-2',
    employer: 'Borneo Mart Delivery',
    quote: 'Great communication. Delivered all items carefully and followed safety protocols.',
    rating: 4,
    date: 'April 28, 2024',
    category: 'Delivery',
    duration: 'Full Day'
  }
];

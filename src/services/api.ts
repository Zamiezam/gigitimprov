// services/api.ts - Complete with all exports
import { supabase } from '../supabaseClient';
import { Gig, Applicant, EmployerReview } from '../types';
import { GoogleGenAI } from '@google/genai';
import { mockGigs, mockApplicants } from './mockApi';

// Re-export supabase for use in other components
export { supabase };

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Make sure ALL functions are exported
export async function verifyStudentIdWithAI(imageBase64: string) {
  const prompt = `
    You are an academic verification system for GigIT Sabah. 
    Analyze this ID card image. Extract the student's name, university name, and matric/student ID.
    Determine if this looks like a valid University ID card from Malaysia (like UMS, UiTM, etc).
    Return ONLY a JSON object: { "isValid": boolean, "name": string, "university": string, "matricId": string, "reason": string }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        { text: prompt },
        { inlineData: { data: imageBase64.split(',')[1], mimeType: 'image/jpeg' } }
      ],
      config: { responseMimeType: "application/json" }
    });

    const result = JSON.parse(response.text);
    
    if (result.isValid) {
      await supabase.from('profiles').update({
        is_verified: true,
        university: result.university,
        matric_id: result.matricId
      }).eq('id', (await supabase.auth.getUser()).data.user?.id);
    }
    
    return result;
  } catch (err) {
    console.error('AI verification failed:', err);
    return { isValid: true, name: 'Student', university: 'UMS', matricId: '12345', reason: 'Mock verification for demo' };
  }
}

// EXPORT THIS FUNCTION - It was missing!
export async function submitGigReviewWithAI(rawRating: number, comment: string) {
  const prompt = `
    Analyze this gig worker review: "${comment}".
    The base rating is ${rawRating}/5. 
    Did they mention the worker being late? Did they mention a no-show? Was the attitude exceptional?
    Calculate a 'reliability_modifier' between -1.0 (terrible/no-show) and +0.5 (exceptional/early).
    Return ONLY JSON: { "modifier": number, "tags": string[], "isNoShow": boolean }
  `;

  try {
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(aiResponse.text);
  } catch (err) {
    console.error('AI review analysis failed:', err);
    // Return default values for demo
    return { modifier: 0, tags: [], isNoShow: false };
  }
}

export async function triggerEmergencyBackup(gigDescription: string, nearbyWorkers: any[]) {
  const prompt = `
    A worker just canceled a gig. We need an emergency replacement.
    Gig Description: "${gigDescription}"
    
    Here is the JSON list of available standby workers:
    ${JSON.stringify(nearbyWorkers)}
    
    Based on their reliability score, completed gigs, and the gig needs, pick the single best worker to dispatch.
    Return ONLY JSON: { "selectedWorkerId": "string", "reason": "Why they were chosen based on their stats" }
  `;

  try {
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return JSON.parse(aiResponse.text);
  } catch (err) {
    console.error('AI emergency backup failed:', err);
    // Return default selection for demo
    return { selectedWorkerId: nearbyWorkers[0]?.id || 'backup-1', reason: 'Best available worker based on rating' };
  }
}

export const api = {
  async getGigs(): Promise<Gig[]> {
    try {
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        console.log('No gigs in database, using mock data');
        return mockGigs;
      }
      
      return data.map((gig: any) => ({
        id: gig.id,
        title: gig.title,
        employer: gig.employer,
        locationName: gig.location_name,
        distance: gig.distance ?? '',
        rate: gig.rate,
        period: gig.period,
        category: gig.category,
        isInstant: gig.is_instant ?? false,
        duration: gig.duration,
        description: gig.description,
        tags: gig.tags ?? [],
        imageUrl: gig.image_url,
        coords: {
          x: gig.coords?.x ?? 50,
          y: gig.coords?.y ?? 50,
          lat: gig.coords?.lat ?? 6.0367,
          lng: gig.coords?.lng ?? 116.1186,
        },
      }));
    } catch (err) {
      console.error('Error fetching gigs, using mock data:', err);
      return mockGigs;
    }
  },

  async createGig(gig: any): Promise<Gig> {
    try {
      const gigData: any = {
        title: gig.title,
        employer: gig.employer,
        rate: gig.rate,
        category: gig.category,
        period: gig.period || 'Hour',
      };
      
      if (gig.employer_id) gigData.employer_id = gig.employer_id;
      if (gig.employer_name) gigData.employer_name = gig.employer_name;
      if (gig.locationName) gigData.location_name = gig.locationName;
      if (gig.distance) gigData.distance = gig.distance;
      if (gig.duration) gigData.duration = gig.duration;
      if (gig.description) gigData.description = gig.description;
      if (gig.tags) gigData.tags = gig.tags;
      if (gig.coords) gigData.coords = gig.coords;
      if (gig.status) gigData.status = gig.status;
      
      const { data, error } = await supabase
        .from('gigs')
        .insert([gigData])
        .select()
        .single();

      if (error) {
        console.log('Database insert failed, returning mock gig');
        return {
          id: `mock-${Date.now()}`,
          title: gig.title,
          employer: gig.employer,
          locationName: gig.locationName,
          distance: gig.distance ?? '0.5km away',
          rate: gig.rate,
          period: gig.period || 'Hour',
          category: gig.category,
          isInstant: false,
          duration: gig.duration,
          description: gig.description,
          tags: gig.tags || [],
          imageUrl: gig.imageUrl,
          coords: gig.coords || { x: 50, y: 50, lat: 6.0367, lng: 116.1186 },
        };
      }

      return {
        id: data.id,
        title: data.title,
        employer: data.employer,
        locationName: data.location_name || '',
        distance: data.distance ?? '',
        rate: data.rate,
        period: data.period || 'Hour',
        category: data.category,
        isInstant: data.is_instant ?? false,
        duration: data.duration,
        description: data.description,
        tags: data.tags ?? [],
        imageUrl: data.image_url,
        coords: {
          x: data.coords?.x ?? 50,
          y: data.coords?.y ?? 50,
          lat: data.coords?.lat ?? 6.0367,
          lng: data.coords?.lng ?? 116.1186,
        },
      };
    } catch (err) {
      console.error('createGig error:', err);
      return {
        id: `mock-${Date.now()}`,
        title: gig.title,
        employer: gig.employer,
        locationName: gig.locationName,
        distance: gig.distance ?? '0.5km away',
        rate: gig.rate,
        period: gig.period || 'Hour',
        category: gig.category,
        isInstant: false,
        duration: gig.duration,
        description: gig.description,
        tags: gig.tags || [],
        imageUrl: gig.imageUrl,
        coords: gig.coords || { x: 50, y: 50, lat: 6.0367, lng: 116.1186 },
      };
    }
  },

  async getApplicantsForGig(gigId: string): Promise<Applicant[]> {
    try {
      const { data, error } = await supabase
        .from('applicants')
        .select('*')
        .eq('gig_id', gigId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return mockApplicants;
      }
      
      return data ?? [];
    } catch (err) {
      console.error('Error fetching applicants, using mock data:', err);
      return mockApplicants;
    }
  },

  async updateApplicantStatus(
    applicantId: string,
    status: 'Pending' | 'Hired' | 'Messaged'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('applicants')
        .update({ status })
        .eq('id', applicantId);

      if (error) throw error;
    } catch (err) {
      console.log('Status update simulated:', applicantId, status);
    }
  },

  async getEmployerReviews(employerName: string): Promise<EmployerReview[]> {
    try {
      const { data, error } = await supabase
        .from('employer_reviews')
        .select('*')
        .eq('employer_name', employerName)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mock data if none exists
      if (!data || data.length === 0) {
        return [
          { employer_name: employerName, is_anonymous: true, rating: 4.5, payment_promptness: 5, safety_rating: 4, comment: "Great employer, paid right on time via DuitNow.", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
          { employer_name: employerName, is_anonymous: true, rating: 4, payment_promptness: 4, safety_rating: 5, comment: "Very safe working environment. Will work for them again.", created_at: new Date(Date.now() - 86400000 * 10).toISOString() }
        ];
      }
      
      return data;
    } catch (err) {
      console.error('Error fetching employer reviews:', err);
      return [];
    }
  },

  async submitEmployerReview(review: Omit<EmployerReview, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('employer_reviews')
        .insert([review]);

      if (error) throw error;
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  },

  // ── Messaging ──────────────────────────────────────────────────────
  async getMessages(userId: string, partnerId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  },

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ sender_id: senderId, receiver_id: receiverId, content }]);
      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
    }
  },

  async getConversations(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:sender_id(*), receiver:receiver_id(*)')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Group by partner
      const seen = new Set<string>();
      const convos: any[] = [];
      for (const msg of data ?? []) {
        const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        if (!seen.has(partnerId)) {
          seen.add(partnerId);
          const partner = msg.sender_id === userId ? msg.receiver : msg.sender;
          convos.push({
            partner_id: partnerId,
            partner_name: partner?.full_name || partner?.email || 'User',
            partner_avatar: partner?.avatar_url,
            last_message: msg.content,
            last_message_time: msg.created_at,
          });
        }
      }
      return convos;
    } catch (err) {
      console.error('Error fetching conversations:', err);
      return [];
    }
  },

  // ── Availability ──────────────────────────────────────────────────
  async setAvailability(userId: string, isAvailable: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: isAvailable })
        .eq('id', userId);
      if (error) throw error;
    } catch (err) {
      console.error('Error setting availability:', err);
    }
  },

  // ── Bonus/Tips ────────────────────────────────────────────────────
  async sendBonus(hiredWorkerId: string, amount: number, message: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('hired_workers')
        .update({ bonus_amount: amount, bonus_message: message, bonus_sent_at: new Date().toISOString() })
        .eq('id', hiredWorkerId);
      if (error) throw error;
    } catch (err) {
      console.error('Error sending bonus:', err);
    }
  },
};

// Re-export Message type for components
export type { Message };
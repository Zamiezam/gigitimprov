import { createClient } from '@supabase/supabase-js';
import { mockGigs } from './services/mockApi';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const isMockMode = !supabaseUrl || !supabaseAnonKey;

// Mock Query Builder for LocalStorage-backed simulation
class MockQueryBuilder {
  table: string;
  data: any[];

  constructor(table: string) {
    this.table = table;
    this.data = JSON.parse(localStorage.getItem(`mock_${table}`) || '[]');

    // Seed default data if empty
    if (this.data.length === 0) {
      if (table === 'gigs') {
        this.data = mockGigs;
        localStorage.setItem('mock_gigs', JSON.stringify(this.data));
      } else if (table === 'hired_workers') {
        this.data = [
          {
            id: 'mock-hired-1',
            worker_id: 'mock-worker-123',
            worker_name: 'Ahmad Rosli',
            worker_avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
            employer_name: 'Sabah SME Cafe',
            employer_id: 'mock-employer-123',
            gig_title: 'Weekend Barista',
            gig_id: 'mock-1',
            amount: 72.00,
            status: 'active',
            payment_status: 'pending',
            rating_given: false,
            clock_in_time: null,
            clock_out_time: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        localStorage.setItem('mock_hired_workers', JSON.stringify(this.data));
      } else if (table === 'profiles') {
        this.data = [
          {
            id: 'mock-worker-123',
            full_name: 'Ahmad Rosli',
            avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
            bio: 'UMS Computer Science student. Experienced barista with 6 months cafe experience. Available weekends.',
            role: 'worker',
            transport: 'Motorcycle',
            skills: ['Barista', 'Customer Service'],
            experience: '1 year at local cafe'
          }
        ];
        localStorage.setItem('mock_profiles', JSON.stringify(this.data));
      }
    }
  }

  select(fields: string = '*') {
    return this;
  }

  eq(column: string, value: any) {
    this.data = this.data.filter(item => item[column] === value);
    return this;
  }

  order(column: string, options?: any) {
    return this;
  }

  limit(count: number) {
    this.data = this.data.slice(0, count);
    return this;
  }

  single() {
    return Promise.resolve({ data: this.data[0] || null, error: null });
  }

  async insert(record: any) {
    const records = Array.isArray(record) ? record : [record];
    const updatedRecords = records.map(r => ({
      id: r.id || `mock-${this.table}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      ...r
    }));

    const allRecords = JSON.parse(localStorage.getItem(`mock_${this.table}`) || '[]');
    allRecords.push(...updatedRecords);
    localStorage.setItem(`mock_${this.table}`, JSON.stringify(allRecords));

    return { data: Array.isArray(record) ? updatedRecords : updatedRecords[0], error: null };
  }

  async update(fields: any) {
    const allRecords = JSON.parse(localStorage.getItem(`mock_${this.table}`) || '[]');
    const idsToUpdate = this.data.map(d => d.id);
    const updated = allRecords.map((item: any) => {
      if (idsToUpdate.includes(item.id)) {
        return { ...item, ...fields, updated_at: new Date().toISOString() };
      }
      return item;
    });

    localStorage.setItem(`mock_${this.table}`, JSON.stringify(updated));
    return { data: fields, error: null };
  }

  then(onfulfilled?: (value: any) => any) {
    const promise = Promise.resolve({ data: this.data, error: null });
    return promise.then(onfulfilled);
  }
}

// Mock Supabase Client Object
const createMockSupabase = () => {
  console.warn('⚠️ Supabase URL or Key missing. GigIT is running in local Mock Mode!');
  
  // Pre-login a default mock worker if not logged in to make the app instantly viewable
  if (!localStorage.getItem('mockUser')) {
    const defaultUser = {
      id: 'mock-worker-123',
      email: 'student@ums.edu.my',
      user_metadata: {
        full_name: 'Ahmad Rosli',
        role: 'worker'
      }
    };
    localStorage.setItem('mockUser', JSON.stringify(defaultUser));
    localStorage.setItem('userRole', 'worker');
  }

  return {
    auth: {
      async getSession() {
        const mockUser = localStorage.getItem('mockUser');
        return {
          data: {
            session: mockUser ? { user: JSON.parse(mockUser) } : null
          },
          error: null
        };
      },
      async getUser() {
        const mockUser = localStorage.getItem('mockUser');
        return {
          data: {
            user: mockUser ? JSON.parse(mockUser) : null
          },
          error: null
        };
      },
      onAuthStateChange(callback: any) {
        // Trigger once initially
        const mockUser = localStorage.getItem('mockUser');
        const session = mockUser ? { user: JSON.parse(mockUser) } : null;
        setTimeout(() => callback('SIGNED_IN', session), 10);
        return {
          data: {
            subscription: {
              unsubscribe: () => {}
            }
          }
        };
      },
      async signInWithPassword({ email }: any) {
        const role = email.includes('employer') ? 'employer' : 'worker';
        const mockUser = {
          id: role === 'employer' ? 'mock-employer-123' : 'mock-worker-123',
          email,
          user_metadata: {
            full_name: role === 'employer' ? 'Sabah Cafe Owner' : 'Ahmad Rosli',
            role
          }
        };
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        localStorage.setItem('userRole', role);
        return { data: { user: mockUser }, error: null };
      },
      async signUp({ email, options }: any) {
        const role = options?.data?.role || 'worker';
        const mockUser = {
          id: `mock-${role}-${Date.now()}`,
          email,
          user_metadata: {
            full_name: options?.data?.full_name || 'New User',
            role
          }
        };
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        localStorage.setItem('userRole', role);
        return { data: { user: mockUser }, error: null };
      },
      async signOut() {
        localStorage.removeItem('mockUser');
        localStorage.removeItem('userRole');
        return { error: null };
      }
    },
    from(table: string) {
      return new MockQueryBuilder(table);
    },
    channel(name: string) {
      return {
        on(event: string, filter: any, callback: any) {
          return this;
        },
        subscribe() {
          return {
            unsubscribe: () => {}
          };
        }
      };
    }
  } as any;
};

export const supabase = isMockMode
  ? createMockSupabase()
  : createClient(supabaseUrl, supabaseAnonKey);


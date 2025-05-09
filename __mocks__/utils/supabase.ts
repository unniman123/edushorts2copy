import { RealtimeChannel } from '@supabase/supabase-js';

// Mock Supabase client with a valid URL format to avoid "Invalid URL" error
const mockFrom = jest.fn().mockImplementation(() => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockImplementation(() => ({
    data: [],
    error: null,
  })),
  single: jest.fn().mockImplementation(() => ({
    data: null,
    error: null,
  })),
}));

const mockRpc = jest.fn().mockImplementation(() => ({
  data: null,
  error: null,
}));

const mockSubscribe = jest.fn().mockImplementation(callback => {
  callback('SUBSCRIBED');
  return { unsubscribe: jest.fn() };
});

const mockChannel = jest.fn().mockImplementation(() => ({
  on: jest.fn().mockReturnThis(),
  subscribe: mockSubscribe,
}));

const mockAuth = {
  getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
  getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChange: jest.fn(),
  startAutoRefresh: jest.fn(),
  stopAutoRefresh: jest.fn(),
};

const mockRealtime = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  presence: jest.fn(),
};

export const supabase = {
  from: mockFrom,
  rpc: mockRpc,
  channel: mockChannel,
  auth: mockAuth,
  realtime: mockRealtime,
};

export const createChannel = jest.fn().mockImplementation(channelName => ({
  channel: mockChannel(),
  cleanup: jest.fn(),
}));

export const cleanupSupabase = jest.fn();

export const getActiveChannels = jest.fn().mockReturnValue({}); 
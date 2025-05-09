// Mock for @supabase/supabase-js
const mockSubscribe = jest.fn().mockImplementation(callback => {
  callback('SUBSCRIBED');
  return { unsubscribe: jest.fn() };
});

const mockChannel = jest.fn().mockImplementation(() => ({
  on: jest.fn().mockReturnThis(),
  subscribe: mockSubscribe,
}));

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
}));

const mockRpc = jest.fn().mockImplementation(() => ({
  data: null,
  error: null,
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

const createClient = jest.fn().mockImplementation((url, key, options) => {
  // Validate URL format to prevent the "Invalid URL" error
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
  
  return {
    from: mockFrom,
    rpc: mockRpc,
    channel: mockChannel,
    auth: mockAuth,
    realtime: mockRealtime,
  };
});

module.exports = {
  createClient,
}; 
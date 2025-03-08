import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

// Default timeout of 10 seconds
const DEFAULT_TIMEOUT = 10000;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    fetch: async (url, options = {}) => {
      const controller = new AbortController();
      const { signal } = controller;
      
      const timeout = setTimeout(() => {
        controller.abort();
      }, DEFAULT_TIMEOUT);

      try {
        const response = await fetch(url, { ...options, signal });
        clearTimeout(timeout);
        return response;
      } catch (error) {
        clearTimeout(timeout);
        throw error;
      }
    }
  }
});

// Helper to check if error is a timeout
export const isTimeoutError = (error: any): boolean => {
  return error?.name === 'AbortError' || 
         error?.message?.includes('timeout') || 
         error?.message?.includes('aborted');
};

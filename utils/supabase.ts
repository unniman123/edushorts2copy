import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import type { Database } from '../types/supabase';

// Get Supabase URL and anon key from environment variables via app.config.js
const supabaseUrl = 'https://zsnofjypqabqzbfmhvnx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzbm9manlwcWFicXpiZm1odm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5Mzg3NjUsImV4cCI6MjA1NzUxNDc2NX0.bxuCEEEbzdy7WuyA6g73MIbhANsjhl6aGEJ4Dx5iAOA';

console.log('Initializing Supabase with URL:', supabaseUrl);

// Configure Supabase client with optimized settings
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
      fastConnect: true,
    },
    timeout: 1000 * 30, // 30 seconds
    reconnectAfterMs: (retryCount: number) => {
      // Exponential backoff with max delay of 15 seconds
      const delay = Math.min(1000 * Math.pow(2, retryCount), 15000);
      return delay;
    },
  },
  // Platform-specific settings
  db: {
    schema: 'public',
  },
});

// Setup channel for monitoring connection status
const channel = supabase.channel('system');
let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 5;

channel
  .on('system', { event: 'connected' }, () => {
    console.log('Connected to Supabase realtime');
    isConnected = true;
    retryCount = 0;
  })
  .on('system', { event: 'disconnected' }, () => {
    console.log('Disconnected from Supabase realtime');
    isConnected = false;

    // Attempt reconnection if needed
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Attempting reconnection (${retryCount}/${MAX_RETRIES})`);
      setTimeout(async () => {
        try {
          await supabase.realtime.connect();
          await channel.subscribe();
        } catch (error) {
          console.warn('Realtime reconnection failed:', error);
        }
      }, Math.min(1000 * Math.pow(2, retryCount), 15000));
    }
  })
  .subscribe((status) => {
    if (status !== 'SUBSCRIBED') {
      console.error('Failed to subscribe to system channel:', status);
    }
  });

// Handle app state changes
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    // App came to foreground
    supabase.auth.startAutoRefresh();
    if (!isConnected) {
      console.log('Reconnecting to Supabase realtime...');
      supabase.realtime.connect();
    }
  } else {
    // App went to background
    supabase.auth.stopAutoRefresh();
  }
});

// Cleanup function for components to use
export const cleanupSupabase = () => {
  supabase.realtime.disconnect();
  isConnected = false;
  retryCount = 0;
};

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native'; // Removed Platform import
import Constants from 'expo-constants';
import type { Database } from '../types/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Get Supabase URL and anon key from app.config.js extra field via Constants
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("supabaseUrl and supabaseAnonKey are required.");
}

// Configure Supabase client with optimized settings
// Use type assertion ! because we check above, or provide default values/handle error
export const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
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
      // More gradual exponential backoff
      const minDelay = 1000; // Start with 1 second
      const maxDelay = 30000; // Cap at 30 seconds
      return Math.min(minDelay * Math.pow(1.5, retryCount), maxDelay);
    },
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'X-Client-Info': 'expo-react-native' },
  }
});

let activeChannels: Record<string, RealtimeChannel> = {};
let reconnectTimers: Record<string, NodeJS.Timeout> = {};
const MAX_RETRIES = 3;

export const createChannel = (channelName: string) => {
  // Check for existing channel
  if (activeChannels[channelName]) {
    return {
      channel: activeChannels[channelName],
      cleanup: () => cleanupChannel(channelName)
    };
  }

  let retryCount = 0;
  console.log(`Creating new channel: ${channelName}`);
  const channel = supabase.channel(channelName);

  const setupChannel = () => {
    channel.subscribe(async (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => {
      console.log(`Channel ${channelName} status: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log(`Successfully subscribed to ${channelName}`);
        activeChannels[channelName] = channel;
        retryCount = 0;

        if (reconnectTimers[channelName]) {
          clearTimeout(reconnectTimers[channelName]);
          delete reconnectTimers[channelName];
        }
      } else if (status === 'CHANNEL_ERROR' && retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Retrying connection to ${channelName} (${retryCount}/${MAX_RETRIES})`);

        if (reconnectTimers[channelName]) {
          clearTimeout(reconnectTimers[channelName]);
        }

        const delay = Math.min(1000 * Math.pow(1.5, retryCount), 15000);
        reconnectTimers[channelName] = setTimeout(async () => {
          if (activeChannels[channelName]) {
            await channel.unsubscribe();
            delete activeChannels[channelName];
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay before retry
            setupChannel();
          }
        }, delay);
      }
    });
  };

  setupChannel(); // Initial setup

  return {
    channel,
    cleanup: () => cleanupChannel(channelName)
  };
};

const cleanupChannel = (channelName: string) => {
  if (reconnectTimers[channelName]) {
    clearTimeout(reconnectTimers[channelName]);
    delete reconnectTimers[channelName];
  }
  if (activeChannels[channelName]) {
    activeChannels[channelName].unsubscribe();
    delete activeChannels[channelName];
  }
};

// Initialize realtime connection with auth state check
const initializeRealtime = async () => {
  console.log('Initializing realtime connection...');
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('No active session found, delaying realtime connection');
      return;
    }

    console.log('Connecting to realtime...');
    await supabase.realtime.connect();
    console.log('Realtime connection established successfully');
  } catch (error) {
    console.error('Error connecting to realtime:', error);
  }
};

// Handle app state changes
AppState.addEventListener('change', (state) => {
  console.log('App state changed:', state);
  if (state === 'active') {
    console.log('App became active, starting auto refresh...');
    supabase.auth.startAutoRefresh();
    // Add delay to ensure auth is ready
    setTimeout(() => {
      console.log('Initializing realtime after app became active...');
      initializeRealtime().then(() => {
        // Longer delay for channel resubscription
        setTimeout(() => {
          console.log('Resubscribing to active channels...');
          Object.entries(activeChannels).forEach(([name, channel]) => {
            try {
              console.log(`Attempting to resubscribe to channel: ${name}`);
              channel.subscribe();
            } catch (error) {
              console.error(`Error resubscribing to ${name}:`, error);
            }
          });
        }, 2000);
      });
    }, 500);
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// Initial connection
initializeRealtime();

export const cleanupSupabase = () => {
  // Clear all reconnect timers
  Object.keys(reconnectTimers).forEach(channelName => {
    clearTimeout(reconnectTimers[channelName]);
    delete reconnectTimers[channelName];
  });

  // Cleanup all channels
  Object.keys(activeChannels).forEach(cleanupChannel);
  activeChannels = {};

  // Disconnect realtime
  supabase.realtime.disconnect();
  console.log('Cleaned up Supabase channels and connections');
};

export const getActiveChannels = () => activeChannels;

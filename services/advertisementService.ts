import { supabase } from '../utils/supabase';
import { Advertisement } from '../types/advertisement';
import { Linking } from 'react-native';

const getActiveAdvertisements = async (): Promise<Advertisement[]> => {
  try {
    console.log('Debug - Fetching active advertisements');
    const { data, error } = await supabase
      .from('advertisements')
      .select(`
        id,
        title,
        image_path,
        cta_link,
        cta_text,
        is_active,
        display_frequency,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('Debug - No active advertisements found');
      return [];
    }

    console.log('Debug - Fetched advertisements:', data);
    return data;
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    throw error;
  }
};

const trackAdImpression = async (adId: string) => {
  try {
    const { error } = await supabase.rpc('increment_ad_impression', { ad_id: adId });
    if (error) {
      console.error("Error tracking impression:", error);
    }
  } catch (error) {
    console.error("Error tracking ad impression:", error);
  }
};

const handleAdClick = async (adId: string, ctaLink: string) => {
  try {
    const { error } = await supabase.rpc('increment_ad_click', { ad_id: adId });
    if (error) {
      console.error("Error tracking click:", error);
    }

    const supported = await Linking.canOpenURL(ctaLink);
    if (supported) {
      await Linking.openURL(ctaLink);
    } else {
      console.error("URL not supported:", ctaLink);
    }
  } catch (error) {
    console.error("Error handling ad click:", error);
  }
};

export const advertisementService = {
  getActiveAdvertisements,
  trackAdImpression,
  handleAdClick
};

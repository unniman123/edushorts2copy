import { supabase } from '../utils/supabase';
import { Advertisement } from '../types/advertisement';
import { Linking } from 'react-native';

const getActiveAdvertisements = async (): Promise<Advertisement[]> => {
  try {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching advertisements:", error);
    throw error;
  }
};

const trackAdImpression = async (adId: string) => {
  try {
    // Update impressions count in Supabase
    await supabase.rpc('increment_ad_impression', { ad_id: adId });
  } catch (error) {
    console.error("Error tracking ad impression:", error);
  }
};

const handleAdClick = async (adId: string, ctaLink: string) => {
  try {
    // Update clicks count in Supabase
    await supabase.rpc('increment_ad_click', { ad_id: adId });

    // Open the CTA link
    const supported = await Linking.canOpenURL(ctaLink);
    if (supported) {
      await Linking.openURL(ctaLink);
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

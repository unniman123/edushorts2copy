import { supabase } from '../utils/supabase';

export const searchArticles = async (query: string) => {
  try {
    const { data, error } = await supabase.rpc('search_articles', { query });
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
};
import { format } from 'date-fns';

export interface Article {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  timeAgo: string;
  imageUrl: string;
  sourceIconUrl: string;
  url: string;
  content: string;
}

interface DatabaseArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_path: string;
  categories?: {
    name: string;
  } | null;
  created_at: string;
  created_by: string;
}


// Helper function to calculate time ago
const getTimeAgo = (date: string) => {
  const now = new Date();
  const articleDate = new Date(date);
  const diffInHours = Math.floor((now.getTime() - articleDate.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  if (diffInHours < 48) return 'Yesterday';
  return format(articleDate, 'MMM d, yyyy');
};

export const adaptArticle = (dbArticle: DatabaseArticle): Article => {
  const SUPABASE_STORAGE_URL = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_URL;

  return {
    id: dbArticle.id,
    title: dbArticle.title,
    summary: dbArticle.summary,
    content: dbArticle.content,
    category: dbArticle.categories?.name || 'Uncategorized',
    source: 'Global Edu',  // Default source for admin-created articles
    timeAgo: getTimeAgo(dbArticle.created_at),
    imageUrl: `${SUPABASE_STORAGE_URL}/article-images/${dbArticle.image_path}`,
    sourceIconUrl: 'https://api.a0.dev/assets/image?text=GE%20logo&aspect=1:1&seed=123', // Default icon
    url: '', // Internal articles don't have external URLs
  };
};

export const adaptArticles = (dbArticles: DatabaseArticle[]): Article[] => {
  return dbArticles.map(adaptArticle);
};

// For mock data fallback
export const isMockMode = () => {
  return process.env.EXPO_PUBLIC_USE_MOCK === 'true';
};

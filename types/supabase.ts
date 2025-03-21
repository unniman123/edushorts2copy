export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      news: {
        Row: {
          id: string
          title: string
          summary: string
          content: string | null
          image_path: string | null
          category_id: string | null
          source_url: string | null
          source_name: string | null
          source_icon: string | null
          status: 'draft' | 'published'
          view_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          summary: string
          content?: string | null
          image_path?: string | null
          category_id?: string | null
          source_url?: string | null
          source_name?: string | null
          source_icon?: string | null
          status?: 'draft' | 'published'
          view_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          summary?: string
          content?: string | null
          image_path?: string | null
          category_id?: string | null
          source_url?: string | null
          source_name?: string | null
          source_icon?: string | null
          status?: 'draft' | 'published'
          view_count?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean
          article_count: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean
          article_count?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean
          article_count?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      news_status: 'draft' | 'published'
    }
  }
}

// Export Row types for easier usage
export type NewsRow = Database['public']['Tables']['news']['Row']
export type CategoryRow = Database['public']['Tables']['categories']['Row']

// Define the Article interface that maps to our news table
export interface Article extends NewsRow {
  category?: CategoryRow
  timeAgo?: string // For UI display
}

// Type guard to check if an object is an Article
export function isArticle(obj: any): obj is Article {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.summary === 'string' &&
    (obj.status === 'draft' || obj.status === 'published')
  )
}

// Helper type for real-time subscription payloads
export type RealtimeNewsPayload = {
  new: NewsRow
  old: NewsRow
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
}

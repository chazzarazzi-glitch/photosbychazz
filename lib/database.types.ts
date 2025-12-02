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
      events: {
        Row: {
          id: string
          slug: string
          display_name: string | null
          cover_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          display_name?: string | null
          cover_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          display_name?: string | null
          cover_image_url?: string | null
          created_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          event_id: string
          image_url: string
          is_visible: boolean
          taken_at: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          image_url: string
          is_visible?: boolean
          taken_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          image_url?: string
          is_visible?: boolean
          taken_at?: string
          created_at?: string
        }
      }
    }
  }
}

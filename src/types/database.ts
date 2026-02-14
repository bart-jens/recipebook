export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      recipe_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          recipe_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          recipe_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          recipe_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_images_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          id: string
          ingredient_name: string
          notes: string | null
          order_index: number
          quantity: number | null
          recipe_id: string
          unit: string | null
        }
        Insert: {
          id?: string
          ingredient_name: string
          notes?: string | null
          order_index: number
          quantity?: number | null
          recipe_id: string
          unit?: string | null
        }
        Update: {
          id?: string
          ingredient_name?: string
          notes?: string | null
          order_index?: number
          quantity?: number | null
          recipe_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ratings: {
        Row: {
          cooked_date: string | null
          created_at: string
          id: string
          notes: string | null
          rating: number
          recipe_id: string
          user_id: string
        }
        Insert: {
          cooked_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating: number
          recipe_id: string
          user_id: string
        }
        Update: {
          cooked_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_tags: {
        Row: {
          id: string
          recipe_id: string
          tag: string
        }
        Insert: {
          id?: string
          recipe_id: string
          tag: string
        }
        Update: {
          id?: string
          recipe_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_tags_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cook_time_minutes: number | null
          created_at: string
          created_by: string
          description: string | null
          forked_from_id: string | null
          id: string
          instructions: string | null
          is_favorite: boolean
          prep_time_minutes: number | null
          published_at: string | null
          servings: number | null
          source_image_path: string | null
          source_type: string
          source_url: string | null
          sponsored: boolean
          sponsor_metadata: Json | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          cook_time_minutes?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          forked_from_id?: string | null
          id?: string
          instructions?: string | null
          is_favorite?: boolean
          prep_time_minutes?: number | null
          published_at?: string | null
          servings?: number | null
          source_image_path?: string | null
          source_type?: string
          source_url?: string | null
          sponsored?: boolean
          sponsor_metadata?: Json | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          cook_time_minutes?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          forked_from_id?: string | null
          id?: string
          instructions?: string | null
          is_favorite?: boolean
          prep_time_minutes?: number | null
          published_at?: string | null
          servings?: number | null
          source_image_path?: string | null
          source_type?: string
          source_url?: string | null
          sponsored?: boolean
          sponsor_metadata?: Json | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_forked_from_id_fkey"
            columns: ["forked_from_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string
          avatar_url: string | null
          bio: string | null
          role: string
          plan: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name: string
          avatar_url?: string | null
          bio?: string | null
          role?: string
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string
          avatar_url?: string | null
          bio?: string | null
          role?: string
          plan?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          id: string
          tagline: string | null
          website_url: string | null
          social_links: Json
          is_verified: boolean
          subscriber_count: number
          created_at: string
        }
        Insert: {
          id: string
          tagline?: string | null
          website_url?: string | null
          social_links?: Json
          is_verified?: boolean
          subscriber_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          tagline?: string | null
          website_url?: string | null
          social_links?: Json
          is_verified?: boolean
          subscriber_count?: number
          created_at?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: []
      }
      creator_subscriptions: {
        Row: {
          id: string
          subscriber_id: string
          creator_id: string
          status: string
          started_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          subscriber_id: string
          creator_id: string
          status?: string
          started_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          subscriber_id?: string
          creator_id?: string
          status?: string
          started_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          id: string
          invited_by: string
          email: string
          code: string
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invited_by: string
          email: string
          code: string
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invited_by?: string
          email?: string
          code?: string
          used_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      recipe_analytics: {
        Row: {
          id: string
          recipe_id: string
          event_type: string
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          event_type: string
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          event_type?: string
          user_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_analytics_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

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
      collection_recipes: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          recipe_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          recipe_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_recipes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cook_log: {
        Row: {
          cooked_at: string
          created_at: string
          id: string
          notes: string | null
          recipe_id: string
          user_id: string
        }
        Insert: {
          cooked_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          recipe_id: string
          user_id: string
        }
        Update: {
          cooked_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cook_log_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          social_links: Json
          subscriber_count: number
          tagline: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id: string
          is_verified?: boolean
          social_links?: Json
          subscriber_count?: number
          tagline?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          social_links?: Json
          subscriber_count?: number
          tagline?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      creator_subscriptions: {
        Row: {
          creator_id: string
          expires_at: string | null
          id: string
          started_at: string
          status: string
          subscriber_id: string
        }
        Insert: {
          creator_id: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          subscriber_id: string
        }
        Update: {
          creator_id?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          subscriber_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          app_version: string | null
          created_at: string
          id: string
          message: string
          metadata: Json
          platform: string
          source_screen: string | null
          status: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          platform: string
          source_screen?: string | null
          status?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          platform?: string
          source_screen?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      follow_requests: {
        Row: {
          created_at: string
          id: string
          requester_id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requester_id: string
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requester_id?: string
          target_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          email: string
          id: string
          invited_by: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          id?: string
          invited_by: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          used_at?: string | null
        }
        Relationships: []
      }
      recipe_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          recipe_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          recipe_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          recipe_id?: string
          user_id?: string | null
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
      recipe_favorites: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_favorites_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_images: {
        Row: {
          created_at: string
          id: string
          image_type: string
          is_primary: boolean
          recipe_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_type?: string
          is_primary?: boolean
          recipe_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          image_type?: string
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
      recipe_shares: {
        Row: {
          id: string
          notes: string | null
          recipe_id: string
          shared_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          recipe_id: string
          shared_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          recipe_id?: string
          shared_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_shares_recipe_id_fkey"
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
          image_url: string | null
          instructions: string | null
          language: string | null
          prep_time_minutes: number | null
          published_at: string | null
          servings: number | null
          source_image_path: string | null
          source_name: string | null
          source_type: string
          source_url: string | null
          sponsor_metadata: Json | null
          sponsored: boolean
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
          image_url?: string | null
          instructions?: string | null
          language?: string | null
          prep_time_minutes?: number | null
          published_at?: string | null
          servings?: number | null
          source_image_path?: string | null
          source_name?: string | null
          source_type?: string
          source_url?: string | null
          sponsor_metadata?: Json | null
          sponsored?: boolean
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
          image_url?: string | null
          instructions?: string | null
          language?: string | null
          prep_time_minutes?: number | null
          published_at?: string | null
          servings?: number | null
          source_image_path?: string | null
          source_name?: string | null
          source_type?: string
          source_url?: string | null
          sponsor_metadata?: Json | null
          sponsored?: boolean
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
      shopping_list_items: {
        Row: {
          created_at: string
          id: string
          ingredient_name: string
          is_checked: boolean
          quantity: number | null
          recipe_ids: string[]
          shopping_list_id: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_name: string
          is_checked?: boolean
          quantity?: number | null
          recipe_ids?: string[]
          shopping_list_id: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_name?: string
          is_checked?: boolean
          quantity?: number | null
          recipe_ids?: string[]
          shopping_list_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_recipes: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_private: boolean
          last_seen_followers_at: string
          onboarded_at: string | null
          plan: string
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id: string
          is_private?: boolean
          last_seen_followers_at?: string
          onboarded_at?: string | null
          plan?: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_private?: boolean
          last_seen_followers_at?: string
          onboarded_at?: string | null
          plan?: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      activity_feed_view: {
        Row: {
          event_at: string | null
          event_type: string | null
          notes: string | null
          recipe_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      recipe_share_cards: {
        Row: {
          image_url: string | null
          recipe_id: string | null
          share_id: string | null
          share_notes: string | null
          shared_at: string | null
          source_name: string | null
          source_type: string | null
          source_url: string | null
          tags: string[] | null
          title: string | null
          user_id: string | null
          user_rating: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_shares_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_recipe_to_shopping_list: {
        Args: { p_recipe_id: string; p_shopping_list_id: string }
        Returns: {
          created_at: string
          id: string
          ingredient_name: string
          is_checked: boolean
          quantity: number | null
          recipe_ids: string[]
          shopping_list_id: string
          unit: string | null
        }[]
      }
      clear_checked_items: {
        Args: { p_shopping_list_id: string }
        Returns: undefined
      }
      recipe_exists: {
        Args: { p_recipe_id: string }
        Returns: boolean
      }
      get_activity_feed: {
        Args: { p_before?: string; p_limit?: number; p_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          event_at: string
          event_type: string
          notes: string
          recipe_id: string
          recipe_image_url: string
          recipe_title: string
          user_id: string
        }[]
      }
      get_chef_profile: { Args: { p_chef_id: string }; Returns: Json }
      get_new_follower_count: { Args: { p_user_id: string }; Returns: number }
      get_new_followers: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          followed_at: string
          follower_id: string
        }[]
      }
      mark_followers_seen: { Args: never; Returns: undefined }
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

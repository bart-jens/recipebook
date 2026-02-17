export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      collections: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          cover_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          cover_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_recipes: {
        Row: {
          id: string
          collection_id: string
          recipe_id: string
          added_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          recipe_id: string
          added_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          recipe_id?: string
          added_at?: string
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
      cook_log: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          cooked_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          cooked_at?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          cooked_at?: string
          notes?: string | null
          created_at?: string
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
      saved_recipes: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          created_at?: string
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
      recipe_favorites: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          created_at?: string
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
      recipe_shares: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          notes: string | null
          shared_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          notes?: string | null
          shared_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          notes?: string | null
          shared_at?: string
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

          prep_time_minutes: number | null
          published_at: string | null
          servings: number | null
          source_image_path: string | null
          source_name: string | null
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
          image_url?: string | null
          instructions?: string | null

          prep_time_minutes?: number | null
          published_at?: string | null
          servings?: number | null
          source_image_path?: string | null
          source_name?: string | null
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
          image_url?: string | null
          instructions?: string | null

          prep_time_minutes?: number | null
          published_at?: string | null
          servings?: number | null
          source_image_path?: string | null
          source_name?: string | null
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
          is_private: boolean
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
          is_private?: boolean
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
          is_private?: boolean
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
      follow_requests: {
        Row: {
          id: string
          requester_id: string
          target_id: string
          created_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          target_id: string
          created_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          target_id?: string
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
      recipe_share_cards: {
        Row: {
          share_id: string
          user_id: string
          recipe_id: string
          share_notes: string | null
          shared_at: string
          title: string
          source_url: string | null
          source_name: string | null
          source_type: string
          image_url: string | null
          tags: string[] | null
          user_rating: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_activity_feed: {
        Args: {
          p_user_id: string
          p_before?: string
          p_limit?: number
        }
        Returns: {
          event_type: string
          user_id: string
          recipe_id: string
          event_at: string
          notes: string | null
          display_name: string | null
          avatar_url: string | null
          recipe_title: string | null
          recipe_image_url: string | null
        }[]
      }
      get_chef_profile: {
        Args: {
          p_chef_id: string
        }
        Returns: Json
      }
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

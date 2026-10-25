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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appa_bath_rewards: {
        Row: {
          coins: number
          day: string
          exp: number
          space_id: string
          user_id: string
        }
        Insert: {
          coins?: number
          day: string
          exp?: number
          space_id: string
          user_id: string
        }
        Update: {
          coins?: number
          day?: string
          exp?: number
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appa_bath_rewards_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appa_bath_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appa_furniture: {
        Row: {
          category: string
          cost: number
          created_at: string
          item: string
          purchased_by: string
          room: string | null
          space_id: string
          pos_x?: number | null
          pos_y?: number | null
          flipped?: boolean | null
          variant?: string | null
        }
        Insert: {
          category: string
          cost: number
          created_at?: string
          item: string
          purchased_by: string
          room?: string | null
          space_id: string
        }
        Update: {
          category?: string
          cost?: number
          created_at?: string
          item?: string
          purchased_by?: string
          room?: string | null
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appa_furniture_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appa_furniture_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      appa_house_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          read_at: string | null
          room: string
          space_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          room: string
          space_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          room?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appa_house_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appa_house_notes_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      appa_game_results: {
        Row: {
          coins: number
          created_at: string
          day: string
          exp: number
          game: string
          score: number
          space_id: string
          user_id: string
        }
        Insert: {
          coins: number
          created_at?: string
          day: string
          exp: number
          game: string
          score: number
          space_id: string
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          day?: string
          exp?: number
          game?: string
          score?: number
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appa_game_results_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appa_game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appa_interactions: {
        Row: {
          action: string
          coins: number
          created_at: string
          day: string
          space_id: string
          user_id: string
        }
        Insert: {
          action: string
          coins: number
          created_at?: string
          day: string
          space_id: string
          user_id: string
        }
        Update: {
          action?: string
          coins?: number
          created_at?: string
          day?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appa_interactions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appa_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appa_outfits: {
        Row: {
          cost: number
          created_at: string
          equipped: boolean
          item: string
          purchased_by: string
          space_id: string
        }
        Insert: {
          cost: number
          created_at?: string
          equipped?: boolean
          item: string
          purchased_by: string
          space_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          equipped?: boolean
          item?: string
          purchased_by?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appa_outfits_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      appa_purchases: {
        Row: {
          consumed_at: string | null
          cost: number
          created_at: string
          exp: number
          food: string
          id: string
          space_id: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          cost: number
          created_at?: string
          exp: number
          food: string
          id?: string
          space_id: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          cost?: number
          created_at?: string
          exp?: number
          food?: string
          id?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appa_purchases_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appa_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appa_state: {
        Row: {
          bath_stage: string
          energy: number
          happiness: number
          hunger: number
          hygiene: number
          hygiene_updated_at: string
          sleeping_since: string | null
          space_id: string
          updated_at: string
          pos_x?: number | null
          pos_y?: number | null
          facing?: 'left' | 'right' | null
          current_room?: 'sala' | 'cocina' | 'dormitorio' | 'bano' | null
        }
        Insert: {
          bath_stage?: string
          energy?: number
          happiness?: number
          hunger?: number
          hygiene?: number
          hygiene_updated_at?: string
          sleeping_since?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          bath_stage?: string
          energy?: number
          happiness?: number
          hunger?: number
          hygiene?: number
          hygiene_updated_at?: string
          sleeping_since?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appa_state_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: true
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_messages: {
        Row: {
          approval: string
          author_id: string
          category: string
          content: string
          created_at: string
          id: string
          scheduled_date: string | null
          space_id: string
          updated_at: string
        }
        Insert: {
          approval?: string
          author_id: string
          category: string
          content: string
          created_at?: string
          id?: string
          scheduled_date?: string | null
          space_id: string
          updated_at?: string
        }
        Update: {
          approval?: string
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          scheduled_date?: string | null
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_messages_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      capsule_contents: {
        Row: {
          capsule_id: string
          content: string
          photo_data: string | null
        }
        Insert: {
          capsule_id: string
          content?: string
          photo_data?: string | null
        }
        Update: {
          capsule_id?: string
          content?: string
          photo_data?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "capsule_contents_capsule_id_fkey"
            columns: ["capsule_id"]
            isOneToOne: true
            referencedRelation: "time_capsules"
            referencedColumns: ["id"]
          },
        ]
      }
      care_rituals: {
        Row: {
          claimed_by: string
          coins: number
          created_at: string
          day: string
          exp: number
          space_id: string
        }
        Insert: {
          claimed_by: string
          coins?: number
          created_at?: string
          day: string
          exp?: number
          space_id: string
        }
        Update: {
          claimed_by?: string
          coins?: number
          created_at?: string
          day?: string
          exp?: number
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_rituals_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_gifts: {
        Row: {
          created_at: string
          gift_id: string
          id: string
          message: string
          opened_at: string | null
          recipient_id: string
          sender_id: string
          space_id: string
          title: string
        }
        Insert: {
          created_at?: string
          gift_id: string
          id?: string
          message?: string
          opened_at?: string | null
          recipient_id: string
          sender_id: string
          space_id: string
          title: string
        }
        Update: {
          created_at?: string
          gift_id?: string
          id?: string
          message?: string
          opened_at?: string | null
          recipient_id?: string
          sender_id?: string
          space_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_gifts_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_gifts_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_gifts_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_quiz_questions: {
        Row: {
          category: string
          created_at: string
          id: string
          order_index: number
          question: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          order_index?: number
          question: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          order_index?: number
          question?: string
        }
        Relationships: []
      }
      couple_quiz_rounds: {
        Row: {
          created_at: string
          day: string
          id: string
          question_id: string
          revealed_at: string | null
          space_id: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          question_id: string
          revealed_at?: string | null
          space_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          question_id?: string
          revealed_at?: string | null
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_quiz_rounds_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "couple_quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_quiz_rounds_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_quiz_answers: {
        Row: {
          created_at: string
          guess_partner_answer: string | null
          id: string
          my_answer: string
          round_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guess_partner_answer?: string | null
          id?: string
          my_answer: string
          round_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          guess_partner_answer?: string | null
          id?: string
          my_answer?: string
          round_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couple_quiz_answers_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "couple_quiz_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      correspondence: {
        Row: {
          author_id: string
          content: string
          created_at: string
          folder: string | null
          id: string
          kind: string
          space_id: string
          title: string
          theme?: 'classic' | 'l_investigation' | null
          scheduled_at?: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          folder?: string | null
          id?: string
          kind: string
          space_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          folder?: string | null
          id?: string
          kind?: string
          space_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "correspondence_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "correspondence_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      correspondence_reads: {
        Row: {
          first_read_at: string
          last_read_at: string
          text_id: string
          user_id: string
        }
        Insert: {
          first_read_at?: string
          last_read_at?: string
          text_id: string
          user_id: string
        }
        Update: {
          first_read_at?: string
          last_read_at?: string
          text_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "correspondence_reads_text_id_fkey"
            columns: ["text_id"]
            isOneToOne: false
            referencedRelation: "correspondence"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_emotions: {
        Row: {
          day: string
          emotion: string
          space_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          day?: string
          emotion: string
          space_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          day?: string
          emotion?: string
          space_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_emotions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_emotions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_history: {
        Row: {
          author_name: string
          category: string
          content: string
          day: string
          message_id: string
          published_at: string
          space_id: string
        }
        Insert: {
          author_name: string
          category: string
          content: string
          day: string
          message_id: string
          published_at?: string
          space_id: string
        }
        Update: {
          author_name?: string
          category?: string
          content?: string
          day?: string
          message_id?: string
          published_at?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_history_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_attempts: {
        Row: {
          attempted_at: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      item_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          journal_id: string | null
          memory_id: string | null
          space_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          journal_id?: string | null
          memory_id?: string | null
          space_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          journal_id?: string | null
          memory_id?: string | null
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_comments_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_comments_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_comments_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      item_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          journal_id: string | null
          memory_id: string | null
          space_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          journal_id?: string | null
          memory_id?: string | null
          space_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          journal_id?: string | null
          memory_id?: string | null
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_reactions_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_reactions_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_reactions_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          archived_at: string | null
          author_id: string
          content: string
          created_at: string
          entry_date: string
          id: string
          kind: string
          space_id: string
          title: string
          theme?: 'classic' | 'l_investigation' | null
          scheduled_at?: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          author_id: string
          content: string
          created_at?: string
          entry_date: string
          id?: string
          kind: string
          space_id: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          author_id?: string
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          kind?: string
          space_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lily_plant: {
        Row: {
          care_count: number
          drain_at?: string
          feed_at: string
          last_by: string | null
          pests_at: string
          prune_at: string
          song_at: string | null
          space_id: string
          sun_at: string
          updated_at: string
          water_at: string
        }
        Insert: {
          care_count?: number
          drain_at?: string
          feed_at?: string
          last_by?: string | null
          pests_at?: string
          prune_at?: string
          song_at?: string | null
          space_id: string
          sun_at?: string
          updated_at?: string
          water_at?: string
        }
        Update: {
          care_count?: number
          drain_at?: string
          feed_at?: string
          last_by?: string | null
          pests_at?: string
          prune_at?: string
          song_at?: string | null
          space_id?: string
          sun_at?: string
          updated_at?: string
          water_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lily_plant_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: true
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          archived_at: string | null
          author_id: string
          created_at: string
          description: string
          id: string
          memory_date: string
          photo_path: string
          space_id: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          author_id: string
          created_at?: string
          description?: string
          id?: string
          memory_date: string
          photo_path: string
          space_id: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          author_id?: string
          created_at?: string
          description?: string
          id?: string
          memory_date?: string
          photo_path?: string
          space_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      private_spaces: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          owner_id: string
          partner_email: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          owner_id: string
          partner_email?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          partner_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_spaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string
          created_at: string
          display_name: string
          id: string
          nickname: string
          preferences: Json
        }
        Insert: {
          avatar?: string
          created_at?: string
          display_name?: string
          id: string
          nickname?: string
          preferences?: Json
        }
        Update: {
          avatar?: string
          created_at?: string
          display_name?: string
          id?: string
          nickname?: string
          preferences?: Json
        }
        Relationships: []
      }
      space_config: {
        Row: {
          admin_email: string
          singleton: boolean
        }
        Insert: {
          admin_email: string
          singleton?: boolean
        }
        Update: {
          admin_email?: string
          singleton?: boolean
        }
        Relationships: []
      }
      space_confirmations: {
        Row: {
          action: string
          expires_at: string
          id: string
          space_id: string
          user_id: string
        }
        Insert: {
          action: string
          expires_at?: string
          id?: string
          space_id: string
          user_id: string
        }
        Update: {
          action?: string
          expires_at?: string
          id?: string
          space_id?: string
          user_id?: string
        }
        Relationships: []
      }
      space_departures: {
        Row: {
          departed_at: string
          space_id: string
          user_id: string
        }
        Insert: {
          departed_at?: string
          space_id: string
          user_id: string
        }
        Update: {
          departed_at?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_departures_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_departures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      space_invites: {
        Row: {
          code_hash: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          revoked_at: string | null
          space_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          revoked_at?: string | null
          space_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          revoked_at?: string | null
          space_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_invites_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      special_dates: {
        Row: {
          archived_at: string | null
          author_id: string
          category: string
          created_at: string
          description: string
          event_date: string
          id: string
          name: string
          reminder_days: number | null
          repeats_yearly: boolean
          space_id: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          author_id: string
          category: string
          created_at?: string
          description?: string
          event_date: string
          id?: string
          name: string
          reminder_days?: number | null
          repeats_yearly?: boolean
          space_id: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          author_id?: string
          category?: string
          created_at?: string
          description?: string
          event_date?: string
          id?: string
          name?: string
          reminder_days?: number | null
          repeats_yearly?: boolean
          space_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "special_dates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "special_dates_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      spiritual_checkins: {
        Row: {
          created_at: string
          day: string
          space_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          space_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spiritual_checkins_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spiritual_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spiritual_items: {
        Row: {
          answered_at: string | null
          author_id: string
          content: string
          created_at: string
          id: string
          kind: string
          reference: string
          space_id: string
          title: string
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          author_id: string
          content?: string
          created_at?: string
          id?: string
          kind: string
          reference?: string
          space_id: string
          title: string
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          kind?: string
          reference?: string
          space_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spiritual_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spiritual_items_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      time_capsules: {
        Row: {
          author_id: string
          created_at: string
          id: string
          kind: string
          opens_at: string
          space_id: string
          title: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          kind: string
          opens_at: string
          space_id: string
          title: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          kind?: string
          opens_at?: string
          space_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_capsules_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_capsules_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          space_id: string
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["app_role"]
          space_id: string
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      word_boards: {
        Row: {
          created_at: string
          day: string
          grid: Json
          space_id: string
          words: string[]
        }
        Insert: {
          created_at?: string
          day: string
          grid: Json
          space_id: string
          words: string[]
        }
        Update: {
          created_at?: string
          day?: string
          grid?: Json
          space_id?: string
          words?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "word_boards_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      word_favorites: {
        Row: {
          created_at: string
          text_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          text_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          text_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_favorites_text_id_fkey"
            columns: ["text_id"]
            isOneToOne: false
            referencedRelation: "correspondence"
            referencedColumns: ["id"]
          },
        ]
      }
      word_finds: {
        Row: {
          coins: number
          created_at: string
          day: string
          exp: number
          space_id: string
          user_id: string
          word: string
        }
        Insert: {
          coins?: number
          created_at?: string
          day: string
          exp?: number
          space_id: string
          user_id: string
          word: string
        }
        Update: {
          coins?: number
          created_at?: string
          day?: string
          exp?: number
          space_id?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_finds_space_id_day_fkey"
            columns: ["space_id", "day"]
            isOneToOne: false
            referencedRelation: "word_boards"
            referencedColumns: ["space_id", "day"]
          },
          {
            foreignKeyName: "word_finds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      word_level_boards: {
        Row: {
          created_at: string
          grid: Json
          level: number
          size: number
          space_id: string
          words: string[]
        }
        Insert: {
          created_at?: string
          grid: Json
          level: number
          size: number
          space_id: string
          words: string[]
        }
        Update: {
          created_at?: string
          grid?: Json
          level?: number
          size?: number
          space_id?: string
          words?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "word_level_boards_level_fkey"
            columns: ["level"]
            isOneToOne: false
            referencedRelation: "word_level_catalog"
            referencedColumns: ["level"]
          },
          {
            foreignKeyName: "word_level_boards_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
        ]
      }
      word_level_catalog: {
        Row: {
          level: number
          size: number
          words: string[]
        }
        Insert: {
          level: number
          size: number
          words: string[]
        }
        Update: {
          level?: number
          size?: number
          words?: string[]
        }
        Relationships: []
      }
      word_level_completions: {
        Row: {
          coins: number
          created_at: string
          exp: number
          level: number
          space_id: string
          user_id: string
        }
        Insert: {
          coins?: number
          created_at?: string
          exp?: number
          level: number
          space_id: string
          user_id: string
        }
        Update: {
          coins?: number
          created_at?: string
          exp?: number
          level?: number
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_level_completions_space_id_level_fkey"
            columns: ["space_id", "level"]
            isOneToOne: true
            referencedRelation: "word_level_boards"
            referencedColumns: ["space_id", "level"]
          },
        ]
      }
      word_level_finds: {
        Row: {
          coins: number
          created_at: string
          exp: number
          level: number
          space_id: string
          user_id: string
          word: string
        }
        Insert: {
          coins?: number
          created_at?: string
          exp?: number
          level: number
          space_id: string
          user_id: string
          word: string
        }
        Update: {
          coins?: number
          created_at?: string
          exp?: number
          level?: number
          space_id?: string
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_level_finds_space_id_level_fkey"
            columns: ["space_id", "level"]
            isOneToOne: false
            referencedRelation: "word_level_boards"
            referencedColumns: ["space_id", "level"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_item_comment: {
        Args: { p_content: string; p_id: string; p_type: string }
        Returns: string
      }
      appa_balance: { Args: { p_space: string }; Returns: number }
      appa_bathe: { Args: { p_step: string }; Returns: Json }
      appa_buy_food: { Args: { p_food: string }; Returns: number }
      appa_buy_furniture: { Args: { p_item: string }; Returns: undefined }
      appa_buy_outfit: { Args: { p_item: string }; Returns: undefined }
      appa_care: {
        Args: { p_kind: string; p_purchase?: string }
        Returns: Json
      }
      appa_finish_game: {
        Args: { p_game: string; p_score: number }
        Returns: Json
      }
      appa_interact: { Args: { p_action: string }; Returns: number }
      appa_place_furniture: {
        Args: { p_item: string; p_room?: string }
        Returns: undefined
      }
      appa_move: {
        Args: { p_facing?: string; p_pos_x: number; p_pos_y: number; p_room: string }
        Returns: undefined
      }
      appa_save_furniture_layout: {
        Args: { p_flipped?: boolean; p_item: string; p_pos_x: number; p_pos_y: number; p_room: string; p_variant?: string }
        Returns: undefined
      }
      appa_leave_note: {
        Args: { p_content: string; p_room: string }
        Returns: string
      }
      appa_read_note: {
        Args: { p_id: string }
        Returns: undefined
      }
      appa_wear_outfit: { Args: { p_item: string }; Returns: undefined }
      begin_space_change: { Args: { p_action: string }; Returns: string }
      build_word_grid: {
        Args: { p_size: number; p_words: string[] }
        Returns: Json
      }
      claim_daily_ritual: { Args: never; Returns: Json }
      confirm_space_change: {
        Args: { p_phrase: string; p_token: string }
        Returns: undefined
      }
      create_invite_code: { Args: never; Returns: Json }
      daily_care_status: { Args: never; Returns: Json }
      delete_bank_message: { Args: { p_id: string }; Returns: undefined }
      delete_item_comment: { Args: { p_id: string }; Returns: undefined }
      delete_item_forever: {
        Args: { p_id: string; p_type: string }
        Returns: string
      }
      delete_library_text: { Args: { p_id: string }; Returns: undefined }
      delete_spiritual_item: { Args: { p_id: string }; Returns: undefined }
      ensure_membership: { Args: never; Returns: Json }
      export_space_copy: { Args: never; Returns: Json }
      find_board_word: {
        Args: { p_day: string; p_end: number; p_start: number }
        Returns: Json
      }
      find_level_word: {
        Args: { p_end: number; p_level: number; p_start: number }
        Returns: Json
      }
      get_daily_message: { Args: never; Returns: Json }
      get_space_status: { Args: never; Returns: Json }
      get_word_board: { Args: never; Returns: Json }
      get_word_level: { Args: never; Returns: Json }
      invite_partner: { Args: { p_email: string }; Returns: undefined }
      is_space_admin: { Args: never; Returns: boolean }
      lily_care: { Args: { p_action: string }; Returns: undefined }
      mark_correspondence_read: { Args: { p_id: string }; Returns: undefined }
      membership_json: { Args: { uid: string }; Returns: Json }
      my_space: { Args: never; Returns: string }
      open_capsule: { Args: { p_id: string }; Returns: Json }
      publish_daily_messages: { Args: never; Returns: undefined }
      purge_expired_archive: { Args: never; Returns: string[] }
      readable_space: { Args: never; Returns: string }
      redeem_invite_code: { Args: { p_code: string }; Returns: Json }
      review_bank_message: {
        Args: { p_approval: string; p_date?: string; p_id: string }
        Returns: undefined
      }
      revoke_invite_code: { Args: never; Returns: undefined }
      save_bank_message: {
        Args: { p_category: string; p_content: string; p_id?: string }
        Returns: string
      }
      open_couple_gift: {
        Args: { p_gift_id: string }
        Returns: Json
      }
      send_couple_gift: {
        Args: { p_gift_id: string; p_title: string; p_message?: string }
        Returns: string
      }
      save_correspondence: {
        Args: {
          p_content: string
          p_folder?: string
          p_id?: string
          p_kind: string
          p_title: string
          p_theme?: string
          p_scheduled_at?: string | null
        }
        Returns: string
      }
      save_daily_emotion: { Args: { p_emotion: string }; Returns: undefined }
      save_journal_entry: {
        Args: {
          p_content: string
          p_date: string
          p_id?: string
          p_kind: string
          p_title: string
        }
        Returns: string
      }
      save_memory: {
        Args: {
          p_date: string
          p_description: string
          p_id?: string
          p_photo_path?: string
          p_title: string
        }
        Returns: string
      }
      save_special_date: {
        Args: {
          p_category: string
          p_date: string
          p_description: string
          p_id?: string
          p_name: string
          p_reminder_days?: number
          p_repeats_yearly?: boolean
        }
        Returns: string
      }
      submit_quiz_answer: {
        Args: {
          p_guess?: string | null
          p_my_answer: string
          p_question_id: string
        }
        Returns: Json
      }
      save_spiritual_item: {
        Args: {
          p_content: string
          p_id?: string
          p_kind: string
          p_reference: string
          p_title: string
        }
        Returns: string
      }
      seal_capsule: {
        Args: {
          p_content: string
          p_kind: string
          p_opens_at: string
          p_photo?: string
          p_title: string
        }
        Returns: string
      }
      select_daily_for_space: { Args: { p_space: string }; Returns: Json }
      set_item_archived: {
        Args: { p_archived: boolean; p_id: string; p_type: string }
        Returns: undefined
      }
      set_petition_answered: {
        Args: { p_answered: boolean; p_id: string }
        Returns: undefined
      }
      set_word_favorite: {
        Args: { p_favorite: boolean; p_id: string }
        Returns: undefined
      }
      space_settings_status: { Args: never; Returns: Json }
      spiritual_checkin: { Args: never; Returns: undefined }
      toggle_item_reaction: {
        Args: { p_emoji: string; p_id: string; p_type: string }
        Returns: boolean
      }
      update_my_profile: {
        Args: {
          p_avatar: string
          p_display_name: string
          p_nickname: string
          p_preferences: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const

/// <reference types="astro/client" />
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database, Profile } from './lib/database.types';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user: User | null;
      profile: Profile | null;
    }
  }
}

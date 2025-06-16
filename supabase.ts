
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Replace "YOUR_SUPABASE_URL" and "YOUR_SUPABASE_ANON_KEY" with your actual Supabase project URL and anon key.
const supabaseUrl = "https://yrvhlfqookinaxepzyom.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlydmhsZnFvb2tpbmF4ZXB6eW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzg2MTksImV4cCI6MjA2NTY1NDYxOX0.6ipyfzMaXGpU9APj8ZGluR7maGZP8CDj0wGrYK9Wbsg";

// The check for placeholder values has been removed as actual values are now in use.
// console.warn(
//   "Supabase URL or Anon Key is using placeholder values. Please ensure they are correctly set."
// );

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
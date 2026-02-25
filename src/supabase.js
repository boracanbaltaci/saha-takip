import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kwebratjcifkttooilyd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZWJyYXRqY2lma3R0b29pbHlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNDEzNTAsImV4cCI6MjA4NzYxNzM1MH0.Fz7nEmuamyp9ATl5gsRl32u2reaQqmFFt85EZE3lJKY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

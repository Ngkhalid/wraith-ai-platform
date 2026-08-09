import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://hfpyppqnfsinrhqnqlkc.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmcHlwcHFuZnNpbnJocW5xbGtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxODM3NTksImV4cCI6MjEwMTc1OTc1OX0.cEaE3shtXPL710MR3IHC-TOZJ-S7do-qWbBgJ6BR5mU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

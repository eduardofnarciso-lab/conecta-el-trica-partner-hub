import { createClient } from "@supabase/supabase-js";

// Configuração pública do Supabase (anon key é pública e protegida por RLS).
// Lê de variáveis VITE_* (definidas em .env); com fallback embutido para
// funcionar localmente sem configuração extra.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? "https://iwkmnjbqvjmhzcyptihc.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3a21uamJxdmptaHpjeXB0aWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzEzNTIsImV4cCI6MjA5NjYwNzM1Mn0.kJlOQmxqDsxELJ7g6yF9HgJe4ny0I4sIMLG1z1PX6jQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

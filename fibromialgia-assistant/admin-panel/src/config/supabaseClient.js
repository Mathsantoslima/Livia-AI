import { createClient } from "@supabase/supabase-js";

// ============================================
// CONFIGURAÇÃO REAL DO SUPABASE - DADOS REAIS
// ============================================

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://dbwrpdxwfqqbsngijrle.supabase.co";
const supabaseKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M";

// Criar cliente real do Supabase uma única vez
let supabaseInstance = null;

const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log("✅ Supabase configurado para dados reais:", supabaseUrl);
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();

// ============================================
// supabase.js — Supabase Client Initialization
// This file is imported by ALL other JS files.
// It creates ONE shared Supabase client.
// ============================================

// We load Supabase from a CDN (no npm needed for frontend)
// The CDN script must be added to every HTML page BEFORE this file



const SUPABASE_URL = CONFIG.SUPABASE_URL;
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;

// Wait for Supabase to load, then create client
function initSupabase() {
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window._supabase = supabase;
    console.log('Supabase client initialized successfully');
  } else {
    console.error('Supabase library not loaded');
  }
}

// Try to initialize immediately
initSupabase();

// Also try after a short delay in case the script loads asynchronously
setTimeout(initSupabase, 100);
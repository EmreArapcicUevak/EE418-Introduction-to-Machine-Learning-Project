// API Configuration
// Keep this fallback in sync across services so every screen hits the same backend.
// EXPO_PUBLIC_API_URL (from .env) takes precedence; fallback is a local LAN IP.
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || '';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// Access the Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase environment variables are missing!\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.\n' +
    'Using a placeholder URL to prevent startup crashes.'
  );
}

// Fallback to a valid URL structure to avoid instantiation errors when env vars are unset or invalid
let verifiedUrl = 'https://placeholder-url-please-configure.supabase.co';
if (supabaseUrl && typeof supabaseUrl === 'string' && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))) {
  verifiedUrl = supabaseUrl;
}

export const isSupabaseConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder-url-please-configure.supabase.co' &&
  !supabaseUrl.includes('placeholder-url') &&
  supabaseAnonKey !== 'placeholder-anon-key'
);

export const supabase = createClient(
  verifiedUrl,
  supabaseAnonKey || 'placeholder-anon-key'
);

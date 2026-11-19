"use client";
// Cookie-backed browser client; Supabase owns session storage and rotation.
import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./supabase-config";
export function createBrowserSupabase() {
  const config = getSupabasePublicConfig();
  return config ? createBrowserClient(config.url, config.key) : null;
}

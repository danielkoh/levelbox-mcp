export interface LevelboxConfig {
  baseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// The Supabase project URL + anon ("publishable") key are PUBLIC by design — the same values ship
// in the levelbox.ai web app's browser bundle. They are safe to commit here; the /mcp server is
// protected by JWT verification + RLS, not by hiding these. Override via flags/env if needed.
const DEFAULTS: LevelboxConfig = {
  baseUrl: "https://api.levelbox.ai/mcp",
  supabaseUrl: "https://gmrkfqscgbxapaljfqve.supabase.co",
  supabaseAnonKey: "sb_publishable__GLbOg-CpEqLuxtmlPab9g_wnE0IH_0",
};

export function resolveConfig(flags: Partial<LevelboxConfig> = {}): LevelboxConfig {
  const pick = (flag: string | undefined, env: string | undefined, dflt: string) =>
    flag ?? env ?? dflt;
  return {
    baseUrl: pick(flags.baseUrl, process.env.LEVELBOX_MCP_URL, DEFAULTS.baseUrl),
    supabaseUrl: pick(flags.supabaseUrl, process.env.LEVELBOX_SUPABASE_URL, DEFAULTS.supabaseUrl),
    supabaseAnonKey: pick(
      flags.supabaseAnonKey,
      process.env.LEVELBOX_SUPABASE_ANON_KEY,
      DEFAULTS.supabaseAnonKey,
    ),
  };
}

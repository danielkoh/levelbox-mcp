export interface LevelboxConfig {
  baseUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

const DEFAULTS: LevelboxConfig = {
  baseUrl: "https://api.levelbox.ai/mcp",
  supabaseUrl: "", // filled with the web app's NEXT_PUBLIC_SUPABASE_URL
  supabaseAnonKey: "", // filled with NEXT_PUBLIC_SUPABASE_ANON_KEY
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

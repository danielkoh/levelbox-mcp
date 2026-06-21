import type { LevelboxConfig } from "../config.js";
import { readCreds, writeCreds } from "./store.js";
export async function refreshTokens(cfg: LevelboxConfig, refreshToken: string) {
  const res = await fetch(`${cfg.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: cfg.supabaseAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`token refresh failed (${res.status}) — run: levelbox-mcp login`);
  const j = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  return { accessToken: j.access_token, refreshToken: j.refresh_token, expiresAt: j.expires_at };
}
export async function getValidAccessToken(
  cfg: LevelboxConfig,
  now = Math.floor(Date.now() / 1000),
): Promise<string> {
  const c = readCreds();
  if (!c) throw new Error("not logged in — run: levelbox-mcp login");
  if (c.expiresAt - now > 60) return c.accessToken;
  const t = await refreshTokens(cfg, c.refreshToken);
  writeCreds({ ...c, ...t });
  return t.accessToken;
}

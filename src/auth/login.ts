import type { LevelboxConfig } from "../config.js";
import { writeCreds } from "./store.js";
import { refreshTokens } from "./refresh.js";

export async function loginWithToken(
  cfg: LevelboxConfig,
  _accessToken: string,
  refreshToken: string,
): Promise<void> {
  const t = await refreshTokens(cfg, refreshToken); // also validates
  writeCreds({
    accessToken: t.accessToken,
    refreshToken: t.refreshToken,
    expiresAt: t.expiresAt,
    supabaseUrl: cfg.supabaseUrl,
  });
}

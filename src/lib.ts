import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { LevelboxConfig } from "./config.js";
import { resolveConfig } from "./config.js";
import { getValidAccessToken } from "./auth/refresh.js";
import { buildRemoteClient } from "./connect.js";

export async function createLevelboxClient(
  flags: Partial<LevelboxConfig> & { token?: string } = {},
): Promise<Client> {
  const { token, ...configFlags } = flags;
  const cfg = resolveConfig(configFlags);
  const accessToken = token ?? (await getValidAccessToken(cfg));
  return buildRemoteClient(cfg, accessToken);
}

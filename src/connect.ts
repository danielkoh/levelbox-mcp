import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { LevelboxConfig } from "./config.js";
import { getValidAccessToken } from "./auth/refresh.js";

export async function buildRemoteClient(cfg: LevelboxConfig, token: string): Promise<Client> {
  const client = new Client({ name: "levelbox-mcp", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(new URL(cfg.baseUrl), {
    requestInit: { headers: { Authorization: `Bearer ${token}` } },
  });
  await client.connect(transport);
  return client;
}

function isUnauthorized(e: unknown): boolean {
  const s = String((e as { message?: string })?.message ?? e);
  return (e as { status?: number })?.status === 401 || /401|unauthor/i.test(s);
}

/** Minimal surface of the remote Client that the handlers actually call. */
export interface RemoteLike {
  listTools: () => Promise<{ tools: { name: string }[] }>;
  callTool: (params: {
    name: string;
    arguments?: Record<string, unknown>;
  }) => Promise<{ content: { type: string; text?: string }[] }>;
}

// getRemote(forceRefresh): returns a connected remote client; forceRefresh rebuilds it with a fresh token.
// makeHandlers caches the remote across calls; on a 401-ish error it calls getRemote(true) to rebuild once.
export function makeHandlers(getRemote: (forceRefresh?: boolean) => Promise<RemoteLike>) {
  let remotePromise: Promise<RemoteLike> = getRemote();
  return {
    listTools: async () => (await remotePromise).listTools(),
    callTool: async (params: { name: string; arguments?: Record<string, unknown> }) => {
      try {
        return await (await remotePromise).callTool(params);
      } catch (e) {
        if (!isUnauthorized(e)) throw e;
        remotePromise = getRemote(true);
        return (await remotePromise).callTool(params);
      }
    },
  };
}

export async function runBridge(cfg: LevelboxConfig): Promise<void> {
  let remote: Client | null = null;
  const getRemote = async (forceRefresh = false): Promise<RemoteLike> => {
    if (remote && !forceRefresh) return remote;
    const token = await getValidAccessToken(cfg); // refreshes if near-expiry
    remote = await buildRemoteClient(cfg, token);
    return remote;
  };
  const h = makeHandlers(getRemote);
  const server = new Server(
    { name: "levelbox-mcp", version: "0.1.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => h.listTools());
  server.setRequestHandler(CallToolRequestSchema, async (req) => h.callTool(req.params));
  await server.connect(new StdioServerTransport());
}

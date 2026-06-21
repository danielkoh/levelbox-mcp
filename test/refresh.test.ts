import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/auth/store.js", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = null;
  return {
    readCreds: () => cur,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writeCreds: (c: any) => {
      cur = c;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __set: (c: any) => {
      cur = c;
    },
  };
});
import * as store from "../src/auth/store.js";
import { getValidAccessToken } from "../src/auth/refresh.js";

const cfg = { baseUrl: "x", supabaseUrl: "https://s.supabase.co", supabaseAnonKey: "anon" };
beforeEach(() => vi.restoreAllMocks());

describe("token refresh", () => {
  it("returns the current token when not near expiry", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).__set({
      accessToken: "good",
      refreshToken: "r",
      expiresAt: 10_000,
      supabaseUrl: "https://s.supabase.co",
    });
    expect(await getValidAccessToken(cfg, 0)).toBe("good");
  });
  it("refreshes when near expiry and persists", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (store as any).__set({
      accessToken: "old",
      refreshToken: "r0",
      expiresAt: 100,
      supabaseUrl: "https://s.supabase.co",
    });
    global.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ access_token: "new", refresh_token: "r1", expires_at: 9999 }),
          { status: 200 },
        ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    expect(await getValidAccessToken(cfg, 90)).toBe("new"); // 100 - 90 < 60 → refresh
    expect(store.readCreds()!.refreshToken).toBe("r1");
  });
});

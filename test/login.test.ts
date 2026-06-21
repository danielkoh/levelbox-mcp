import { describe, it, expect, vi } from "vitest";

vi.mock("../src/auth/store.js", () => {
  return {
    writeCreds: vi.fn(),
  };
});

import { loginWithToken, handleCallbackBody } from "../src/auth/login.js";
import * as store from "../src/auth/store.js";

const cfg = { baseUrl: "x", supabaseUrl: "https://s.supabase.co", supabaseAnonKey: "anon" };

describe("login", () => {
  it("validates a pasted token via refresh and stores creds", async () => {
    global.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ access_token: "A", refresh_token: "R2", expires_at: 9999 }), {
          status: 200,
        }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any;
    await loginWithToken(cfg, "ignored", "R1");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(store.writeCreds as any).toHaveBeenCalledWith({
      accessToken: "A",
      refreshToken: "R2",
      expiresAt: 9999,
      supabaseUrl: "https://s.supabase.co",
    });
  });

  it("maps a posted supabase session to creds", () => {
    const c = handleCallbackBody(
      { baseUrl: "x", supabaseUrl: "https://s.supabase.co", supabaseAnonKey: "a" },
      { access_token: "A", refresh_token: "R", expires_at: 4242 },
    );
    expect(c).toEqual({
      accessToken: "A",
      refreshToken: "R",
      expiresAt: 4242,
      supabaseUrl: "https://s.supabase.co",
    });
  });

  it("throws when a required field is missing from the callback body", () => {
    expect(() =>
      handleCallbackBody(
        { baseUrl: "x", supabaseUrl: "https://s.supabase.co", supabaseAnonKey: "a" },
        // missing refresh_token — cast to bypass TS type so we can test the runtime guard
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { access_token: "A", refresh_token: "", expires_at: 4242 } as any,
      ),
    ).toThrow("invalid session from login page");
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readCreds, writeCreds, clearCreds, credsPath } from "../src/auth/store.js";

let tmp: string;
const realHome = process.env.HOME;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "lvb-"));
  process.env.HOME = tmp;
});

afterEach(() => {
  process.env.HOME = realHome;
  rmSync(tmp, { recursive: true, force: true });
});

describe("credential store", () => {
  it("round-trips creds and writes 0600", () => {
    expect(readCreds()).toBeNull();
    writeCreds({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 123,
      supabaseUrl: "https://x.supabase.co",
    });
    expect(readCreds()).toEqual({
      accessToken: "a",
      refreshToken: "r",
      expiresAt: 123,
      supabaseUrl: "https://x.supabase.co",
    });
    expect(statSync(credsPath()).mode & 0o777).toBe(0o600);
    clearCreds();
    expect(readCreds()).toBeNull();
  });
});

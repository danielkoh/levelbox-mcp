import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";

export interface Creds {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  supabaseUrl: string;
}

export function credsPath(): string {
  return join(homedir(), ".levelbox", "credentials.json");
}

export function readCreds(): Creds | null {
  try {
    return JSON.parse(readFileSync(credsPath(), "utf8")) as Creds;
  } catch {
    return null;
  }
}

export function writeCreds(c: Creds): void {
  const dir = join(homedir(), ".levelbox");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(credsPath(), JSON.stringify(c, null, 2), { mode: 0o600 });
}

export function clearCreds(): void {
  try {
    rmSync(credsPath());
  } catch {
    /* ignore */
  }
}

import { createServer } from "node:http";
import type { LevelboxConfig } from "../config.js";
import { writeCreds } from "./store.js";
import type { Creds } from "./store.js";
import { refreshTokens } from "./refresh.js";

// ---------------------------------------------------------------------------
// Pure mapper — unit-testable
// ---------------------------------------------------------------------------

export interface CallbackBody {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export function handleCallbackBody(cfg: LevelboxConfig, body: CallbackBody): Creds {
  if (
    typeof body.access_token !== "string" ||
    body.access_token === "" ||
    typeof body.refresh_token !== "string" ||
    body.refresh_token === "" ||
    typeof body.expires_at !== "number"
  ) {
    throw new Error("invalid session from login page");
  }
  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: body.expires_at,
    supabaseUrl: cfg.supabaseUrl,
  };
}

// ---------------------------------------------------------------------------
// Login page HTML (inlined — no file to ship, no copy step needed)
// ---------------------------------------------------------------------------

function buildLoginPage(supabaseUrl: string, supabaseAnonKey: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>levelbox.ai — Sign in</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f1117;
      color: #e1e4e8;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 380px;
    }
    h1 { font-size: 1.4rem; font-weight: 600; margin-bottom: 8px; }
    p.tagline { color: #8b949e; font-size: 0.9rem; margin-bottom: 28px; }
    button, input[type="email"], input[type="password"] {
      width: 100%;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 0.95rem;
      border: 1px solid #30363d;
      outline: none;
    }
    input[type="email"], input[type="password"] {
      background: #0d1117;
      color: #e1e4e8;
      margin-bottom: 10px;
    }
    button {
      cursor: pointer;
      font-weight: 600;
      border: none;
      margin-bottom: 10px;
    }
    #btn-google { background: #238636; color: #fff; }
    #btn-google:hover { background: #2ea043; }
    #btn-email { background: #21262d; color: #e1e4e8; border: 1px solid #30363d; }
    #btn-email:hover { background: #30363d; }
    .divider { text-align: center; color: #8b949e; font-size: 0.8rem; margin: 14px 0; }
    #status { margin-top: 16px; font-size: 0.9rem; color: #8b949e; text-align: center; }
    #status.error { color: #f85149; }
    #status.success { color: #3fb950; }
  </style>
</head>
<body>
  <div class="card">
    <h1>levelbox.ai</h1>
    <p class="tagline">Get paid to wait for your price</p>

    <button id="btn-google">Continue with Google</button>

    <div class="divider">or</div>

    <input type="email" id="email" placeholder="Email address" autocomplete="email" />
    <input type="password" id="password" placeholder="Password" autocomplete="current-password" />
    <button id="btn-email">Sign in with Email</button>

    <div id="status"></div>
  </div>

  <script type="module">
    // Config injected by the CLI server
    window.__LVB = { url: ${JSON.stringify(supabaseUrl)}, anon: ${JSON.stringify(supabaseAnonKey)} };

    import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

    const supabase = createClient(window.__LVB.url, window.__LVB.anon);

    const status = document.getElementById("status");

    function setStatus(msg, kind) {
      status.textContent = msg;
      status.className = kind || "";
    }

    // Listen for successful sign-in and POST the session to the local callback
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("Sending credentials to CLI…");
        try {
          const res = await fetch("/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at,
            }),
          });
          if (res.ok) {
            setStatus("You can close this tab.", "success");
          } else {
            setStatus("CLI callback failed (" + res.status + "). Please retry.", "error");
          }
        } catch (err) {
          setStatus("Could not reach CLI: " + String(err), "error");
        }
      }
    });

    document.getElementById("btn-google").addEventListener("click", async () => {
      setStatus("Redirecting to Google…");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: location.origin },
      });
      if (error) setStatus(error.message, "error");
    });

    document.getElementById("btn-email").addEventListener("click", async () => {
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      if (!email || !password) { setStatus("Enter email and password.", "error"); return; }
      setStatus("Signing in…");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setStatus(error.message, "error");
    });
  </script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Browser login — starts a localhost HTTP server, opens the browser, waits
// ---------------------------------------------------------------------------

export async function loginWithBrowser(cfg: LevelboxConfig): Promise<void> {
  // Lazy-import `open` so the rest of the module stays importable in test env
  const { default: open } = await import("open");

  const html = buildLoginPage(cfg.supabaseUrl, cfg.supabaseAnonKey);

  return new Promise<void>((resolve, reject) => {
    const TIMEOUT_MS = 120_000;

    const server = createServer((req, res) => {
      if (req.method === "GET" && req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
        return;
      }

      if (req.method === "POST" && req.url === "/callback") {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          clearTimeout(timer);
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as CallbackBody;
            writeCreds(handleCallbackBody(cfg, body));
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
            server.close();
            resolve();
          } catch (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: String(err) }));
            server.close();
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    // Bind to port 0 → OS assigns an ephemeral port
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to get server address"));
        return;
      }
      const url = `http://127.0.0.1:${addr.port}`;
      open(url).catch(() => {
        /* ignore if open fails — user can paste URL manually */
      });
      process.stderr.write(`\nOpen this URL in your browser to sign in:\n  ${url}\n\n`);
    });

    const timer = setTimeout(() => {
      server.close();
      reject(new Error("Browser login timed out after 120 seconds"));
    }, TIMEOUT_MS);

    // Don't block the Node process from exiting if something else resolves first
    timer.unref();
  });
}

// ---------------------------------------------------------------------------
// Token-based login (A6 — kept here)
// ---------------------------------------------------------------------------

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

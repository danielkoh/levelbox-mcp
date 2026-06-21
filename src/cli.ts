import { Command } from "commander";
import { pathToFileURL } from "node:url";

// ---------------------------------------------------------------------------
// Injectable deps shape — keeps dispatch unit-testable without side effects
// ---------------------------------------------------------------------------

export interface CliDeps {
  connect: () => Promise<void>;
  loginToken: (token: string, refresh: string) => Promise<void>;
  loginBrowser: () => Promise<void>;
  logout: () => Promise<void>;
  status: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Global-options shape (parsed before sub-command dispatch)
// ---------------------------------------------------------------------------

export interface GlobalOpts {
  baseUrl?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

// ---------------------------------------------------------------------------
// buildProgram — pure commander setup; no I/O, no side-effects
// ---------------------------------------------------------------------------

export function buildProgram(deps: CliDeps): Command {
  const program = new Command();

  program
    .name("levelbox-mcp")
    .description("MCP bridge for levelbox.ai — run as default to start the bridge")
    .option("--base-url <url>", "levelbox API base URL")
    .option("--supabase-url <url>", "Supabase project URL")
    .option("--supabase-anon-key <key>", "Supabase anon key")
    // Suppress commander's default error-exit so tests can catch thrown errors
    .exitOverride();

  // connect — also the default command when bare `levelbox-mcp` is invoked
  program
    .command("connect", { isDefault: true })
    .description("Start the MCP stdio bridge (default when no subcommand is given)")
    .action(async () => {
      await deps.connect();
    });

  // login
  program
    .command("login")
    .description("Authenticate with levelbox.ai")
    .option("--token <access_token>", "Access token (paste mode)")
    .option("--refresh <refresh_token>", "Refresh token (required with --token)")
    .action(async (opts: { token?: string; refresh?: string }) => {
      if (opts.token && opts.refresh) {
        await deps.loginToken(opts.token, opts.refresh);
      } else {
        await deps.loginBrowser();
      }
    });

  // logout
  program
    .command("logout")
    .description("Remove stored credentials")
    .action(async () => {
      await deps.logout();
    });

  // status
  program
    .command("status")
    .description("Show current auth status and configured base URL")
    .action(async () => {
      await deps.status();
    });

  return program;
}

// ---------------------------------------------------------------------------
// Module-bottom auto-run — only when invoked as the entry point (via bin),
// NOT when imported by tests or other modules.
//
// Guard: compare import.meta.url to the resolved URL of process.argv[1].
// The bin (bin/levelbox-mcp.mjs) does `import("../dist/cli.js")` which means
// import.meta.url points to dist/cli.js while process.argv[1] points to the
// bin file — they differ, so the guard would always be false. To support this,
// the bin should instead call `main()` after the dynamic import, OR we detect
// that argv[1] ends with "levelbox-mcp" / "levelbox-mcp.mjs".
//
// We use the argv[1] basename approach: run only when the process was started
// with a path whose basename is "levelbox-mcp" or "levelbox-mcp.mjs".
// This is robust for both `node dist/cli.js` and the bin shim invocation.
// ---------------------------------------------------------------------------

export async function main(): Promise<void> {
  const { resolveConfig } = await import("./config.js");
  const { runBridge } = await import("./connect.js");
  const { loginWithToken, loginWithBrowser } = await import("./auth/login.js");
  const { clearCreds, readCreds } = await import("./auth/store.js");

  // Parse global options first so we can resolve config before subcommand fires
  // Commander parses lazily during parseAsync; we extract globals after that.
  // To thread config into commands we build a mutable ref updated at parse time.
  let cfg = resolveConfig();

  const deps: CliDeps = {
    connect: async () => {
      await runBridge(cfg);
    },

    loginToken: async (token: string, refresh: string) => {
      await loginWithToken(cfg, token, refresh);
      process.stderr.write("levelbox-mcp: logged in (token)\n");
    },

    loginBrowser: async () => {
      await loginWithBrowser(cfg);
      process.stderr.write("levelbox-mcp: logged in (browser)\n");
    },

    logout: async () => {
      clearCreds();
      process.stderr.write("levelbox-mcp: credentials removed\n");
    },

    status: async () => {
      const creds = readCreds();
      const now = Math.floor(Date.now() / 1000);
      if (!creds) {
        process.stderr.write(`levelbox-mcp: not logged in\nbase-url: ${cfg.baseUrl}\n`);
      } else {
        const valid = creds.expiresAt > now;
        process.stderr.write(
          `levelbox-mcp: logged in\naccount: ${creds.supabaseUrl}\ntoken valid: ${valid}\nbase-url: ${cfg.baseUrl}\n`,
        );
      }
    },
  };

  const program = buildProgram(deps);

  // Re-resolve config after parsing so global flags override env/defaults
  program.hook("preAction", () => {
    const opts = program.opts<GlobalOpts>();
    cfg = resolveConfig(opts);
  });

  await program.parseAsync(process.argv);
}

// Run only when this module is the CLI entry point.
// The bin does `import("../dist/cli.js")` so process.argv[1] will be the bin
// path (e.g. .../bin/levelbox-mcp.mjs) while import.meta.url will be
// .../dist/cli.js — they differ. We detect via argv[1] basename instead.
const argv1 = process.argv[1] ?? "";
const isEntry =
  argv1.endsWith("/levelbox-mcp") ||
  argv1.endsWith("/levelbox-mcp.mjs") ||
  pathToFileURL(argv1).href === import.meta.url;

if (isEntry) {
  main().catch((err: unknown) => {
    process.stderr.write(`levelbox-mcp: ${String(err)}\n`);
    process.exit(1);
  });
}

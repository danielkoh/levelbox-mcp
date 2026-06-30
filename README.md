# levelbox-mcp

Open-source MCP bridge for **[levelbox.ai](https://levelbox.ai)** — connect your AI assistant (Claude Desktop, Claude Code, etc.) to the remote levelbox wheel screener over Model Context Protocol.

This is a **client/bridge** that lets AI agents access the levelbox screener tools, not a server.

## Install

```bash
npm install -g levelbox-mcp
```

## Quick Start

### 1. Authenticate

```bash
levelbox-mcp login
```

This opens a browser to sign in with your **levelbox.ai** account (Google OAuth or email/password). Credentials are stored locally and auto-refresh.

**Headless fallback** (e.g., on a remote machine without a browser):

```bash
levelbox-mcp login --token <access_token> --refresh <refresh_token>
```

### 2. Configure Your AI Assistant

Add this block to your MCP configuration:

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "levelbox": {
      "command": "npx",
      "args": ["-y", "levelbox-mcp", "connect"]
    }
  }
}
```

**Claude Code** (`.mcp.json` in your project, or globally via `claude mcp add`):

```json
{
  "mcpServers": {
    "levelbox": {
      "command": "npx",
      "args": ["-y", "levelbox-mcp", "connect"]
    }
  }
}
```

Restart your assistant to load the levelbox tools.

### 3. Use the Tools

Your assistant now has access to:

**Screen**

- **list_themes** — Browse available screener themes (filter types, criteria)
- **list_candidates** — View screened candidates for a theme
- **top_candidates** — Best wheel candidates across *all* themes, deduped and ranked
- **get_candidate** — Fetch details for a specific symbol

**Your account** (signed in)

- **watchlist_summary** — Your watchlist's projected premium, required capital, and annualized yield, scaled by your contract counts
- **pick_symbol** / **unpick_symbol** / **list_picks** — Manage your picks/watchlist
- **portfolio** *(Pro)* — Your imported positions with marks, plus cash, premium collected, and realized P/L
- **covered_calls** *(Pro)* — Covered-call income suggestions on shares you own (premium, yields, assignment odds, upside cap, downside cushion)

**Analytical use only.** These tools provide market data, valuations, and signals to inform your analysis — not investment directives. Use them to research, backtest, and understand opportunities, then make your own decisions.

## Commands

- **`levelbox-mcp connect`** (default) — Start the MCP bridge (stdio). This is what the config block runs.
- **`levelbox-mcp login`** — Authenticate with levelbox.ai (opens browser or accepts `--token`/`--refresh`).
- **`levelbox-mcp logout`** — Clear stored credentials.
- **`levelbox-mcp status`** — Show login status and configured base URL.

## Configuration

Set via environment variables or command-line flags. Flags override env vars.

| Env Var                      | Flag                  | Default                        |
| ---------------------------- | --------------------- | ------------------------------ |
| `LEVELBOX_MCP_URL`           | `--base-url`          | `https://api.levelbox.ai/mcp`  |
| `LEVELBOX_SUPABASE_URL`      | `--supabase-url`      | (from env, required for login) |
| `LEVELBOX_SUPABASE_ANON_KEY` | `--supabase-anon-key` | (from env, required for login) |

Example:

```bash
LEVELBOX_MCP_URL=http://localhost:8000/mcp levelbox-mcp connect
# or
levelbox-mcp --base-url http://localhost:8000/mcp connect
```

## Setup Note: Browser Login & OAuth

For **Google OAuth** and other OAuth redirects to work, the **levelbox.ai Supabase project's Auth settings must allow localhost redirects**:

1. Go to your Supabase project → **Authentication** → **URL Configuration**
2. Add `http://localhost:*` and/or `http://127.0.0.1:*` to **Redirect URLs**

**Email/password login works without this.**

If you see an OAuth redirect error, check that these URLs are in your allowlist.

## Troubleshooting

### 401 "Not Logged In"

The token has expired or refresh failed:

```bash
levelbox-mcp login
```

Re-authenticate to refresh your local credentials.

### Connection refused

Check that the base URL is correct:

```bash
levelbox-mcp status
# Shows current base-url; update via LEVELBOX_MCP_URL or --base-url
```

### MCP tool not showing in your assistant

Ensure the config block is in the right file:

- **Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Claude Code:** `.mcp.json` in your project root or globally (~/.claude/.mcp.json)

Restart your assistant after updating the config.

## License

MIT — see LICENSE.

## Repository

https://github.com/danielkoh/levelbox-mcp

## About

Built and maintained by **[levelbox.ai](https://levelbox.ai)** — the options wheel screener that helps you get paid to wait for your price. Learn more at [levelbox.ai](https://levelbox.ai).

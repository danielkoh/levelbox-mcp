---
name: levelbox-mcp
description: Open-source MCP client bridge to levelbox.ai wheel screener — install, login, add config, access screening tools.
---

# levelbox-mcp

## What it is

A client/bridge that connects your AI assistant to **levelbox.ai**, an options wheel screener. It exposes screener tools over Model Context Protocol so Claude (Desktop, Code, or other AI apps) can query candidates, themes, and manage your picks.

## Install & Setup

### Step 1: Install the CLI

```bash
npm install -g levelbox-mcp
```

### Step 2: Authenticate

```bash
levelbox-mcp login
```

Opens a browser to sign in with your levelbox.ai account (Google OAuth or email/password). Credentials auto-refresh locally.

### Step 3: Add the MCP Config Block

Add to your Claude Desktop / Claude Code MCP configuration:

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

- **Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Claude Code:** `.mcp.json` in project root or `~/.claude/.mcp.json`

Restart your assistant.

### Step 4: Use the Tools

Your assistant now has access to the levelbox screener:

- **list_themes** — Browse screening themes
- **list_candidates** — Get candidates for a theme
- **top_candidates** — Top N candidates by rank
- **get_candidate** — Details for a symbol
- **pick_symbol** — Add to watchlist
- **unpick_symbol** — Remove from watchlist
- **list_picks** — View your picks

## Important

**Analytical use only.** These tools provide market data, analysis, and signals — not investment advice. Use them to research and understand opportunities. You decide what to do.

## Troubleshooting

- **401 "Not logged in"?** Run `levelbox-mcp login` to refresh credentials.
- **Browser login fails with OAuth error?** Check that your Supabase project's **Auth > URL Configuration** allows `http://localhost:*` (email/password works without it).
- **Not seeing tools?** Restart your AI assistant and verify the config block is in the right file.

## Env Vars

- `LEVELBOX_MCP_URL` (default: `https://api.levelbox.ai/mcp`)
- `LEVELBOX_SUPABASE_URL` (required for login)
- `LEVELBOX_SUPABASE_ANON_KEY` (required for login)

Or use flags: `--base-url`, `--supabase-url`, `--supabase-anon-key`.

---

**Repo:** https://github.com/danielkoh/levelbox-mcp

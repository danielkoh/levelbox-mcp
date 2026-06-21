import { describe, it, expect, afterEach } from "vitest";
import { resolveConfig } from "../src/config.js";

afterEach(() => {
  delete process.env.LEVELBOX_MCP_URL;
});

describe("resolveConfig", () => {
  it("defaults baseUrl to the prod MCP endpoint", () => {
    expect(resolveConfig().baseUrl).toBe("https://api.levelbox.ai/mcp");
  });
  it("prefers flag over env over default", () => {
    process.env.LEVELBOX_MCP_URL = "https://env.example/mcp";
    expect(resolveConfig().baseUrl).toBe("https://env.example/mcp");
    expect(resolveConfig({ baseUrl: "https://flag.example/mcp" }).baseUrl).toBe(
      "https://flag.example/mcp",
    );
  });
});

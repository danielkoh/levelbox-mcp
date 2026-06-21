import { it, expect, vi } from "vitest";

// Mock modules before importing createLevelboxClient
vi.mock("../src/connect.js", () => ({
  buildRemoteClient: vi.fn(async () => ({ __fake: true })),
}));

vi.mock("../src/auth/refresh.js", () => ({
  getValidAccessToken: vi.fn(async () => "should-not-be-called"),
}));

import { createLevelboxClient } from "../src/lib.js";
import { buildRemoteClient } from "../src/connect.js";
import { getValidAccessToken } from "../src/auth/refresh.js";

it("resolves config with provided baseUrl and uses provided token to call buildRemoteClient", async () => {
  // Call createLevelboxClient with a provided token and baseUrl
  const result = await createLevelboxClient({
    baseUrl: "https://flag.example/mcp",
    token: "TKN",
  });

  // Assert sentinel was returned
  expect(result).toEqual({ __fake: true });

  // Assert buildRemoteClient was called with the resolved config (baseUrl from args)
  // and the provided token (not from getValidAccessToken)
  expect(buildRemoteClient).toHaveBeenCalledWith(
    expect.objectContaining({
      baseUrl: "https://flag.example/mcp",
    }),
    "TKN",
  );

  // Assert getValidAccessToken was NOT called (because token was provided)
  expect(getValidAccessToken).not.toHaveBeenCalled();
});

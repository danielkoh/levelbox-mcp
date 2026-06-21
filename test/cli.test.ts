import { it, expect, vi } from "vitest";
import { buildProgram } from "../src/cli.js";

it("routes `login --token` to the paste path and `connect` to the bridge", async () => {
  const deps = {
    connect: vi.fn(),
    loginToken: vi.fn(),
    loginBrowser: vi.fn(),
    logout: vi.fn(),
    status: vi.fn(),
  };
  const p = buildProgram(deps);
  await p.parseAsync(["node", "cli", "login", "--token", "A", "--refresh", "R"]);
  expect(deps.loginToken).toHaveBeenCalled();
  expect(deps.loginBrowser).not.toHaveBeenCalled();
  await p.parseAsync(["node", "cli", "connect"]);
  expect(deps.connect).toHaveBeenCalled();
});

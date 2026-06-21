import { it, expect, vi } from "vitest";
import { makeHandlers, type RemoteLike } from "../src/connect.js";

it("forwards list/call to the remote, refresh+retry on 401", async () => {
  const calls: string[] = [];
  let dies = true;
  const remote: RemoteLike = {
    listTools: vi.fn(async () => ({ tools: [{ name: "list_candidates" }] })),
    callTool: vi.fn(async (p: { name: string }) => {
      calls.push(p.name);
      if (dies) {
        dies = false;
        throw Object.assign(new Error("HTTP 401 Unauthorized"), { status: 401 });
      }
      return { content: [{ type: "text", text: "ok" }] };
    }),
  };
  const getRemote = vi.fn(async () => remote); // refresh+rebuild returns same fake
  const h = makeHandlers(getRemote);
  expect(await h.listTools()).toEqual({ tools: [{ name: "list_candidates" }] });
  const r = await h.callTool({ name: "list_candidates", arguments: {} });
  expect(r).toEqual({ content: [{ type: "text", text: "ok" }] });
  expect(remote.callTool).toHaveBeenCalledTimes(2); // 401 → retry
  expect(getRemote).toHaveBeenCalledTimes(2); // initial + rebuild-after-401
});

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { cacheGet, cacheSet, withCache } from "../cache.js";

// These tests exercise the graceful-fallback path: when REDIS_URL is unset
// (the default in CI), every cache op is a no-op and withCache always calls
// through to the underlying function.

describe("cache fallback (no Redis)", () => {
  test("cacheGet returns null when Redis is not configured", async () => {
    const v = await cacheGet("nonexistent-key");
    assert.equal(v, null);
  });

  test("cacheSet swallows errors and returns void", async () => {
    const result = await cacheSet("k", { v: 1 }, 60);
    assert.equal(result, undefined);
  });

  test("withCache always invokes the fn when cache is a no-op", async () => {
    let calls = 0;
    const compute = async () => { calls++; return { hello: "world" }; };
    const a = await withCache("test-key", 60, compute);
    const b = await withCache("test-key", 60, compute);
    assert.equal(calls, 2, "expected compute to be called twice without Redis");
    assert.deepEqual(a, { hello: "world" });
    assert.deepEqual(b, { hello: "world" });
  });
});

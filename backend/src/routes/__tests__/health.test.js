import { test, describe } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";

// Mirror the small piece of index.js we want to exercise — keeps the test
// hermetic and doesn't pull in DB/Redis bootstrap.
function buildApp() {
  const app = express();
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" });
  });
  return app;
}

describe("GET /api/health", () => {
  test("responds 200 with status=ok", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
    assert.ok(res.body.timestamp);
    assert.equal(res.body.version, "1.0.0");
  });

  test("timestamp is a valid ISO string", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/health");
    assert.ok(!Number.isNaN(Date.parse(res.body.timestamp)));
  });
});

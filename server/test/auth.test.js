// Auth API tests — node:test + node:assert, no frameworks.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Isolated data dir and a fixed JWT secret for tests.
process.env.DATA_DIR = mkdtempSync(join(tmpdir(), "oposdipu-test-"));
process.env.JWT_SECRET = "test-secret";
process.env.PORT = "0"; // ephemeral port — we take the real one from the server

const { start } = await import("../index.js");

let server;
let base;

before(async () => {
  server = start({ port: 0 });
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  rmSync(process.env.DATA_DIR, { recursive: true, force: true });
});

async function api(method, path, { body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // non-JSON body
  }
  return { status: res.status, json };
}

let token;

test("register → 201", async () => {
  const { status, json } = await api("POST", "/api/auth/register", {
    body: { username: "tester", password: "secret123" },
  });
  assert.equal(status, 201);
  assert.equal(json.username, "tester");
});

test("register duplicado → 409", async () => {
  const { status } = await api("POST", "/api/auth/register", {
    body: { username: "tester", password: "secret123" },
  });
  assert.equal(status, 409);
});

test("validación → 400 (username corto / password corto)", async () => {
  const shortUser = await api("POST", "/api/auth/register", {
    body: { username: "ab", password: "secret123" },
  });
  assert.equal(shortUser.status, 400);

  const shortPass = await api("POST", "/api/auth/register", {
    body: { username: "tester2", password: "123" },
  });
  assert.equal(shortPass.status, 400);
});

test("login → 200 con token", async () => {
  const { status, json } = await api("POST", "/api/auth/login", {
    body: { username: "tester", password: "secret123" },
  });
  assert.equal(status, 200);
  assert.ok(typeof json.token === "string" && json.token.length > 0);
  token = json.token;
});

test("login malo → 401", async () => {
  const wrong = await api("POST", "/api/auth/login", {
    body: { username: "tester", password: "wrongpass" },
  });
  assert.equal(wrong.status, 401);

  const unknown = await api("POST", "/api/auth/login", {
    body: { username: "nobody", password: "secret123" },
  });
  assert.equal(unknown.status, 401);
});

test("/me con token → 200 {username}", async () => {
  const { status, json } = await api("GET", "/api/auth/me", { token });
  assert.equal(status, 200);
  assert.equal(json.username, "tester");
});

test("/me sin token → 401", async () => {
  const { status } = await api("GET", "/api/auth/me");
  assert.equal(status, 401);
});

test("/me con token inválido → 401", async () => {
  const { status } = await api("GET", "/api/auth/me", {
    token: "not.a.valid.token",
  });
  assert.equal(status, 401);
});

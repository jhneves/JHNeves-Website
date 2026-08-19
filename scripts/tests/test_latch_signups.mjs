import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const loadModule = async (relativePath) => {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
};

const interestModule = await loadModule("../../functions/api/latch-interest.js");
const downloadModule = await loadModule("../../functions/api/latch-download.js");
const downloadGrantModule = await loadModule("../../functions/api/latch-download/[token].js");
const protectedDownloadModule = await loadModule("../../functions/latch/downloads/Latch-0.1-8.dmg.js");
const exportModule = await loadModule("../../functions/api/latch-signups.js");

class MemoryKV {
  constructor(entries = []) {
    this.values = new Map(entries);
  }

  async get(key, type) {
    const value = this.values.get(key) ?? null;
    return type === "json" && value ? JSON.parse(value) : value;
  }

  async put(key, value) {
    this.values.set(key, value);
  }

  async delete(key) {
    this.values.delete(key);
  }

  async list({ prefix = "" }) {
    const keys = [...this.values.keys()]
      .filter((key) => key.startsWith(prefix))
      .map((name) => ({ name }));
    return { keys, cursor: "", list_complete: true };
  }
}

class MemoryAssets {
  constructor(response = new Response("signed dmg", {
    headers: { "content-type": "application/octet-stream" },
  })) {
    this.response = response;
    this.requests = [];
  }

  async fetch(request) {
    this.requests.push(request);
    return this.response;
  }
}

const signupRequest = (body) => new Request("https://jhneves.com/api/latch-interest", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "referer": "https://jhneves.com/latch/?campaign=beta",
  },
  body: JSON.stringify(body),
});

const downloadRequest = (body) => new Request("https://jhneves.com/api/latch-download", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "referer": "https://jhneves.com/latch/?campaign=beta",
  },
  body: JSON.stringify(body),
});

test("Latch beta download stores the email and issues a single-use DMG grant", async () => {
  const kv = new MemoryKV();
  const assets = new MemoryAssets();
  const response = await downloadModule.onRequestPost({
    request: downloadRequest({ email: "  Person@Example.com " }),
    env: { WAITLIST: kv, ASSETS: assets },
  });

  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.ok, true);
  assert.match(result.downloadUrl, /^\/api\/latch-download\/[0-9a-f]{48}$/);
  assert.equal(assets.requests.length, 0);

  assert.equal(kv.values.size, 2);
  const [key, rawRecord] = [...kv.values.entries()].find(([entryKey]) => /^latch:[0-9a-f]{64}$/.test(entryKey));
  const firstRecord = JSON.parse(rawRecord);
  assert.match(key, /^latch:[0-9a-f]{64}$/);
  assert.equal(firstRecord.email, "person@example.com");
  assert.equal(firstRecord.downloadCount, 1);
  assert.equal(firstRecord.consent, "latch_beta_and_release_updates");

  const token = result.downloadUrl.split("/").pop();
  const grantResponse = await downloadGrantModule.onRequestGet({
    env: { WAITLIST: kv, ASSETS: assets },
    params: { token },
  });
  assert.equal(grantResponse.status, 200);
  assert.equal(grantResponse.headers.get("content-type"), "application/x-apple-diskimage");
  assert.equal(grantResponse.headers.get("content-disposition"), 'attachment; filename="Latch-0.1-8.dmg"');
  assert.equal(grantResponse.headers.get("cache-control"), "private, no-store");
  assert.equal(await grantResponse.text(), "signed dmg");
  assert.equal(assets.requests.length, 1);
  assert.equal(new URL(assets.requests[0]).pathname, "/latch/downloads/Latch-0.1-8.dmg");
  assert.equal(kv.values.has(`latch-download:${token}`), false);

  const reusedGrant = await downloadGrantModule.onRequestGet({
    env: { WAITLIST: kv, ASSETS: new MemoryAssets() },
    params: { token },
  });
  assert.equal(reusedGrant.status, 404);

  const duplicate = await downloadModule.onRequestPost({
    request: downloadRequest({ email: "PERSON@example.com" }),
    env: { WAITLIST: kv, ASSETS: new MemoryAssets() },
  });
  assert.equal(duplicate.status, 200);
  const duplicateRecord = JSON.parse(kv.values.get(key));
  assert.equal(duplicateRecord.firstAt, firstRecord.firstAt);
  assert.equal(duplicateRecord.downloadCount, 2);
});

test("Latch beta download rejects invalid requests and unavailable dependencies", async () => {
  const kv = new MemoryKV();
  const assets = new MemoryAssets();

  const invalid = await downloadModule.onRequestPost({
    request: downloadRequest({ email: "not-an-email" }),
    env: { WAITLIST: kv, ASSETS: assets },
  });
  assert.equal(invalid.status, 400);

  const honeypot = await downloadModule.onRequestPost({
    request: downloadRequest({ email: "bot@example.com", website: "spam" }),
    env: { WAITLIST: kv, ASSETS: assets },
  });
  assert.equal(honeypot.status, 400);
  assert.equal(kv.values.size, 0);
  assert.equal(assets.requests.length, 0);

  const unavailable = await downloadModule.onRequestPost({
    request: downloadRequest({ email: "person@example.com" }),
    env: {},
  });
  assert.equal(unavailable.status, 503);

  const invalidGrant = await downloadGrantModule.onRequestGet({
    env: { WAITLIST: kv, ASSETS: assets },
    params: { token: "not-a-token" },
  });
  assert.equal(invalidGrant.status, 404);
});

test("The public DMG path is blocked", async () => {
  const response = protectedDownloadModule.onRequest();
  assert.equal(response.status, 404);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("Latch signups normalize and deduplicate email without storing request metadata", async () => {
  const kv = new MemoryKV();
  const firstResponse = await interestModule.onRequestPost({
    request: signupRequest({ email: "  Person@Example.com " }),
    env: { WAITLIST: kv },
  });

  assert.equal(firstResponse.status, 200);
  assert.equal(kv.values.size, 1);
  const [key, rawRecord] = [...kv.values.entries()][0];
  const firstRecord = JSON.parse(rawRecord);
  assert.match(key, /^latch:[0-9a-f]{64}$/);
  assert.equal(firstRecord.email, "person@example.com");
  assert.equal(firstRecord.ref, "/latch/");
  assert.equal(firstRecord.consent, "latch_product_updates");
  assert.equal("ip" in firstRecord, false);
  assert.equal("ua" in firstRecord, false);

  const duplicateResponse = await interestModule.onRequestPost({
    request: signupRequest({ email: "PERSON@example.com" }),
    env: { WAITLIST: kv },
  });
  assert.equal(duplicateResponse.status, 200);
  assert.equal(kv.values.size, 1);
  const duplicateRecord = JSON.parse(kv.values.get(key));
  assert.equal(duplicateRecord.firstAt, firstRecord.firstAt);
});

test("Latch signup rejects invalid email and fails visibly without storage", async () => {
  const invalidResponse = await interestModule.onRequestPost({
    request: signupRequest({ email: "not-an-email" }),
    env: { WAITLIST: new MemoryKV() },
  });
  assert.equal(invalidResponse.status, 400);

  const unavailableResponse = await interestModule.onRequestPost({
    request: signupRequest({ email: "person@example.com" }),
    env: {},
  });
  assert.equal(unavailableResponse.status, 503);
});

test("Honeypot submissions return success without storing an address", async () => {
  const kv = new MemoryKV();
  const response = await interestModule.onRequestPost({
    request: signupRequest({ email: "bot@example.com", website: "spam" }),
    env: { WAITLIST: kv },
  });
  assert.equal(response.status, 200);
  assert.equal(kv.values.size, 0);
});

test("CSV export requires the admin token and includes only Latch records", async () => {
  const kv = new MemoryKV([
    ["latch:one", JSON.stringify({
      email: "person@example.com",
      firstAt: "2026-07-26T10:00:00Z",
      lastAt: "2026-07-26T10:00:00Z",
      ref: "/latch/",
    })],
    ["2026-07-20__wingman@example.com", JSON.stringify({ email: "wingman@example.com" })],
  ]);

  const unauthorized = await exportModule.onRequestGet({
    request: new Request("https://jhneves.com/api/latch-signups"),
    env: { WAITLIST: kv, ADMIN_TOKEN: "secret" },
  });
  assert.equal(unauthorized.status, 401);

  const authorized = await exportModule.onRequestGet({
    request: new Request("https://jhneves.com/api/latch-signups", {
      headers: { "authorization": "Bearer secret" },
    }),
    env: { WAITLIST: kv, ADMIN_TOKEN: "secret" },
  });
  const csv = await authorized.text();
  assert.equal(authorized.status, 200);
  assert.match(csv, /person@example\.com/);
  assert.doesNotMatch(csv, /wingman@example\.com/);
  assert.equal(authorized.headers.get("cache-control"), "no-store");
});

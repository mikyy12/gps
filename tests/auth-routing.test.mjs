import test from "node:test";
import assert from "node:assert/strict";
import { resolvePostLoginPath } from "../src/lib/auth/role-routing.mjs";

test("falls back to role home when next is absent", () => {
  assert.equal(resolvePostLoginPath("admin", null), "/admin");
  assert.equal(resolvePostLoginPath("agency", undefined), "/agency");
  assert.equal(resolvePostLoginPath("operator", ""), "/operator");
});

test("accepts only paths inside the authenticated role portal", () => {
  assert.equal(resolvePostLoginPath("agency", "/agency/reservations"), "/agency/reservations");
  assert.equal(resolvePostLoginPath("operator", "/operator/availability"), "/operator/availability");
  assert.equal(resolvePostLoginPath("agency", "/admin"), "/agency");
  assert.equal(resolvePostLoginPath("operator", "/agency"), "/operator");
});

test("rejects scheme-relative and external redirect attempts", () => {
  assert.equal(resolvePostLoginPath("admin", "//evil.example"), "/admin");
  assert.equal(resolvePostLoginPath("agency", "https://evil.example"), "/agency");
  assert.equal(resolvePostLoginPath("operator", "javascript:alert(1)"), "/operator");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { can, cleanDelegations, permissionsOf, PERMS } from "../src/lib/auth/permissions.ts";

test("owner has every permission", () => {
  for (const p of PERMS) assert.equal(can({ role: "owner", mfa: false }, p), true, p);
});

test("staff: agenda and contact details only — no website, finance, health, exports", () => {
  const s = { role: "staff", mfa: true };
  for (const p of ["agenda.view", "agenda.manage", "customers.view"] as const) assert.equal(can(s, p), true, p);
  for (const p of ["cms.edit", "cms.publish", "finance", "health.view", "customers.export", "customers.manage", "hours.manage"] as const) assert.equal(can(s, p), false, p);
});

test("delegations: only allowed ones count, sensitive ones need two-step verification", () => {
  assert.deepEqual(cleanDelegations("staff", ["finance", "health.view", "nonsense", "health.view"]), ["health.view"]);
  assert.equal(can({ role: "staff", mfa: false, delegations: ["health.view"] }, "health.view"), false, "no 2FA → no health data");
  assert.equal(can({ role: "staff", mfa: true, delegations: ["health.view"] }, "health.view"), true);
  assert.equal(can({ role: "manager", mfa: true, delegations: ["finance"] }, "finance"), true);
  assert.equal(can({ role: "manager", mfa: false, delegations: ["finance"] }, "finance"), false);
  assert.equal(can({ role: "manager", mfa: true, delegations: ["hours.manage"] }, "hours.manage"), true);
  assert.equal(can({ role: "manager", mfa: true, delegations: [] }, "finance"), false, "manager has no finance by default");
});

test("editor: draft texts only; unknown roles get nothing (fail closed)", () => {
  assert.deepEqual([...permissionsOf({ role: "editor", mfa: true, delegations: ["cms.publish", "finance"] })], ["cms.edit"]);
  assert.equal(permissionsOf({ role: "admin", mfa: true }).size, 0);
  assert.equal(permissionsOf({ role: "", mfa: true }).size, 0);
});

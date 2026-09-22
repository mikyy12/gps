import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const sql = fs.readFileSync("supabase/migrations/20260911051000_s0_security_stabilization.sql", "utf8");

test("enables RLS on previously uncovered public tables", () => {
  for (const table of ["agencies_users", "routes", "tours"]) {
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY;`));
  }
});

test("operator-sensitive policies are scoped by vessel owner", () => {
  assert.match(sql, /v\.owner_id = auth\.uid\(\)/);
  assert.match(sql, /v\.owner_id = v_user/);
  assert.match(sql, /availability_admin_or_operator_write/);
  assert.match(sql, /reservations_select_role_scoped/);
  assert.match(sql, /vouchers_select_role_scoped/);
});

test("new users are not assigned an operational role implicitly", () => {
  assert.match(sql, /INSERT INTO public\.profiles \(id, role_id, first_name, last_name\)/);
  assert.match(sql, /NEW\.id,\s*NULL,/s);
});

test("SECURITY DEFINER mutation RPCs perform explicit ownership checks", () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.cancel_reservation/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.update_availability_seats/);
  assert.match(sql, /RAISE EXCEPTION 'NOT_ALLOWED'/);
});

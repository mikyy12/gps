import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required for integration tests.');
}

const options = { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } };
const service = createClient(url, serviceRoleKey, options);

async function createUser(email) {
  const password = 'R1-Admin-Test!42';
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(error);
  assert.ok(data.user?.id);
  return { id: data.user.id, email, password };
}

async function login(user) {
  const client = createClient(url, anonKey, options);
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password });
  assert.ifError(error);
  return client;
}

test('admin catalog writes persist while agency callers are denied', async (t) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const adminUser = await createUser(`catalog-admin-${suffix}@example.test`);
  const agencyUser = await createUser(`catalog-agency-${suffix}@example.test`);

  const { data: roleRows, error: roleError } = await service.from('roles').select('id,name');
  assert.ifError(roleError);
  const roles = Object.fromEntries(roleRows.map((row) => [row.name, row.id]));

  for (const [userId, roleId] of [[adminUser.id, roles.admin], [agencyUser.id, roles.agency]]) {
    const { error } = await service.from('profiles').update({ role_id: roleId }).eq('id', userId);
    assert.ifError(error);
  }

  const admin = await login(adminUser);
  const agency = await login(agencyUser);

  await t.test('admin can create an agency with a configured commission', async () => {
    const { data, error } = await admin
      .from('agencies')
      .insert({
        name: `Admin Agency ${suffix}`,
        ruc: `ADMIN-${suffix}`,
        email: `contact-${suffix}@example.test`,
        commission_rate: 0.18,
      })
      .select('id,name,commission_rate')
      .single();
    assert.ifError(error);
    assert.equal(data.name, `Admin Agency ${suffix}`);
    assert.equal(Number(data.commission_rate), 0.18);
  });

  await t.test('admin can create a tour with a persisted base price', async () => {
    const { data, error } = await admin
      .from('tours')
      .insert({ name: `Admin Tour ${suffix}`, description: 'Persisted from admin flow', base_price: 125.5 })
      .select('id,name,base_price')
      .single();
    assert.ifError(error);
    assert.equal(data.name, `Admin Tour ${suffix}`);
    assert.equal(Number(data.base_price), 125.5);
  });

  await t.test('agency role cannot create agencies', async () => {
    const { error } = await agency.from('agencies').insert({ name: `Forbidden Agency ${suffix}`, commission_rate: 0.15 });
    assert.ok(error, 'agency insert into agencies must be denied by RLS');
  });

  await t.test('agency role cannot create tours', async () => {
    const { error } = await agency.from('tours').insert({ name: `Forbidden Tour ${suffix}`, base_price: 1 });
    assert.ok(error, 'agency insert into tours must be denied by RLS');
  });
});

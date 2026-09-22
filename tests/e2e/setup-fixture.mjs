import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const agencyEmail = process.env.E2E_AGENCY_EMAIL ?? 'e2e-agency@example.test';
const agencyPassword = process.env.E2E_AGENCY_PASSWORD ?? 'E2E-Password!42';
const operatorEmail = process.env.E2E_OPERATOR_EMAIL ?? 'e2e-operator@example.test';
const operatorPassword = process.env.E2E_OPERATOR_PASSWORD ?? 'E2E-Operator-Password!42';

if (!url || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the E2E fixture.');
}

const service = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

async function createUser(email, password, firstName, lastName) {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });
  assert.ifError(error);
  assert.ok(data.user?.id, `user ${email} should be created`);
  return data.user.id;
}

async function one(table, values) {
  const { data, error } = await service.from(table).insert(values).select('*').single();
  assert.ifError(error);
  return data;
}

const { data: roleRows, error: roleError } = await service.from('roles').select('id,name');
assert.ifError(roleError);
const roles = Object.fromEntries(roleRows.map((row) => [row.name, row.id]));
assert.ok(roles.agency && roles.operator, 'agency and operator roles must exist');

const agencyUserId = await createUser(agencyEmail, agencyPassword, 'E2E', 'Agency');
const operatorUserId = await createUser(
  operatorEmail,
  operatorPassword,
  'E2E',
  'Operator',
);

for (const [userId, roleId] of [
  [agencyUserId, roles.agency],
  [operatorUserId, roles.operator],
]) {
  const { error } = await service.from('profiles').update({ role_id: roleId }).eq('id', userId);
  assert.ifError(error);
}

const agency = await one('agencies', {
  name: 'E2E Galapagos Agency',
  ruc: 'E2E-RUC-001',
  commission_rate: 0.2,
});

const { error: membershipError } = await service.from('agencies_users').insert({
  agency_id: agency.id,
  user_id: agencyUserId,
});
assert.ifError(membershipError);

const route = await one('routes', {
  name: 'E2E Santa Cruz → Isabela',
  origin: 'Puerto Ayora',
  destination: 'Puerto Villamil',
  duration_minutes: 120,
});

const tour = await one('tours', {
  name: 'E2E Ferry Isabela',
  description: 'Deterministic browser E2E fixture',
  base_price: 40,
});

const vessel = await one('vessels', {
  name: 'E2E Ferry One',
  registration_number: 'E2E-VESSEL-001',
  capacity: 10,
  vessel_type: 'ferry',
  owner_id: operatorUserId,
});

const departure = new Date();
departure.setUTCDate(departure.getUTCDate() + 30);
const departureDate = departure.toISOString().slice(0, 10);

await one('availability', {
  vessel_id: vessel.id,
  route_id: route.id,
  tour_id: tour.id,
  date: departureDate,
  departure_time: '07:00:00',
  total_seats: 10,
  available_seats: 10,
  status: 'active',
});

console.log(`E2E fixture ready for ${agencyEmail} on ${departureDate}`);

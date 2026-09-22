import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error('SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required for integration tests.');
}

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
};
const service = createClient(url, serviceRoleKey, clientOptions);

async function createUser(email) {
  const password = 'O2-Holds-Password!42';
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: 'O2', last_name: 'Holds' },
  });
  assert.ifError(error);
  return { id: data.user.id, email, password };
}

async function signedClient(user) {
  const client = createClient(url, anonKey, clientOptions);
  const { error } = await client.auth.signInWithPassword({ email: user.email, password: user.password });
  assert.ifError(error);
  return client;
}

async function one(table, values) {
  const { data, error } = await service.from(table).insert(values).select('*').single();
  assert.ifError(error);
  return data;
}

async function setRole(userId, roleId) {
  const { error } = await service.from('profiles').update({ role_id: roleId }).eq('id', userId);
  assert.ifError(error);
}

function expectDenied(error, fragment) {
  assert.ok(error, 'expected RPC to be rejected');
  if (fragment) assert.match(error.message, new RegExp(fragment, 'i'));
}

test('O2 expiring holds and idempotency are authoritative', async (t) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const users = {
    agencyA: await createUser(`o2-agency-a-${suffix}@example.test`),
    agencyB: await createUser(`o2-agency-b-${suffix}@example.test`),
  };

  const { data: roleRows, error: roleError } = await service.from('roles').select('id,name');
  assert.ifError(roleError);
  const roles = Object.fromEntries(roleRows.map((row) => [row.name, row.id]));
  await setRole(users.agencyA.id, roles.agency);
  await setRole(users.agencyB.id, roles.agency);

  const agencies = {
    a: await one('agencies', { name: `O2 Agency A ${suffix}`, ruc: `O2-A-${suffix}` }),
    b: await one('agencies', { name: `O2 Agency B ${suffix}`, ruc: `O2-B-${suffix}` }),
  };
  for (const membership of [
    { agency_id: agencies.a.id, user_id: users.agencyA.id },
    { agency_id: agencies.b.id, user_id: users.agencyB.id },
  ]) {
    const { error } = await service.from('agencies_users').insert(membership);
    assert.ifError(error);
  }

  const route = await one('routes', {
    name: `O2 Route ${suffix}`,
    origin: 'Puerto Ayora',
    destination: 'Puerto Villamil',
    duration_minutes: 120,
  });
  const tour = await one('tours', {
    name: `O2 Tour ${suffix}`,
    description: 'O2 holds integration fixture',
    base_price: 50,
  });
  const vessel = await one('vessels', {
    name: `O2 Vessel ${suffix}`,
    registration_number: `O2-${suffix}`,
    capacity: 10,
    vessel_type: 'ferry',
    owner_id: users.agencyA.id,
  });
  const availability = await one('availability', {
    vessel_id: vessel.id,
    route_id: route.id,
    tour_id: tour.id,
    date: '2032-02-15',
    departure_time: '07:00:00',
    total_seats: 3,
    available_seats: 3,
    status: 'active',
  });
  const clients = {
    agencyA: await signedClient(users.agencyA),
    agencyB: await signedClient(users.agencyB),
  };

  let hold;
  await t.test('creates one hold and repeats it idempotently', async () => {
    const request = {
      p_availability_id: availability.id,
      p_agency_id: agencies.a.id,
      p_passenger_count: 2,
      p_lead_passenger_name: 'Hold Passenger',
      p_lead_passenger_document: 'O2-001',
      p_idempotency_key: `o2-key-${suffix}`,
      p_hold_seconds: 900,
    };
    const first = await clients.agencyA.rpc('create_reservation_hold', request);
    assert.ifError(first.error);
    assert.equal(first.data.length, 1);
    assert.equal(first.data[0].reservation_status, 'held');
    assert.equal(first.data[0].reused, false);
    assert.ok(first.data[0].expires_at);
    hold = first.data[0];

    const repeated = await clients.agencyA.rpc('create_reservation_hold', request);
    assert.ifError(repeated.error);
    assert.equal(repeated.data[0].reservation_id, hold.reservation_id);
    assert.equal(repeated.data[0].reused, true);

    const { data: availabilityRow, error: availabilityError } = await service
      .from('availability').select('available_seats').eq('id', availability.id).single();
    assert.ifError(availabilityError);
    assert.equal(availabilityRow.available_seats, 1, 'idempotent retry must not consume another seat');
  });

  await t.test('same key with a different payload is rejected', async () => {
    const { data, error } = await clients.agencyA.rpc('create_reservation_hold', {
      p_availability_id: availability.id,
      p_agency_id: agencies.a.id,
      p_passenger_count: 1,
      p_lead_passenger_name: 'Different Passenger',
      p_lead_passenger_document: 'O2-002',
      p_idempotency_key: `o2-key-${suffix}`,
      p_hold_seconds: 900,
    });
    assert.equal(data, null);
    expectDenied(error, 'IDEMPOTENCY_CONFLICT');
  });

  await t.test('agency cannot confirm another agency hold', async () => {
    const { data, error } = await clients.agencyB.rpc('confirm_reservation_hold', {
      p_reservation_id: hold.reservation_id,
    });
    assert.equal(data, null);
    expectDenied(error, 'NOT_ALLOWED');
  });

  await t.test('owner confirms once and receives one voucher', async () => {
    const { data, error } = await clients.agencyA.rpc('confirm_reservation_hold', {
      p_reservation_id: hold.reservation_id,
    });
    assert.ifError(error);
    assert.equal(data.length, 1);
    assert.equal(data[0].reservation_status, 'confirmed');
    assert.ok(data[0].voucher_token);

    const repeated = await clients.agencyA.rpc('confirm_reservation_hold', {
      p_reservation_id: hold.reservation_id,
    });
    assert.ifError(repeated.error);
    assert.equal(repeated.data[0].voucher_token, data[0].voucher_token);

    const { data: vouchers, error: voucherError } = await service
      .from('vouchers').select('id').eq('reservation_id', hold.reservation_id);
    assert.ifError(voucherError);
    assert.equal(vouchers.length, 1);
  });

  await t.test('expired holds release seats before a new hold', async () => {
    const expiring = await clients.agencyA.rpc('create_reservation_hold', {
      p_availability_id: availability.id,
      p_agency_id: agencies.a.id,
      p_passenger_count: 1,
      p_lead_passenger_name: 'Expiring Passenger',
      p_lead_passenger_document: 'O2-003',
      p_idempotency_key: `o2-expiring-${suffix}`,
      p_hold_seconds: 60,
    });
    assert.ifError(expiring.error);

    const { error: expireError } = await service.from('reservations')
      .update({ expires_at: '2000-01-01T00:00:00Z' })
      .eq('id', expiring.data[0].reservation_id);
    assert.ifError(expireError);

    const replacement = await clients.agencyA.rpc('create_reservation_hold', {
      p_availability_id: availability.id,
      p_agency_id: agencies.a.id,
      p_passenger_count: 1,
      p_lead_passenger_name: 'Replacement Passenger',
      p_lead_passenger_document: 'O2-004',
      p_idempotency_key: `o2-replacement-${suffix}`,
      p_hold_seconds: 900,
    });
    assert.ifError(replacement.error);
    assert.equal(replacement.data[0].reservation_status, 'held');

    const { data: expired, error: expiredError } = await service.from('reservations')
      .select('status').eq('id', expiring.data[0].reservation_id).single();
    assert.ifError(expiredError);
    assert.equal(expired.status, 'expired');
  });

  await t.test('concurrent holds cannot oversell the last seat', async () => {
    const lastSeatAvailability = await one('availability', {
      vessel_id: vessel.id,
      route_id: route.id,
      tour_id: tour.id,
      date: '2032-02-16',
      departure_time: '08:00:00',
      total_seats: 1,
      available_seats: 1,
      status: 'active',
    });
    const results = await Promise.all([
      clients.agencyA.rpc('create_reservation_hold', {
        p_availability_id: lastSeatAvailability.id, p_agency_id: agencies.a.id,
        p_passenger_count: 1, p_lead_passenger_name: 'Concurrent A', p_lead_passenger_document: 'A',
        p_idempotency_key: `o2-concurrent-a-${suffix}`, p_hold_seconds: 900,
      }),
      clients.agencyA.rpc('create_reservation_hold', {
        p_availability_id: lastSeatAvailability.id, p_agency_id: agencies.a.id,
        p_passenger_count: 1, p_lead_passenger_name: 'Concurrent B', p_lead_passenger_document: 'B',
        p_idempotency_key: `o2-concurrent-b-${suffix}`, p_hold_seconds: 900,
      }),
    ]);
    assert.equal(results.filter((result) => !result.error).length, 1);
    assert.equal(results.filter((result) => result.error?.message.includes('INSUFFICIENT_SEATS')).length, 1);
  });
});

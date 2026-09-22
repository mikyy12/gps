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
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

const service = createClient(url, serviceRoleKey, clientOptions);

async function createUser(email, password = 'R1-Test-Password!42') {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: 'R1', last_name: 'Fixture' },
  });
  assert.ifError(error);
  assert.ok(data.user?.id, `user ${email} should be created`);
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
  assert.ok(error, `expected request to be denied${fragment ? ` with ${fragment}` : ''}`);
  if (fragment) assert.match(`${error.message} ${error.details ?? ''}`, new RegExp(fragment, 'i'));
}

test('R1 live Supabase authorization and booking invariants', async (t) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const users = {
    admin: await createUser(`admin-${suffix}@example.test`),
    agencyA: await createUser(`agency-a-${suffix}@example.test`),
    agencyB: await createUser(`agency-b-${suffix}@example.test`),
    operatorA: await createUser(`operator-a-${suffix}@example.test`),
    operatorB: await createUser(`operator-b-${suffix}@example.test`),
    pending: await createUser(`pending-${suffix}@example.test`),
  };

  const { data: roleRows, error: roleError } = await service.from('roles').select('id,name');
  assert.ifError(roleError);
  const roles = Object.fromEntries(roleRows.map((row) => [row.name, row.id]));
  assert.ok(roles.admin && roles.agency && roles.operator, 'operational roles must exist');

  await setRole(users.admin.id, roles.admin);
  await setRole(users.agencyA.id, roles.agency);
  await setRole(users.agencyB.id, roles.agency);
  await setRole(users.operatorA.id, roles.operator);
  await setRole(users.operatorB.id, roles.operator);

  const agencyA = await one('agencies', { name: `R1 Agency A ${suffix}`, ruc: `A-${suffix}` });
  const agencyB = await one('agencies', { name: `R1 Agency B ${suffix}`, ruc: `B-${suffix}` });
  for (const membership of [
    { agency_id: agencyA.id, user_id: users.agencyA.id },
    { agency_id: agencyB.id, user_id: users.agencyB.id },
  ]) {
    const { error } = await service.from('agencies_users').insert(membership);
    assert.ifError(error);
  }

  const route = await one('routes', {
    name: `R1 Santa Cruz → Isabela ${suffix}`,
    origin: 'Puerto Ayora',
    destination: 'Puerto Villamil',
    duration_minutes: 120,
  });
  const tour = await one('tours', {
    name: `R1 Ferry ${suffix}`,
    description: 'Integration fixture',
    base_price: 40,
  });
  const vesselA = await one('vessels', {
    name: `R1 Vessel A ${suffix}`,
    registration_number: `VA-${suffix}`,
    capacity: 10,
    vessel_type: 'ferry',
    owner_id: users.operatorA.id,
  });
  const vesselB = await one('vessels', {
    name: `R1 Vessel B ${suffix}`,
    registration_number: `VB-${suffix}`,
    capacity: 10,
    vessel_type: 'ferry',
    owner_id: users.operatorB.id,
  });
  const availabilityA = await one('availability', {
    vessel_id: vesselA.id,
    route_id: route.id,
    tour_id: tour.id,
    date: '2030-01-15',
    departure_time: '07:00:00',
    total_seats: 10,
    available_seats: 10,
    status: 'active',
  });
  const availabilityB = await one('availability', {
    vessel_id: vesselB.id,
    route_id: route.id,
    tour_id: tour.id,
    date: '2030-01-16',
    departure_time: '08:00:00',
    total_seats: 10,
    available_seats: 10,
    status: 'active',
  });

  const clients = {
    admin: await signedClient(users.admin),
    agencyA: await signedClient(users.agencyA),
    agencyB: await signedClient(users.agencyB),
    operatorA: await signedClient(users.operatorA),
    operatorB: await signedClient(users.operatorB),
    pending: await signedClient(users.pending),
  };

  await t.test('new users remain pending and cannot self-escalate role_id', async () => {
    const { data: pendingProfile, error: pendingReadError } = await clients.pending
      .from('profiles')
      .select('id,role_id')
      .eq('id', users.pending.id)
      .single();
    assert.ifError(pendingReadError);
    assert.equal(pendingProfile.role_id, null);

    const { error: escalationError } = await clients.pending
      .from('profiles')
      .update({ role_id: roles.admin })
      .eq('id', users.pending.id);
    expectDenied(escalationError, 'ROLE_CHANGE_NOT_ALLOWED');

    const { error: ownProfileError } = await clients.pending
      .from('profiles')
      .update({ first_name: 'Pending' })
      .eq('id', users.pending.id);
    assert.ifError(ownProfileError);
  });

  await t.test('admin can provision an operational role through the audited RPC', async () => {
    const { data, error } = await clients.admin.rpc('assign_user_role', {
      p_user_id: users.pending.id,
      p_role: 'agency',
    });
    assert.ifError(error);
    assert.equal(data, true);

    const { data: profile, error: profileError } = await service
      .from('profiles')
      .select('role_id')
      .eq('id', users.pending.id)
      .single();
    assert.ifError(profileError);
    assert.equal(profile.role_id, roles.agency);
  });

  await t.test('agency membership is tenant-scoped', async () => {
    const { data: rowsA, error: errorA } = await clients.agencyA.from('agencies').select('id');
    assert.ifError(errorA);
    assert.deepEqual(rowsA.map((row) => row.id), [agencyA.id]);

    const { data: rowsB, error: errorB } = await clients.agencyB.from('agencies').select('id');
    assert.ifError(errorB);
    assert.deepEqual(rowsB.map((row) => row.id), [agencyB.id]);
  });

  await t.test('direct reservation inserts are denied so seat locking cannot be bypassed', async () => {
    const { error } = await clients.agencyA.from('reservations').insert({
      availability_id: availabilityA.id,
      agency_id: agencyA.id,
      user_id: users.agencyA.id,
      status: 'confirmed',
      total_price: 1,
      commission_amount: 0,
      passenger_count: 1,
      lead_passenger_name: 'Bypass Attempt',
    });
    expectDenied(error);
  });

  await t.test('agency cannot book on behalf of another tenant', async () => {
    const { error } = await clients.agencyA.rpc('create_reservation', {
      p_availability_id: availabilityA.id,
      p_agency_id: agencyB.id,
      p_passenger_count: 1,
      p_lead_passenger_name: 'Wrong Tenant',
      p_lead_passenger_document: 'TEST-1',
    });
    expectDenied(error, 'AGENCY_NOT_ALLOWED');
  });

  let reservationA;
  let voucherA;
  await t.test('authorized agency booking is atomic and decrements inventory', async () => {
    const { data, error } = await clients.agencyA.rpc('create_reservation', {
      p_availability_id: availabilityA.id,
      p_agency_id: agencyA.id,
      p_passenger_count: 2,
      p_lead_passenger_name: 'Allowed Passenger',
      p_lead_passenger_document: 'TEST-2',
    });
    assert.ifError(error);
    assert.equal(data.length, 1);
    reservationA = data[0].reservation_id;
    voucherA = data[0].voucher_token;
    assert.equal(data[0].available_seats, 8);
    assert.equal(Number(data[0].total_price), 80);
    assert.equal(Number(data[0].commission_amount), 12);
  });

  await t.test('operators only see their own fleet, availability, reservations and vouchers', async () => {
    const { data: vesselsA, error: vesselsAError } = await clients.operatorA.from('vessels').select('id');
    assert.ifError(vesselsAError);
    assert.deepEqual(vesselsA.map((row) => row.id), [vesselA.id]);

    const { data: vesselsB, error: vesselsBError } = await clients.operatorB.from('vessels').select('id');
    assert.ifError(vesselsBError);
    assert.deepEqual(vesselsB.map((row) => row.id), [vesselB.id]);

    const { data: availabilityRowsA, error: availabilityRowsAError } = await clients.operatorA.from('availability').select('id');
    assert.ifError(availabilityRowsAError);
    assert.deepEqual(availabilityRowsA.map((row) => row.id), [availabilityA.id]);

    const { data: reservationRowsA, error: reservationRowsAError } = await clients.operatorA.from('reservations').select('id').eq('id', reservationA);
    assert.ifError(reservationRowsAError);
    assert.equal(reservationRowsA.length, 1);

    const { data: reservationRowsB, error: reservationRowsBError } = await clients.operatorB.from('reservations').select('id').eq('id', reservationA);
    assert.ifError(reservationRowsBError);
    assert.equal(reservationRowsB.length, 0);

    const { data: voucherRowsA, error: voucherRowsAError } = await clients.operatorA.from('vouchers').select('qr_code_token').eq('reservation_id', reservationA);
    assert.ifError(voucherRowsAError);
    assert.equal(voucherRowsA.length, 1);

    const { data: voucherRowsB, error: voucherRowsBError } = await clients.operatorB.from('vouchers').select('qr_code_token').eq('reservation_id', reservationA);
    assert.ifError(voucherRowsBError);
    assert.equal(voucherRowsB.length, 0);
  });

  await t.test('cross-operator mutation RPCs are rejected', async () => {
    const { error: seatError } = await clients.operatorB.rpc('update_availability_seats', {
      p_availability_id: availabilityA.id,
      p_available_seats: 7,
    });
    expectDenied(seatError, 'NOT_ALLOWED');

    const { error: cancelError } = await clients.operatorB.rpc('cancel_reservation', {
      p_reservation_id: reservationA,
    });
    expectDenied(cancelError, 'NOT_ALLOWED');
  });

  await t.test('owning operator may mutate own inventory and cancel its reservation', async () => {
    const { data: seats, error: seatError } = await clients.operatorA.rpc('update_availability_seats', {
      p_availability_id: availabilityA.id,
      p_available_seats: 7,
    });
    assert.ifError(seatError);
    assert.equal(seats, 7);

    const { data: cancelled, error: cancelError } = await clients.operatorA.rpc('cancel_reservation', {
      p_reservation_id: reservationA,
    });
    assert.ifError(cancelError);
    assert.equal(cancelled, true);

    const anonymous = createClient(url, anonKey, clientOptions);
    const { data: verification, error: verificationError } = await anonymous.rpc('verify_voucher', { p_token: voucherA });
    assert.ifError(verificationError);
    assert.equal(verification.length, 0, 'cancelled voucher must not verify as valid');
  });

  await t.test('unrelated agency cannot read another agency reservation', async () => {
    const { data, error } = await clients.agencyB.from('reservations').select('id').eq('id', reservationA);
    assert.ifError(error);
    assert.equal(data.length, 0);
  });

  await t.test('admin retains global visibility while operator B fixture remains isolated', async () => {
    const { data: vessels, error: vesselsError } = await clients.admin.from('vessels').select('id');
    assert.ifError(vesselsError);
    assert.ok(vessels.some((row) => row.id === vesselA.id));
    assert.ok(vessels.some((row) => row.id === vesselB.id));

    const { data: availabilityRows, error: availabilityError } = await clients.operatorB.from('availability').select('id');
    assert.ifError(availabilityError);
    assert.deepEqual(availabilityRows.map((row) => row.id), [availabilityB.id]);
  });
});

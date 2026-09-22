import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error(
    'SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required for integration tests.'
  );
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

const service = createClient(url, serviceRoleKey, clientOptions);

async function createUser(email, password = 'R3-Test-Password!42') {
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: 'R3',
      last_name: 'Fixture',
    },
  });

  assert.ifError(error);
  assert.ok(data.user?.id, `user ${email} should be created`);

  return {
    id: data.user.id,
    email,
    password,
  };
}

async function signedClient(user) {
  const client = createClient(url, anonKey, clientOptions);

  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  assert.ifError(error);
  return client;
}

async function one(table, values) {
  const { data, error } = await service
    .from(table)
    .insert(values)
    .select('*')
    .single();

  assert.ifError(error);
  return data;
}

async function setRole(userId, roleId) {
  const { error } = await service
    .from('profiles')
    .update({ role_id: roleId })
    .eq('id', userId);

  assert.ifError(error);
}

function expectDenied(error, fragment) {
  assert.ok(
    error,
    `expected request to be denied${fragment ? ` with ${fragment}` : ''}`
  );

  if (fragment) {
    assert.match(
      `${error.message} ${error.details ?? ''}`,
      new RegExp(fragment, 'i')
    );
  }
}

async function createBooking({
  client,
  availabilityId,
  agencyId,
  passengerName,
  document,
}) {
  const { data, error } = await client.rpc('create_reservation', {
    p_availability_id: availabilityId,
    p_agency_id: agencyId,
    p_passenger_count: 1,
    p_lead_passenger_name: passengerName,
    p_lead_passenger_document: document,
  });

  assert.ifError(error);
  assert.equal(data.length, 1);

  return {
    reservationId: data[0].reservation_id,
    voucherToken: data[0].voucher_token,
  };
}

test('R3 authoritative voucher redemption and anti-double-use invariants', async (t) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const users = {
    admin: await createUser(`admin-${suffix}@example.test`),
    agencyA: await createUser(`agency-a-${suffix}@example.test`),
    agencyB: await createUser(`agency-b-${suffix}@example.test`),
    operatorA: await createUser(`operator-a-${suffix}@example.test`),
    operatorB: await createUser(`operator-b-${suffix}@example.test`),
  };

  const { data: roleRows, error: roleError } = await service
    .from('roles')
    .select('id,name');

  assert.ifError(roleError);

  const roles = Object.fromEntries(
    roleRows.map((row) => [row.name, row.id])
  );

  assert.ok(
    roles.admin && roles.agency && roles.operator,
    'required operational roles must exist'
  );

  await setRole(users.admin.id, roles.admin);
  await setRole(users.agencyA.id, roles.agency);
  await setRole(users.agencyB.id, roles.agency);
  await setRole(users.operatorA.id, roles.operator);
  await setRole(users.operatorB.id, roles.operator);

  const agencyA = await one('agencies', {
    name: `R3 Agency A ${suffix}`,
    ruc: `R3-A-${suffix}`,
  });

  const agencyB = await one('agencies', {
    name: `R3 Agency B ${suffix}`,
    ruc: `R3-B-${suffix}`,
  });

  for (const membership of [
    {
      agency_id: agencyA.id,
      user_id: users.agencyA.id,
    },
    {
      agency_id: agencyB.id,
      user_id: users.agencyB.id,
    },
  ]) {
    const { error } = await service
      .from('agencies_users')
      .insert(membership);

    assert.ifError(error);
  }

  const route = await one('routes', {
    name: `R3 Puerto Ayora → Puerto Villamil ${suffix}`,
    origin: 'Puerto Ayora',
    destination: 'Puerto Villamil',
    duration_minutes: 120,
  });

  const tour = await one('tours', {
    name: `R3 Ferry ${suffix}`,
    description: 'R3 voucher redemption integration fixture',
    base_price: 40,
  });

  const vesselA = await one('vessels', {
    name: `R3 Vessel A ${suffix}`,
    registration_number: `R3-VA-${suffix}`,
    capacity: 20,
    vessel_type: 'ferry',
    owner_id: users.operatorA.id,
  });

  const vesselB = await one('vessels', {
    name: `R3 Vessel B ${suffix}`,
    registration_number: `R3-VB-${suffix}`,
    capacity: 20,
    vessel_type: 'ferry',
    owner_id: users.operatorB.id,
  });

  const availabilityA = await one('availability', {
    vessel_id: vesselA.id,
    route_id: route.id,
    tour_id: tour.id,
    date: '2031-01-15',
    departure_time: '07:00:00',
    total_seats: 20,
    available_seats: 20,
    status: 'active',
  });

  const availabilityB = await one('availability', {
    vessel_id: vesselB.id,
    route_id: route.id,
    tour_id: tour.id,
    date: '2031-01-16',
    departure_time: '08:00:00',
    total_seats: 20,
    available_seats: 20,
    status: 'active',
  });

  const clients = {
    admin: await signedClient(users.admin),
    agencyA: await signedClient(users.agencyA),
    agencyB: await signedClient(users.agencyB),
    operatorA: await signedClient(users.operatorA),
    operatorB: await signedClient(users.operatorB),
  };

  let operatorVoucher;
  let operatorReservation;

  await t.test('operator can redeem a voucher belonging to their own vessel', async () => {
    const booking = await createBooking({
      client: clients.agencyA,
      availabilityId: availabilityA.id,
      agencyId: agencyA.id,
      passengerName: 'Own Vessel Passenger',
      document: `OWN-${suffix}`,
    });

    operatorReservation = booking.reservationId;
    operatorVoucher = booking.voucherToken;

    const { data, error } = await clients.operatorA.rpc(
      'redeem_voucher',
      {
        p_token: operatorVoucher,
      }
    );

    assert.ifError(error);
    assert.equal(data.length, 1);
    assert.equal(data[0].redeemed, true);
    assert.equal(data[0].reservation_id, operatorReservation);
    assert.equal(data[0].voucher_status, 'redeemed');
    assert.ok(data[0].redeemed_at);

    const { data: voucher, error: voucherError } = await service
      .from('vouchers')
      .select('status,redeemed_at,redeemed_by')
      .eq('id', data[0].voucher_id)
      .single();

    assert.ifError(voucherError);
    assert.equal(voucher.status, 'redeemed');
    assert.equal(voucher.redeemed_by, users.operatorA.id);
    assert.ok(voucher.redeemed_at);
  });

  await t.test('second redemption attempt is rejected', async () => {
    const { data, error } = await clients.operatorA.rpc(
      'redeem_voucher',
      {
        p_token: operatorVoucher,
      }
    );

    assert.equal(data, null);
    expectDenied(error, 'VOUCHER_NOT_REDEEMABLE|VOUCHER_ALREADY_REDEEMED');

    const { data: redemptions, error: redemptionError } = await service
      .from('voucher_redemptions')
      .select('id,voucher_id,reservation_id,redeemed_by')
      .eq('voucher_id', (
        await service
          .from('vouchers')
          .select('id')
          .eq('qr_code_token', operatorVoucher)
          .single()
      ).data.id);

    assert.ifError(redemptionError);
    assert.equal(redemptions.length, 1);
    assert.equal(redemptions[0].redeemed_by, users.operatorA.id);
  });

  await t.test('concurrent redemption allows exactly one winner', async () => {
    const booking = await createBooking({
      client: clients.agencyA,
      availabilityId: availabilityA.id,
      agencyId: agencyA.id,
      passengerName: 'Concurrent Passenger',
      document: `CONCURRENT-${suffix}`,
    });

    const results = await Promise.all(
      [clients.operatorA, clients.operatorA].map((client) =>
        client.rpc('redeem_voucher', { p_token: booking.voucherToken })
      )
    );

    assert.equal(results.filter(({ error }) => !error).length, 1);
    assert.equal(results.filter(({ error }) => error).length, 1);
    expectDenied(
      results.find(({ error }) => error)?.error,
      'VOUCHER_NOT_REDEEMABLE|VOUCHER_ALREADY_REDEEMED'
    );

    const { data: redemptionRows, error: redemptionError } = await service
      .from('vouchers')
      .select('id,status')
      .eq('qr_code_token', booking.voucherToken)
      .single();

    assert.ifError(redemptionError);
    assert.equal(redemptionRows.status, 'redeemed');

    const { data: auditRows, error: auditError } = await service
      .from('voucher_redemptions')
      .select('id')
      .eq('voucher_id', redemptionRows.id);

    assert.ifError(auditError);
    assert.equal(auditRows.length, 1);
  });

  await t.test('agency cannot redeem vouchers', async () => {
    const booking = await createBooking({
      client: clients.agencyA,
      availabilityId: availabilityA.id,
      agencyId: agencyA.id,
      passengerName: 'Agency Must Not Redeem',
      document: `AGENCY-${suffix}`,
    });

    const { data, error } = await clients.agencyA.rpc(
      'redeem_voucher',
      {
        p_token: booking.voucherToken,
      }
    );

    assert.equal(data, null);
    expectDenied(error, 'ROLE_NOT_ALLOWED');

    const { data: voucher, error: voucherError } = await service
      .from('vouchers')
      .select('status')
      .eq('qr_code_token', booking.voucherToken)
      .single();

    assert.ifError(voucherError);
    assert.equal(voucher.status, 'issued');
  });

  await t.test('operator cannot redeem a voucher belonging to another operator', async () => {
    const booking = await createBooking({
      client: clients.agencyA,
      availabilityId: availabilityB.id,
      agencyId: agencyA.id,
      passengerName: 'Wrong Operator Passenger',
      document: `WRONG-OP-${suffix}`,
    });

    const { data, error } = await clients.operatorA.rpc(
      'redeem_voucher',
      {
        p_token: booking.voucherToken,
      }
    );

    assert.equal(data, null);
    expectDenied(error, 'OPERATOR_NOT_ALLOWED');

    const { data: voucher, error: voucherError } = await service
      .from('vouchers')
      .select('status,redeemed_by')
      .eq('qr_code_token', booking.voucherToken)
      .single();

    assert.ifError(voucherError);
    assert.equal(voucher.status, 'issued');
    assert.equal(voucher.redeemed_by, null);
  });

  await t.test('admin can redeem globally', async () => {
    const booking = await createBooking({
      client: clients.agencyB,
      availabilityId: availabilityB.id,
      agencyId: agencyB.id,
      passengerName: 'Admin Redemption Passenger',
      document: `ADMIN-${suffix}`,
    });

    const { data, error } = await clients.admin.rpc(
      'redeem_voucher',
      {
        p_token: booking.voucherToken,
      }
    );

    assert.ifError(error);
    assert.equal(data.length, 1);
    assert.equal(data[0].redeemed, true);

    const { data: voucher, error: voucherError } = await service
      .from('vouchers')
      .select('status,redeemed_by')
      .eq('qr_code_token', booking.voucherToken)
      .single();

    assert.ifError(voucherError);
    assert.equal(voucher.status, 'redeemed');
    assert.equal(voucher.redeemed_by, users.admin.id);
  });

  await t.test('cancelled reservation cannot be redeemed', async () => {
    const booking = await createBooking({
      client: clients.agencyA,
      availabilityId: availabilityA.id,
      agencyId: agencyA.id,
      passengerName: 'Cancelled Passenger',
      document: `CANCEL-${suffix}`,
    });

    const { data: cancelled, error: cancelError } = await clients.agencyA.rpc(
      'cancel_reservation',
      {
        p_reservation_id: booking.reservationId,
      }
    );

    assert.ifError(cancelError);
    assert.equal(cancelled, true);

    const { data, error } = await clients.operatorA.rpc(
      'redeem_voucher',
      {
        p_token: booking.voucherToken,
      }
    );

    assert.equal(data, null);
    expectDenied(error, 'RESERVATION_NOT_REDEEMABLE');

    const { data: voucher, error: voucherError } = await service
      .from('vouchers')
      .select('status')
      .eq('qr_code_token', booking.voucherToken)
      .single();

    assert.ifError(voucherError);
    assert.equal(voucher.status, 'issued');
  });

  await t.test('unknown voucher token is rejected', async () => {
    const { data, error } = await clients.admin.rpc(
      'redeem_voucher',
      {
        p_token: `invalid-r3-token-${suffix}`,
      }
    );

    assert.equal(data, null);
    expectDenied(error, 'VOUCHER_NOT_FOUND');
  });

  await t.test('direct authenticated voucher mutation cannot bypass redemption RPC', async () => {
    const booking = await createBooking({
      client: clients.agencyA,
      availabilityId: availabilityA.id,
      agencyId: agencyA.id,
      passengerName: 'Direct Mutation Passenger',
      document: `DIRECT-${suffix}`,
    });

    const { data: updatedRows, error } = await clients.operatorA
      .from('vouchers')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redeemed_by: users.operatorA.id,
      })
      .eq('qr_code_token', booking.voucherToken)
      .select('id');

    assert.ifError(error);
    assert.deepEqual(updatedRows, []);

    const { data: voucher, error: voucherError } = await service
      .from('vouchers')
      .select('status,redeemed_by')
      .eq('qr_code_token', booking.voucherToken)
      .single();

    assert.ifError(voucherError);
    assert.equal(voucher.status, 'issued');
    assert.equal(voucher.redeemed_by, null);
  });

  await t.test('redemption creates exactly one append-only record and one audit event', async () => {
    const booking = await createBooking({
      client: clients.agencyA,
      availabilityId: availabilityA.id,
      agencyId: agencyA.id,
      passengerName: 'Audit Passenger',
      document: `AUDIT-${suffix}`,
    });

    const { data, error } = await clients.operatorA.rpc(
      'redeem_voucher',
      {
        p_token: booking.voucherToken,
      }
    );

    assert.ifError(error);
    assert.equal(data.length, 1);

    const voucherId = data[0].voucher_id;

    const { data: redemptions, error: redemptionError } = await service
      .from('voucher_redemptions')
      .select('id,voucher_id,reservation_id,redeemed_by,redeemed_at')
      .eq('voucher_id', voucherId);

    assert.ifError(redemptionError);
    assert.equal(redemptions.length, 1);
    assert.equal(redemptions[0].voucher_id, voucherId);
    assert.equal(redemptions[0].reservation_id, booking.reservationId);
    assert.equal(redemptions[0].redeemed_by, users.operatorA.id);
    assert.ok(redemptions[0].redeemed_at);

    const { data: auditRows, error: auditError } = await service
      .from('audit_logs')
      .select('id,action,table_name,record_id,old_value,new_value')
      .eq('action', 'voucher.redeemed')
      .eq('table_name', 'vouchers')
      .eq('record_id', voucherId);

    assert.ifError(auditError);
    assert.equal(auditRows.length, 1);

    assert.equal(auditRows[0].old_value.status, 'issued');
    assert.equal(auditRows[0].new_value.status, 'redeemed');
    assert.equal(
      auditRows[0].new_value.reservation_id,
      booking.reservationId
    );
    assert.equal(
      auditRows[0].new_value.redeemed_by,
      users.operatorA.id
    );
  });

  await t.test('public verification remains read-only and reports redeemed state', async () => {
    const anonymous = createClient(url, anonKey, clientOptions);

    const { data, error } = await anonymous.rpc('verify_voucher', {
      p_token: operatorVoucher,
    });

    assert.ifError(error);
    assert.equal(data.length, 1);
    assert.equal(data[0].voucher_status, 'redeemed');
    assert.equal(data[0].reservation_status, 'confirmed');
    assert.ok(data[0].redeemed_at);
  });

  await t.test('voucher_redemptions is not directly writable through authenticated RLS', async () => {
    const booking = await createBooking({
      client: clients.agencyA,
      availabilityId: availabilityA.id,
      agencyId: agencyA.id,
      passengerName: 'RLS Redemption Passenger',
      document: `RLS-${suffix}`,
    });

    const { error } = await clients.operatorA
      .from('voucher_redemptions')
      .insert({
        voucher_id: (
          await service
            .from('vouchers')
            .select('id')
            .eq('qr_code_token', booking.voucherToken)
            .single()
        ).data.id,
        reservation_id: booking.reservationId,
        redeemed_by: users.operatorA.id,
      });

    expectDenied(error);
  });
});

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
  const password = 'R1-Search-Test!42';
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

async function insertOne(table, values) {
  const { data, error } = await service.from(table).insert(values).select('*').single();
  assert.ifError(error);
  return data;
}

test('server-side search filters before limit and booking uses agency commission rate', async () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const agencyUser = await createUser(`search-agency-${suffix}@example.test`);
  const operator = await createUser(`search-operator-${suffix}@example.test`);

  const { data: roleRows, error: roleError } = await service.from('roles').select('id,name');
  assert.ifError(roleError);
  const roles = Object.fromEntries(roleRows.map((row) => [row.name, row.id]));

  for (const [userId, roleId] of [
    [agencyUser.id, roles.agency],
    [operator.id, roles.operator],
  ]) {
    const { error } = await service.from('profiles').update({ role_id: roleId }).eq('id', userId);
    assert.ifError(error);
  }

  const agency = await insertOne('agencies', {
    name: `Commission Agency ${suffix}`,
    ruc: `COM-${suffix}`,
    commission_rate: 0.2,
  });
  const { error: membershipError } = await service.from('agencies_users').insert({
    agency_id: agency.id,
    user_id: agencyUser.id,
  });
  assert.ifError(membershipError);

  const matchingRoute = await insertOne('routes', {
    name: `Santa Cruz → Isabela ${suffix}`,
    origin: 'Puerto Ayora',
    destination: 'Puerto Villamil',
    duration_minutes: 120,
  });
  const nonMatchingRoute = await insertOne('routes', {
    name: `Santa Cruz → San Cristóbal ${suffix}`,
    origin: 'Puerto Ayora',
    destination: 'Puerto Baquerizo Moreno',
    duration_minutes: 150,
  });
  const tour = await insertOne('tours', {
    name: `Inter-island Ferry ${suffix}`,
    base_price: 50,
  });
  const vessel = await insertOne('vessels', {
    name: `Search Vessel ${suffix}`,
    registration_number: `SEARCH-${suffix}`,
    capacity: 100,
    vessel_type: 'ferry',
    owner_id: operator.id,
  });

  const fillerRows = Array.from({ length: 55 }, (_, index) => ({
    vessel_id: vessel.id,
    route_id: nonMatchingRoute.id,
    tour_id: tour.id,
    date: '2030-01-01',
    departure_time: `${String(Math.floor(index / 12)).padStart(2, '0')}:${String((index % 12) * 5).padStart(2, '0')}:00`,
    total_seats: 10,
    available_seats: 10,
    status: 'active',
  }));
  const { error: fillerError } = await service.from('availability').insert(fillerRows);
  assert.ifError(fillerError);

  const matchingAvailability = await insertOne('availability', {
    vessel_id: vessel.id,
    route_id: matchingRoute.id,
    tour_id: tour.id,
    date: '2030-02-01',
    departure_time: '07:00:00',
    total_seats: 10,
    available_seats: 4,
    status: 'active',
  });

  const agencyClient = await login(agencyUser);
  const uniqueRouteQuery = `Isabela ${suffix}`;

  const { data: searchRows, error: searchError } = await agencyClient.rpc('search_availability', {
    p_date: null,
    p_query: uniqueRouteQuery,
    p_passengers: 3,
  });
  assert.ifError(searchError);
  assert.equal(searchRows.length, 1, 'matching row must survive even when more than 50 earlier nonmatches exist');
  assert.equal(searchRows[0].id, matchingAvailability.id);
  assert.equal(searchRows[0].destination, 'Puerto Villamil');

  const { data: insufficientRows, error: insufficientError } = await agencyClient.rpc('search_availability', {
    p_date: null,
    p_query: uniqueRouteQuery,
    p_passengers: 5,
  });
  assert.ifError(insufficientError);
  assert.equal(insufficientRows.length, 0, 'search must enforce passenger capacity server-side');

  const { data: bookingRows, error: bookingError } = await agencyClient.rpc('create_reservation', {
    p_availability_id: matchingAvailability.id,
    p_agency_id: agency.id,
    p_passenger_count: 2,
    p_lead_passenger_name: 'Commission Passenger',
    p_lead_passenger_document: 'COMM-TEST',
  });
  assert.ifError(bookingError);
  assert.equal(bookingRows.length, 1);
  assert.equal(Number(bookingRows[0].total_price), 100);
  assert.equal(Number(bookingRows[0].commission_amount), 20, '20% agency commission must be calculated in PostgreSQL');

  const { data: storedReservation, error: storedError } = await agencyClient
    .from('reservations')
    .select('commission_amount,total_price')
    .eq('id', bookingRows[0].reservation_id)
    .single();
  assert.ifError(storedError);
  assert.equal(Number(storedReservation.total_price), 100);
  assert.equal(Number(storedReservation.commission_amount), 20);
});

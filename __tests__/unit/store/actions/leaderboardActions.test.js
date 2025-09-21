/**
 * leaderboardActions.test.js
 *
 * What This Test File Covers (4):
 *
 * 1. fetchLeaderboard (no filters)
 *    - Calls base URL with no params and returns leaderboard array.
 *
 * 2. fetchLeaderboard (with city + role filters)
 *    - Builds correct query string (?city=...&role=...) and returns leaderboard.
 *
 * 3. fetchLeaderboard (empty response)
 *    - Returns [] when response.leaderboard is missing.
 *
 * 4. fetchLeaderboard (error case)
 *    - Rejects with error.message or fallback string.
 */

import { configureStore } from '@reduxjs/toolkit';

// Mock API + paths
jest.mock('../../../../src/utils/api', () => ({ get: jest.fn() }));
jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_LEADERBOARD: 'https://api.example.com/leaderboard',
}));

import { get } from '../../../../src/utils/api';
import { fetchLeaderboard } from '../../../../src/store/actions/leaderboardActions';

// Minimal store
const makeStore = (preloadedState) =>
  configureStore({
    reducer: (state = preloadedState) => state,
    middleware: (gdm) => gdm({ serializableCheck: false }),
    preloadedState,
  });

beforeEach(() => {
  jest.clearAllMocks();
});

// 1) No filters
it('fetchLeaderboard returns leaderboard without filters', async () => {
  const data = { leaderboard: [{ id: 1, score: 100 }] };
  get.mockResolvedValueOnce(data);

  const store = makeStore({});
  const action = await store.dispatch(fetchLeaderboard());

  expect(get).toHaveBeenCalledWith('https://api.example.com/leaderboard');
  expect(action.type).toMatch(/leaderboard\/fetchLeaderboard\/fulfilled$/);
  expect(action.payload).toEqual(data.leaderboard);
});

// 2) With filters
it('fetchLeaderboard builds correct query with city and role', async () => {
  const data = { leaderboard: [{ id: 2, score: 200 }] };
  get.mockResolvedValueOnce(data);

  const store = makeStore({});
  const action = await store.dispatch(fetchLeaderboard({ city: 'Paris', role: 'admin' }));

  expect(get).toHaveBeenCalledWith('https://api.example.com/leaderboard?city=Paris&role=admin');
  expect(action.type).toMatch(/leaderboard\/fetchLeaderboard\/fulfilled$/);
  expect(action.payload).toEqual(data.leaderboard);
});

// 3) Empty response
it('fetchLeaderboard returns [] when leaderboard missing', async () => {
  get.mockResolvedValueOnce({});

  const store = makeStore({});
  const action = await store.dispatch(fetchLeaderboard());

  expect(action.type).toMatch(/leaderboard\/fetchLeaderboard\/fulfilled$/);
  expect(action.payload).toEqual([]);
});

// 4) Error case
it('fetchLeaderboard rejects with error.message', async () => {
  get.mockRejectedValueOnce(new Error('Boom'));

  const store = makeStore({});
  const action = await store.dispatch(fetchLeaderboard());

  expect(action.type).toMatch(/leaderboard\/fetchLeaderboard\/rejected$/);
  expect(action.payload).toBe('Boom');
});

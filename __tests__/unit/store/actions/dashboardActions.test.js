/**
 * fetchDashboard.test.js
 *
 * What This Test File Covers (4):
 *
 * 1. Successful fetch
 *    - Calls API with the correct URL and returns data.
 *
 * 2. Reject with error.message
 *    - If API throws with an Error, thunk rejects with that message.
 *
 * 3. Reject with fallback message
 *    - If API throws a non-Error (e.g. plain object), thunk rejects with "Failed to load dashboard".
 *
 * 4. Correct action types
 *    - Verifies that fulfilled and rejected actions have the right type suffixes.
 */

import { configureStore } from '@reduxjs/toolkit';

// Mock API module
jest.mock('../../../../src/utils/api', () => ({
  get: jest.fn(),
}));

jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_DASHBOARD: 'https://api.example.com/dashboard',
}));

import { get } from '../../../../src/utils/api';
import { fetchDashboard } from '../../../../src/store/actions/dashboardActions';

// Minimal store to dispatch thunks
const makeStore = (preloadedState) =>
  configureStore({
    reducer: (state = preloadedState) => state,
    middleware: (gdm) => gdm({ serializableCheck: false }),
    preloadedState,
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchDashboard', () => {
  it('fetches dashboard data successfully', async () => {
    const mockData = { stats: { score: 100 } };
    get.mockResolvedValueOnce(mockData);

    const store = makeStore({});
    const action = await store.dispatch(fetchDashboard('u-1'));

    expect(get).toHaveBeenCalledWith('https://api.example.com/dashboard/u-1');
    expect(action.type).toMatch(/dashboard\/fetchDashboard\/fulfilled$/);
    expect(action.payload).toEqual(mockData);
  });

  it('rejects with error.message when API throws Error', async () => {
    get.mockRejectedValueOnce(new Error('Boom'));

    const store = makeStore({});
    const action = await store.dispatch(fetchDashboard('u-2'));

    expect(action.type).toMatch(/dashboard\/fetchDashboard\/rejected$/);
    expect(action.payload).toBe('Boom');
  });

  it('rejects with fallback message when API throws non-Error', async () => {
    get.mockRejectedValueOnce({});

    const store = makeStore({});
    const action = await store.dispatch(fetchDashboard('u-3'));

    expect(action.type).toMatch(/dashboard\/fetchDashboard\/rejected$/);
    expect(action.payload).toBe('Failed to load dashboard');
  });

  it('produces correct action types', async () => {
    get.mockResolvedValueOnce({ ok: true });

    const store = makeStore({});
    const action = await store.dispatch(fetchDashboard('u-4'));

    expect(action.type).toBe('dashboard/fetchDashboard/fulfilled');
  });
});

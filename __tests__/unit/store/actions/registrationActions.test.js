/**
 * registerActions.test.js
 *
 * What These Tests Cover (3):
 *
 * 1. Successful registration
 *    - Calls POST with enriched payload, stores AsyncStorage values, returns data.
 *
 * 2. Missing lat/long
 *    - Ensures null is sent for latitude/longitude when absent.
 *
 * 3. Error rejection
 *    - When API rejects, thunk rejects with error.message.
 */

import { configureStore } from '@reduxjs/toolkit';

jest.mock('../../../../src/utils/api', () => ({
  post: jest.fn(),
}));
jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_USERS: 'https://api.example.com/users',
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { post } from '../../../../src/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser } from '../../../../src/store/actions/registrationActions';

// Minimal store
const makeStore = () =>
  configureStore({
    reducer: (s) => s || {},
    middleware: (gdm) => gdm({ serializableCheck: false }),
  });

beforeEach(() => {
  jest.clearAllMocks();
});

// 1) Successful registration
it('registerUser posts payload, stores AsyncStorage, returns data', async () => {
  const mockResp = { id: 'u1', name: 'Alice' };
  post.mockResolvedValueOnce(mockResp);

  const store = makeStore();
  const action = await store.dispatch(
    registerUser({
      phone_number: '12345',
      country_code: '+44',
      name: 'Alice',
      latitude: 50,
      longitude: -1,
    })
  );

  expect(post).toHaveBeenCalledWith(
    'https://api.example.com/users/register',
    expect.objectContaining({
      phone_number: '12345',
      country_code: '+44',
      latitude: 50,
      longitude: -1,
    }),
    {}
  );

  expect(AsyncStorage.setItem).toHaveBeenCalledWith('countryCode', '+44');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastPhone', '12345');

  expect(action.type).toMatch(/registration\/registerUser\/fulfilled$/);
  expect(action.payload).toEqual(mockResp);
});

// 2) Missing lat/long defaults to null
it('sends null for missing latitude/longitude', async () => {
  post.mockResolvedValueOnce({ ok: true });

  const store = makeStore();
  await store.dispatch(
    registerUser({ phone_number: '555', country_code: '+91', name: 'Bob' })
  );

  expect(post).toHaveBeenCalledWith(
    'https://api.example.com/users/register',
    expect.objectContaining({
      latitude: null,
      longitude: null,
    }),
    {}
  );
});

// 3) Error rejection
it('rejects with error.message on failure', async () => {
  post.mockRejectedValueOnce(new Error('boom'));

  const store = makeStore();
  const action = await store.dispatch(
    registerUser({ phone_number: '777', country_code: '+1' })
  );

  expect(action.type).toMatch(/registration\/registerUser\/rejected$/);
  expect(action.payload).toBe('boom');
});

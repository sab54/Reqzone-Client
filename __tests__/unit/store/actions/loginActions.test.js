/**
 * authActions.test.js
 *
 * What This Test File Covers (5):
 *
 * 1. requestOtp (success)
 *    - Posts correct body, stores phone+country in AsyncStorage, returns data.
 *
 * 2. requestOtp (failure)
 *    - Rejects with error.message.
 *
 * 3. verifyOtp (success & failure)
 *    - Success: posts user_id+otp, returns data.
 *    - Failure: rejects with error.message.
 *
 * 4. logout
 *    - Returns true.
 *
 * 5. updateUserLocation (success & failure)
 *    - Success: PATCH correct endpoint with coords, returns data.
 *    - Failure: rejects with error.message.
 */

import { configureStore } from '@reduxjs/toolkit';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock API + paths
jest.mock('../../../../src/utils/api', () => ({
  post: jest.fn(),
  patch: jest.fn(),
}));
jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_USERS: 'https://api.example.com/users',
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { post, patch } from '../../../../src/utils/api';
import {
  requestOtp,
  verifyOtp,
  logout,
  updateUserLocation,
} from '../../../../src/store/actions/loginActions';

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

// 1) requestOtp success
it('requestOtp posts body, stores AsyncStorage values, and returns data', async () => {
  post.mockResolvedValueOnce({ ok: true });
  const store = makeStore({});
  const payload = { phone_number: '1234567890', country_code: '+91' };

  const action = await store.dispatch(requestOtp(payload));

  expect(post).toHaveBeenCalledWith('https://api.example.com/users/request-otp', payload);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('countryCode', '+91');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastPhone', '1234567890');
  expect(action.type).toMatch(/auth\/requestOtp\/fulfilled$/);
  expect(action.payload).toEqual({ ok: true });
});

// 2) requestOtp failure
it('requestOtp rejects with error.message', async () => {
  post.mockRejectedValueOnce(new Error('Network fail'));
  const store = makeStore({});

  const action = await store.dispatch(
    requestOtp({ phone_number: '111', country_code: '+1' })
  );

  expect(action.type).toMatch(/auth\/requestOtp\/rejected$/);
  expect(action.payload).toBe('Network fail');
});

// 3) verifyOtp success & failure
it('verifyOtp posts user_id+otp and returns data', async () => {
  post.mockResolvedValueOnce({ token: 'jwt' });
  const store = makeStore({});

  const action = await store.dispatch(
    verifyOtp({ user_id: 'u-1', otp_code: '9999' })
  );

  expect(post).toHaveBeenCalledWith('https://api.example.com/users/verify-otp', {
    user_id: 'u-1',
    otp_code: '9999',
  });
  expect(action.type).toMatch(/auth\/verifyOtp\/fulfilled$/);
  expect(action.payload).toEqual({ token: 'jwt' });
});

it('verifyOtp rejects with error.message on failure', async () => {
  post.mockRejectedValueOnce(new Error('Bad OTP'));
  const store = makeStore({});

  const action = await store.dispatch(verifyOtp({ user_id: 'u-1', otp_code: '0000' }));

  expect(action.type).toMatch(/auth\/verifyOtp\/rejected$/);
  expect(action.payload).toBe('Bad OTP');
});

// 4) logout
it('logout simply resolves to true', async () => {
  const store = makeStore({});
  const action = await store.dispatch(logout());

  expect(action.type).toMatch(/auth\/logout\/fulfilled$/);
  expect(action.payload).toBe(true);
});

// 5) updateUserLocation success & failure
it('updateUserLocation PATCHes correct endpoint and returns data', async () => {
  patch.mockResolvedValueOnce({ updated: true });
  const store = makeStore({});
  const payload = { userId: '42', latitude: 1.23, longitude: 4.56 };

  const action = await store.dispatch(updateUserLocation(payload));

  expect(patch).toHaveBeenCalledWith(
    'https://api.example.com/users/42/location',
    { latitude: 1.23, longitude: 4.56 }
  );
  expect(action.type).toMatch(/auth\/updateUserLocation\/fulfilled$/);
  expect(action.payload).toEqual({ updated: true });
});

it('updateUserLocation rejects with error.message on failure', async () => {
  patch.mockRejectedValueOnce(new Error('GPS error'));
  const store = makeStore({});

  const action = await store.dispatch(updateUserLocation({ userId: '42', latitude: 0, longitude: 0 }));

  expect(action.type).toMatch(/auth\/updateUserLocation\/rejected$/);
  expect(action.payload).toBe('GPS error');
});

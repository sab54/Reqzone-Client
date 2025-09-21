/**
 * emergencyActions.test.js
 *
 * (Only the first test changed to properly mock DEV_MODE before importing the module.)
 */

import { configureStore } from '@reduxjs/toolkit';

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// API mocks
jest.mock('../../../../src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  del: jest.fn(),
}));

// Static mocks that are fine to keep at top-level
jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_USERS: 'https://api.example.com/users',
}));

// For most tests we'll use DEV_MODE=false; the first test will isolate modules and override.
jest.mock('../../../../src/utils/config', () => ({
  DEV_MODE: false,
}));

jest.mock('../../../../src/data/mockData', () => ({
  mockEmergencySettings: { customName: 'Mock', customNumber: '000', countryCode: 'US' },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, post, del } from '../../../../src/utils/api';
import {
  // NOTE: first test will dynamically re-require this with DEV_MODE=true
  loadEmergencySettings,
  saveEmergencySettings,
  fetchEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
} from '../../../../src/store/actions/emergencyActions';
import { setEmergencySettings } from '../../../../src/store/reducers/emergencyReducer';

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

// --- FIXED TEST ---
it('loadEmergencySettings dispatches mockEmergencySettings when DEV_MODE=true', async () => {
  // Make sure module-level singletons are re-evaluated with DEV_MODE=true
  jest.resetModules();

  // Re-mock with DEV_MODE=true BEFORE importing the actions module
  jest.doMock('../../../../src/utils/config', () => ({ DEV_MODE: true }), { virtual: true });
  jest.doMock('../../../../src/data/mockData', () => ({
    mockEmergencySettings: { customName: 'Mock', customNumber: '000', countryCode: 'US' },
  }), { virtual: true });

  // Re-require AFTER mocks so the thunk sees DEV_MODE=true
  const { loadEmergencySettings: loadWithDev } =
    require('../../../../src/store/actions/emergencyActions');

  const dispatch = jest.fn();
  await loadWithDev()(dispatch);

  // Assert on the action object (not function identity) to avoid cross-module instance issues
  expect(dispatch).toHaveBeenCalledWith({
    type: 'emergency/setEmergencySettings',
    payload: { customName: 'Mock', customNumber: '000', countryCode: 'US' },
  });
});

// 2) saveEmergencySettings (DEV_MODE false)
it('saveEmergencySettings stores values in AsyncStorage and dispatches them', async () => {
  const dispatch = jest.fn();
  const settings = { customName: 'Alice', customNumber: '12345', countryCode: 'IN' };

  await saveEmergencySettings(settings)(dispatch);

  expect(AsyncStorage.setItem).toHaveBeenCalledWith('emergencyContactName', 'Alice');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('emergencyContactNumber', '12345');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('emergencyCountry', 'IN');
  expect(dispatch).toHaveBeenCalledWith(setEmergencySettings(settings));
});

// 3) fetchEmergencyContacts (success)
it('fetchEmergencyContacts returns response.data', async () => {
  get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Eve' }] });

  const store = makeStore({});
  const action = await store.dispatch(fetchEmergencyContacts('u-1'));

  expect(get).toHaveBeenCalledWith('https://api.example.com/users/emergency-contacts/u-1');
  expect(action.type).toMatch(/emergency\/fetchContacts\/fulfilled$/);
  expect(action.payload).toEqual([{ id: 1, name: 'Eve' }]);
});

// 4) addEmergencyContact (success)
it('addEmergencyContact posts correct payload and returns it', async () => {
  post.mockResolvedValueOnce({});

  const store = makeStore({});
  const payload = { user_id: 'u-2', name: 'Bob', phone_number: '999' };
  const action = await store.dispatch(addEmergencyContact(payload));

  expect(post).toHaveBeenCalledWith('https://api.example.com/users/emergency-contacts', payload);
  expect(action.type).toMatch(/emergency\/addContact\/fulfilled$/);
  expect(action.payload).toEqual(payload);
});

// 5) deleteEmergencyContact (success)
it('deleteEmergencyContact calls API and returns id', async () => {
  del.mockResolvedValueOnce({});
  const store = makeStore({});

  const action = await store.dispatch(deleteEmergencyContact(42));

  expect(del).toHaveBeenCalledWith('https://api.example.com/users/emergency-contacts/42');
  expect(action.type).toMatch(/emergency\/deleteContact\/fulfilled$/);
  expect(action.payload).toBe(42);
});

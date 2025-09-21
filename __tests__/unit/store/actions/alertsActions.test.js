/**
 * alertsThunks.test.js
 *
 * What These Tests Cover:
 * 1) fetchGlobalHazardAlerts
 *    - US feed normalization (Atom/CAP style)
 *    - GB feed normalization (RSS style)
 *    - Error surface via rejectWithValue
 *
 * 2) fetchAlertsData
 *    - fullSystemFetch=true returns system alerts (with optional userId passthrough)
 *    - fullSystemFetch=false returns paginated/category data
 *
 * 3) CRUD-ish thunks
 *    - createSystemAlert, createEmergencyAlert, markAlertAsRead, deleteAlert
 *
 * 4) loadPendingActions (DEV_MODE=true path)
 *
 * Notes:
 * - We dispatch thunks into a minimal RTK store; we assert on the returned action’s
 *   `type` suffix and `payload` instead of reducers.
 */

import { configureStore } from '@reduxjs/toolkit';

// --- Mocks for modules used inside the thunks file ---
jest.mock('../../../../src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  del: jest.fn(),
}));
jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_ALERTS: 'https://api.example.com/alerts',
}));
jest.mock('../../../../src/utils/config', () => ({
  DEV_MODE: false, // default; overridden in a specific test via isolateModules
}));
jest.mock('../../../../src/data/mockData', () => ({
  mockAlerts: {
    pendingActions: [{ id: 'mock-pa-1', type: 'Acknowledge' }],
  },
}));
jest.mock('react-native-xml2js', () => ({
  parseString: jest.fn(), // we control parsed output per test
}));
jest.mock('../../../../src/utils/utils', () => ({
  getUserLocation: jest.fn(),
  reverseGeocode: jest.fn(),
}));

// Bring in the mocks to configure per-test
import { get, post, patch, del } from '../../../../src/utils/api';
import { parseString } from 'react-native-xml2js';
import { getUserLocation, reverseGeocode } from '../../../../src/utils/utils';

// Will import thunks AFTER mocks so they see the mocked modules
import * as thunks from '../../../../src/store/actions/alertsActions';

// Minimal store for dispatching thunks (no reducer transitions needed)
const makeStore = () =>
  configureStore({
    reducer: (state = {}) => state,
    middleware: (gdm) => gdm({ serializableCheck: false }),
  });

beforeEach(() => {
  jest.clearAllMocks();
  // global.fetch mock
  global.fetch = jest.fn().mockResolvedValue({
    text: async () => '<xml>irrelevant-when-parseString-is-mocked</xml>',
  });
});

describe('fetchGlobalHazardAlerts', () => {
  it('normalizes US CAP feed entries', async () => {
    // Arrange location -> US
    getUserLocation.mockResolvedValue({ latitude: 10, longitude: 20 });
    reverseGeocode.mockResolvedValue({ countryCode: 'US' });

    // XML -> parsed object (Atom/CAP fields under feed.entry[])
    parseString.mockImplementation((xml, opts, cb) => {
      cb(null, {
        feed: {
          entry: [
            {
              title: { _: 'US Alert' },
              summary: { _: 'Summary' },
              'cap:areaDesc': 'Area A',
              'cap:severity': 'Severe',
              'cap:event': 'Tornado',
              'cap:effective': '2023-01-01T00:00:00Z',
              'cap:expires': '2023-01-02T00:00:00Z',
              link: { href: 'https://cap.example/us-alert' },
              id: 'urn:cap:us:1',
            },
          ],
        },
      });
    });

    const store = makeStore();

    // Act
    const action = await store.dispatch(thunks.fetchGlobalHazardAlerts());

    // Assert
    expect(action.type).toMatch(/alerts\/fetchGlobalHazardAlerts\/fulfilled$/);
    expect(action.payload.country).toBe('US');
    expect(action.payload.alerts).toHaveLength(1);
    const alert = action.payload.alerts[0];
    expect(alert).toMatchObject({
      title: 'US Alert',
      summary: 'Summary',
      area: 'Area A',
      severity: 'Severe',
      event: 'Tornado',
      link: 'https://cap.example/us-alert',
      country: 'US',
      source: 'global',
    });
    // date fields normalized to ISO
    expect(alert.effective).toBe('2023-01-01T00:00:00.000Z');
    expect(alert.expires).toBe('2023-01-02T00:00:00.000Z');
    expect(action.payload.count).toBe(1);
    expect(typeof action.payload.timestamp).toBe('string');
  });

  it('normalizes GB RSS feed entries', async () => {
    getUserLocation.mockResolvedValue({ latitude: 50, longitude: 0 });
    reverseGeocode.mockResolvedValue({ countryCode: 'GB' });

    // XML -> parsed object (RSS under rss.channel.item[])
    parseString.mockImplementation((xml, opts, cb) => {
      cb(null, {
        rss: {
          channel: {
            item: [
              {
                title: 'GB Warning',
                description: 'Take care',
                'georss:point': '51.5 -0.12',
                'cap:severity': 'Moderate',
                category: { _: 'Weather Warning' },
                link: 'https://met.example/gb-warning',
              },
            ],
          },
        },
      });
    });

    const store = makeStore();
    const action = await store.dispatch(thunks.fetchGlobalHazardAlerts());

    expect(action.type).toMatch(/alerts\/fetchGlobalHazardAlerts\/fulfilled$/);
    expect(action.payload.country).toBe('GB');
    expect(action.payload.alerts).toHaveLength(1);
    const alert = action.payload.alerts[0];
    expect(alert).toMatchObject({
      title: 'GB Warning',
      summary: 'Take care',
      area: '51.5 -0.12',
      severity: 'Moderate',
      event: 'Weather Warning',
      link: 'https://met.example/gb-warning',
      country: 'GB',
      source: 'global',
      effective: null,
      expires: null,
    });
  });

  it('surfaces errors via rejectWithValue when no feed exists', async () => {
    getUserLocation.mockResolvedValue({ latitude: 1, longitude: 2 });
    reverseGeocode.mockResolvedValue({ countryCode: 'FR' }); // no feed configured

    const store = makeStore();
    const action = await store.dispatch(thunks.fetchGlobalHazardAlerts());

    expect(action.type).toMatch(/alerts\/fetchGlobalHazardAlerts\/rejected$/);
    expect(action.payload).toMatch(/No feed available for FR/);
  });
});

describe('fetchAlertsData', () => {
  it('fullSystemFetch=true returns system alerts & disables hasMore', async () => {
    get.mockResolvedValueOnce({ systemAlerts: [{ id: 1 }, { id: 2 }] });

    const store = makeStore();
    const action = await store.dispatch(
      thunks.fetchAlertsData({
        fullSystemFetch: true,
        userId: 'u-123',
      })
    );

    expect(action.type).toMatch(/alerts\/fetchAlertsData\/fulfilled$/);
    expect(action.payload).toEqual({
      alerts: [{ id: 1 }, { id: 2 }],
      hasMore: false,
      totalCount: 2,
      fromUserFetch: false,
      page: 1,
    });
    // Ensure our API helper was called with userId passthrough
    expect(get).toHaveBeenCalledWith(
      'https://api.example.com/alerts/system?userId=u-123'
    );
  });

  it('fullSystemFetch=false returns paginated/category data', async () => {
    get.mockResolvedValueOnce({
      alerts: [{ id: 'a' }],
      hasMore: true,
      totalCount: 10,
    });

    const store = makeStore();
    const action = await store.dispatch(
      thunks.fetchAlertsData({
        category: 'Flood',
        page: 3,
        pageSize: 6,
        fullSystemFetch: false,
      })
    );

    expect(action.type).toMatch(/alerts\/fetchAlertsData\/fulfilled$/);
    expect(action.payload).toEqual({
      alerts: [{ id: 'a' }],
      hasMore: true,
      totalCount: 10,
      fromUserFetch: false,
      page: 3,
    });
    expect(get).toHaveBeenCalledWith(
      'https://api.example.com/alerts?category=Flood&page=3&pageSize=6'
    );
  });
});

describe('CRUD-ish thunks', () => {
  it('createSystemAlert passes payload and returns API response', async () => {
    post.mockResolvedValueOnce({ ok: true, createdId: 'sys-1' });

    const store = makeStore();
    const action = await store.dispatch(
      thunks.createSystemAlert({
        userIds: ['u1'],
        title: 'Test',
        message: 'Hello',
        urgency: 'High',
        latitude: 1,
        longitude: 2,
        radius_km: 5,
        source: 'ops',
      })
    );

    expect(post).toHaveBeenCalledWith(
      'https://api.example.com/alerts/system',
      expect.objectContaining({
        userIds: ['u1'],
        title: 'Test',
        message: 'Hello',
        urgency: 'High',
      })
    );
    expect(action.type).toMatch(/alerts\/createSystemAlert\/fulfilled$/);
    expect(action.payload).toEqual({ ok: true, createdId: 'sys-1' });
  });

  it('createEmergencyAlert returns API response', async () => {
    post.mockResolvedValueOnce({ ok: true, id: 'em-42' });

    const store = makeStore();
    const action = await store.dispatch(
      thunks.createEmergencyAlert({
        title: 'SOS',
        message: 'Help',
        urgency: 'Critical',
        latitude: 10,
        longitude: 20,
        radius_km: 1,
        created_by: 'admin',
      })
    );

    expect(post).toHaveBeenCalledWith(
      'https://api.example.com/alerts/emergency',
      expect.objectContaining({ title: 'SOS', message: 'Help' })
    );
    expect(action.type).toMatch(/alerts\/createEmergencyAlert\/fulfilled$/);
    expect(action.payload).toEqual({ ok: true, id: 'em-42' });
  });

  it('markAlertAsRead returns alertId + response + alertType', async () => {
    patch.mockResolvedValueOnce({ ok: true });

    const store = makeStore();
    const action = await store.dispatch(
      thunks.markAlertAsRead({
        alertId: 'A1',
        alertType: 'system',
        userId: 'u-1',
      })
    );

    expect(patch).toHaveBeenCalledWith(
      'https://api.example.com/alerts/A1/read',
      { type: 'system', userId: 'u-1' }
    );
    expect(action.type).toMatch(/alerts\/markAlertAsRead\/fulfilled$/);
    expect(action.payload).toEqual({
      alertId: 'A1',
      response: { ok: true },
      alertType: 'system',
    });
  });

  it('deleteAlert returns the deleted alertId', async () => {
    del.mockResolvedValueOnce(undefined);

    const store = makeStore();
    const action = await store.dispatch(thunks.deleteAlert('to-del'));

    expect(del).toHaveBeenCalledWith(
      'https://api.example.com/alerts/to-del'
    );
    expect(action.type).toMatch(/alerts\/deleteAlert\/fulfilled$/);
    expect(action.payload).toBe('to-del');
  });
});

describe('loadPendingActions', () => {
  it('returns mock pending actions when DEV_MODE=true', async () => {
    await jest.isolateModulesAsync(async () => {
      // Make sure this isolated graph is clean
      jest.resetModules();

      // Mock BOTH modules that alertsActions reads at import time
      jest.doMock('../../../../src/utils/config', () => ({ DEV_MODE: true }));
      jest.doMock('../../../../src/data/mockData', () => ({
        mockAlerts: { pendingActions: [{ id: 'mock-pa-1', type: 'Acknowledge' }] },
      }));

      // Now import AFTER mocks so the file sees them
      const reloaded = require('../../../../src/store/actions/alertsActions');
      const { mockAlerts } = require('../../../../src/data/mockData');

      const store = configureStore({
        reducer: (s = {}) => s,
        middleware: (gdm) => gdm({ serializableCheck: false }),
      });

      const action = await store.dispatch(reloaded.loadPendingActions());

      expect(action.type).toMatch(/alerts\/loadPendingActions\/fulfilled$/);
      expect(action.payload).toEqual(mockAlerts.pendingActions);
    });
  });
});

describe('fetchGlobalHazardAlerts – error propagation', () => {
  it('rejects when XML parsing fails', async () => {
    getUserLocation.mockResolvedValue({ latitude: 10, longitude: 20 });
    reverseGeocode.mockResolvedValue({ countryCode: 'US' });

    parseString.mockImplementation((xml, opts, cb) => {
      cb(new Error('bad xml'));
    });

    const store = makeStore();
    const action = await store.dispatch(thunks.fetchGlobalHazardAlerts());

    expect(action.type).toMatch(/alerts\/fetchGlobalHazardAlerts\/rejected$/);
    expect(action.payload).toMatch(/bad xml|Failed to fetch global hazard alerts/);
  });
});

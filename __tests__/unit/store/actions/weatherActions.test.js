/**
 * weatherActions.test.js
 *
 * What These Tests Cover (5):
 * 1) DEV mode (current): uses mockWeatherData, toggles loading, no network.
 * 2) PROD current (cached & recent): uses cached state and skips network.
 * 3) PROD current (stale): hits network, uses getUserLocation, sets last fetch.
 * 4) DEV mode (forecast): filters 12:00:00 entries and slices 5.
 * 5) Error path (current): on fetch throw, sets error and clears loading.
 */

import { configureStore } from '@reduxjs/toolkit';

// Stable mocks (kept outside isolation)
jest.mock('../../../../src/utils/utils', () => ({
  getUserLocation: jest.fn(async () => ({ latitude: 51.5, longitude: -0.12 })),
}));

// Async reducer action creators (plain action objects so we can assert payloads)
function mockReducerModule() {
  return {
    setWeatherData: jest.fn((payload) => ({ type: 'weather/setWeatherData', payload })),
    setForecastData: jest.fn((payload) => ({ type: 'weather/setForecastData', payload })),
    setWeatherLoading: jest.fn((payload) => ({ type: 'weather/setWeatherLoading', payload })),
    setWeatherError: jest.fn((payload) => ({ type: 'weather/setWeatherError', payload })),
    setLastWeatherFetch: jest.fn((payload) => ({ type: 'weather/setLastWeatherFetch', payload })),
    setLastForecastFetch: jest.fn((payload) => ({ type: 'weather/setLastForecastFetch', payload })),
  };
}

// Helper to run a test inside an isolated module graph with specific config + mocks
function withIsolated({ DEV_MODE, KEY, mockData }, run) {
  jest.isolateModules(() => {
    // Config (DEV_MODE + OPENWEATHER_API_KEY)
    jest.doMock('../../../../src/utils/config', () => ({
      DEV_MODE,
      OPENWEATHER_API_KEY: KEY,
    }), { virtual: true });

    // Reducer action creators
    const reducerMocks = mockReducerModule();
    jest.doMock('../../../../src/store/reducers/weatherReducer', () => reducerMocks, { virtual: true });

    // Mock data module (DEV mode articles)
    jest.doMock('../../../../src/data/mockData', () => mockData, { virtual: true });

    // Require AFTER mocks
    const { fetchWeatherData, fetchForecastData } = require('../../../../src/store/actions/weatherActions');

    run({ actions: { fetchWeatherData, fetchForecastData }, reducerMocks });
  });
}

const makeStore = (preloadedState) =>
  configureStore({
    reducer: (s = preloadedState) => s,
    middleware: (gdm) => gdm({ serializableCheck: false }),
    preloadedState,
  });

const realFetch = global.fetch;
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});
afterAll(() => {
  global.fetch = realFetch;
});

// 1) DEV mode current weather
it('DEV: fetchWeatherData uses mockWeatherData, toggles loading, no network', async () => {
  withIsolated(
    {
      DEV_MODE: true,
      KEY: 'TEST',
      mockData: {
        mockWeatherData: { name: 'MockTown', main: { temp: 20 } },
        mockForecastData: { list: [] },
      },
    },
    async ({ actions, reducerMocks }) => {
      const store = makeStore({ weather: { lastWeatherFetch: null, current: null } });

      await store.dispatch(actions.fetchWeatherData());

      expect(reducerMocks.setWeatherLoading).toHaveBeenCalledWith(true);
      expect(reducerMocks.setWeatherData).toHaveBeenCalledWith({ name: 'MockTown', main: { temp: 20 } });
      expect(reducerMocks.setWeatherLoading).toHaveBeenCalledWith(false);
      expect(global.fetch).not.toHaveBeenCalled();
    }
  );
});

// 2) PROD current: cached & recent -> skip network
it('PROD: fetchWeatherData uses recent cached current and skips network', async () => {
  const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
  withIsolated(
    {
      DEV_MODE: false,
      KEY: 'OW_KEY',
      mockData: { mockWeatherData: {}, mockForecastData: { list: [] } },
    },
    async ({ actions, reducerMocks }) => {
      const cached = { name: 'CacheVille', main: { temp: 11 } };
      const store = makeStore({ weather: { lastWeatherFetch: recent, current: cached } });

      await store.dispatch(actions.fetchWeatherData());

      expect(global.fetch).not.toHaveBeenCalled();
      expect(reducerMocks.setWeatherData).toHaveBeenCalledWith(cached);
      expect(reducerMocks.setWeatherLoading).toHaveBeenCalledWith(false);
    }
  );
});

// 3) PROD current: stale -> fetch network
it('PROD: fetchWeatherData fetches when stale, uses getUserLocation, sets last fetch', async () => {
  const stale = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
  withIsolated(
    {
      DEV_MODE: false,
      KEY: 'OW123',
      mockData: { mockWeatherData: {}, mockForecastData: { list: [] } },
    },
    async ({ actions, reducerMocks }) => {
      global.fetch.mockResolvedValueOnce({
        json: async () => ({ name: 'London', main: { temp: 13 } }),
      });

      const store = makeStore({ weather: { lastWeatherFetch: stale, current: null } });

      await store.dispatch(actions.fetchWeatherData());

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.openweathermap.org/data/2.5/weather?lat=51.5&lon=-0.12&appid=OW123&units=metric')
      );
      expect(reducerMocks.setWeatherData).toHaveBeenCalledWith({ name: 'London', main: { temp: 13 } });
      // last fetch timestamp should be ISO string
      expect(reducerMocks.setLastWeatherFetch).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/));
      expect(reducerMocks.setWeatherLoading).toHaveBeenCalledWith(false);
    }
  );
});

// 4) DEV forecast: noon filter + slice 5
it('DEV: fetchForecastData filters dt_txt for 12:00:00 and slices 5 entries', async () => {
  const list = [
    { dt_txt: '2025-01-01 12:00:00', x: 1 },
    { dt_txt: '2025-01-02 09:00:00', x: 2 },
    { dt_txt: '2025-01-02 12:00:00', x: 3 },
    { dt_txt: '2025-01-03 12:00:00', x: 4 },
    { dt_txt: '2025-01-04 12:00:00', x: 5 },
    { dt_txt: '2025-01-05 12:00:00', x: 6 },
    { dt_txt: '2025-01-06 12:00:00', x: 7 },
  ];

  withIsolated(
    {
      DEV_MODE: true,
      KEY: 'IGNORED',
      mockData: { mockWeatherData: {}, mockForecastData: { list } },
    },
    async ({ actions, reducerMocks }) => {
      const store = makeStore({ weather: { lastForecastFetch: null, forecast: null } });

      await store.dispatch(actions.fetchForecastData());

      // Should take noon entries and slice to 5
      expect(reducerMocks.setForecastData).toHaveBeenCalledWith([
        { dt_txt: '2025-01-01 12:00:00', x: 1 },
        { dt_txt: '2025-01-02 12:00:00', x: 3 },
        { dt_txt: '2025-01-03 12:00:00', x: 4 },
        { dt_txt: '2025-01-04 12:00:00', x: 5 },
        { dt_txt: '2025-01-05 12:00:00', x: 6 },
      ]);
      expect(global.fetch).not.toHaveBeenCalled();
    }
  );
});

// 5) Error path: sets error and clears loading
it('on current weather fetch error, sets setWeatherError and clears loading', async () => {
  withIsolated(
    {
      DEV_MODE: false,
      KEY: 'OW_ERR',
      mockData: { mockWeatherData: {}, mockForecastData: { list: [] } },
    },
    async ({ actions, reducerMocks }) => {
      global.fetch.mockRejectedValueOnce(new Error('network fail'));
      const store = makeStore({ weather: { lastWeatherFetch: null, current: null } });

      await store.dispatch(actions.fetchWeatherData());

      expect(reducerMocks.setWeatherError).toHaveBeenCalledWith('network fail');
      expect(reducerMocks.setWeatherLoading).toHaveBeenCalledWith(false);
    }
  );
});

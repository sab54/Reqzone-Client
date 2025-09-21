/**
 * newsActions.test.js
 *
 * Fixed to use jest.isolateModules so each test has its own module graph.
 * We re-require the thunk & the reducer mock inside the same graph to avoid
 * stale jest.fn instances after resetModules.
 */

import { configureStore } from '@reduxjs/toolkit';

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Stable mocks (not re-mocked per test)
jest.mock('expo-localization', () => ({ region: 'GB' }));
jest.mock('../../../../src/data/mockData', () => ({
  mockArticles: {
    articles: [
      { title: 'Earthquake Alert', description: 'Seismic activity' },
      { title: 'Fire Response', description: 'Wildfire in region' },
      { title: 'Flood Update', description: 'Rivers rising' },
      { title: 'Rescue Ops', description: 'Swift water rescue' },
      { title: 'Preparedness Tips', description: 'Emergency kit' },
      { title: 'Evacuation Plan', description: 'Route details' },
      { title: 'Aftershock News', description: 'Safety review' },
    ],
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

const realFetch = global.fetch;
beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});
afterAll(() => {
  global.fetch = realFetch;
});

// Tiny store for dispatching thunks
const makeStore = (preloadedState) =>
  configureStore({
    reducer: (state = preloadedState) => state,
    middleware: (gdm) => gdm({ serializableCheck: false }),
    preloadedState,
  });

/** Utility: run a test inside an isolated module graph with given config mock. */
function withIsolatedModules(configMock, run) {
  jest.isolateModules(() => {
    // Per-test config (DEV_MODE/NEWS_API_KEY)
    jest.doMock('../../../../src/utils/config', () => configMock, { virtual: true });

    // Keep the reducer mocked so thunks call jest.fn() action creators
    jest.doMock('../../../../src/store/reducers/newsReducer', () => ({
      setNewsArticles: jest.fn((payload) => ({ type: 'news/setNewsArticles', payload })),
      appendNewsArticles: jest.fn((payload) => ({ type: 'news/appendNewsArticles', payload })),
      setNewsLoading: jest.fn((payload) => ({ type: 'news/setNewsLoading', payload })),
      setNewsTotal: jest.fn((payload) => ({ type: 'news/setNewsTotal', payload })),
    }), { virtual: true });

    // Require AFTER mocks are set
    const actions = require('../../../../src/store/actions/newsActions');
    const reducerMocks = require('../../../../src/store/reducers/newsReducer');

    run({ actions, reducerMocks });
  });
}

// 1) DEV: page 1, All
it('DEV: loads mock articles, sets total, and sets page 1 items', async () => {
  withIsolatedModules({ DEV_MODE: true, NEWS_API_KEY: 'TEST_KEY' }, async ({ actions, reducerMocks }) => {
    const { fetchNewsData } = actions;
    const { setNewsArticles, setNewsTotal, setNewsLoading } = reducerMocks;

    const store = makeStore({});
    await store.dispatch(fetchNewsData('All', 1, 6));

    expect(setNewsLoading).toHaveBeenCalledWith(true);
    expect(setNewsTotal).toHaveBeenCalledWith(7);
    expect(setNewsArticles).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Earthquake Alert' }),
        expect.objectContaining({ title: 'Evacuation Plan' }),
      ])
    );
    expect(setNewsLoading).toHaveBeenCalledWith(false);
    // no network in DEV
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// 2) DEV: page 2 with filter
it('DEV: filters by category and appends correct page 2 slice', async () => {
  withIsolatedModules({ DEV_MODE: true, NEWS_API_KEY: 'TEST_KEY' }, async ({ actions, reducerMocks }) => {
    const { fetchNewsData } = actions;
    const { setNewsTotal, appendNewsArticles, setNewsLoading } = reducerMocks;

    const store = makeStore({});
    await store.dispatch(fetchNewsData('Flood', 2, 1));

    expect(setNewsTotal).toHaveBeenCalledWith(1);
    expect(appendNewsArticles).toHaveBeenCalledWith([]); // page 2 slice is empty
    expect(setNewsLoading).toHaveBeenCalledWith(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// 3) PROD Local: top-headlines URL + cache
it('PROD Local: builds Top Headlines URL with region and caches response', async () => {
  withIsolatedModules({ DEV_MODE: false, NEWS_API_KEY: 'TEST_KEY' }, async ({ actions, reducerMocks }) => {
    const { fetchNewsData } = actions;
    const { setNewsArticles, setNewsTotal, setNewsLoading } = reducerMocks;

    global.fetch.mockResolvedValueOnce({
      json: async () => ({ articles: [{ title: 'Local One' }], totalResults: 1 }),
    });

    const store = makeStore({});
    await store.dispatch(fetchNewsData('Local', 1, 5));

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://newsapi.org/v2/top-headlines?country=GB&pageSize=5&page=1&apiKey=TEST_KEY'
    );
    expect(setNewsArticles).toHaveBeenCalledWith([{ title: 'Local One' }]);
    expect(setNewsTotal).toHaveBeenCalledWith(1);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'newsArticles_Local_page_1',
      JSON.stringify([{ title: 'Local One' }])
    );
    expect(setNewsLoading).toHaveBeenCalledWith(false);
  });
});

// 4) PROD All: everything URL + append on page > 1
it('PROD All: encodes default query and appends on page > 1', async () => {
  withIsolatedModules({ DEV_MODE: false, NEWS_API_KEY: 'KEY2' }, async ({ actions, reducerMocks }) => {
    const { fetchNewsData } = actions;
    const { appendNewsArticles, setNewsTotal, setNewsLoading } = reducerMocks;

    // Network result
    global.fetch.mockResolvedValueOnce({
      json: async () => ({
        articles: [{ title: 'A1' }, { title: 'A2' }],
        totalResults: 2,
      }),
    });

    const store = makeStore({});
    await store.dispatch(fetchNewsData('All', 2, 2));

    expect(global.fetch).toHaveBeenCalledWith(
      'https://newsapi.org/v2/everything?q=emergency%20OR%20disaster&language=en&pageSize=2&page=2&sortBy=publishedAt&apiKey=KEY2'
    );
    expect(appendNewsArticles).toHaveBeenCalledWith([{ title: 'A1' }, { title: 'A2' }]);
    expect(setNewsTotal).toHaveBeenCalledWith(2);
    expect(setNewsLoading).toHaveBeenCalledWith(false);
  });
});

// 5) Error path: still clears loading
it('on fetch error: logs error and clears loading', async () => {
  withIsolatedModules({ DEV_MODE: false, NEWS_API_KEY: 'ERR_KEY' }, async ({ actions, reducerMocks }) => {
    const { fetchNewsData } = actions;
    const { setNewsLoading } = reducerMocks;

    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch.mockRejectedValueOnce(new Error('boom'));

    const store = makeStore({});
    await store.dispatch(fetchNewsData('All', 1, 3));

    expect(errSpy).toHaveBeenCalled();
    expect(setNewsLoading).toHaveBeenCalledWith(false);
    errSpy.mockRestore();
  });
});

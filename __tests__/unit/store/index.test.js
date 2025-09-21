// __tests__/unit/store/index.test.js

/**
 * store.index.test.js
 *
 * What These Tests Cover:
 * 1) Store Initialization with the actual slice keys from src/store/index.js
 * 2) Slice-Scoped Dispatch (auth)
 * 3) Unknown Action is a no-op
 * 4) Multiple Slice Updates independently (weather + chat)
 *
 * Notes:
 * - We mock ONLY the reducers that src/store/index.js actually imports.
 * - We use jest.isolateModules() to ensure a fresh store instance per test.
 * - src/store/index.js exports a default; we read default OR the module itself for safety.
 */

 // Deterministic mock reducer factory
const makeReducer =
  (marker, type) =>
  (state = { marker, v: 0 }, action) =>
    action.type === type ? { ...state, v: state.v + 1 } : state;

// ===== Mock the exact reducer modules used by src/store/index.js =====
jest.mock('../../../src/store/reducers/loginReducer', () =>
  makeReducer('auth', 'AUTH_PING')
);
jest.mock('../../../src/store/reducers/registrationReducer', () =>
  makeReducer('registration', 'REG_PING')
);
jest.mock('../../../src/store/reducers/themeReducer', () =>
  makeReducer('theme', 'THEME_PING')
);
jest.mock('../../../src/store/reducers/bookmarksReducer', () =>
  makeReducer('bookmarks', 'BOOKMARKS_PING')
);
jest.mock('../../../src/store/reducers/emergencyReducer', () =>
  makeReducer('emergency', 'EMERGENCY_PING')
);
jest.mock('../../../src/store/reducers/newsReducer', () =>
  makeReducer('news', 'NEWS_PING')
);
jest.mock('../../../src/store/reducers/weatherReducer', () =>
  makeReducer('weather', 'WEATHER_PING')
);
jest.mock('../../../src/store/reducers/alertsReducer', () =>
  makeReducer('alerts', 'ALERTS_PING')
);
jest.mock('../../../src/store/reducers/chatReducer', () =>
  makeReducer('chat', 'CHAT_PING')
);
jest.mock('../../../src/store/reducers/gamificationReducer', () =>
  makeReducer('gamification', 'GAMIFICATION_PING')
);
jest.mock('../../../src/store/reducers/documentsReducer', () =>
  makeReducer('documents', 'DOCUMENTS_PING')
);
jest.mock('../../../src/store/reducers/quizReducer', () =>
  makeReducer('quizzes', 'QUIZZES_PING')
);
jest.mock('../../../src/store/reducers/tasksReducer', () =>
  makeReducer('tasks', 'TASKS_PING')
);
jest.mock('../../../src/store/reducers/badgesReducer', () =>
  makeReducer('badges', 'BADGES_PING')
);
jest.mock('../../../src/store/reducers/dashboardReducer', () =>
  makeReducer('dashboard', 'DASHBOARD_PING')
);
jest.mock('../../../src/store/reducers/leaderboardReducer', () =>
  makeReducer('leaderboard', 'LEADERBOARD_PING')
);

// ===== Helper to obtain a fresh store instance each test =====
const getFreshStore = () => {
  let freshStore;
  jest.isolateModules(() => {
    const mod = require('../../../src/store/index');
    freshStore = mod.default || mod; // support default export
  });
  return freshStore;
};

describe('Redux Store (src/store/index.js)', () => {
  let store;

  beforeEach(() => {
    store = getFreshStore();
  });

  it('initializes with all expected slice keys and default state', () => {
    const state = store.getState();

    expect(Object.keys(state).sort()).toEqual(
      [
        // Auth
        'auth',
        'registration',

        // UI
        'theme',

        // Features
        'chat',
        'weather',
        'news',
        'bookmarks',
        'documents',
        'alerts',
        'emergency',
        'gamification',

        // Games
        'quizzes',
        'tasks',
        'badges',
        'dashboard',
        'leaderboard',
      ].sort()
    );

    expect(state.auth).toEqual({ marker: 'auth', v: 0 });
    expect(state.registration).toEqual({ marker: 'registration', v: 0 });
    expect(state.theme).toEqual({ marker: 'theme', v: 0 });

    expect(state.chat).toEqual({ marker: 'chat', v: 0 });
    expect(state.weather).toEqual({ marker: 'weather', v: 0 });
    expect(state.news).toEqual({ marker: 'news', v: 0 });
    expect(state.bookmarks).toEqual({ marker: 'bookmarks', v: 0 });
    expect(state.documents).toEqual({ marker: 'documents', v: 0 });
    expect(state.alerts).toEqual({ marker: 'alerts', v: 0 });
    expect(state.emergency).toEqual({ marker: 'emergency', v: 0 });
    expect(state.gamification).toEqual({ marker: 'gamification', v: 0 });

    expect(state.quizzes).toEqual({ marker: 'quizzes', v: 0 });
    expect(state.tasks).toEqual({ marker: 'tasks', v: 0 });
    expect(state.badges).toEqual({ marker: 'badges', v: 0 });
    expect(state.dashboard).toEqual({ marker: 'dashboard', v: 0 });
    expect(state.leaderboard).toEqual({ marker: 'leaderboard', v: 0 });
  });

  it('routes dispatch only to the intended slice (auth)', () => {
    const before = store.getState();

    store.dispatch({ type: 'AUTH_PING' });
    const after = store.getState();

    expect(after.auth.v).toBe(before.auth.v + 1);

    // everything else untouched
    expect(after.registration).toEqual(before.registration);
    expect(after.theme).toEqual(before.theme);

    expect(after.chat).toEqual(before.chat);
    expect(after.weather).toEqual(before.weather);
    expect(after.news).toEqual(before.news);
    expect(after.bookmarks).toEqual(before.bookmarks);
    expect(after.documents).toEqual(before.documents);
    expect(after.alerts).toEqual(before.alerts);
    expect(after.emergency).toEqual(before.emergency);
    expect(after.gamification).toEqual(before.gamification);

    expect(after.quizzes).toEqual(before.quizzes);
    expect(after.tasks).toEqual(before.tasks);
    expect(after.badges).toEqual(before.badges);
    expect(after.dashboard).toEqual(before.dashboard);
    expect(after.leaderboard).toEqual(before.leaderboard);
  });

  it('unknown actions do not mutate state', () => {
    const before = store.getState();
    store.dispatch({ type: 'SOME_UNKNOWN_ACTION' });
    const after = store.getState();
    expect(after).toEqual(before);
  });

  it('updates multiple slices independently when their actions are dispatched', () => {
    const before = store.getState();

    store.dispatch({ type: 'WEATHER_PING' });
    store.dispatch({ type: 'CHAT_PING' });

    const after = store.getState();

    expect(after.weather.v).toBe(before.weather.v + 1);
    expect(after.chat.v).toBe(before.chat.v + 1);

    // everything else untouched
    expect(after.auth).toEqual(before.auth);
    expect(after.registration).toEqual(before.registration);
    expect(after.theme).toEqual(before.theme);

    expect(after.news).toEqual(before.news);
    expect(after.bookmarks).toEqual(before.bookmarks);
    expect(after.documents).toEqual(before.documents);
    expect(after.alerts).toEqual(before.alerts);
    expect(after.emergency).toEqual(before.emergency);
    expect(after.gamification).toEqual(before.gamification);

    expect(after.quizzes).toEqual(before.quizzes);
    expect(after.tasks).toEqual(before.tasks);
    expect(after.badges).toEqual(before.badges);
    expect(after.dashboard).toEqual(before.dashboard);
    expect(after.leaderboard).toEqual(before.leaderboard);
  });
});

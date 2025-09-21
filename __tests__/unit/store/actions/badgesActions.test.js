/**
 * badgesActions.test.js
 *
 * What These Tests Cover:
 * 1) fetchAllBadges
 *    - successful fetch returns badges array
 *    - failed fetch rejects with error message
 *
 * 2) fetchUserBadges
 *    - successful fetch returns earned list for a user
 *
 * 3) awardBadgeToUser
 *    - posts correct payload and returns API response
 *    - failed award rejects with error message
 *
 * Notes:
 * - We dispatch into a minimal RTK store and assert on the returned action
 *   `type` and `payload` (no reducers changed).
 */

import { configureStore } from '@reduxjs/toolkit';

// --- Mocks used by the thunks ---
jest.mock('../../../../src/utils/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));
jest.mock('../../../../src/utils/apiPaths', () => ({
  API_URL_BADGES: 'https://api.example.com/badges',
}));

import { get, post } from '../../../../src/utils/api';

// IMPORTANT: import thunks AFTER mocks so they see mocked modules
import * as badges from '../../../../src/store/actions/badgesActions';

const makeStore = () =>
  configureStore({
    reducer: (state = {}) => state,
    middleware: (gdm) => gdm({ serializableCheck: false }),
  });

beforeEach(() => {
  jest.clearAllMocks();
});

describe('fetchAllBadges', () => {
  it('resolves with badges array on success', async () => {
    get.mockResolvedValueOnce({ badges: [{ id: 'b1' }, { id: 'b2' }] });

    const store = makeStore();
    const action = await store.dispatch(badges.fetchAllBadges());

    expect(action.type).toMatch(/badges\/fetchAllBadges\/fulfilled$/);
    expect(get).toHaveBeenCalledWith('https://api.example.com/badges');
    expect(action.payload).toEqual([{ id: 'b1' }, { id: 'b2' }]);
  });

  it('rejects with message on error', async () => {
    get.mockRejectedValueOnce(new Error('network down'));

    const store = makeStore();
    const action = await store.dispatch(badges.fetchAllBadges());

    expect(action.type).toMatch(/badges\/fetchAllBadges\/rejected$/);
    expect(action.payload).toBe('network down');
  });
});

describe('fetchUserBadges', () => {
  it('resolves with earned badges for a user', async () => {
    get.mockResolvedValueOnce({ earned: [{ id: 'eb1' }] });

    const store = makeStore();
    const action = await store.dispatch(badges.fetchUserBadges('user-123'));

    expect(get).toHaveBeenCalledWith('https://api.example.com/badges/user/user-123');
    expect(action.type).toMatch(/badges\/fetchUserBadges\/fulfilled$/);
    expect(action.payload).toEqual([{ id: 'eb1' }]);
  });
});

describe('awardBadgeToUser', () => {
  it('posts correct payload and returns API response', async () => {
    post.mockResolvedValueOnce({ ok: true, awarded: { id: 'bX' } });

    const store = makeStore();
    const action = await store.dispatch(
      badges.awardBadgeToUser({ userId: 'u1', badgeId: 'bX' })
    );

    expect(post).toHaveBeenCalledWith(
      'https://api.example.com/badges/award',
      { user_id: 'u1', badge_id: 'bX' }
    );
    expect(action.type).toMatch(/badges\/awardBadgeToUser\/fulfilled$/);
    expect(action.payload).toEqual({ ok: true, awarded: { id: 'bX' } });
  });

  it('rejects with message when API rejects', async () => {
    post.mockRejectedValueOnce(new Error('forbidden'));

    const store = makeStore();
    const action = await store.dispatch(
      badges.awardBadgeToUser({ userId: 'u1', badgeId: 'bY' })
    );

    expect(action.type).toMatch(/badges\/awardBadgeToUser\/rejected$/);
    expect(action.payload).toBe('forbidden');
  });
});

/**
 * badgesReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & clearBadgeState
 *    - Returns defined initial state; clearBadgeState resets only `lastAwarded` + `error`.
 *
 * 2) fetchAllBadges flow
 *    - pending sets loading true, fulfilled replaces allBadges, rejected sets error.
 *
 * 3) fetchUserBadges flow
 *    - pending sets loading true, fulfilled replaces userBadges, rejected sets error.
 *
 * 4) awardBadgeToUser flow
 *    - pending sets loading, fulfilled sets lastAwarded, rejected sets error.
 */

import reducer, { clearBadgeState } from '../../../../src/store/reducers/badgesReducer';
import {
  fetchAllBadges,
  fetchUserBadges,
  awardBadgeToUser,
} from '../../../../src/store/actions/badgesActions';

const initial = {
  allBadges: [],
  userBadges: [],
  loading: false,
  error: null,
  lastAwarded: null,
};

describe('badgesReducer', () => {
  it('1) returns initial state and clearBadgeState resets lastAwarded + error only', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initial);

    const withData = {
      ...initial,
      allBadges: [{ id: 1 }],
      error: 'oops',
      lastAwarded: { id: 99 },
    };
    const afterClear = reducer(withData, clearBadgeState());
    expect(afterClear.allBadges).toEqual([{ id: 1 }]); // unchanged
    expect(afterClear.error).toBeNull();
    expect(afterClear.lastAwarded).toBeNull();
  });

  it('2) fetchAllBadges flow', () => {
    let state = reducer(undefined, { type: fetchAllBadges.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    const payload = [{ id: 1, name: 'A' }];
    state = reducer(state, { type: fetchAllBadges.fulfilled.type, payload });
    expect(state.loading).toBe(false);
    expect(state.allBadges).toEqual(payload);

    state = reducer(state, { type: fetchAllBadges.rejected.type, payload: 'fail' });
    expect(state.loading).toBe(false);
    expect(state.error).toBe('fail');
  });

  it('3) fetchUserBadges flow', () => {
    let state = reducer(undefined, { type: fetchUserBadges.pending.type });
    expect(state.loading).toBe(true);

    const payload = [{ id: 2, name: 'UserBadge' }];
    state = reducer(state, { type: fetchUserBadges.fulfilled.type, payload });
    expect(state.loading).toBe(false);
    expect(state.userBadges).toEqual(payload);

    state = reducer(state, { type: fetchUserBadges.rejected.type, payload: 'bad' });
    expect(state.error).toBe('bad');
  });

  it('4) awardBadgeToUser flow', () => {
    let state = reducer(undefined, { type: awardBadgeToUser.pending.type });
    expect(state.loading).toBe(true);

    const payload = { id: 77, name: 'Hero' };
    state = reducer(state, { type: awardBadgeToUser.fulfilled.type, payload });
    expect(state.loading).toBe(false);
    expect(state.lastAwarded).toEqual(payload);

    state = reducer(state, { type: awardBadgeToUser.rejected.type, payload: 'nope' });
    expect(state.error).toBe('nope');
  });
});

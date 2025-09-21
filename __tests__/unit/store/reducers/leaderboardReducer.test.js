/**
 * leaderboardReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & Unknown Action
 *    - Returns initial shape and ignores unknown actions.
 *
 * 2) clearLeaderboard
 *    - Empties leaderboard and clears error, leaves loading untouched.
 *
 * 3) fetchLeaderboard flow
 *    - pending sets loading, clears error
 *    - fulfilled replaces leaderboard and clears loading
 *    - rejected sets error and clears loading
 *
 * 4) Immutability
 *    - Frozen state passed to reducer with unknown action remains unchanged.
 */

import reducer, { clearLeaderboard } from '../../../../src/store/reducers/leaderboardReducer';
import { fetchLeaderboard } from '../../../../src/store/actions/leaderboardActions';

const initial = {
  leaderboard: [],
  loading: false,
  error: null,
};

describe('leaderboard reducer', () => {
  it('1) returns initial state and ignores unknown actions', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initial);

    const prev = { ...initial, leaderboard: [{ id: 1, score: 50 }] };
    const next = reducer(prev, { type: 'leaderboard/NOT_A_REAL_ACTION' });
    expect(next).toEqual(prev);
  });

  it('2) clearLeaderboard empties leaderboard and clears error', () => {
    const dirty = {
      leaderboard: [{ id: 'u1', score: 100 }],
      loading: true,
      error: 'oops',
    };
    const cleared = reducer(dirty, clearLeaderboard());
    expect(cleared.leaderboard).toEqual([]);
    expect(cleared.error).toBeNull();
    expect(cleared.loading).toBe(true); // untouched
  });

  it('3) fetchLeaderboard pending → fulfilled → rejected', () => {
    // pending
    let state = reducer(undefined, { type: fetchLeaderboard.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    // fulfilled
    const payload = [
      { id: 'u1', score: 200 },
      { id: 'u2', score: 150 },
    ];
    state = reducer(state, { type: fetchLeaderboard.fulfilled.type, payload });
    expect(state.loading).toBe(false);
    expect(state.leaderboard).toEqual(payload);

    // rejected
    state = reducer(state, { type: fetchLeaderboard.rejected.type, payload: 'fail' });
    expect(state.loading).toBe(false);
    expect(state.error).toBe('fail');
  });

  it('4) immutability check with frozen state', () => {
    const frozen = Object.freeze({ ...initial, leaderboard: [{ id: 'x', score: 99 }] });
    const next = reducer(frozen, { type: 'something/else' });
    expect(next).toEqual(frozen);
  });
});

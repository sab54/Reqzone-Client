/**
 * dashboardReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & Unknown Action
 *    - Returns the initial state and ignores unknown actions.
 *
 * 2) clearDashboard
 *    - Resets profile, stats, and error to null, keeps loading untouched.
 *
 * 3) fetchDashboard flow
 *    - pending → sets loading, clears error
 *    - fulfilled → sets profile+stats, clears loading
 *    - rejected → sets error, clears loading
 *
 * 4) Ensures immutability
 *    - Freezing previous state doesn’t break reducer on unknown action.
 */

import reducer, { clearDashboard } from '../../../../src/store/reducers/dashboardReducer';
import { fetchDashboard } from '../../../../src/store/actions/dashboardActions';

const initial = {
  profile: null,
  stats: null,
  loading: false,
  error: null,
};

describe('dashboard reducer', () => {
  it('1) returns initial state and ignores unknown actions', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initial);

    const prev = Object.freeze({ ...initial, profile: { id: 1 } });
    const next = reducer(prev, { type: 'dashboard/NOT_A_REAL_ACTION' });
    expect(next).toEqual(prev);
  });

  it('2) clearDashboard resets profile, stats, error', () => {
    const dirty = {
      ...initial,
      profile: { id: 1, name: 'A' },
      stats: { score: 100 },
      error: 'bad',
      loading: true,
    };
    const cleared = reducer(dirty, clearDashboard());
    expect(cleared.profile).toBeNull();
    expect(cleared.stats).toBeNull();
    expect(cleared.error).toBeNull();
    expect(cleared.loading).toBe(true); // untouched
  });

  it('3) fetchDashboard pending → fulfilled → rejected', () => {
    let state = reducer(undefined, { type: fetchDashboard.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    const payload = { profile: { id: 'u1' }, stats: { score: 55 } };
    state = reducer(state, { type: fetchDashboard.fulfilled.type, payload });
    expect(state.loading).toBe(false);
    expect(state.profile).toEqual(payload.profile);
    expect(state.stats).toEqual(payload.stats);

    state = reducer(state, { type: fetchDashboard.rejected.type, payload: 'fail' });
    expect(state.loading).toBe(false);
    expect(state.error).toBe('fail');
  });

  it('4) immutability: frozen prev state unchanged by unknown action', () => {
    const frozen = Object.freeze({ ...initial, stats: { games: 2 } });
    const next = reducer(frozen, { type: 'something/else' });
    expect(next).toEqual(frozen);
  });
});

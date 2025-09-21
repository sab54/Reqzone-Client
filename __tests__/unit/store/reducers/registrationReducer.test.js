/**
 * registrationReducer.test.js
 *
 * What These Tests Cover (3):
 *
 * 1) Initial State & Unknown Action
 *    - Returns initial state and ignores unknown actions.
 *
 * 2) registerUser flow
 *    - pending sets loading; fulfilled sets user; rejected sets error.
 *
 * 3) Immutability
 *    - Frozen state with unknown action is not mutated.
 */

import reducer from '../../../../src/store/reducers/registrationReducer';
import { registerUser } from '../../../../src/store/actions/registrationActions';

const initial = {
  loading: false,
  user: null,
  error: null,
};

describe('registration reducer', () => {
  it('1) returns initial state and ignores unknown actions', () => {
    const s0 = reducer(undefined, { type: '@@INIT' });
    expect(s0).toEqual(initial);

    const prev = { ...initial, user: { id: 1 } };
    const next = reducer(prev, { type: 'registration/NOT_A_REAL_ACTION' });
    expect(next).toEqual(prev);
  });

  it('2) registerUser pending → fulfilled → rejected', () => {
    // pending
    let state = reducer(undefined, { type: registerUser.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    // fulfilled
    const newUser = { id: 'u1', name: 'Alice' };
    state = reducer(state, { type: registerUser.fulfilled.type, payload: newUser });
    expect(state.loading).toBe(false);
    expect(state.user).toEqual(newUser);
    expect(state.error).toBeNull();

    // rejected
    state = reducer(state, { type: registerUser.rejected.type, payload: 'bad' });
    expect(state.loading).toBe(false);
    expect(state.error).toBe('bad');
  });

  it('3) immutability with frozen state', () => {
    const frozen = Object.freeze({ ...initial, user: { id: 'z' } });
    const next = reducer(frozen, { type: 'something/else' });
    expect(next).toEqual(frozen);
  });
});

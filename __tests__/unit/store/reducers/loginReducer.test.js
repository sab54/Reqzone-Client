/**
 * loginReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & resetAuthState
 *    - Returns initial state and resets properly.
 *
 * 2) verifyOtp flow
 *    - pending sets loading; fulfilled sets user + isVerified=true; rejected sets error + isVerified=false.
 *
 * 3) updateUserLocation flow
 *    - pending toggles loading; fulfilled updates user coords if present; rejected sets error.
 *
 * 4) logout.fulfilled
 *    - Always resets state to initial.
 */

import reducer, { resetAuthState } from '../../../../src/store/reducers/loginReducer';
import { verifyOtp, logout, updateUserLocation } from '../../../../src/store/actions/loginActions';

const initial = {
  loading: false,
  error: null,
  user: null,
  isVerified: false,
};

describe('login reducer', () => {
  it('1) returns initial state and resetAuthState clears changes', () => {
    const s0 = reducer(undefined, { type: '@@INIT' });
    expect(s0).toEqual(initial);

    const dirty = {
      loading: true,
      error: 'fail',
      user: { id: 1, name: 'Alice' },
      isVerified: true,
    };
    const cleared = reducer(dirty, resetAuthState());
    expect(cleared).toEqual(initial);
  });

  it('2) verifyOtp: pending → fulfilled → rejected', () => {
    let state = reducer(undefined, { type: verifyOtp.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
    expect(state.isVerified).toBe(false);

    // fulfilled with user
    const payload = { user: { id: 'u1', name: 'Bob' } };
    state = reducer(state, { type: verifyOtp.fulfilled.type, payload });
    expect(state.loading).toBe(false);
    expect(state.user).toEqual(payload.user);
    expect(state.isVerified).toBe(true);

    // rejected
    state = reducer(state, { type: verifyOtp.rejected.type, payload: 'bad-otp' });
    expect(state.loading).toBe(false);
    expect(state.error).toBe('bad-otp');
    expect(state.isVerified).toBe(false);
  });

  it('3) updateUserLocation flow', () => {
    // pending
    let state = reducer(undefined, { type: updateUserLocation.pending.type });
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();

    // fulfilled with no user → noop
    state = reducer(state, {
      type: updateUserLocation.fulfilled.type,
      meta: { arg: { latitude: 10, longitude: 20 } },
      payload: {},
    });
    expect(state.user).toBeNull();

    // add a user
    state = { ...state, user: { id: 'x', latitude: 0, longitude: 0 } };
    state = reducer(state, {
      type: updateUserLocation.fulfilled.type,
      meta: { arg: { latitude: 42, longitude: 99 } },
      payload: {},
    });
    expect(state.user.latitude).toBe(42);
    expect(state.user.longitude).toBe(99);

    // rejected sets error
    state = reducer(state, { type: updateUserLocation.rejected.type, payload: 'geo-fail' });
    expect(state.loading).toBe(false);
    expect(state.error).toBe('geo-fail');
  });

  it('4) logout.fulfilled resets state', () => {
    const dirty = {
      loading: true,
      error: 'something',
      user: { id: 7 },
      isVerified: true,
    };
    const reset = reducer(dirty, { type: logout.fulfilled.type });
    expect(reset).toEqual(initial);
  });
});

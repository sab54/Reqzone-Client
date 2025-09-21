/**
 * alertsReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & Unknown Action
 *    - Returns the defined initial state and ignores unknown actions (immutability check).
 *
 * 2) Alerts List Flow (user + paged), Mark Read, Delete
 *    - Handles pending/fulfilled/rejected.
 *    - Page 1 replaces; Page 2 appends; mark-as-read flips flag; delete updates list and totalCount.
 *
 * 3) Pending Actions Flow + Toggles
 *    - loadPendingActions pending/fulfilled/rejected, TOGGLE_ACTION, CLEAR_PENDING_ACTIONS.
 *
 * 4) Global Hazards
 *    - pending/fulfilled/rejected; fulfilled replaces {data,country,timestamp}.
 */

import reducer from '../../../../src/store/reducers/alertsReducer';

const init = {
  alerts: { data: [], loading: false, hasMore: false, totalCount: 0, error: null },
  pendingActions: { data: [], loading: false, error: null },
  globalHazards: { data: [], loading: false, error: null, country: null, timestamp: null },
};

describe('alertsReducer', () => {
  test('1) returns initial state and ignores unknown actions', () => {
    const initial = reducer(undefined, { type: '@@INIT' });
    expect(initial).toEqual(init);

    const prev = Object.freeze({ ...initial });
    const next = reducer(prev, { type: 'alerts/NOT_A_REAL_ACTION', payload: 123 });
    expect(next).toEqual(prev);
  });

  test('2) alerts flow: pending → fulfilled (user & paged), rejected; mark read; delete', () => {
    // pending
    let state = reducer(undefined, { type: 'alerts/fetchUserAlerts/pending' });
    expect(state.alerts.loading).toBe(true);
    expect(state.alerts.error).toBeNull();

    // fulfilled (user alerts one-shot)
    const userAlerts = [{ id: 1, is_read: false }, { id: 2, is_read: false }];
    state = reducer(state, { type: 'alerts/fetchUserAlerts/fulfilled', payload: userAlerts });
    expect(state.alerts.loading).toBe(false);
    expect(state.alerts.data).toEqual(userAlerts);
    expect(state.alerts.totalCount).toBe(2);
    expect(state.alerts.hasMore).toBe(false);

    // mark as read
    state = reducer(state, { type: 'alerts/markAlertAsRead/fulfilled', payload: { alertId: 2 } });
    expect(state.alerts.data.find(a => a.id === 2)?.is_read).toBe(true);

    // paged: page 1 replaces
    const page1 = { alerts: [{ id: 10 }, { id: 11 }], hasMore: true, totalCount: 5 };
    state = reducer(state, {
      type: 'alerts/fetchAlertsData/fulfilled',
      payload: page1,
      meta: { arg: { page: 1 } },
    });
    expect(state.alerts.data).toEqual(page1.alerts);
    expect(state.alerts.hasMore).toBe(true);
    expect(state.alerts.totalCount).toBe(5);

    // paged: page 2 appends
    const page2 = { alerts: [{ id: 12 }, { id: 13 }], hasMore: false, totalCount: 5 };
    state = reducer(state, {
      type: 'alerts/fetchAlertsData/fulfilled',
      payload: page2,
      meta: { arg: { page: 2 } },
    });
    expect(state.alerts.data.map(a => a.id)).toEqual([10, 11, 12, 13]);
    expect(state.alerts.hasMore).toBe(false);
    expect(state.alerts.totalCount).toBe(5);

    // delete one (totalCount floors at >= 0)
    const beforeDeleteCount = state.alerts.totalCount;
    state = reducer(state, { type: 'alerts/deleteAlert/fulfilled', payload: 11 });
    expect(state.alerts.data.map(a => a.id)).toEqual([10, 12, 13]);
    expect(state.alerts.totalCount).toBe(Math.max(beforeDeleteCount - 1, 0));

    // rejected should set error and clear loading
    state = reducer(state, { type: 'alerts/fetchAlertsData/rejected', payload: 'boom' });
    expect(state.alerts.loading).toBe(false);
    expect(state.alerts.error).toBe('boom');
  });

  test('3) pendingActions: pending → fulfilled → rejected, toggle and clear', () => {
    // pending
    let state = reducer(undefined, { type: 'alerts/loadPendingActions/pending' });
    expect(state.pendingActions.loading).toBe(true);
    expect(state.pendingActions.error).toBeNull();

    // fulfilled (replace data)
    const items = [
      { id: 'a', title: 'Thing A', completed: false },
      { id: 'b', title: 'Thing B', completed: true },
    ];
    state = reducer(state, { type: 'alerts/loadPendingActions/fulfilled', payload: items });
    expect(state.pendingActions.loading).toBe(false);
    expect(state.pendingActions.data).toEqual(items);

    // toggle (flip completed on id 'a')
    state = reducer(state, { type: 'TOGGLE_ACTION', payload: 'a' });
    expect(state.pendingActions.data.find(i => i.id === 'a')?.completed).toBe(true);

    // rejected (sets error; loading false)
    state = reducer(state, { type: 'alerts/loadPendingActions/rejected', payload: 'err!' });
    expect(state.pendingActions.loading).toBe(false);
    expect(state.pendingActions.error).toBe('err!');

    // clear
    state = reducer(state, { type: 'CLEAR_PENDING_ACTIONS' });
    expect(state.pendingActions.data).toEqual([]);
  });

  test('4) global hazards: pending → fulfilled replaces block; rejected sets error', () => {
    // pending
    let state = reducer(undefined, { type: 'alerts/fetchGlobalHazardAlerts/pending' });
    expect(state.globalHazards.loading).toBe(true);
    expect(state.globalHazards.error).toBeNull();

    // fulfilled (replace data/country/timestamp)
    const payload = {
      alerts: [{ id: 99, level: 'high' }],
      country: 'GB',
      timestamp: '2025-09-20T10:00:00.000Z',
    };
    state = reducer(state, { type: 'alerts/fetchGlobalHazardAlerts/fulfilled', payload });
    expect(state.globalHazards.loading).toBe(false);
    expect(state.globalHazards.error).toBeNull();
    expect(state.globalHazards.data).toEqual(payload.alerts);
    expect(state.globalHazards.country).toBe('GB');
    expect(state.globalHazards.timestamp).toBe(payload.timestamp);

    // rejected
    state = reducer(state, { type: 'alerts/fetchGlobalHazardAlerts/rejected', payload: 'nope' });
    expect(state.globalHazards.loading).toBe(false);
    expect(state.globalHazards.error).toBe('nope');
  });
});

/**
 * gamificationReducer.test.js
 *
 * What These Tests Cover (4):
 *
 * 1) Initial State & Unknown Action
 *    - Returns defined initial state and ignores unknown actions.
 *
 * 2) GAIN_XP leveling logic
 *    - Accumulates XP, rolls over on level-up, awards 'levelup' badge.
 *
 * 3) UNLOCK_BADGE deduplication
 *    - Adds a badge if not present; ignores duplicates.
 *
 * 4) RESET_GAMIFICATION
 *    - Restores initial state regardless of prior progress.
 */

import reducer from '../../../../src/store/reducers/gamificationReducer';

const initial = {
  xp: 0,
  level: 1,
  nextLevelXP: 100,
  badges: [],
};

describe('gamification reducer', () => {
  it('1) returns initial state and ignores unknown actions', () => {
    const state = reducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(initial);

    const prev = { ...initial, xp: 50 };
    const next = reducer(prev, { type: 'NOT_A_REAL_ACTION' });
    expect(next).toEqual(prev);
  });

  it('2) GAIN_XP handles rollover and multiple level-ups', () => {
    // Gain 50 XP: no level up
    let state = reducer(initial, { type: 'GAIN_XP', payload: 50 });
    expect(state.xp).toBe(50);
    expect(state.level).toBe(1);
    expect(state.badges).toEqual([]);

    // Gain 100 XP: should level up once
    state = reducer(state, { type: 'GAIN_XP', payload: 100 });
    expect(state.level).toBe(2);
    expect(state.xp).toBe(50); // 150 total - 100 required
    expect(state.nextLevelXP).toBe(200);
    expect(state.badges).toContain('levelup');

    // Gain enough to skip multiple levels
    state = reducer(state, { type: 'GAIN_XP', payload: 600 });
    expect(state.level).toBeGreaterThan(2);
    expect(state.badges.filter(b => b === 'levelup').length).toBeGreaterThan(1);
  });

  it('3) UNLOCK_BADGE adds unique badges only', () => {
    let state = reducer(initial, { type: 'UNLOCK_BADGE', payload: 'explorer' });
    expect(state.badges).toEqual(['explorer']);

    // Duplicate ignored
    state = reducer(state, { type: 'UNLOCK_BADGE', payload: 'explorer' });
    expect(state.badges).toEqual(['explorer']);

    // Another badge
    state = reducer(state, { type: 'UNLOCK_BADGE', payload: 'collector' });
    expect(state.badges).toEqual(['explorer', 'collector']);
  });

  it('4) RESET_GAMIFICATION restores initial state', () => {
    const dirty = {
      xp: 99,
      level: 5,
      nextLevelXP: 500,
      badges: ['levelup', 'explorer'],
    };
    const reset = reducer(dirty, { type: 'RESET_GAMIFICATION' });
    expect(reset).toEqual(initial);
  });
});

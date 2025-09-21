/**
 * gamificationActions.test.js
 *
 * What This Test File Covers (3):
 *
 * 1. gainXP
 *    - Returns correct type and payload with XP amount.
 *
 * 2. unlockBadge
 *    - Returns correct type and payload with badgeId.
 *
 * 3. resetGamification
 *    - Returns correct type and no payload.
 */

import { gainXP, unlockBadge, resetGamification } from '../../../../src/store/actions/gamificationActions';

describe('gamificationActions', () => {
  it('gainXP returns correct action with payload', () => {
    const action = gainXP(50);
    expect(action).toEqual({ type: 'GAIN_XP', payload: 50 });
  });

  it('unlockBadge returns correct action with payload', () => {
    const action = unlockBadge('badge-123');
    expect(action).toEqual({ type: 'UNLOCK_BADGE', payload: 'badge-123' });
  });

  it('resetGamification returns correct action with no payload', () => {
    const action = resetGamification();
    expect(action).toEqual({ type: 'RESET_GAMIFICATION' });
  });
});

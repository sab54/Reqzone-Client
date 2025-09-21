/**
 * gamificationActions.js
 *
 * Plain Redux action creators for gamification mechanics.
 *
 * Exports:
 * - **gainXP(amount)**
 *   - Returns `{ type: 'GAIN_XP', payload: amount }`.
 *   - Used when a user earns XP points (e.g., completing tasks).
 *
 * - **unlockBadge(badgeId)**
 *   - Returns `{ type: 'UNLOCK_BADGE', payload: badgeId }`.
 *   - Used when a user unlocks a badge/achievement.
 *
 * - **resetGamification()**
 *   - Returns `{ type: 'RESET_GAMIFICATION' }`.
 *   - Used to reset gamification progress (e.g., on logout or testing).
 *
 * Notes:
 * - These are synchronous action creators, not async thunks.
 * - Reducers should handle state updates based on these action types.
 *
 * Author: Sunidhi Abhange
 */

export const gainXP = (amount) => ({
    type: 'GAIN_XP',
    payload: amount,
});

export const unlockBadge = (badgeId) => ({
    type: 'UNLOCK_BADGE',
    payload: badgeId,
});

export const resetGamification = () => ({
    type: 'RESET_GAMIFICATION',
});

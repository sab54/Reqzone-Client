// src/store/reducers/gamificationReducer.js
/**
 * gamificationReducer.js
 *
 * Tracks user gamification progress:
 * - `xp`: current experience points within the active level
 * - `level`: current level (starts at 1)
 * - `nextLevelXP`: XP required to reach the next level (100 * level)
 * - `badges`: unlocked or auto-awarded achievements
 *
 * Actions:
 * - `GAIN_XP (amount)`
 *   - Adds XP, looping to handle multiple level-ups if `xp >= nextLevelXP`.
 *   - Each level-up pushes a `'levelup'` badge.
 * - `UNLOCK_BADGE (badgeId)`
 *   - Adds badge if not already present.
 * - `RESET_GAMIFICATION`
 *   - Resets to the initial state.
 *
 * Notes:
 * - Level scaling is simple: 100 * level.
 * - XP rolls over when leveling up.
 * - Badges array is append-only, except reset.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
    xp: 0,
    level: 1,
    nextLevelXP: 100,
    badges: [],
};

// XP required for next level (simple formula: 100 * level)
const getNextLevelXP = (level) => 100 * level;

export default function gamificationReducer(state = initialState, action) {
    switch (action.type) {
        case 'GAIN_XP': {
            let newXP = state.xp + action.payload;
            let newLevel = state.level;
            let nextXP = getNextLevelXP(newLevel);
            let leveledUp = false;

            while (newXP >= nextXP) {
                newXP -= nextXP;
                newLevel++;
                nextXP = getNextLevelXP(newLevel);
                leveledUp = true;
            }

            return {
                ...state,
                xp: newXP,
                level: newLevel,
                nextLevelXP: nextXP,
                badges: leveledUp ? [...state.badges, 'levelup'] : state.badges,
            };
        }

        case 'UNLOCK_BADGE': {
            if (state.badges.includes(action.payload)) return state;
            return {
                ...state,
                badges: [...state.badges, action.payload],
            };
        }

        case 'RESET_GAMIFICATION':
            return initialState;

        default:
            return state;
    }
}

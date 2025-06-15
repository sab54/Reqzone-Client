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

import { createSlice } from '@reduxjs/toolkit';
import { getThemeColors } from '../../theme/themeTokens';

const initialState = {
    mode: 'system', // 'light' | 'dark' | 'system'
    isDarkMode: false,
    themeColors: getThemeColors(false),
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setThemeMode: (state, action) => {
            state.mode = action.payload;
        },
        setEffectiveDarkMode: (state, action) => {
            state.isDarkMode = action.payload;
            state.themeColors = getThemeColors(action.payload);
        },
    },
});

export const { setThemeMode, setEffectiveDarkMode } = themeSlice.actions;
export default themeSlice.reducer;

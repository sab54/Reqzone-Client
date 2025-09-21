/**
 * themeActions.js
 *
 * Redux async actions for theme persistence and system-dark detection.
 *
 * Exports:
 * - **loadThemeFromStorage()**
 *   - Reads `themeMode` from AsyncStorage (defaults to `"system"`).
 *   - Dispatches `applyThemeMode(mode)`.
 *
 * - **toggleTheme()**
 *   - Cycles `mode` between "light" → "dark" → "system" → "light".
 *   - Dispatches `applyThemeMode(nextMode)`.
 *
 * - **applyThemeMode(mode)**
 *   - Persists `themeMode` into AsyncStorage.
 *   - Dispatches `setThemeMode(mode)`.
 *   - Detects system color scheme via `Appearance.getColorScheme()`.
 *   - Dispatches `setEffectiveDarkMode(isDark)` based on mode+system scheme.
 *
 * Dependencies:
 * - AsyncStorage (`themeMode` key).
 * - `Appearance.getColorScheme` (from React Native).
 * - Reducer actions: `setThemeMode`, `setEffectiveDarkMode`.
 *
 * Author: Sunidhi Abhange
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { setThemeMode, setEffectiveDarkMode } from '../reducers/themeReducer';

export const loadThemeFromStorage = () => async (dispatch) => {
    const storedMode = await AsyncStorage.getItem('themeMode');
    const mode = storedMode || 'system';
    dispatch(applyThemeMode(mode));
};

export const toggleTheme = () => (dispatch, getState) => {
    const { mode } = getState().theme;
    const nextMode =
        mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light';

    dispatch(applyThemeMode(nextMode));
};

export const applyThemeMode = (mode) => async (dispatch) => {
    await AsyncStorage.setItem('themeMode', mode);
    dispatch(setThemeMode(mode));

    const systemScheme = Appearance.getColorScheme();
    const isDark =
        mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
    dispatch(setEffectiveDarkMode(isDark));
};

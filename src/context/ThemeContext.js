/**
 * ThemeContext.js
 *
 * Provides app-wide theme state and actions, bridging Redux, AsyncStorage, and the system color scheme.
 *
 * Key functionalities:
 * - **Initial Load**
 *   - Reads `themeMode` from AsyncStorage (`'light' | 'dark' | 'system'`, default `'system'`).
 *   - Dispatches `setThemeMode(saved || 'system')`.
 * - **Effective Dark Mode**
 *   - Whenever `themeMode` or system scheme changes, dispatches `setEffectiveDarkMode(boolean)` where:
 *       - If mode is `'system'`: uses `useColorScheme()` (`'dark'` → true).
 *       - If mode is `'dark'`: true.
 *       - If mode is `'light'`: false.
 * - **toggleTheme()**
 *   - Cycles mode: `light → dark → system → light`.
 *   - Persists new mode to AsyncStorage, dispatches `setThemeMode(nextMode)` and `setEffectiveDarkMode(resolved)`.
 *
 * Exposed context value:
 * - `isDarkMode` (boolean)
 * - `themeMode`  ('light' | 'dark' | 'system')
 * - `themeColors` (palette from Redux)
 * - `toggleTheme` (function)
 *
 * Author: Sunidhi Abhange
 */

import React, { createContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, useColorScheme } from 'react-native';
import {
    setThemeMode,
    setEffectiveDarkMode,
} from '../store/reducers/themeReducer';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const dispatch = useDispatch();
    const systemScheme = useColorScheme();
    const themeMode = useSelector((state) => state.theme.mode);
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const themeColors = useSelector((state) => state.theme.themeColors);

    React.useEffect(() => {
        const loadTheme = async () => {
            const saved = await AsyncStorage.getItem('themeMode');
            dispatch(setThemeMode(saved || 'system'));
        };
        loadTheme();
    }, [dispatch]);

    React.useEffect(() => {
        const resolvedDark =
            themeMode === 'system'
                ? systemScheme === 'dark'
                : themeMode === 'dark';
        dispatch(setEffectiveDarkMode(resolvedDark));
    }, [themeMode, systemScheme, dispatch]);

    const toggleTheme = async () => {
        const nextMode =
            themeMode === 'light'
                ? 'dark'
                : themeMode === 'dark'
                ? 'system'
                : 'light';

        await AsyncStorage.setItem('themeMode', nextMode);
        dispatch(setThemeMode(nextMode));

        const resolvedDark =
            nextMode === 'system'
                ? systemScheme === 'dark'
                : nextMode === 'dark';
        dispatch(setEffectiveDarkMode(resolvedDark));
    };

    return (
        <ThemeContext.Provider
            value={{
                isDarkMode,
                themeMode,
                themeColors,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

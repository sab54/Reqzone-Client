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

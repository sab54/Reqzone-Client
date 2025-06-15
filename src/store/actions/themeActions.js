// themeActions.js
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

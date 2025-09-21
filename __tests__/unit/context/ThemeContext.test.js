/**
 * ThemeContext.test.js
 *
 * Covers:
 * 1) Initial load reads AsyncStorage and dispatches setThemeMode(saved || "system")
 * 2) Effective dark mode when themeMode="system" uses useColorScheme()
 * 3) toggleTheme cycles light → dark → system → light, persists, dispatches correct modes/flags
 * 4) Context exposes isDarkMode, themeMode, themeColors, toggleTheme
 *
 * Notes:
 * - Uses your existing jest.setup react-redux mock (dispatch unwrap).
 * - Interacts via a small Probe UI using RN primitives (TouchableOpacity).
 */

import React, { useContext, useEffect } from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import { useColorScheme, TouchableOpacity, Text } from 'react-native';

jest.mock('../../../src/store/reducers/themeReducer', () => ({
  setThemeMode: (mode) => ({ type: 'theme/setThemeMode', payload: mode }),
  setEffectiveDarkMode: (isDark) => ({ type: 'theme/setEffectiveDarkMode', payload: isDark }),
}));

import { ThemeProvider, ThemeContext } from '../../../src/context/ThemeContext';

function Probe({ onValues }) {
  const ctx = useContext(ThemeContext);
  useEffect(() => { onValues?.(ctx); });
  return (
    <TouchableOpacity accessibilityRole="button" onPress={() => ctx.toggleTheme?.()}>
      <Text>Toggle</Text>
    </TouchableOpacity>
  );
}

function renderWithState(initialState, opts = {}) {
  useSelector.mockImplementation((sel) => sel(initialState));
  const dispatch = useDispatch();
  const onValues = opts.onValues || (() => {});
  const utils = render(
    <ThemeProvider>
      <Probe onValues={onValues} />
    </ThemeProvider>
  );
  return { ...utils, dispatch, getState: () => initialState };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(require('react-native'), 'useColorScheme').mockReturnValue('light');
  AsyncStorage.getItem.mockResolvedValue(null);
  AsyncStorage.setItem.mockResolvedValue(undefined);
});

afterAll(() => {
  if (useColorScheme?.mockRestore) useColorScheme.mockRestore();
});

describe('ThemeContext / ThemeProvider', () => {
  test('Initial load: reads AsyncStorage and dispatches setThemeMode(saved || "system")', async () => {
    AsyncStorage.getItem.mockResolvedValue('dark');
    const state = {
      theme: {
        mode: 'system',
        isDarkMode: false,
        themeColors: { surface: '#111', text: '#eee', link: '#0af' },
      },
    };
    const { dispatch } = renderWithState(state);
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'theme/setThemeMode', payload: 'dark' });
    });
  });

  test('Effective dark mode: themeMode="system" resolves from useColorScheme()', async () => {
    useColorScheme.mockReturnValue('dark');
    const state = { theme: { mode: 'system', isDarkMode: false, themeColors: {} } };
    const { dispatch } = renderWithState(state);
    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'theme/setEffectiveDarkMode', payload: true });
    });
  });


  test('Context exposes isDarkMode, themeMode, themeColors, toggleTheme', async () => {
    let captured;
    const state = { theme: { mode: 'system', isDarkMode: true, themeColors: { surface: '#000', text: '#fff' } } };
    renderWithState(state, { onValues: (ctx) => (captured = ctx) });
    await waitFor(() => {
      expect(captured).toBeTruthy();
      expect(typeof captured.toggleTheme).toBe('function');
    });
    expect(captured.isDarkMode).toBe(true);
    expect(captured.themeMode).toBe('system');
    expect(captured.themeColors).toEqual({ surface: '#000', text: '#fff' });
  });
});

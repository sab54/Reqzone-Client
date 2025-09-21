/**
 * themeActions.test.js
 *
 * What This Test File Covers (3):
 *
 * 1. loadThemeFromStorage
 * 2. toggleTheme
 * 3. applyThemeMode
 */

import { configureStore } from '@reduxjs/toolkit';

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock reducer action creators (return plain actions)
jest.mock('../../../../src/store/reducers/themeReducer', () => ({
  setThemeMode: jest.fn((payload) => ({ type: 'theme/setThemeMode', payload })),
  setEffectiveDarkMode: jest.fn((payload) => ({ type: 'theme/setEffectiveDarkMode', payload })),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import {
  setThemeMode,
  setEffectiveDarkMode,
} from '../../../../src/store/reducers/themeReducer';
import {
  loadThemeFromStorage,
  toggleTheme,
  applyThemeMode,
} from '../../../../src/store/actions/themeActions';

// Minimal store for thunk dispatch
const makeStore = (preloadedState) =>
  configureStore({
    reducer: (s = preloadedState) => s,
    middleware: (gdm) => gdm({ serializableCheck: false }),
    preloadedState,
  });

/** Wait one macrotask so nested thunks (applyThemeMode) finish. */
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  jest.clearAllMocks();
});

// 1) loadThemeFromStorage
it('loads stored theme (or system), applies it, and sets effective dark via Appearance', async () => {
  // Simulate previously stored 'dark'
  AsyncStorage.getItem.mockResolvedValueOnce('dark');

  // System scheme -> dark
  const schemeSpy = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');

  const store = makeStore({});
  await store.dispatch(loadThemeFromStorage());
  await flush(); // <-- allow inner applyThemeMode to complete

  // loadThemeFromStorage should have read storage...
  expect(AsyncStorage.getItem).toHaveBeenCalledWith('themeMode');

  // ...then applied the mode (applyThemeMode writes it back)
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('themeMode', 'dark');

  // reducer actions triggered by applyThemeMode
  expect(setThemeMode).toHaveBeenCalledWith('dark');
  expect(setEffectiveDarkMode).toHaveBeenCalledWith(true);

  schemeSpy.mockRestore();
});

// 2) toggleTheme cycles correctly
// 2) toggleTheme cycles correctly
it('toggles theme mode: light -> dark -> system -> light', async () => {
  const dispatch = jest.fn((action) => {
    // allow thunks to run (applyThemeMode)
    if (typeof action === 'function') return action(dispatch, () => ({}));
    return action;
  });
  const flush = () => new Promise((r) => setTimeout(r, 0));
  const schemeSpy = jest.spyOn(Appearance, 'getColorScheme').mockReturnValue('dark');

  // light -> dark
  await toggleTheme()(dispatch, () => ({ theme: { mode: 'light' } }));
  await flush();
  expect(setThemeMode).toHaveBeenLastCalledWith('dark');
  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('themeMode', 'dark');

  // dark -> system
  await toggleTheme()(dispatch, () => ({ theme: { mode: 'dark' } }));
  await flush();
  expect(setThemeMode).toHaveBeenLastCalledWith('system');
  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('themeMode', 'system');

  // system -> light
  await toggleTheme()(dispatch, () => ({ theme: { mode: 'system' } }));
  await flush();
  expect(setThemeMode).toHaveBeenLastCalledWith('light');
  expect(AsyncStorage.setItem).toHaveBeenLastCalledWith('themeMode', 'light');

  schemeSpy.mockRestore();
});
;

// 3) applyThemeMode respects system scheme when mode === 'system'
it('applyThemeMode persists mode and derives effectiveDark from system scheme', async () => {
  const schemeSpy = jest.spyOn(Appearance, 'getColorScheme');

  // Case A: system -> light
  schemeSpy.mockReturnValueOnce('light');
  const store = makeStore({});
  await store.dispatch(applyThemeMode('system'));

  expect(AsyncStorage.setItem).toHaveBeenCalledWith('themeMode', 'system');
  expect(setThemeMode).toHaveBeenCalledWith('system');
  expect(setEffectiveDarkMode).toHaveBeenCalledWith(false);

  // Case B: explicit dark ignores system
  await store.dispatch(applyThemeMode('dark'));
  expect(setThemeMode).toHaveBeenLastCalledWith('dark');
  expect(setEffectiveDarkMode).toHaveBeenLastCalledWith(true);

  schemeSpy.mockRestore();
});
